import { walletService } from "./wallet-service";
import { transactionService } from "./transaction-service";
import { TRANSACTION_TYPES, TRANSACTION_STATUS, PLATFORM_FEE_PERCENT } from "@shared/schema";
import { db } from "../db";
import { challengeParticipants, challenges } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export class ChallengeFinanceService {
  async processEntryFee(userId: string, challengeId: string, entryFee: number, challengeTitle: string) {
    const idempotencyKey = `challenge_entry_${userId}_${challengeId}`;

    const existing = await transactionService.getByIdempotencyKey(idempotencyKey);
    if (existing) {
      if (existing.status === TRANSACTION_STATUS.COMPLETED) {
        return existing;
      }
    }

    await walletService.lockBalance(userId, entryFee);

    const tx = await transactionService.create({
      userId,
      type: TRANSACTION_TYPES.CHALLENGE_ENTRY,
      amount: entryFee,
      status: TRANSACTION_STATUS.COMPLETED,
      idempotencyKey,
      description: `Entrada: ${challengeTitle}`,
      challengeId,
    });

    return tx;
  }

  async refundEntryFee(userId: string, challengeId: string, entryFee: number, challengeTitle: string) {
    await walletService.unlockBalance(userId, entryFee);

    await transactionService.create({
      userId,
      type: TRANSACTION_TYPES.REFUND,
      amount: entryFee,
      status: TRANSACTION_STATUS.COMPLETED,
      description: `Reembolso: ${challengeTitle}`,
      challengeId,
    });
  }

  async finalizeChallenge(challengeId: string, winnerUserIds: string[]) {
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, challengeId));
    if (!challenge) throw new Error("Desafio não encontrado");

    const participants = await db.select().from(challengeParticipants)
      .where(and(
        eq(challengeParticipants.challengeId, challengeId),
        eq(challengeParticipants.isActive, true)
      ));

    const entryFee = Number(challenge.entryFee);
    const totalPool = entryFee * participants.length;
    const platformFee = totalPool * (PLATFORM_FEE_PERCENT / 100);
    const prizePool = totalPool - platformFee;

    for (const participant of participants) {
      await walletService.deductLockedBalance(participant.userId, entryFee);
    }

    if (winnerUserIds.length > 0) {
      const prizePerWinner = prizePool / winnerUserIds.length;

      for (const winnerId of winnerUserIds) {
        await walletService.addBalance(winnerId, prizePerWinner);

        await transactionService.create({
          userId: winnerId,
          type: TRANSACTION_TYPES.CHALLENGE_WIN,
          amount: prizePerWinner,
          status: TRANSACTION_STATUS.COMPLETED,
          description: `Prêmio: ${challenge.title}`,
          challengeId,
          metadata: { totalPool, platformFee, winnersCount: winnerUserIds.length },
        });
      }
    }

    if (platformFee > 0) {
      await transactionService.create({
        userId: challenge.createdBy,
        type: TRANSACTION_TYPES.PLATFORM_FEE,
        amount: platformFee,
        status: TRANSACTION_STATUS.COMPLETED,
        description: `Taxa plataforma: ${challenge.title}`,
        challengeId,
        metadata: { feePercent: PLATFORM_FEE_PERCENT, totalPool },
      });
    }

    await db.update(challenges)
      .set({ isActive: false, status: "completed" })
      .where(eq(challenges.id, challengeId));

    return { totalPool, platformFee, prizePool, winnersCount: winnerUserIds.length };
  }
}

export const challengeFinanceService = new ChallengeFinanceService();
