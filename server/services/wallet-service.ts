import { db } from "../db";
import { wallets, transactions, TRANSACTION_TYPES, TRANSACTION_STATUS, challengeParticipants, challenges } from "@shared/schema";
import { eq, sql, and, inArray } from "drizzle-orm";

export class WalletService {
  async getOrCreateWallet(userId: string) {
    const [existing] = await db.select().from(wallets).where(eq(wallets.userId, userId));
    if (existing) return existing;

    const [created] = await db.insert(wallets)
      .values({ userId, balance: "0.00", lockedBalance: "0.00" })
      .onConflictDoNothing()
      .returning();

    if (created) return created;

    const [found] = await db.select().from(wallets).where(eq(wallets.userId, userId));
    return found;
  }

  async getBalance(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);

    const [result] = await db.select({
      deposits: sql<string>`COALESCE(SUM(CASE WHEN type = 'deposit' AND status = 'completed' THEN amount ELSE 0 END), 0)`,
      withdrawals: sql<string>`COALESCE(SUM(CASE WHEN type = 'withdraw_request' AND status IN ('completed', 'processing') THEN amount ELSE 0 END), 0)`,
      challengeEntries: sql<string>`COALESCE(SUM(CASE WHEN type = 'challenge_entry' AND status = 'completed' THEN amount ELSE 0 END), 0)`,
      challengeWins: sql<string>`COALESCE(SUM(CASE WHEN type = 'challenge_win' AND status = 'completed' THEN amount ELSE 0 END), 0)`,
      refunds: sql<string>`COALESCE(SUM(CASE WHEN type = 'refund' AND status = 'completed' THEN amount ELSE 0 END), 0)`,
    }).from(transactions).where(eq(transactions.userId, userId));

    const realBalance = Number(result.deposits) - Number(result.withdrawals) - Number(result.challengeEntries) + Number(result.challengeWins) + Number(result.refunds);

    const parts = await db.select().from(challengeParticipants).where(
      and(eq(challengeParticipants.userId, userId), eq(challengeParticipants.isActive, true))
    );

    // displayLocked: total committed to active/pending challenges (for UI display)
    // pendingLocked: only entries not yet COMPLETED (to avoid double-counting with realBalance)
    let displayLocked = 0;
    let pendingLocked = 0;

    for (const p of parts) {
      const [ch] = await db.select().from(challenges).where(eq(challenges.id, p.challengeId));
      if (ch && (ch.status === "active" || ch.status === "pending") && Number(ch.entryFee || 0) > 0) {
        displayLocked += Number(ch.entryFee);

        const idempotencyKey = `challenge_entry_${userId}_${ch.id}`;
        const [entryTx] = await db.select().from(transactions)
          .where(eq(transactions.idempotencyKey, idempotencyKey));
        if (!entryTx || entryTx.status === "pending") {
          pendingLocked += Number(ch.entryFee);
        }
      }
    }

    const correctedBalance = Math.max(realBalance, 0);
    const availableBalance = Math.max(correctedBalance - displayLocked, 0);

    if (correctedBalance !== Number(wallet.balance) || displayLocked !== Number(wallet.lockedBalance)) {
      await db.update(wallets)
        .set({ balance: String(correctedBalance), lockedBalance: String(displayLocked), updatedAt: new Date() })
        .where(eq(wallets.userId, userId));
    }

    return {
      balance: correctedBalance,
      lockedBalance: displayLocked,
      availableBalance,
    };
  }

  async addBalance(userId: string, amount: number): Promise<void> {
    if (amount <= 0) throw new Error("Valor deve ser positivo");

    await this.getOrCreateWallet(userId);

    const [updated] = await db.update(wallets)
      .set({
        balance: sql`${wallets.balance}::numeric + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, userId))
      .returning();

    if (!updated) throw new Error("Falha ao atualizar saldo");
  }

  async deductBalance(userId: string, amount: number): Promise<void> {
    if (amount <= 0) throw new Error("Valor deve ser positivo");

    const wallet = await this.getOrCreateWallet(userId);
    if (Number(wallet.balance) - Number(wallet.lockedBalance) < amount) {
      throw new Error("Saldo insuficiente");
    }

    await db.update(wallets)
      .set({
        balance: sql`${wallets.balance}::numeric - ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, userId));
  }

  async lockBalance(userId: string, amount: number): Promise<void> {
    if (amount <= 0) throw new Error("Valor deve ser positivo");

    const wallet = await this.getOrCreateWallet(userId);
    const available = Number(wallet.balance) - Number(wallet.lockedBalance);

    if (available < amount) {
      throw new Error("Saldo insuficiente");
    }

    const [updated] = await db.update(wallets)
      .set({
        lockedBalance: sql`${wallets.lockedBalance}::numeric + ${amount}`,
        updatedAt: new Date(),
      })
      .where(
        sql`${wallets.userId} = ${userId} AND (${wallets.balance}::numeric - ${wallets.lockedBalance}::numeric) >= ${amount}`
      )
      .returning();

    if (!updated) throw new Error("Saldo insuficiente para bloqueio");
  }

  async unlockBalance(userId: string, amount: number): Promise<void> {
    if (amount <= 0) throw new Error("Valor deve ser positivo");

    await db.update(wallets)
      .set({
        lockedBalance: sql`GREATEST(${wallets.lockedBalance}::numeric - ${amount}, 0)`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, userId));
  }

  async deductLockedBalance(userId: string, amount: number): Promise<void> {
    if (amount <= 0) throw new Error("Valor deve ser positivo");

    await db.update(wallets)
      .set({
        balance: sql`${wallets.balance}::numeric - ${amount}`,
        lockedBalance: sql`GREATEST(${wallets.lockedBalance}::numeric - ${amount}, 0)`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, userId));
  }
}

export const walletService = new WalletService();
