import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { db } from "./db";
import { challenges, challengeParticipants, checkIns, transactions, TRANSACTION_TYPES, TRANSACTION_STATUS } from "@shared/schema";
import { eq, and, sql, inArray, gte, isNotNull } from "drizzle-orm";
import { paymentService } from "./services/payment-service";
import { webhookService } from "./services/webhook-service";
import { transactionService } from "./services/transaction-service";
import { walletService } from "./services/wallet-service";
import { notificationService } from "./services/notification-service";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use("/api/upload", express.raw({ type: "*/*", limit: "50mb" }));

app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

async function processMissedDaysAuto() {
  try {
    const allChallenges = await db.select().from(challenges);
    const activeChallenges = allChallenges.filter((c: any) => c.status === "active" && c.isActive);

    // Always process YESTERDAY (the day that is now fully over).
    // We never mark today as missed while the day is still ongoing.
    const yesterdayDate = new Date();
    yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
    const processDate = yesterdayDate.toISOString().slice(0, 10);

    let totalEliminated = 0;

    for (const challenge of activeChallenges) {
      const cType = challenge.type;
      if (cType !== "checkin" && cType !== "survival") continue;

      const targetDate = new Date(processDate);
      const dayOfWeek = targetDate.getUTCDay().toString();
      const challengeRestDays: string[] = (challenge as any).restDays || [];
      if (challengeRestDays.length > 0 && challengeRestDays.includes(dayOfWeek)) continue;
      if ((challenge as any).skipWeekends && (dayOfWeek === "0" || dayOfWeek === "6")) continue;

      const maxMissed = cType === "checkin" ? 0 : ((challenge as any).maxMissedDays ?? 3);
      const restDaysAllowed = (challenge as any).restDaysAllowed || 0;

      const participants = await db.select().from(challengeParticipants)
        .where(and(eq(challengeParticipants.challengeId, challenge.id), eq(challengeParticipants.isActive, true)));

      for (const p of participants) {
        if ((p as any).isAdmin) continue;
        // Skip if already processed for this date or if the user checked in on/after processDate
        const lastCheckin = (p as any).lastCheckInDate;
        if (lastCheckin && lastCheckin >= processDate) continue;

        // Verify against actual check-in records (not just lastCheckInDate)
        const actualCheckIn = await db.select().from(checkIns)
          .where(and(
            eq(checkIns.challengeId, challenge.id),
            eq(checkIns.userId, p.userId),
            eq(checkIns.status, "completed"),
            sql`DATE(${checkIns.createdAt}) = ${processDate}::date`
          )).limit(1);
        if (actualCheckIn.length > 0) {
          // They did check in — mark processed and skip
          await db.update(challengeParticipants).set({ lastCheckInDate: processDate } as any)
            .where(eq(challengeParticipants.id, p.id));
          continue;
        }

        const restDaysUsed = (p as any).restDaysUsed || 0;
        if (restDaysAllowed > 0 && restDaysUsed < restDaysAllowed) {
          await db.update(challengeParticipants).set({ restDaysUsed: restDaysUsed + 1, lastCheckInDate: processDate } as any)
            .where(eq(challengeParticipants.id, p.id));
          continue;
        }

        const currentMissed = ((p as any).missedDays || 0) + 1;
        await db.update(challengeParticipants).set({ missedDays: currentMissed, lastCheckInDate: processDate } as any)
          .where(eq(challengeParticipants.id, p.id));

        if (currentMissed > maxMissed) {
          await db.update(challengeParticipants).set({ isActive: false } as any)
            .where(eq(challengeParticipants.id, p.id));
          totalEliminated++;
        }
      }
    }

    log(`[Auto] Missed days processed: ${activeChallenges.length} desafios, ${totalEliminated} eliminados`);
  } catch (err: any) {
    log(`[Auto] Erro ao processar missed days: ${err.message}`);
  }
}

