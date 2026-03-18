import { db } from "../db";
import { wallets, transactions, TRANSACTION_TYPES, TRANSACTION_STATUS } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

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
    const balance = Number(wallet.balance);
    const lockedBalance = Number(wallet.lockedBalance);
    return {
      balance,
      lockedBalance,
      availableBalance: balance - lockedBalance,
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
