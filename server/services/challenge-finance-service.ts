import { walletService } from "./wallet-service";
import { transactionService } from "./transaction-service";
import { TRANSACTION_TYPES, TRANSACTION_STATUS, PLATFORM_FEE_PERCENT } from "@shared/schema";
import { db } from "../db";
import { challengeParticipants, challenges, transactions } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export class ChallengeFinanceService {
  async processEntryFee(userId: string, challengeId: string, entryFee: number, challengeTitle: string) {
    const idempotencyKey = `challenge_entry_${userId}_${challengeId}`;

    const existing = await transactionService.getByIdempotencyKey(idempotencyKey);
    if (existing) {
      return existing;
    }

    // Re-check available balance right before creating the entry so that even
    // if two concurrent requests passed the outer check, only one succeeds.
    const { availableBalance } = await walletService.getBalance(userId);
    if (availableBalance < entryFee) {
      throw new Error(`Saldo insuficiente para entrar no desafio. Disponível: R$ ${availableBalance.toFixed(2)}, necessário: R$ ${entryFee.toFixed(2)}`);
    }

    const tx = await transactionService.create({
      userId,
      type: TRANSACTION_TYPES.CHALLENGE_ENTRY,
      amount: entryFee,
      status: TRANSACTION_STATUS.PENDING,
      idempotencyKey,
      description: `Entrada: ${challengeTitle}`,
      challengeId,
    });

    return tx;
  }

  async refundEntryFee(userId: string, challengeId: string, entryFee: number, challengeTitle: string) {
    const idempotencyKey = `challenge_entry_${userId}_${challengeId}`;
    const existing = await transactionService.getByIdempotencyKey(idempotencyKey);
    if (existing && existing.status === TRANSACTION_STATUS.PENDING) {
      await transactionService.updateStatus(existing.id, TRANSACTION_STATUS.FAILED);
    }

    await transactionService.create({
      userId,
      type: TRANSACTION_TYPES.REFUND,
      amount: entryFee,
      status: TRANSACTION_STATUS.COMPLETED,
      description: `Reembolso: ${challengeTitle}`,
      challengeId,
    });
  }

  async finalizeChallenge(challengeId: string, winnerUserIds: string[], winnerGroups?: string[][]) {
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

    await db.update(challenges)
      .set({ isActive: false, status: "completed" })
      .where(eq(challenges.id, challengeId));

    for (const participant of participants) {
      const idempotencyKey = `challenge_entry_${participant.userId}_${challengeId}`;
      const entryTx = await transactionService.getByIdempotencyKey(idempotencyKey);
      if (entryTx && entryTx.status === TRANSACTION_STATUS.PENDING) {
        await transactionService.updateStatus(entryTx.id, TRANSACTION_STATUS.COMPLETED);
      } else if (!entryTx) {
        await transactionService.create({
          userId: participant.userId,
          type: TRANSACTION_TYPES.CHALLENGE_ENTRY,
          amount: entryFee,
          status: TRANSACTION_STATUS.COMPLETED,
          idempotencyKey,
          description: `Entrada: ${challenge.title}`,
          challengeId,
        });
      }
    }

    const isRankingWithSplit = challenge.type === "ranking" && (challenge as any).splitPrize === true;
    const splitPercentages = (challenge as any).splitPercentages as Record<string, number> | null;

    if (isRankingWithSplit && splitPercentages && winnerGroups && winnerGroups.length > 0) {
      let positionIndex = 0;
      for (const group of winnerGroups) {
        if (!group || group.length === 0) { positionIndex++; continue; }
        let combinedPct = 0;
        for (let k = 0; k < group.length; k++) {
          combinedPct += splitPercentages[String(positionIndex + k + 1)] ?? 0;
        }
        const prizePerPerson = (prizePool * combinedPct / 100) / group.length;
        const startPos = positionIndex + 1;
        const endPos = positionIndex + group.length;
        const posLabel = group.length > 1 ? `${startPos}°-${endPos}° (empate)` : `${startPos}° lugar`;

        for (const winnerId of group) {
          if (prizePerPerson <= 0) continue;
          await walletService.addBalance(winnerId, prizePerPerson);
          await transactionService.create({
            userId: winnerId,
            type: TRANSACTION_TYPES.CHALLENGE_WIN,
            amount: prizePerPerson,
            status: TRANSACTION_STATUS.COMPLETED,
            description: `Prêmio ${posLabel}: ${challenge.title}`,
            challengeId,
            metadata: { totalPool, platformFee, position: startPos, isTie: group.length > 1, combinedPct, winnersInGroup: group.length },
          });
        }
        positionIndex += group.length;
      }
    } else if (winnerUserIds.length > 0) {
      for (let i = 0; i < winnerUserIds.length; i++) {
        const winnerId = winnerUserIds[i];
        let prizeAmount: number;
        let positionLabel = `${i + 1}° lugar`;

        if (isRankingWithSplit && splitPercentages) {
          const pct = splitPercentages[String(i + 1)] ?? 0;
          prizeAmount = prizePool * (pct / 100);
        } else {
          prizeAmount = prizePool / winnerUserIds.length;
        }

        if (prizeAmount <= 0) continue;

        await walletService.addBalance(winnerId, prizeAmount);
        await transactionService.create({
          userId: winnerId,
          type: TRANSACTION_TYPES.CHALLENGE_WIN,
          amount: prizeAmount,
          status: TRANSACTION_STATUS.COMPLETED,
          description: isRankingWithSplit
            ? `Prêmio ${positionLabel}: ${challenge.title}`
            : `Prêmio: ${challenge.title}`,
          challengeId,
          metadata: {
            totalPool, platformFee, winnersCount: winnerUserIds.length, position: i + 1,
            percentage: isRankingWithSplit && splitPercentages ? (splitPercentages[String(i + 1)] ?? null) : null,
          },
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

    return { totalPool, platformFee, prizePool, winnersCount: winnerUserIds.length };
  }
}

export const challengeFinanceService = new ChallengeFinanceService();