// Reconciliation job: polls AbacatePay for every PROCESSING/PENDING withdrawal
// and updates the platform status accordingly.
// Runs every 5 minutes so that even if webhooks are missed (network error, server
// was restarted when webhook arrived, etc.) the status self-corrects automatically.
async function reconcileWithdrawals() {
  if (!paymentService.isConfigured()) return;

  try {
    // --- Part 1: PROCESSING/PENDING withdrawals that have an externalId ---
    // These are saques that were sent to the gateway but never received a webhook.
    const openWithdrawals = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.type, TRANSACTION_TYPES.WITHDRAW_REQUEST),
          inArray(transactions.status, [
            TRANSACTION_STATUS.PROCESSING,
            TRANSACTION_STATUS.PENDING,
          ]),
          isNotNull(transactions.externalId),
        ),
      );

    // --- Part 2: FAILED withdrawals from the last 7 days with an externalId ---
    // Covers the case where the gateway paid but the platform incorrectly shows
    // "failed" (e.g. network timeout during webhook delivery, false failure webhook,
    // or any bug that marked it failed before confirming gateway status).
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentFailed = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.type, TRANSACTION_TYPES.WITHDRAW_REQUEST),
          eq(transactions.status, TRANSACTION_STATUS.FAILED),
          isNotNull(transactions.externalId),
          gte(transactions.createdAt, sevenDaysAgo),
        ),
      );

    const toCheck = [...openWithdrawals, ...recentFailed];
    if (toCheck.length === 0) return;

    log(`[Reconcile] Checking ${openWithdrawals.length} open + ${recentFailed.length} recently-failed withdrawal(s)...`);

    let completed = 0;
    let failed = 0;
    let stillPending = 0;
    let autoFixed = 0; // FAILED on platform but PAID on gateway → auto-corrected

    for (const tx of toCheck) {
      try {
        const gatewayStatus = await paymentService.getWithdrawStatus(tx.externalId!);
        const upper = gatewayStatus.toUpperCase();
        const isPaid = upper === "PAID" || upper === "COMPLETED" || upper === "SUCCESS";
        const isFailed =
          upper === "FAILED" ||
          upper === "REJECTED" ||
          upper === "CANCELLED" ||
          upper === "CANCELED" ||
          upper === "ERROR";

        if (isPaid) {
          if (tx.status === TRANSACTION_STATUS.FAILED) {
            // Platform shows FAILED but gateway confirms the money was sent.
            // Restore the correct state: mark COMPLETED and deduct balance
            // (processWithdrawFailed restored the balance when it was marked failed;
            // we need to take it back since the user actually received the money).
            await transactionService.updateStatus(tx.id, TRANSACTION_STATUS.COMPLETED, {
              ...(tx.metadata as any || {}),
              autoReconciledAt: new Date().toISOString(),
              gatewayStatus,
              previousStatus: tx.status,
              reconciledBy: "auto",
            });
            try {
              await walletService.deductBalance(tx.userId, Number(tx.amount));
            } catch (e: any) {
              // Non-critical — balance formula self-corrects on next getBalance()
              log(`[Reconcile] deductBalance skipped for auto-fix of ${tx.id}: ${e.message}`);
            }
            log(`[Reconcile] AUTO-FIXED withdrawal ${tx.id} (was FAILED, gateway says ${gatewayStatus}) — balance deducted`);
            autoFixed++;
          } else {
            await webhookService.processWithdrawCompleted(tx.externalId!, {
              reconciledAt: new Date().toISOString(),
              gatewayStatus,
            });
            completed++;
          }
        } else if (isFailed) {
          if (tx.status !== TRANSACTION_STATUS.FAILED) {
            await webhookService.processWithdrawFailed(tx.externalId!, {
              reconciledAt: new Date().toISOString(),
              gatewayStatus,
            });
            failed++;
          }
          // If already FAILED on platform AND gateway: nothing to do
        } else {
          stillPending++;
        }
      } catch (txErr: any) {
        log(`[Reconcile] Error checking withdrawal ${tx.id}: ${txErr.message}`);
      }
    }

    if (completed > 0 || failed > 0 || autoFixed > 0) {
      log(
        `[Reconcile] Done — completed: ${completed}, failed: ${failed}, auto-fixed (paid but was FAILED): ${autoFixed}, still pending: ${stillPending}`,
      );
    }
  } catch (err: any) {
    log(`[Reconcile] Error: ${err.message}`);
  }
}

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );

  // Daily check-in reminder notifications (8 AM Brasília = 11:00 UTC)
  // Fires once per day for every active challenge participant who hasn't
  // checked in yet. Uses a minute-level poll so it fires within ~1 minute
  // of the target time even if the server restarted.
  let lastReminderDate = "";
  setInterval(async () => {
    try {
      const now = new Date();
      const utcH = now.getUTCHours();
      const utcM = now.getUTCMinutes();
      const todayKey = now.toISOString().slice(0, 10);
      // Fire between 11:00–11:01 UTC (08:00 Brasília) once per day
      if (utcH !== 11 || utcM !== 0) return;
      if (lastReminderDate === todayKey) return;
      lastReminderDate = todayKey;

      const activeChallenges = await db.select().from(challenges)
        .where(and(eq(challenges.status, "active"), eq(challenges.isActive, true)));

      const checkInTypes = ["checkin", "survival"];
      let total = 0;

      for (const challenge of activeChallenges) {
        if (!checkInTypes.includes(challenge.type)) continue;

        const participants = await db.select().from(challengeParticipants)
          .where(and(
            eq(challengeParticipants.challengeId, challenge.id),
            eq(challengeParticipants.isActive, true),
          ));

        for (const p of participants) {
          if ((p as any).isAdmin) continue;

          // Check if already checked in today
          const todayCheckIn = await db.select().from(checkIns)
            .where(and(
              eq(checkIns.challengeId, challenge.id),
              eq(checkIns.userId, p.userId),
              eq(checkIns.status, "completed"),
              sql`DATE(${checkIns.createdAt}) = ${todayKey}::date`,
            )).limit(1);

          if (todayCheckIn.length > 0) continue;

          notificationService.notify(p.userId, {
            type: "reminder",
            title: "⏰ Hora do check-in!",
            body: `Você ainda não fez o check-in de hoje no desafio "${challenge.title}". Não perca o dia!`,
            actionUrl: `/check-in/${challenge.id}`,
            challengeId: challenge.id,
          }).catch(() => {});
          total++;
        }
      }

      if (total > 0) log(`[Reminder] ${total} lembrete(s) de check-in enviado(s)`);
    } catch (err: any) {
      log(`[Reminder] Erro: ${err.message}`);
    }
  }, 60_000); // check every minute

  // Auto-process missed days every 24 hours (and once 5 seconds after startup)
  setTimeout(processMissedDaysAuto, 5000);
  setInterval(processMissedDaysAuto, 24 * 60 * 60 * 1000);

  // Withdrawal reconciliation: check PROCESSING/PENDING withdrawals against the
  // gateway every 60 seconds. Catches cases where the webhook was missed (server
  // was down or gateway didn't deliver it). Self-heals without admin intervention.
  // Also checks recent FAILED withdrawals (7 days) in case the gateway paid but
  // platform showed failure due to a network/timing error.
  const RECONCILE_INTERVAL_MS = 60 * 1000; // 60 seconds
  setTimeout(reconcileWithdrawals, 15_000); // first run 15s after startup
  setInterval(reconcileWithdrawals, RECONCILE_INTERVAL_MS);
})();
