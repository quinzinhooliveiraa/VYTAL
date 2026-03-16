import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerSchema, loginSchema, insertChallengeSchema, insertMessageSchema, insertCommunitySchema, insertCheckInSchema, DEPOSIT_MINIMUM, WITHDRAW_MINIMUM, TRANSACTION_TYPES, TRANSACTION_STATUS } from "@shared/schema";
import bcrypt from "bcryptjs";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { walletService } from "./services/wallet-service";
import { transactionService } from "./services/transaction-service";
import { paymentService } from "./services/payment-service";
import { webhookService } from "./services/webhook-service";
import { challengeFinanceService } from "./services/challenge-finance-service";
import { db } from "./db";
import { challenges, communities, transactions, challengeJoinRequests } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import * as oidcClient from "openid-client";
import memoize from "memoizee";

const ADMIN_EMAILS = [
  "oliveirasocial74@gmail.com",
  "quinzinhooliveiraa@gmail.com",
];

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
      const isAdmin = ADMIN_EMAILS.includes(data.email.toLowerCase());
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
        isAdmin,
      } as any);

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

  // ====== SOCIAL LOGIN (Google / Apple via Replit OIDC) ======

  const getOidcConfig = memoize(
    async () => {
      return await oidcClient.discovery(
        new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
        process.env.REPL_ID!
      );
    },
    { maxAge: 3600 * 1000 }
  );

  app.get("/api/login", async (req, res) => {
    try {
      const config = await getOidcConfig();
      const callbackUrl = `https://${req.hostname}/api/callback`;
      const codeVerifier = oidcClient.randomPKCECodeVerifier();
      const codeChallenge = await oidcClient.calculatePKCECodeChallenge(codeVerifier);
      const state = oidcClient.randomState();

      (req.session as any).oidc = { codeVerifier, state, callbackUrl };

      const authUrl = oidcClient.buildAuthorizationUrl(config, {
        redirect_uri: callbackUrl,
        scope: "openid email profile",
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        state,
        prompt: "login consent",
      });

      res.redirect(authUrl.href);
    } catch (error: any) {
      console.error("OIDC login error:", error);
      res.redirect("/login?error=social_login_failed");
    }
  });

  app.get("/api/callback", async (req, res) => {
    try {
      const config = await getOidcConfig();
      const oidcSession = (req.session as any).oidc;
      if (!oidcSession) return res.redirect("/login?error=session_expired");

      const tokens = await oidcClient.authorizationCodeGrant(config, new URL(req.url, `https://${req.hostname}`), {
        pkceCodeVerifier: oidcSession.codeVerifier,
        expectedState: oidcSession.state,
      });

      const claims = tokens.claims();
      if (!claims) return res.redirect("/login?error=no_claims");

      const email = claims.email as string;
      const firstName = (claims as any).first_name || claims.given_name || "";
      const lastName = (claims as any).last_name || claims.family_name || "";
      const fullName = `${firstName} ${lastName}`.trim() || email.split("@")[0];
      const profileImage = (claims as any).profile_image_url || claims.picture || "";

      delete (req.session as any).oidc;

      let appUser = await storage.getUserByEmail(email);

      if (appUser) {
        (req.session as any).userId = appUser.id;
        await storage.updateUser(appUser.id, { online: true, avatar: appUser.avatar || profileImage });
      } else {
        const baseUsername = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 20);
        let username = baseUsername;
        let counter = 1;
        while (await storage.getUserByUsername(username)) {
          username = `${baseUsername}${counter}`;
          counter++;
        }

        const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(2) + Date.now(), 10);
        const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());

        appUser = await storage.createUser({
          username,
          email,
          password: randomPassword,
          name: fullName,
          avatar: profileImage,
          isAdmin,
        } as any);

        (req.session as any).userId = appUser.id;
        res.redirect("/onboarding");
        return;
      }

      res.redirect("/dashboard");
    } catch (error: any) {
      console.error("OIDC callback error:", error);
      res.redirect("/login?error=auth_failed");
    }
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
    const { name, bio, avatar, goals, publicEarnings, isPrivate, cpf, phone } = req.body;
    const updated = await storage.updateUser(userId, { name, bio, avatar, goals, publicEarnings, isPrivate, cpf, phone });
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
    const isCreator = userId === challenge.createdBy;

    let joinRequestStatus: string | null = null;
    if (userId && !isParticipant) {
      const [existing] = await db.select().from(challengeJoinRequests)
        .where(and(eq(challengeJoinRequests.challengeId, req.params.id), eq(challengeJoinRequests.userId, userId)));
      if (existing) joinRequestStatus = existing.status;
    }

    const hasStarted = challenge.startDate ? new Date(challenge.startDate) <= new Date() : true;

    const visibleParticipants = isParticipant || isCreator
      ? participants
      : participants.map((p: any) => {
          if (p.user?.isPrivate) {
            return { ...p, user: { ...p.user, name: "Perfil Privado", avatar: "", username: "privado" } };
          }
          return p;
        });
    
    res.json({ ...challenge, participants: visibleParticipants, isParticipant, joinRequestStatus, hasStarted });
  });

  app.post("/api/challenges", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const body = { ...req.body, createdBy: userId };
      if (body.startDate && typeof body.startDate === "string") {
        body.startDate = new Date(body.startDate);
      }
      const data = insertChallengeSchema.parse(body);
      
      const entryFee = Number(data.entryFee || 0);
      if (entryFee > 0) {
        const { availableBalance } = await walletService.getBalance(userId);
        if (availableBalance < entryFee) {
          return res.status(400).json({ message: `Saldo insuficiente. Você tem R$ ${availableBalance.toFixed(2)} disponível, mas precisa de R$ ${entryFee.toFixed(2)} para criar este desafio.` });
        }
      }

      const startDateVal = data.startDate ? new Date(data.startDate) : new Date();
      const endDate = new Date(startDateVal);
      endDate.setDate(endDate.getDate() + (data.duration || 30));
      
      const challenge = await storage.createChallenge({ ...data, startDate: startDateVal, endDate });
      await storage.joinChallenge(challenge.id, userId, true);

      if (entryFee > 0) {
        await challengeFinanceService.processEntryFee(userId, challenge.id, entryFee, challenge.title);
      }
      
      res.status(201).json(challenge);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao criar desafio" });
    }
  });

  app.post("/api/challenges/:id/join", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const challengeId = req.params.id;
      
      const existing = await storage.getParticipant(challengeId, userId);
      if (existing) return res.status(400).json({ message: "Você já está neste desafio" });
      
      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) return res.status(404).json({ message: "Desafio não encontrado" });

      const hasStarted = challenge.startDate ? new Date(challenge.startDate) <= new Date() : true;
      if (hasStarted) return res.status(400).json({ message: "Este desafio já começou. Não é possível entrar." });
      
      const entryFee = Number(challenge.entryFee);
      if (entryFee > 0) {
        const { availableBalance } = await walletService.getBalance(userId);
        if (availableBalance < entryFee) {
          return res.status(400).json({ message: `Saldo insuficiente. Você tem R$ ${availableBalance.toFixed(2)} disponível, mas precisa de R$ ${entryFee.toFixed(2)} para entrar.` });
        }
        await challengeFinanceService.processEntryFee(userId, challengeId, entryFee, challenge.title);
      }
      
      const participant = await storage.joinChallenge(challengeId, userId);
      res.status(201).json(participant);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao entrar no desafio" });
    }
  });

  app.post("/api/challenges/:id/request-join", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const challengeId = req.params.id;

      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) return res.status(404).json({ message: "Desafio não encontrado" });

      const hasStarted = challenge.startDate ? new Date(challenge.startDate) <= new Date() : true;
      if (hasStarted) return res.status(400).json({ message: "Este desafio já começou. Não é possível pedir para entrar." });

      const existing = await storage.getParticipant(challengeId, userId);
      if (existing) return res.status(400).json({ message: "Você já está neste desafio" });

      const [existingRequest] = await db.select().from(challengeJoinRequests)
        .where(and(eq(challengeJoinRequests.challengeId, challengeId), eq(challengeJoinRequests.userId, userId)));
      if (existingRequest) {
        if (existingRequest.status === "pending") return res.status(400).json({ message: "Você já tem uma solicitação pendente" });
        if (existingRequest.status === "rejected") return res.status(400).json({ message: "Sua solicitação foi recusada pelo moderador" });
      }

      const [request] = await db.insert(challengeJoinRequests).values({
        challengeId,
        userId,
      }).returning();

      res.status(201).json(request);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao solicitar entrada" });
    }
  });

  app.get("/api/challenges/:id/join-requests", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const challengeId = req.params.id;

      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) return res.status(404).json({ message: "Desafio não encontrado" });
      if (challenge.createdBy !== userId) return res.status(403).json({ message: "Apenas o criador pode ver solicitações" });

      const { users } = await import("@shared/schema");
      const requests = await db.select({
        id: challengeJoinRequests.id,
        challengeId: challengeJoinRequests.challengeId,
        userId: challengeJoinRequests.userId,
        status: challengeJoinRequests.status,
        createdAt: challengeJoinRequests.createdAt,
        userName: users.name,
        userAvatar: users.avatar,
        userUsername: users.username,
      }).from(challengeJoinRequests)
        .innerJoin(users, eq(challengeJoinRequests.userId, users.id))
        .where(eq(challengeJoinRequests.challengeId, challengeId))
        .orderBy(challengeJoinRequests.createdAt);

      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/challenges/:id/join-requests/:requestId/approve", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { id: challengeId, requestId } = req.params;

      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) return res.status(404).json({ message: "Desafio não encontrado" });
      if (challenge.createdBy !== userId) return res.status(403).json({ message: "Apenas o criador pode aprovar" });

      const [request] = await db.select().from(challengeJoinRequests).where(eq(challengeJoinRequests.id, requestId));
      if (!request || request.challengeId !== challengeId) return res.status(404).json({ message: "Solicitação não encontrada" });
      if (request.status !== "pending") return res.status(400).json({ message: "Solicitação já foi processada" });

      await db.update(challengeJoinRequests).set({
        status: "approved",
        reviewedAt: new Date(),
        reviewedBy: userId,
      }).where(eq(challengeJoinRequests.id, requestId));

      const entryFee = Number(challenge.entryFee);
      if (entryFee > 0) {
        const { availableBalance } = await walletService.getBalance(request.userId);
        if (availableBalance < entryFee) {
          await db.update(challengeJoinRequests).set({ status: "rejected", reviewedAt: new Date(), reviewedBy: userId })
            .where(eq(challengeJoinRequests.id, requestId));
          return res.status(400).json({ message: "Usuário não tem saldo suficiente. Solicitação recusada." });
        }
        await challengeFinanceService.processEntryFee(request.userId, challengeId, entryFee, challenge.title);
      }

      await storage.joinChallenge(challengeId, request.userId);
      res.json({ message: "Participante aprovado com sucesso" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/challenges/:id/join-requests/:requestId/reject", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { id: challengeId, requestId } = req.params;

      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) return res.status(404).json({ message: "Desafio não encontrado" });
      if (challenge.createdBy !== userId) return res.status(403).json({ message: "Apenas o criador pode recusar" });

      const [request] = await db.select().from(challengeJoinRequests).where(eq(challengeJoinRequests.id, requestId));
      if (!request || request.challengeId !== challengeId) return res.status(404).json({ message: "Solicitação não encontrada" });
      if (request.status !== "pending") return res.status(400).json({ message: "Solicitação já foi processada" });

      await db.update(challengeJoinRequests).set({
        status: "rejected",
        reviewedAt: new Date(),
        reviewedBy: userId,
      }).where(eq(challengeJoinRequests.id, requestId));

      res.json({ message: "Solicitação recusada" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/challenges/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const challenge = await storage.getChallenge(req.params.id);
      if (!challenge) return res.status(404).json({ message: "Desafio não encontrado" });
      if (challenge.createdBy !== userId) return res.status(403).json({ message: "Apenas o criador pode editar" });

      const allowed: (keyof typeof challenge)[] = ["title", "description", "rules", "isPrivate"];
      const updates: any = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "Nenhum campo para atualizar" });
      }

      const updated = await storage.updateChallenge(req.params.id, updates);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/challenges/:id/quit", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const challengeId = req.params.id;

      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) return res.status(404).json({ message: "Desafio não encontrado" });
      if (!challenge.isActive) return res.status(400).json({ message: "Este desafio já foi finalizado" });

      const participant = await storage.getParticipant(challengeId, userId);
      if (!participant || !participant.isActive) {
        return res.status(400).json({ message: "Você não está participando deste desafio" });
      }

      if (challenge.createdBy === userId) {
        return res.status(400).json({ message: "O criador do desafio não pode desistir. Finalize o desafio se necessário." });
      }

      const entryFee = Number(challenge.entryFee);

      await storage.leaveChallenge(challengeId, userId);

      if (entryFee > 0) {
        await walletService.deductLockedBalance(userId, entryFee);

        await transactionService.create({
          userId,
          type: TRANSACTION_TYPES.CHALLENGE_ENTRY,
          amount: entryFee,
          status: TRANSACTION_STATUS.COMPLETED,
          description: `Desistência: ${challenge.title} (valor perdido)`,
          challengeId,
          metadata: { action: "quit", forfeit: true },
        });
      }

      res.json({
        success: true,
        message: `Você desistiu do desafio "${challenge.title}". O valor de entrada de R$ ${entryFee.toFixed(2)} foi perdido e permanece no pote do desafio.`,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao desistir do desafio" });
    }
  });

  app.post("/api/challenges/:id/finalize", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const challengeId = req.params.id;
      
      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) return res.status(404).json({ message: "Desafio não encontrado" });
      if (challenge.createdBy !== userId) return res.status(403).json({ message: "Apenas o criador pode finalizar" });
      
      const { winnerUserIds } = req.body;
      if (!Array.isArray(winnerUserIds) || winnerUserIds.length === 0) {
        return res.status(400).json({ message: "Informe os vencedores" });
      }
      
      const result = await challengeFinanceService.finalizeChallenge(challengeId, winnerUserIds);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao finalizar desafio" });
    }
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

  // ====== CHALLENGE MESSAGES ======

  app.get("/api/challenges/:id/messages", requireAuth, async (req, res) => {
    const msgs = await storage.getChallengeMessages(req.params.id);
    res.json(msgs);
  });

  app.post("/api/challenges/:id/messages", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const challengeId = req.params.id;
      const { text } = req.body;

      if (!text || !text.trim()) return res.status(400).json({ message: "Mensagem vazia" });

      const participant = await storage.getParticipant(challengeId, userId);
      if (!participant || !participant.isActive) {
        return res.status(403).json({ message: "Apenas participantes podem enviar mensagens" });
      }

      const msg = await storage.createChallengeMessage({ challengeId, userId, text: text.trim() });
      const user = await storage.getUser(userId);
      res.status(201).json({
        ...msg,
        user: { id: user!.id, name: user!.name, avatar: user!.avatar, username: user!.username },
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao enviar mensagem" });
    }
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
    const allComms = await storage.getCommunities();
    const result = [];
    for (const comm of allComms) {
      const activeChallenges = await db.select({ count: sql<number>`count(*)::int` })
        .from(challenges)
        .where(and(eq(challenges.communityId, comm.id), eq(challenges.isActive, true)));
      result.push({ ...comm, activeChallenges: activeChallenges[0]?.count || 0 });
    }
    res.json(result);
  });

  app.get("/api/communities/:id", async (req, res) => {
    const community = await storage.getCommunity(req.params.id);
    if (!community) return res.status(404).json({ message: "Comunidade não encontrada" });
    const members = await storage.getCommunityMembers(req.params.id);
    const activeChallenges = await db.select({ count: sql<number>`count(*)::int` })
      .from(challenges)
      .where(and(eq(challenges.communityId, community.id), eq(challenges.isActive, true)));
    res.json({ ...community, members, memberCount: members.length, activeChallenges: activeChallenges[0]?.count || 0 });
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
    const userComms = await storage.getUserCommunities(userId);
    res.json(userComms);
  });

  // ====== WALLET ======

  app.get("/api/wallet/balance", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const walletBalance = await walletService.getBalance(userId);
      res.json(walletBalance);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/wallet/transactions", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const txs = await transactionService.getUserTransactions(userId);
      res.json(txs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/wallet/deposit", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { amount } = req.body;
      const numAmount = Number(amount);

      if (!numAmount || numAmount <= 0) {
        return res.status(400).json({ message: "Valor inválido" });
      }
      if (numAmount < DEPOSIT_MINIMUM) {
        return res.status(400).json({ message: `Depósito mínimo: R$ ${DEPOSIT_MINIMUM},00` });
      }

      const idempotencyKey = transactionService.generateIdempotencyKey();

      const tx = await transactionService.create({
        userId,
        type: TRANSACTION_TYPES.DEPOSIT,
        amount: numAmount,
        status: TRANSACTION_STATUS.PENDING,
        idempotencyKey,
        description: "Depósito via Pix",
      });

      if (paymentService.isConfigured()) {
        const user = await storage.getUser(userId);
        if (!user?.cpf) {
          await transactionService.updateStatus(tx.id, TRANSACTION_STATUS.FAILED);
          return res.status(400).json({ message: "Configure seu CPF no perfil antes de depositar", needsCpf: true });
        }

        const amountInCents = Math.round(numAmount * 100);
        const charge = await paymentService.createPixCharge(
          amountInCents,
          `Depósito FitStake - R$ ${numAmount.toFixed(2)}`,
          tx.id,
          {
            name: user.name,
            email: user.email,
            cellphone: user.phone || "5500000000000",
            taxId: user.cpf,
          }
        );

        await transactionService.setExternalId(tx.id, charge.id);
        await transactionService.updateStatus(tx.id, TRANSACTION_STATUS.PROCESSING, {
          pixUrl: charge.url,
          pixQrCode: charge.qrCode,
          pixQrCodeBase64: charge.qrCodeBase64,
        });

        res.status(201).json({
          transaction: tx,
          pix: {
            qrCode: charge.qrCode,
            qrCodeBase64: charge.qrCodeBase64,
            url: charge.url,
            chargeId: charge.id,
          },
        });
      } else {
        await walletService.addBalance(userId, numAmount);
        await transactionService.updateStatus(tx.id, TRANSACTION_STATUS.COMPLETED);

        res.status(201).json({
          transaction: { ...tx, status: TRANSACTION_STATUS.COMPLETED },
          pix: null,
          message: "Depósito simulado (gateway não configurado)",
        });
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao processar depósito" });
    }
  });

  app.post("/api/wallet/withdraw", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { amount, pixKey, pixKeyType, testMode } = req.body;
      const numAmount = Number(amount);

      if (!numAmount || numAmount <= 0) {
        return res.status(400).json({ message: "Valor inválido" });
      }
      if (numAmount < WITHDRAW_MINIMUM) {
        return res.status(400).json({ message: `Saque mínimo: R$ ${WITHDRAW_MINIMUM},00` });
      }
      if (!pixKey) {
        return res.status(400).json({ message: "Chave Pix obrigatória" });
      }

      const { availableBalance } = await walletService.getBalance(userId);
      if (numAmount > availableBalance) {
        return res.status(400).json({ message: `Saldo disponível insuficiente. Você tem R$ ${availableBalance.toFixed(2)} disponível para saque.` });
      }

      const pending = await transactionService.getPendingWithdrawals(userId);
      if (pending.length > 0) {
        return res.status(400).json({ message: "Você já tem um saque pendente" });
      }

      await walletService.lockBalance(userId, numAmount);

      const isTest = testMode === true;
      const idempotencyKey = transactionService.generateIdempotencyKey();
      const tx = await transactionService.create({
        userId,
        type: TRANSACTION_TYPES.WITHDRAW_REQUEST,
        amount: numAmount,
        status: TRANSACTION_STATUS.PENDING,
        idempotencyKey,
        description: isTest ? "Saque simulado (teste)" : "Saque via Pix",
        metadata: { pixKey, pixKeyType: pixKeyType || "CPF", testMode: isTest },
      });

      if (!isTest && paymentService.isConfigured()) {
        try {
          const amountInCents = Math.round(numAmount * 100);
          const withdraw = await paymentService.createPixWithdraw(
            amountInCents,
            pixKey,
            pixKeyType || "CPF",
            "Saque FitStake"
          );

          await transactionService.setExternalId(tx.id, withdraw.id);
          await transactionService.updateStatus(tx.id, TRANSACTION_STATUS.PROCESSING);

          res.status(201).json({
            transaction: { ...tx, status: TRANSACTION_STATUS.PROCESSING },
            message: "Saque solicitado. O processamento pode levar alguns minutos.",
          });
        } catch (gatewayError: any) {
          await walletService.unlockBalance(userId, numAmount);
          const errorMsg = gatewayError.message || "Erro desconhecido";
          await transactionService.updateStatus(tx.id, TRANSACTION_STATUS.FAILED, {
            error: errorMsg,
          });
          let userMessage = "Erro ao processar saque. ";
          if (errorMsg.toLowerCase().includes("key") || errorMsg.toLowerCase().includes("chave") || errorMsg.toLowerCase().includes("pix")) {
            userMessage += "Verifique se a chave Pix está correta e corresponde ao tipo selecionado.";
          } else if (errorMsg.toLowerCase().includes("insufficient") || errorMsg.toLowerCase().includes("saldo") || errorMsg.toLowerCase().includes("balance")) {
            userMessage += "Saldo insuficiente no gateway.";
          } else if (errorMsg.toLowerCase().includes("limit") || errorMsg.toLowerCase().includes("limite")) {
            userMessage += "Limite de saque excedido. Tente um valor menor.";
          } else {
            userMessage += `Detalhe: ${errorMsg}`;
          }
          res.status(400).json({ message: userMessage });
        }
      } else {
        await walletService.deductLockedBalance(userId, numAmount);
        await transactionService.updateStatus(tx.id, TRANSACTION_STATUS.COMPLETED);

        res.status(201).json({
          transaction: { ...tx, status: TRANSACTION_STATUS.COMPLETED },
          message: isTest ? "Saque simulado com sucesso (modo teste). O saldo foi debitado mas nenhum Pix real foi enviado." : "Saque processado.",
        });
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao processar saque" });
    }
  });

  app.get("/api/wallet/deposit/:transactionId/status", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const tx = await transactionService.getTransaction(req.params.transactionId);
      if (!tx || tx.userId !== userId) {
        return res.status(404).json({ message: "Transação não encontrada" });
      }

      if ((tx.status === TRANSACTION_STATUS.PROCESSING || tx.status === TRANSACTION_STATUS.PENDING) && tx.externalId && paymentService.isConfigured()) {
        try {
          const gatewayStatus = await paymentService.getChargeStatus(tx.externalId);
          console.log("[DepositStatus] Gateway status for", tx.externalId, ":", gatewayStatus);
          if (gatewayStatus === "COMPLETED" || gatewayStatus === "PAID") {
            await webhookService.processPaymentConfirmed(tx.externalId);
            const updated = await transactionService.getTransaction(tx.id);
            return res.json(updated);
          }
        } catch (err: any) {
          console.error("[DepositStatus] Error checking gateway:", err.message);
        }
      }

      res.json(tx);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ====== SUPPORT TICKETS ======

  app.post("/api/support", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { type, message } = req.body;

      if (!type || !message?.trim()) {
        return res.status(400).json({ message: "Tipo e mensagem são obrigatórios" });
      }
      if (!["feedback", "suporte", "ideia"].includes(type)) {
        return res.status(400).json({ message: "Tipo inválido" });
      }

      const ticket = await storage.createSupportTicket({ userId, type, message: message.trim() });
      res.status(201).json(ticket);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao enviar" });
    }
  });

  app.get("/api/support/mine", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const all = await storage.getSupportTickets();
    res.json(all.filter(t => t.userId === userId));
  });

  // ====== AVATAR UPLOAD ======

  app.post("/api/users/avatar", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { avatar } = req.body;
      if (!avatar) return res.status(400).json({ message: "Avatar é obrigatório" });
      const updated = await storage.updateUser(userId, { avatar });
      if (!updated) return res.status(404).json({ message: "Usuário não encontrado" });
      res.json({ avatar: updated.avatar });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Erro ao atualizar avatar" });
    }
  });

  // ====== ADMIN ======

  const requireAdmin = async (req: any, res: any, next: any) => {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ message: "Não autenticado" });
    const user = await storage.getUser(userId);
    if (!user || !user.isAdmin) return res.status(403).json({ message: "Acesso negado" });
    next();
  };

  app.get("/api/admin/stats", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { db: database } = await import("./db");
      const { transactions, wallets, users: usersTable, challenges: challengesTable } = await import("@shared/schema");
      const { sql, eq, and } = await import("drizzle-orm");

      const [feeResult] = await database.select({
        total: sql<string>`COALESCE(SUM(amount), 0)`,
        count: sql<number>`COUNT(*)`,
      }).from(transactions).where(eq(transactions.type, "platform_fee"));

      const [depositCompleted] = await database.select({
        total: sql<string>`COALESCE(SUM(amount), 0)`,
        count: sql<number>`COUNT(*)`,
      }).from(transactions).where(and(eq(transactions.type, "deposit"), eq(transactions.status, "completed")));

      const [depositAll] = await database.select({
        total: sql<string>`COALESCE(SUM(amount), 0)`,
        count: sql<number>`COUNT(*)`,
      }).from(transactions).where(eq(transactions.type, "deposit"));

      const [withdrawAll] = await database.select({
        total: sql<string>`COALESCE(SUM(amount), 0)`,
        count: sql<number>`COUNT(*)`,
      }).from(transactions).where(eq(transactions.type, "withdraw_request"));

      const [walletResult] = await database.select({
        totalBalance: sql<string>`COALESCE(SUM(balance), 0)`,
        totalLocked: sql<string>`COALESCE(SUM(locked_balance), 0)`,
      }).from(wallets);

      const [userCountResult] = await database.select({ count: sql<number>`COUNT(*)` }).from(usersTable);
      const [challengeCount] = await database.select({ count: sql<number>`COUNT(*)` }).from(challengesTable);
      const [activeChallenges] = await database.select({ count: sql<number>`COUNT(*)` }).from(challengesTable).where(eq(challengesTable.isActive, true));

      const [challengeEntries] = await database.select({
        total: sql<string>`COALESCE(SUM(amount), 0)`,
        count: sql<number>`COUNT(*)`,
      }).from(transactions).where(eq(transactions.type, "challenge_entry"));

      const [challengeWins] = await database.select({
        total: sql<string>`COALESCE(SUM(amount), 0)`,
        count: sql<number>`COUNT(*)`,
      }).from(transactions).where(eq(transactions.type, "challenge_win"));

      res.json({
        platformFees: { total: Number(feeResult.total), count: Number(feeResult.count) },
        depositsCompleted: { total: Number(depositCompleted.total), count: Number(depositCompleted.count) },
        depositsAll: { total: Number(depositAll.total), count: Number(depositAll.count) },
        withdrawals: { total: Number(withdrawAll.total), count: Number(withdrawAll.count) },
        usersBalance: { total: Number(walletResult.totalBalance), locked: Number(walletResult.totalLocked) },
        challengeEntries: { total: Number(challengeEntries.total), count: Number(challengeEntries.count) },
        challengeWins: { total: Number(challengeWins.total), count: Number(challengeWins.count) },
        totalUsers: Number(userCountResult.count),
        totalChallenges: Number(challengeCount.count),
        activeChallenges: Number(activeChallenges.count),
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/transactions", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { db: database } = await import("./db");
      const { transactions, users: usersTable } = await import("@shared/schema");
      const { desc, eq } = await import("drizzle-orm");

      const allTxs = await database.select({
        id: transactions.id,
        userId: transactions.userId,
        type: transactions.type,
        amount: transactions.amount,
        status: transactions.status,
        description: transactions.description,
        metadata: transactions.metadata,
        createdAt: transactions.createdAt,
        userName: usersTable.name,
        userEmail: usersTable.email,
      }).from(transactions)
        .leftJoin(usersTable, eq(transactions.userId, usersTable.id))
        .orderBy(desc(transactions.createdAt))
        .limit(200);
      res.json(allTxs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { db: database } = await import("./db");
      const { users: usersTable, wallets } = await import("@shared/schema");
      const { desc, eq, sql } = await import("drizzle-orm");

      const allUsers = await database.select({
        id: usersTable.id,
        username: usersTable.username,
        email: usersTable.email,
        name: usersTable.name,
        cpf: usersTable.cpf,
        phone: usersTable.phone,
        isAdmin: usersTable.isAdmin,
        online: usersTable.online,
        createdAt: usersTable.createdAt,
        balance: sql<string>`COALESCE(w.balance, 0)`.as("balance"),
        lockedBalance: sql<string>`COALESCE(w.locked_balance, 0)`.as("locked_balance"),
      }).from(usersTable)
        .leftJoin(sql`wallets w`, sql`w.user_id = ${usersTable.id}`)
        .orderBy(desc(usersTable.createdAt));

      res.json(allUsers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/users/:id/toggle-admin", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { db: database } = await import("./db");
      const { users: usersTable } = await import("@shared/schema");
      const { eq, sql } = await import("drizzle-orm");

      const [target] = await database.select().from(usersTable).where(eq(usersTable.id, req.params.id));
      if (!target) return res.status(404).json({ message: "Usuário não encontrado" });

      await database.update(usersTable).set({ isAdmin: !target.isAdmin }).where(eq(usersTable.id, req.params.id));
      res.json({ success: true, isAdmin: !target.isAdmin });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/users/:id/block", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { db: database } = await import("./db");
      const { users: usersTable } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      await database.update(usersTable).set({ online: false, isPrivate: true }).where(eq(usersTable.id, req.params.id));
      res.json({ success: true, message: "Usuário bloqueado" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { db: database } = await import("./db");
      const { users: usersTable, wallets, transactions } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      const [target] = await database.select().from(usersTable).where(eq(usersTable.id, req.params.id));
      if (!target) return res.status(404).json({ message: "Usuário não encontrado" });
      if (target.isAdmin) return res.status(403).json({ message: "Não é possível apagar um admin" });

      await database.delete(transactions).where(eq(transactions.userId, req.params.id));
      await database.delete(wallets).where(eq(wallets.userId, req.params.id));
      await database.delete(usersTable).where(eq(usersTable.id, req.params.id));
      res.json({ success: true, message: "Usuário removido" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/support", requireAuth, requireAdmin, async (req, res) => {
    try {
      const tickets = await storage.getSupportTickets();
      res.json(tickets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/admin/support/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { status, adminNotes } = req.body;
      await storage.updateSupportTicketStatus(req.params.id, status, adminNotes);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/suspicious", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { db: database } = await import("./db");
      const { transactions, users: usersTable } = await import("@shared/schema");
      const { sql, eq, desc } = await import("drizzle-orm");

      const highVolume = await database.select({
        userId: transactions.userId,
        userName: usersTable.name,
        userEmail: usersTable.email,
        txCount: sql<number>`COUNT(*)`.as("tx_count"),
        totalAmount: sql<string>`SUM(amount)`.as("total_amount"),
      }).from(transactions)
        .leftJoin(usersTable, eq(transactions.userId, usersTable.id))
        .groupBy(transactions.userId, usersTable.name, usersTable.email)
        .having(sql`COUNT(*) > 5 OR SUM(amount) > 500`)
        .orderBy(sql`SUM(amount) DESC`);

      const failedTxs = await database.select({
        id: transactions.id,
        userId: transactions.userId,
        userName: usersTable.name,
        type: transactions.type,
        amount: transactions.amount,
        status: transactions.status,
        createdAt: transactions.createdAt,
      }).from(transactions)
        .leftJoin(usersTable, eq(transactions.userId, usersTable.id))
        .where(eq(transactions.status, "failed"))
        .orderBy(desc(transactions.createdAt))
        .limit(20);

      const rapidDeposits = await database.select({
        userId: transactions.userId,
        userName: usersTable.name,
        userEmail: usersTable.email,
        depositCount: sql<number>`COUNT(*)`.as("deposit_count"),
        totalDeposited: sql<string>`SUM(amount)`.as("total_deposited"),
      }).from(transactions)
        .leftJoin(usersTable, eq(transactions.userId, usersTable.id))
        .where(sql`type = 'deposit' AND created_at > NOW() - INTERVAL '24 hours'`)
        .groupBy(transactions.userId, usersTable.name, usersTable.email)
        .having(sql`COUNT(*) >= 3`)
        .orderBy(sql`COUNT(*) DESC`);

      res.json({ highVolume, failedTxs, rapidDeposits });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ====== WEBHOOKS ======

  app.post("/api/webhooks/abacatepay", async (req, res) => {
    try {
      const { event, data } = req.body;

      console.log("[Webhook] Received:", event, data?.id);

      if (!event || !data) {
        return res.status(400).json({ message: "Payload inválido" });
      }

      let result;

      switch (event) {
        case "billing.paid":
        case "PAYMENT.RECEIVED":
          result = await webhookService.processPaymentConfirmed(data.id || data.billing?.id, data);
          break;
        case "withdraw.completed":
        case "withdraw.paid":
          result = await webhookService.processWithdrawCompleted(data.id, data);
          break;
        case "withdraw.failed":
          result = await webhookService.processWithdrawFailed(data.id, data);
          break;
        default:
          console.log("[Webhook] Evento não tratado:", event);
          result = { success: true, message: "Evento ignorado" };
      }

      res.json(result);
    } catch (error: any) {
      console.error("[Webhook] Error:", error.message);
      res.status(500).json({ message: "Erro ao processar webhook" });
    }
  });

  return httpServer;
}
