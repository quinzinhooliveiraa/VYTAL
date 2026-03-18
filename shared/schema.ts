import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  bio: text("bio").default(""),
  avatar: text("avatar").default(""),
  banner: text("banner").default(""),
  cpf: text("cpf").default(""),
  phone: text("phone").default(""),
  goals: jsonb("goals").default([]),
  publicEarnings: boolean("public_earnings").default(true),
  isPrivate: boolean("is_private").default(false),
  online: boolean("online").default(false),
  isAdmin: boolean("is_admin").default(false),
  role: text("role").default("user"),
  authProvider: text("auth_provider").default("email"),
  twoFactorSecret: text("two_factor_secret"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  pwaInstalled: boolean("pwa_installed").default(false),
  isBanned: boolean("is_banned").default(false),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const challenges = pgTable("challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").default(""),
  type: text("type").notNull(),
  sport: text("sport").notNull(),
  entryFee: decimal("entry_fee", { precision: 10, scale: 2 }).notNull(),
  duration: integer("duration").notNull(),
  maxParticipants: integer("max_participants").default(50),
  validationType: text("validation_type").default("photo_gps"),
  rules: text("rules").default(""),
  image: text("image").default(""),
  goalTarget: integer("goal_target"),
  maxMissedDays: integer("max_missed_days").default(0),
  skipWeekends: boolean("skip_weekends").default(false),
  restDays: text("rest_days").array(),
  restDaysAllowed: integer("rest_days_allowed").default(0),
  isActive: boolean("is_active").default(true),
  status: text("status").default("active"),
  isPrivate: boolean("is_private").default(false),
  splitPrize: boolean("split_prize").default(false),
  splitPercentages: jsonb("split_percentages").default({ 1: 50, 2: 30, 3: 20 }),
  communityId: varchar("community_id"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const challengeParticipants = pgTable("challenge_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: varchar("challenge_id").notNull().references(() => challenges.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  score: integer("score").default(0),
  totalDistanceKm: decimal("total_distance_km", { precision: 10, scale: 3 }).default("0"),
  totalDurationMins: integer("total_duration_mins").default(0),
  missedDays: integer("missed_days").default(0),
  restDaysUsed: integer("rest_days_used").default(0),
  lastCheckInDate: text("last_check_in_date"),
  isActive: boolean("is_active").default(true),
  isAdmin: boolean("is_admin").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const checkIns = pgTable("check_ins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: varchar("challenge_id").notNull().references(() => challenges.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: text("status").default("completed"),
  photoUrl: text("photo_url").default(""),
  backPhotoUrl: text("back_photo_url").default(""),
  endPhotoUrl: text("end_photo_url").default(""),
  endBackPhotoUrl: text("end_back_photo_url").default(""),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  endLatitude: decimal("end_latitude", { precision: 10, scale: 7 }),
  endLongitude: decimal("end_longitude", { precision: 10, scale: 7 }),
  distanceKm: decimal("distance_km", { precision: 8, scale: 3 }),
  durationMins: integer("duration_mins"),
  caloriesBurned: integer("calories_burned"),
  avgPace: text("avg_pace"),
  reps: integer("reps"),
  indoorProofPhotoUrl: text("indoor_proof_photo_url").default(""),
  isIndoor: boolean("is_indoor").default(false),
  approved: boolean("approved").default(false),
  locationName: text("location_name").default(""),
  endLocationName: text("end_location_name").default(""),
  flagged: boolean("flagged").default(false),
  flagReason: text("flag_reason").default(""),
  checkedOutAt: timestamp("checked_out_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  text: text("text").notNull(),
  audioUrl: text("audio_url"),
  replyToId: varchar("reply_to_id"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const follows = pgTable("follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").notNull().references(() => users.id),
  followingId: varchar("following_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const followRequests = pgTable("follow_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requesterId: varchar("requester_id").notNull().references(() => users.id),
  targetId: varchar("target_id").notNull().references(() => users.id),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

export const communities = pgTable("communities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").default(""),
  sport: text("sport").notNull(),
  image: text("image").default(""),
  isPrivate: boolean("is_private").default(false),
  ownerFeePercent: decimal("owner_fee_percent", { precision: 5, scale: 2 }).default("5.00"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const communityMembers = pgTable("community_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull().references(() => communities.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  isAdmin: boolean("is_admin").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const challengeJoinRequests = pgTable("challenge_join_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: varchar("challenge_id").notNull().references(() => challenges.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by"),
});

export const challengeMessages = pgTable("challenge_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: varchar("challenge_id").notNull().references(() => challenges.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  text: text("text").notNull(),
  audioUrl: text("audio_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const supportTickets = pgTable("support_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  message: text("message").notNull(),
  status: text("status").default("open").notNull(),
  adminNotes: text("admin_notes").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

// Legacy table - kept for backward compatibility
export const walletTransactions = pgTable("wallet_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").default(""),
  challengeId: varchar("challenge_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ====== NEW FINANCIAL SYSTEM ======

export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  balance: decimal("balance", { precision: 12, scale: 2 }).default("0.00").notNull(),
  lockedBalance: decimal("locked_balance", { precision: 12, scale: 2 }).default("0.00").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").default("pending").notNull(),
  externalId: text("external_id"),
  idempotencyKey: text("idempotency_key").unique(),
  description: text("description").default(""),
  challengeId: varchar("challenge_id"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, online: true });
export const insertChallengeSchema = createInsertSchema(challenges).omit({ id: true, createdAt: true, isActive: true, status: true });
export const insertCheckInSchema = createInsertSchema(checkIns).omit({ id: true, createdAt: true, approved: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true, isRead: true });
export const insertFollowSchema = createInsertSchema(follows).omit({ id: true, createdAt: true });
export const insertCommunitySchema = createInsertSchema(communities).omit({ id: true, createdAt: true });
export const insertChallengeMessageSchema = createInsertSchema(challengeMessages).omit({ id: true, createdAt: true });
export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({ id: true, createdAt: true, status: true, adminNotes: true });
export const insertChallengeJoinRequestSchema = createInsertSchema(challengeJoinRequests).omit({ id: true, createdAt: true, reviewedAt: true, reviewedBy: true, status: true });
export const insertWalletTransactionSchema = createInsertSchema(walletTransactions).omit({ id: true, createdAt: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWalletSchema = createInsertSchema(wallets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFollowRequestSchema = createInsertSchema(followRequests).omit({ id: true, createdAt: true, reviewedAt: true, status: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type ChallengeParticipant = typeof challengeParticipants.$inferSelect;
export type CheckIn = typeof checkIns.$inferSelect;
export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Follow = typeof follows.$inferSelect;
export type InsertFollow = z.infer<typeof insertFollowSchema>;
export type Community = typeof communities.$inferSelect;
export type InsertCommunity = z.infer<typeof insertCommunitySchema>;
export type CommunityMember = typeof communityMembers.$inferSelect;
export type ChallengeJoinRequest = typeof challengeJoinRequests.$inferSelect;
export type FollowRequest = typeof followRequests.$inferSelect;
export type InsertFollowRequest = z.infer<typeof insertFollowRequestSchema>;
export type InsertChallengeJoinRequest = z.infer<typeof insertChallengeJoinRequestSchema>;
export type ChallengeMessage = typeof challengeMessages.$inferSelect;
export type InsertChallengeMessage = z.infer<typeof insertChallengeMessageSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

// In-app Notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  icon: text("icon").default(""),
  actionUrl: text("action_url").default(""),
  challengeId: varchar("challenge_id"),
  fromUserId: varchar("from_user_id"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true, isRead: true });
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Push Subscriptions
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({ id: true, createdAt: true });
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;

// Transaction types enum
export const TRANSACTION_TYPES = {
  DEPOSIT: "deposit",
  CHALLENGE_ENTRY: "challenge_entry",
  CHALLENGE_WIN: "challenge_win",
  WITHDRAW_REQUEST: "withdraw_request",
  WITHDRAW_PROCESSING: "withdraw_processing",
  WITHDRAW_COMPLETED: "withdraw_completed",
  PLATFORM_FEE: "platform_fee",
  REFUND: "refund",
} as const;

export const TRANSACTION_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export const PLATFORM_FEE_PERCENT = 10;
export const DEPOSIT_MINIMUM = 30;
export const WITHDRAW_MINIMUM = 30;

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});
