import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerSchema, loginSchema, insertChallengeSchema, insertMessageSchema, insertCommunitySchema, insertCheckInSchema } from "@shared/schema";
import bcrypt from "bcryptjs";
import session from "express-session";
import pgSession from "connect-pg-simple";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  const PgStore = pgSession(session);

  app.use(session({
    store: new PgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "fitstake-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    },
  }));

  // Auth middleware
  function requireAuth(req: any, res: any, next: any) {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    next();
  }

  // ====== AUTH ======

  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);

      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) return res.status(400).json({ message: "Email já cadastrado" });

      const existingUsername = await storage.getUserByUsername(data.username);
      if (existingUsername) return res.status(400).json({ message: "Username já em uso" });

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
      });

      (req.session as any).userId = user.id;
      const { password, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao criar conta" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(data.email);
      if (!user) return res.status(401).json({ message: "Email ou senha inválidos" });

      const valid = await bcrypt.compare(data.password, user.password);
      if (!valid) return res.status(401).json({ message: "Email ou senha inválidos" });

      (req.session as any).userId = user.id;
      await storage.updateUser(user.id, { online: true });
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao fazer login" });
    }
  });

  app.post("/api/auth/logout", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    if (userId) await storage.updateUser(userId, { online: false });
    req.session.destroy(() => {
      res.json({ message: "Logout realizado" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Não autenticado" });
    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json({ message: "Usuário não encontrado" });
    const { password, ...safeUser } = user;
    res.json(safeUser);
  });

  // ====== USERS ======

  app.get("/api/users/search", requireAuth, async (req, res) => {
    const query = req.query.q as string;
    if (!query) return res.json([]);
    const results = await storage.searchUsers(query);
    res.json(results.map(({ password, ...u }) => u));
  });

  app.get("/api/users/:username", async (req, res) => {
    const user = await storage.getUserByUsername(req.params.username);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
    const { password, ...safeUser } = user;

    const userId = (req.session as any)?.userId;
    let isFollowing = false;
    if (userId) {
      isFollowing = await storage.isFollowing(userId, user.id);
    }

    const stats = await storage.getUserStats(user.id);
    const followers = await storage.getFollowers(user.id);
    const following = await storage.getFollowing(user.id);

    res.json({
      ...safeUser,
      isFollowing,
      stats,
      followerCount: followers.length,
      followingCount: following.length,
    });
  });

  app.patch("/api/users/me", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const { name, bio, avatar, goals, publicEarnings, isPrivate } = req.body;
    const updated = await storage.updateUser(userId, { name, bio, avatar, goals, publicEarnings, isPrivate });
    if (!updated) return res.status(404).json({ message: "Usuário não encontrado" });
    const { password, ...safeUser } = updated;
    res.json(safeUser);
  });

  // ====== CHALLENGES ======

  app.get("/api/challenges", async (req, res) => {
    const challenges = await storage.getChallenges();
    res.json(challenges);
  });

  app.get("/api/challenges/mine", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const challenges = await storage.getUserChallenges(userId);
    res.json(challenges);
  });

  app.get("/api/challenges/:id", async (req, res) => {
    const challenge = await storage.getChallenge(req.params.id);
    if (!challenge) return res.status(404).json({ message: "Desafio não encontrado" });
    
    const participants = await storage.getChallengeParticipants(req.params.id);
    const userId = (req.session as any)?.userId;
    const isParticipant = userId ? participants.some(p => p.userId === userId) : false;
    
    res.json({ ...challenge, participants, isParticipant });
  });

  app.post("/api/challenges", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const data = insertChallengeSchema.parse({ ...req.body, createdBy: userId });
      
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (data.duration || 30));
      
      const challenge = await storage.createChallenge({ ...data, endDate });
      await storage.joinChallenge(challenge.id, userId, true);
      
      res.status(201).json(challenge);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao criar desafio" });
    }
  });

  app.post("/api/challenges/:id/join", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const challengeId = req.params.id;
    
    const existing = await storage.getParticipant(challengeId, userId);
    if (existing) return res.status(400).json({ message: "Você já está neste desafio" });
    
    const challenge = await storage.getChallenge(challengeId);
    if (!challenge) return res.status(404).json({ message: "Desafio não encontrado" });
    
    if (Number(challenge.entryFee) > 0) {
      const balance = await storage.getWalletBalance(userId);
      if (balance < Number(challenge.entryFee)) {
        return res.status(400).json({ message: "Saldo insuficiente" });
      }
      await storage.createTransaction({
        userId,
        type: "entry_fee",
        amount: challenge.entryFee,
        description: `Entrada: ${challenge.title}`,
        challengeId,
      });
    }
    
    const participant = await storage.joinChallenge(challengeId, userId);
    res.status(201).json(participant);
  });

  // ====== CHECK-INS ======

  app.post("/api/check-ins", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const data = insertCheckInSchema.parse({ ...req.body, userId });
      
      const participant = await storage.getParticipant(data.challengeId, userId);
      if (!participant) return res.status(400).json({ message: "Você não está neste desafio" });
      
      const checkIn = await storage.createCheckIn(data);
      await storage.updateParticipantScore(data.challengeId, userId, (participant.score || 0) + 1);
      
      res.status(201).json(checkIn);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao fazer check-in" });
    }
  });

  app.get("/api/check-ins/:challengeId", requireAuth, async (req, res) => {
    const checkIns = await storage.getChallengeCheckIns(req.params.challengeId);
    res.json(checkIns);
  });

  // ====== MESSAGES ======

  app.get("/api/messages/conversations", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const conversations = await storage.getUserConversations(userId);
    res.json(conversations.map(c => ({
      user: { ...c.user, password: undefined },
      lastMessage: c.lastMessage,
      unreadCount: c.unreadCount,
    })));
  });

  app.get("/api/messages/:username", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const otherUser = await storage.getUserByUsername(req.params.username);
    if (!otherUser) return res.status(404).json({ message: "Usuário não encontrado" });
    
    const msgs = await storage.getConversation(userId, otherUser.id);
    await storage.markMessagesRead(otherUser.id, userId);
    res.json(msgs);
  });

  app.post("/api/messages", requireAuth, async (req, res) => {
    try {
      const senderId = (req.session as any).userId;
      const { receiverUsername, text, replyToId } = req.body;
      
      const receiver = await storage.getUserByUsername(receiverUsername);
      if (!receiver) return res.status(404).json({ message: "Usuário não encontrado" });
      
      const message = await storage.sendMessage({
        senderId,
        receiverId: receiver.id,
        text,
        replyToId: replyToId || null,
      });
      
      res.status(201).json(message);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao enviar mensagem" });
    }
  });

  // ====== FOLLOWS ======

  app.post("/api/follows/:username", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const target = await storage.getUserByUsername(req.params.username);
    if (!target) return res.status(404).json({ message: "Usuário não encontrado" });
    if (target.id === userId) return res.status(400).json({ message: "Não pode seguir a si mesmo" });

    const alreadyFollowing = await storage.isFollowing(userId, target.id);
    if (alreadyFollowing) return res.status(400).json({ message: "Já está seguindo" });
    
    const follow = await storage.follow(userId, target.id);
    res.status(201).json(follow);
  });

  app.delete("/api/follows/:username", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const target = await storage.getUserByUsername(req.params.username);
    if (!target) return res.status(404).json({ message: "Usuário não encontrado" });
    
    await storage.unfollow(userId, target.id);
    res.json({ message: "Unfollowed" });
  });

  app.get("/api/follows/status/:username", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const target = await storage.getUserByUsername(req.params.username);
    if (!target) return res.status(404).json({ following: false });
    const following = await storage.isFollowing(userId, target.id);
    res.json({ following });
  });

  app.get("/api/follows/followers", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const followers = await storage.getFollowers(userId);
    res.json(followers.map(f => ({ ...f, follower: { ...f.follower, password: undefined } })));
  });

  app.get("/api/follows/following", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const following = await storage.getFollowing(userId);
    res.json(following.map(f => ({ ...f, following: { ...f.following, password: undefined } })));
  });

  // ====== COMMUNITIES ======

  app.get("/api/communities", async (req, res) => {
    const communities = await storage.getCommunities();
    res.json(communities);
  });

  app.get("/api/communities/:id", async (req, res) => {
    const community = await storage.getCommunity(req.params.id);
    if (!community) return res.status(404).json({ message: "Comunidade não encontrada" });
    const members = await storage.getCommunityMembers(req.params.id);
    res.json({ ...community, members, memberCount: members.length });
  });

  app.post("/api/communities", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const data = insertCommunitySchema.parse({ ...req.body, createdBy: userId });
      const community = await storage.createCommunity(data);
      await storage.joinCommunity(community.id, userId);
      res.status(201).json(community);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao criar comunidade" });
    }
  });

  app.post("/api/communities/:id/join", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const member = await storage.joinCommunity(req.params.id, userId);
    res.status(201).json(member);
  });

  app.delete("/api/communities/:id/leave", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    await storage.leaveCommunity(req.params.id, userId);
    res.json({ message: "Saiu da comunidade" });
  });

  app.get("/api/communities/mine", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const communities = await storage.getUserCommunities(userId);
    res.json(communities);
  });

  // ====== WALLET ======

  app.get("/api/wallet/balance", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const balance = await storage.getWalletBalance(userId);
    res.json({ balance });
  });

  app.get("/api/wallet/transactions", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const transactions = await storage.getTransactions(userId);
    res.json(transactions);
  });

  app.post("/api/wallet/deposit", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const { amount } = req.body;
    if (!amount || Number(amount) <= 0) return res.status(400).json({ message: "Valor inválido" });
    
    const transaction = await storage.createTransaction({
      userId,
      type: "deposit",
      amount: String(amount),
      description: "Depósito via Pix",
    });
    res.status(201).json(transaction);
  });

  return httpServer;
}
