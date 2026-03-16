import { db } from "../db";
import { transactions, TRANSACTION_STATUS } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";

export interface CreateTransactionParams {
  userId: string;
  type: string;
  amount: number;
  status?: string;
  externalId?: string;
  idempotencyKey?: string;
  description?: string;
  challengeId?: string;
  metadata?: Record<string, any>;
}

export class TransactionService {
  generateIdempotencyKey(): string {
    return crypto.randomUUID();
  }

  async create(params: CreateTransactionParams) {
    if (params.idempotencyKey) {
      const [existing] = await db.select().from(transactions)
        .where(eq(transactions.idempotencyKey, params.idempotencyKey));
      if (existing) return existing;
    }

    const [tx] = await db.insert(transactions).values({
      userId: params.userId,
      type: params.type,
      amount: String(params.amount),
      status: params.status || TRANSACTION_STATUS.PENDING,
      externalId: params.externalId || null,
      idempotencyKey: params.idempotencyKey || this.generateIdempotencyKey(),
      description: params.description || "",
      challengeId: params.challengeId || null,
      metadata: params.metadata || {},
    }).returning();

    return tx;
  }

  async updateStatus(transactionId: string, status: string, metadata?: Record<string, any>) {
    const updates: any = { status, updatedAt: new Date() };
    if (metadata) {
      updates.metadata = metadata;
    }

    const [updated] = await db.update(transactions)
      .set(updates)
      .where(eq(transactions.id, transactionId))
      .returning();

    return updated;
  }

  async setExternalId(transactionId: string, externalId: string) {
    const [updated] = await db.update(transactions)
      .set({ externalId, updatedAt: new Date() })
      .where(eq(transactions.id, transactionId))
      .returning();
    return updated;
  }

  async getByExternalId(externalId: string) {
    const [tx] = await db.select().from(transactions)
      .where(eq(transactions.externalId, externalId));
    return tx;
  }

  async getByIdempotencyKey(key: string) {
    const [tx] = await db.select().from(transactions)
      .where(eq(transactions.idempotencyKey, key));
    return tx;
  }

  async getUserTransactions(userId: string, limit = 50) {
    return db.select().from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }

  async getTransaction(id: string) {
    const [tx] = await db.select().from(transactions).where(eq(transactions.id, id));
    return tx;
  }

  async getPendingWithdrawals(userId: string) {
    return db.select().from(transactions)
      .where(and(
        eq(transactions.userId, userId),
        eq(transactions.type, "withdraw_request"),
        eq(transactions.status, TRANSACTION_STATUS.PENDING)
      ));
  }
}

export const transactionService = new TransactionService();
