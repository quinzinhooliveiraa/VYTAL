import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { db } from "./db";
import { challenges, challengeParticipants, checkIns, transactions, TRANSACTION_TYPES, TRANSACTION_STATUS } from "@shared/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { paymentService } from "./services/payment-service";
import { webhookService } from "./services/webhook-service";

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
    // Find all withdrawal transactions that are still open on the platform
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
        ),
      );

    // Only reconcile those that have an externalId (already sent to gateway)
    const toCheck = openWithdrawals.filter((tx) => !!tx.externalId);
    if (toCheck.length === 0) return;

    log(`[Reconcile] Checking ${toCheck.length} open withdrawal(s)...`);

    let completed = 0;
    let failed = 0;
    let stillPending = 0;

    for (const tx of toCheck) {
      try {
        const gatewayStatus = await paymentService.getWithdrawStatus(tx.externalId!);
        const upper = gatewayStatus.toUpperCase();

        if (upper === "PAID" || upper === "COMPLETED" || upper === "SUCCESS") {
          await webhookService.processWithdrawCompleted(tx.externalId!, {
            reconciledAt: new Date().toISOString(),
            gatewayStatus,
          });
          completed++;
        } else if (
          upper === "FAILED" ||
          upper === "REJECTED" ||
          upper === "CANCELLED" ||
          upper === "CANCELED" ||
          upper === "ERROR"
        ) {
          await webhookService.processWithdrawFailed(tx.externalId!, {
            reconciledAt: new Date().toISOString(),
            gatewayStatus,
          });
          failed++;
        } else {
          stillPending++;
        }
      } catch (txErr: any) {
        log(`[Reconcile] Error checking withdrawal ${tx.id}: ${txErr.message}`);
      }
    }

    if (completed > 0 || failed > 0) {
      log(
        `[Reconcile] Withdrawals reconciled — completed: ${completed}, failed: ${failed}, still pending: ${stillPending}`,
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

  // Auto-process missed days every 24 hours (and once 5 seconds after startup)
  setTimeout(processMissedDaysAuto, 5000);
  setInterval(processMissedDaysAuto, 24 * 60 * 60 * 1000);

  // Withdrawal reconciliation: check PROCESSING/PENDING withdrawals against the
  // gateway every 5 minutes. Catches cases where the webhook was missed (server
  // was down or gateway didn't deliver it). Self-heals without admin intervention.
  const RECONCILE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  setTimeout(reconcileWithdrawals, 30_000); // first run 30s after startup
  setInterval(reconcileWithdrawals, RECONCILE_INTERVAL_MS);
})();
