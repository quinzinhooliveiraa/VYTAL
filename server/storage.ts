import { db } from "./db";
import { encrypt, decrypt } from "./utils/encryption";
import { eq, and, or, desc, sql, ne, ilike, inArray } from "drizzle-orm";
import { count as drizzleCount } from "drizzle-orm";
import {
  users, challenges, challengeParticipants, checkIns,
  messages, follows, communities, communityMembers, walletTransactions,
  challengeMessages, supportTickets, pushSubscriptions, notifications,
  type User, type InsertUser, type Challenge, type InsertChallenge,
  type CheckIn, type InsertCheckIn, type Message, type InsertMessage,
  type Follow, type InsertFollow, type Community, type InsertCommunity,
  type CommunityMember, type WalletTransaction, type InsertWalletTransaction,
  type ChallengeParticipant, type ChallengeMessage, type InsertChallengeMessage,
  type SupportTicket, type InsertSupportTicket,
  type PushSubscription, type InsertPushSubscription,
  type Notification, type InsertNotification
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  searchUsers(query: string, limit?: number): Promise<User[]>;

  // Challenges
  getChallenge(id: string): Promise<Challenge | undefined>;
  getChallenges(limit?: number): Promise<Challenge[]>;
  getUserChallenges(userId: string): Promise<Challenge[]>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  updateChallenge(id: string, data: Partial<Challenge>): Promise<Challenge | undefined>;

  // Challenge Participants
  joinChallenge(challengeId: string, userId: string, isAdmin?: boolean): Promise<ChallengeParticipant>;
  leaveChallenge(challengeId: string, userId: string): Promise<void>;
  getChallengeParticipants(challengeId: string): Promise<(ChallengeParticipant & { user: User })[]>;
  getParticipant(challengeId: string, userId: string): Promise<ChallengeParticipant | undefined>;
  updateParticipantScore(challengeId: string, userId: string, score: number): Promise<void>;

  // Challenge Messages
  createChallengeMessage(msg: InsertChallengeMessage): Promise<ChallengeMessage>;
  getChallengeMessages(challengeId: string): Promise<(ChallengeMessage & { user: { id: string; name: string; avatar: string | null; username: string } })[]>;

  // Check-ins
  createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn>;
  getChallengeCheckIns(challengeId: string): Promise<CheckIn[]>;
  getUserCheckIns(userId: string, challengeId?: string): Promise<CheckIn[]>;

  // Messages
  sendMessage(message: InsertMessage): Promise<Message>;
  getConversation(userId1: string, userId2: string, limit?: number): Promise<Message[]>;
  getUserConversations(userId: string): Promise<{ user: User; lastMessage: Message; unreadCount: number }[]>;
  markMessagesRead(senderId: string, receiverId: string): Promise<void>;

  // Follows
  follow(followerId: string, followingId: string): Promise<Follow>;
  unfollow(followerId: string, followingId: string): Promise<void>;
  getFollowers(userId: string): Promise<(Follow & { follower: User })[]>;
  getFollowing(userId: string): Promise<(Follow & { following: User })[]>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;

  // Communities
  getCommunity(id: string): Promise<Community | undefined>;
  getCommunities(limit?: number): Promise<(Community & { memberCount: number })[]>;
  createCommunity(community: InsertCommunity): Promise<Community>;
  joinCommunity(communityId: string, userId: string): Promise<CommunityMember>;
  leaveCommunity(communityId: string, userId: string): Promise<void>;
  getCommunityMembers(communityId: string): Promise<(CommunityMember & { user: User })[]>;
  getUserCommunities(userId: string): Promise<Community[]>;

  // Wallet
  getWalletBalance(userId: string): Promise<number>;
  getTransactions(userId: string, limit?: number): Promise<WalletTransaction[]>;
  createTransaction(transaction: InsertWalletTransaction): Promise<WalletTransaction>;

  // Support
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  getSupportTickets(): Promise<(SupportTicket & { userName: string; userEmail: string })[]>;
  updateSupportTicketStatus(id: string, status: string, adminNotes?: string): Promise<void>;

  // Push Subscriptions
  savePushSubscription(sub: InsertPushSubscription): Promise<PushSubscription>;
  getPushSubscriptions(userId: string): Promise<PushSubscription[]>;
  getAllPushSubscribedUserIds(): Promise<string[]>;
  getAdminUserIds(): Promise<string[]>;
  deletePushSubscription(endpoint: string): Promise<void>;

  // Notifications
  createNotification(notif: InsertNotification): Promise<Notification>;
  getNotifications(userId: string, limit?: number): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  markNotificationRead(id: string, userId: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;

  // Stats
  getUserStats(userId: string): Promise<{
    challengesCompleted: number;
    challengesWon: number;
    totalEarned: number;
    checkInCount: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  private decryptUser(user: User): User {
    return {
      ...user,
      cpf: user.cpf ? decrypt(user.cpf) : user.cpf,
      phone: user.phone ? decrypt(user.phone) : user.phone,
    };
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user ? this.decryptUser(user) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user ? this.decryptUser(user) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(sql`LOWER(${users.email}) = LOWER(${email})`);
    return user ? this.decryptUser(user) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const toSave = { ...data };
    if (toSave.cpf !== undefined && toSave.cpf !== null && toSave.cpf !== "") {
      toSave.cpf = encrypt(toSave.cpf);
    }
    if (toSave.phone !== undefined && toSave.phone !== null && toSave.phone !== "") {
      toSave.phone = encrypt(toSave.phone);
    }
    const [user] = await db.update(users).set(toSave).where(eq(users.id, id)).returning();
    return user ? this.decryptUser(user) : undefined;
  }

  async searchUsers(query: string, limit = 20): Promise<User[]> {
    return db.select().from(users)
      .where(or(ilike(users.username, `%${query}%`), ilike(users.name, `%${query}%`)))
      .limit(limit);
  }

  // Challenges
  async getChallenge(id: string): Promise<Challenge | undefined> {
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id));
    return challenge;
  }

  async getChallenges(limit = 20): Promise<Challenge[]> {
    return db.select().from(challenges)
      .where(eq(challenges.isActive, true))
      .orderBy(desc(challenges.createdAt))
      .limit(limit);
  }

  async getExploreChallenges(limit = 50): Promise<Challenge[]> {
    return db.select().from(challenges)
      .where(
        and(
          eq(challenges.isActive, true),
          eq(challenges.isPrivate, false),
          or(eq(challenges.status, "pending"), eq(challenges.status, "active"))
        )
      )
      .orderBy(desc(challenges.createdAt))
      .limit(limit);
  }

  async getUserChallenges(userId: string): Promise<any[]> {
    const participations = await db.select({
      challengeId: challengeParticipants.challengeId,
      isActive: challengeParticipants.isActive,
    })
      .from(challengeParticipants)
      .where(eq(challengeParticipants.userId, userId));
    
    if (participations.length === 0) return [];
    
    const ids = participations.map(p => p.challengeId);
    const challs = await db.select().from(challenges)
      .where(inArray(challenges.id, ids))
      .orderBy(desc(challenges.createdAt));

    const counts = await db.select({
      challengeId: challengeParticipants.challengeId,
      count: sql<number>`count(*)::int`,
      activeCount: sql<number>`count(*) filter (where ${challengeParticipants.isActive} = true)::int`,
    }).from(challengeParticipants)
      .where(inArray(challengeParticipants.challengeId, ids))
      .groupBy(challengeParticipants.challengeId);

    const countMap = new Map(counts.map(c => [c.challengeId, c]));
    const partMap = new Map(participations.map(p => [p.challengeId, p]));

    return challs.map(c => ({
      ...c,
      participantCount: countMap.get(c.id)?.count || 0,
      activeParticipantCount: countMap.get(c.id)?.activeCount || 0,
      myParticipation: partMap.get(c.id),
    }));
  }

  async createChallenge(challenge: InsertChallenge): Promise<Challenge> {
    const [created] = await db.insert(challenges).values(challenge).returning();
    return created;
  }

  async updateChallenge(id: string, data: Partial<Challenge>): Promise<Challenge | undefined> {
    const [updated] = await db.update(challenges).set(data).where(eq(challenges.id, id)).returning();
    return updated;
  }

  // Challenge Participants
  async joinChallenge(challengeId: string, userId: string, isAdmin = false): Promise<ChallengeParticipant> {
    const [participant] = await db.insert(challengeParticipants)
      .values({ challengeId, userId, isAdmin })
      .returning();
    return participant;
  }

  async leaveChallenge(challengeId: string, userId: string): Promise<void> {
    await db.update(challengeParticipants)
      .set({ isActive: false })
      .where(and(
        eq(challengeParticipants.challengeId, challengeId),
        eq(challengeParticipants.userId, userId)
      ));
  }

  async getChallengeParticipants(challengeId: string): Promise<(ChallengeParticipant & { user: User })[]> {
    const rows = await db.select()
      .from(challengeParticipants)
      .innerJoin(users, eq(challengeParticipants.userId, users.id))
      .where(eq(challengeParticipants.challengeId, challengeId));
    
    return rows.map(r => ({ ...r.challenge_participants, user: r.users }));
  }

  async getParticipant(challengeId: string, userId: string): Promise<ChallengeParticipant | undefined> {
    const [p] = await db.select().from(challengeParticipants)
      .where(and(
        eq(challengeParticipants.challengeId, challengeId),
        eq(challengeParticipants.userId, userId)
      ));
    return p;
  }

  async updateParticipantScore(challengeId: string, userId: string, score: number): Promise<void> {
    await db.update(challengeParticipants)
      .set({ score })
      .where(and(
        eq(challengeParticipants.challengeId, challengeId),
        eq(challengeParticipants.userId, userId)
      ));
  }

  // Challenge Messages
  async createChallengeMessage(msg: InsertChallengeMessage): Promise<ChallengeMessage> {
    const [created] = await db.insert(challengeMessages).values(msg).returning();
    return created;
  }

  async getChallengeMessages(challengeId: string) {
    const rows = await db.select({
      id: challengeMessages.id,
      challengeId: challengeMessages.challengeId,
      userId: challengeMessages.userId,
      text: challengeMessages.text,
      audioUrl: challengeMessages.audioUrl,
      createdAt: challengeMessages.createdAt,
      user: {
        id: users.id,
        name: users.name,
        avatar: users.avatar,
        username: users.username,
      },
    })
      .from(challengeMessages)
      .innerJoin(users, eq(challengeMessages.userId, users.id))
      .where(eq(challengeMessages.challengeId, challengeId))
      .orderBy(challengeMessages.createdAt);
    return rows;
  }

  // Check-ins
  async createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn> {
    const [created] = await db.insert(checkIns).values(checkIn).returning();
    return created;
  }

  async getChallengeCheckIns(challengeId: string): Promise<CheckIn[]> {
    return db.select().from(checkIns)
      .where(eq(checkIns.challengeId, challengeId))
      .orderBy(desc(checkIns.createdAt));
  }

  async getUserCheckIns(userId: string, challengeId?: string): Promise<CheckIn[]> {
    const conditions = [eq(checkIns.userId, userId)];
    if (challengeId) conditions.push(eq(checkIns.challengeId, challengeId));
    return db.select().from(checkIns)
      .where(and(...conditions))
      .orderBy(desc(checkIns.createdAt));
  }

  // Messages
  async sendMessage(message: InsertMessage): Promise<Message> {
    const [created] = await db.insert(messages).values(message).returning();
    return created;
  }

  async getConversation(userId1: string, userId2: string, limit = 50): Promise<Message[]> {
    return db.select().from(messages)
      .where(or(
        and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
        and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
      ))
      .orderBy(messages.createdAt)
      .limit(limit);
  }

  async getUserConversations(userId: string): Promise<{ user: User; lastMessage: Message; unreadCount: number }[]> {
    const allMessages = await db.select().from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.createdAt));

    const conversationMap = new Map<string, { lastMessage: Message; unreadCount: number }>();
    
    for (const msg of allMessages) {
      const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!conversationMap.has(otherUserId)) {
        const unreadCount = allMessages.filter(m => 
          m.senderId === otherUserId && m.receiverId === userId && !m.isRead
        ).length;
        conversationMap.set(otherUserId, { lastMessage: msg, unreadCount });
      }
    }

    const result: { user: User; lastMessage: Message; unreadCount: number }[] = [];
    for (const [otherUserId, conv] of conversationMap) {
      const user = await this.getUser(otherUserId);
      if (user) {
        result.push({ user, lastMessage: conv.lastMessage, unreadCount: conv.unreadCount });
      }
    }

    return result;
  }

  async markMessagesRead(senderId: string, receiverId: string): Promise<void> {
    await db.update(messages)
      .set({ isRead: true })
      .where(and(eq(messages.senderId, senderId), eq(messages.receiverId, receiverId)));
  }

  // Follows
  async follow(followerId: string, followingId: string): Promise<Follow> {
    const [f] = await db.insert(follows).values({ followerId, followingId }).returning();
    return f;
  }

  async unfollow(followerId: string, followingId: string): Promise<void> {
    await db.delete(follows).where(and(
      eq(follows.followerId, followerId),
      eq(follows.followingId, followingId)
    ));
  }

  async getFollowers(userId: string): Promise<(Follow & { follower: User })[]> {
    const rows = await db.select()
      .from(follows)
      .innerJoin(users, eq(follows.followerId, users.id))
      .where(eq(follows.followingId, userId));
    return rows.map(r => ({ ...r.follows, follower: r.users }));
  }

  async getFollowing(userId: string): Promise<(Follow & { following: User })[]> {
    const rows = await db.select()
      .from(follows)
      .innerJoin(users, eq(follows.followingId, users.id))
      .where(eq(follows.followerId, userId));
    return rows.map(r => ({ ...r.follows, following: r.users }));
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const [f] = await db.select().from(follows).where(and(
      eq(follows.followerId, followerId),
      eq(follows.followingId, followingId)
    ));
    return !!f;
  }

  // Communities
  async getCommunity(id: string): Promise<Community | undefined> {
    const [community] = await db.select().from(communities).where(eq(communities.id, id));
    return community;
  }

  async getCommunities(limit = 20): Promise<(Community & { memberCount: number })[]> {
    const comms = await db.select().from(communities).orderBy(desc(communities.createdAt)).limit(limit);
    const result: (Community & { memberCount: number })[] = [];
    for (const comm of comms) {
      const [count] = await db.select({ count: sql<number>`count(*)::int` })
        .from(communityMembers)
        .where(eq(communityMembers.communityId, comm.id));
      result.push({ ...comm, memberCount: count?.count || 0 });
    }
    return result;
  }

  async createCommunity(community: InsertCommunity): Promise<Community> {
    const [created] = await db.insert(communities).values(community).returning();
    return created;
  }

  async joinCommunity(communityId: string, userId: string): Promise<CommunityMember> {
    const [member] = await db.insert(communityMembers)
      .values({ communityId, userId })
      .returning();
    return member;
  }

  async leaveCommunity(communityId: string, userId: string): Promise<void> {
    await db.delete(communityMembers).where(and(
      eq(communityMembers.communityId, communityId),
      eq(communityMembers.userId, userId)
    ));
  }

  async getCommunityMembers(communityId: string): Promise<(CommunityMember & { user: User })[]> {
    const rows = await db.select()
      .from(communityMembers)
      .innerJoin(users, eq(communityMembers.userId, users.id))
      .where(eq(communityMembers.communityId, communityId));
    return rows.map(r => ({ ...r.community_members, user: r.users }));
  }

  async getUserCommunities(userId: string): Promise<Community[]> {
    const memberships = await db.select({ communityId: communityMembers.communityId })
      .from(communityMembers)
      .where(eq(communityMembers.userId, userId));
    
    if (memberships.length === 0) return [];
    
    const ids = memberships.map(m => m.communityId);
    return db.select().from(communities)
      .where(inArray(communities.id, ids));
  }

  // Wallet
  async getWalletBalance(userId: string): Promise<number> {
    const [result] = await db.select({
      balance: sql<number>`COALESCE(SUM(CASE WHEN ${walletTransactions.type} IN ('deposit', 'prize', 'refund') THEN ${walletTransactions.amount}::numeric ELSE -${walletTransactions.amount}::numeric END), 0)::numeric`
    }).from(walletTransactions).where(eq(walletTransactions.userId, userId));
    return Number(result?.balance || 0);
  }

  async getTransactions(userId: string, limit = 50): Promise<WalletTransaction[]> {
    return db.select().from(walletTransactions)
      .where(eq(walletTransactions.userId, userId))
      .orderBy(desc(walletTransactions.createdAt))
      .limit(limit);
  }

  async createTransaction(transaction: InsertWalletTransaction): Promise<WalletTransaction> {
    const [created] = await db.insert(walletTransactions).values(transaction).returning();
    return created;
  }

  // Stats
  async getUserStats(userId: string): Promise<{
    challengesCompleted: number;
    challengesWon: number;
    totalEarned: number;
    checkInCount: number;
  }> {
    const [completedResult] = await db.select({ count: sql<number>`count(*)::int` })
      .from(challengeParticipants)
      .where(eq(challengeParticipants.userId, userId));

    const [checkInResult] = await db.select({ count: sql<number>`count(*)::int` })
      .from(checkIns)
      .where(eq(checkIns.userId, userId));

    const [earningsResult] = await db.select({
      total: sql<number>`COALESCE(SUM(${walletTransactions.amount}::numeric), 0)::numeric`
    }).from(walletTransactions)
      .where(and(
        eq(walletTransactions.userId, userId),
        eq(walletTransactions.type, "prize")
      ));

    return {
      challengesCompleted: completedResult?.count || 0,
      challengesWon: 0,
      totalEarned: Number(earningsResult?.total || 0),
      checkInCount: checkInResult?.count || 0,
    };
  }

  // Support
  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    const [created] = await db.insert(supportTickets).values(ticket).returning();
    return created;
  }

  async getSupportTickets() {
    const rows = await db.select({
      id: supportTickets.id,
      userId: supportTickets.userId,
      type: supportTickets.type,
      message: supportTickets.message,
      status: supportTickets.status,
      adminNotes: supportTickets.adminNotes,
      createdAt: supportTickets.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
      .from(supportTickets)
      .innerJoin(users, eq(supportTickets.userId, users.id))
      .orderBy(desc(supportTickets.createdAt));
    return rows;
  }

  async updateSupportTicketStatus(id: string, status: string, adminNotes?: string): Promise<void> {
    const updates: any = { status };
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;
    await db.update(supportTickets).set(updates).where(eq(supportTickets.id, id));
  }

  async savePushSubscription(sub: InsertPushSubscription): Promise<PushSubscription> {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
    const [row] = await db.insert(pushSubscriptions).values(sub).returning();
    return row;
  }

  async getPushSubscriptions(userId: string): Promise<PushSubscription[]> {
    return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  }

  async getAllPushSubscribedUserIds(): Promise<string[]> {
    const rows = await db.selectDistinct({ userId: pushSubscriptions.userId }).from(pushSubscriptions);
    return rows.map(r => r.userId);
  }

  async getAdminUserIds(): Promise<string[]> {
    const rows = await db.select({ id: users.id }).from(users).where(eq(users.isAdmin, true));
    return rows.map(r => r.id);
  }

  async deletePushSubscription(endpoint: string): Promise<void> {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  }

  async createNotification(notif: InsertNotification): Promise<Notification> {
    const [row] = await db.insert(notifications).values(notif).returning();
    return row;
  }

  async getNotifications(userId: string, limit = 50): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit);
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db.select({ count: drizzleCount() }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result?.count || 0;
  }

  async markNotificationRead(id: string, userId: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }
}

export const storage = new DatabaseStorage();
