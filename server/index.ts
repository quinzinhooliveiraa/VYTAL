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

// Replit runs behind a reverse proxy — required for correct IP detection by rate limiters
app.set("trust proxy", 1);

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
        const eliminado = currentMissed > maxMissed;
        await db.update(challengeParticipants).set({ missedDays: currentMissed, lastCheckInDate: processDate, ...(eliminado ? { isActive: false } : {}) } as any)
          .where(eq(challengeParticipants.id, p.id));

        if (eliminado) {
          totalEliminated++;
          notificationService.notify(p.userId, {
            type: "eliminated",
            title: "Você foi eliminado",
            body: `Você perdeu dias demais e foi desqualificado do desafio "${(challenge as any).title}". Seu valor de entrada foi perdido.`,
            icon: "x-circle",
            actionUrl: `/challenge/${challenge.id}`,
            challengeId: challenge.id,
          }).catch(() => {});
        } else if (maxMissed > 0 && currentMissed === maxMissed) {
          // Aviso: última chance antes da eliminação
          notificationService.notify(p.userId, {
            type: "elimination_warning",
            title: "Atencao: ultima chance!",
            body: `Voce ja usou todas as suas faltas no desafio "${(challenge as any).title}". Faltou mais um dia = eliminado!`,
            icon: "alert-triangle",
            actionUrl: `/challenge/${challenge.id}`,
            challengeId: challenge.id,
          }).catch(() => {});
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

  // Motivational push notifications at peak exercise times (Brasília):
  // 06:00 = 09:00 UTC, 12:00 = 15:00 UTC, 18:00 = 21:00 UTC
  const MOTIVATION_SLOTS: Array<{ utcH: number; utcM: number; slot: string }> = [
    { utcH: 9,  utcM: 0, slot: "manha"  },
    { utcH: 15, utcM: 0, slot: "almoco" },
    { utcH: 21, utcM: 0, slot: "tarde"  },
  ];

  // Title pool (30) × body pool (13) per slot. lcm(30,13)=390 > 365 → no repeat for a full year.
  // dayOfYear selects title and body independently, creating 390 unique combinations.
  const MOTIVATION_TITLES: Record<string, string[]> = {
    manha: [
      "Bom dia, guerreiro!","Nova manhã, nova chance!","Hoje é o dia!","Acorda, campeão!",
      "Manhã de ouro!","O treino tá te esperando!","Levanta e vai!","Cedo é pra quem chega primeiro!",
      "Mais um dia pra vencer!","O sol nasceu — e você?","Hoje tem treino!","Começa cedo, termina forte!",
      "Bom dia pra quem tá de pé!","A manhã é dos guerreiros!","Mais um dia no desafio!",
      "Hora de acordar o campeão!","O dia não espera!","Dia novo, meta nova!","Quem madruga, treina!",
      "Novo dia, mesmo foco!","Disciplina começa de manhã!","De novo, de pé, de frente!",
      "O pote não vai se pagar sozinho!","Mais um amanhecer, mais uma chance!","Vai com tudo hoje!",
      "Acorda que o desafio já começou!","Manhã fria? Aquece com o treino!","Primeira missão do dia: treinar!",
      "Olhos abertos, foco ligado!","Cada manhã é uma votação pelo seu sucesso!",
    ],
    almoco: [
      "Pausa pro treino?","Meio-dia chegou!","Energia no pico!","Treino na hora do almoço!",
      "Intervalo produtivo!","Hora de mover o corpo!","O dia ainda não acabou!","Já pensou no treino?",
      "Almoça e treina!","Aqui é o pico de energia!","Faltou treinar ainda?","Faz uma pausa que vale!",
      "Aproveita o intervalo!","Qual o plano pro treino?","Não deixa pra depois!","Agora é o momento!",
      "Treino de almoço conta dobrado!","A tarde começa no treino!","Partiu treino!",
      "O relógio não para, o treino também não!","Hoje tem treino sim!","Corpo em movimento!",
      "Já fez o check-in?","Tá esperando o quê?","Hora H chegou!","Cinco minutos de decisão!",
      "Quem usa o meio do dia ganha o dia!","Bora que o pote tá crescendo!",
      "Não perde esse horário!","A melhor pausa é a do treino!",
    ],
    tarde: [
      "Fim de expediente!","A tarde é sua!","Hora dourada!","Vai treinar?","Fecha o dia forte!",
      "É hora de treinar!","Antes de dormir, treina!","A noite é dos fortes!","Tá cansado? Normal.",
      "Não perde a tarde!","Hoje tem check-in!","Quase fim do dia!","Última chance de hoje!",
      "Termina o dia no treino!","O desafio tá na reta final de hoje!","Falta pouco pro check-in!",
      "Já treinou hoje?","Fecha com chave de ouro!","Noite de campeão!","Cada treino conta!",
      "Mais um passo pro prêmio!","Vai lá, você consegue!","Hoje é dia de check-in!",
      "Suor vale ouro aqui!","Não vai deixar o dia passar, né?","O relógio tá correndo!",
      "Termina o que você começou!","Quem treina de noite sonha com vitória!",
      "O pote espera os persistentes!","Último treino do dia — o mais importante!",
    ],
  };

  const MOTIVATION_BODIES: Record<string, string[]> = {
    manha: [
      "O dia começa cedo pra quem quer vencer. Acorda, treina e manda ver no desafio!",
      "Enquanto o mundo dorme, você já está na luta. Cada manhã conta!",
      "Uma atividade agora muda o seu dia inteiro. Começa com tudo!",
      "Cada manhã é uma oportunidade de ser melhor que ontem. Não deixa ela passar!",
      "O seu eu do futuro agradece o que você faz agora. Vai lá!",
      "Disciplina é escolher o que você quer mais em vez do que quer agora. Treina!",
      "O pote tá esperando quem não desiste. Mostra que é você!",
      "Não precisa ser perfeito, precisa ser consistente. Mais um dia no desafio!",
      "A sequência que você está construindo vale mais que qualquer desculpa. Continua!",
      "Cada treino de manhã é um voto de confiança em si mesmo. Vote em você!",
      "Não perde a manhã — ela não volta. Faz o treino e garante mais um dia!",
      "Os melhores resultados vêm de quem começa o dia com intenção. Vai com tudo!",
      "Levanta mais cedo, treina mais forte, dorme mais satisfeito. É assim que funciona!",
    ],
    almoco: [
      "Quem disse que almoço é só comida? Uma atividade agora e o dia já valeu!",
      "Já pensou no seu treino de hoje? O desafio não espera!",
      "Seu corpo tá no pico de energia agora. Aproveita esse horário!",
      "É uma das melhores estratégias dos campeões: treinar no intervalo. Bora!",
      "Não deixa o dia passar sem marcar presença no desafio. Você consegue!",
      "O desafio tá te esperando. Cinco minutos pra planejar o treino de hoje!",
      "Falta a parte mais importante do dia: seu treino. Não fica pra depois!",
      "Quem usa o meio do dia pra treinar sai na frente. Sai na frente!",
      "Não precisa de muito tempo — consistência bate intensidade. Vai lá!",
      "Aproveita que o corpo tá aquecido e o dia ainda tem horas. Treina agora!",
      "O pote tá crescendo. Mas só quem treina tá na disputa. Garante o seu!",
      "A pausa mais produtiva que existe é a que você gasta suando. Vai em frente!",
      "Todo grande resultado começa com uma decisão no meio do dia. Decide agora!",
    ],
    tarde: [
      "Hora de fechar o dia com chave de ouro. Bora fazer o check-in!",
      "Mas sabe quem não desiste? Você. Vai lá e faz acontecer!",
      "Enquanto muitos descansam, você se supera. Fecha o dia no desafio!",
      "Cada treino conta. Cada check-in vale. Não para agora!",
      "O dia quase acabou. Ainda dá tempo de treinar e garantir sua vaga amanhã!",
      "Não é o treino mais pesado que vence. É o mais constante. Vai lá!",
      "Todo dia é dia de treino pra quem quer ganhar. Te vejo no check-in!",
      "O pote tá sendo disputado agora mesmo. Não deixa o outro ganhar por falta de treino!",
      "A consistência que você está construindo vale mais que qualquer prêmio. Mas o prêmio ajuda!",
      "Amanhã você vai acordar feliz por ter treinado hoje. Vai!",
      "Fecha os olhos e imagina ganhar o desafio. Agora abre e vai treinar!",
      "Os que chegam no fim são os que não desistiram nos dias difíceis. Hoje é um desses dias!",
      "Um treino de fim do dia cansa o corpo, descansa a mente e enche o bolso. Bora!",
    ],
  };

  const sentMotivations = new Set<string>(); // "userId:date:slot"

  setInterval(async () => {
    try {
      const now = new Date();
      const utcH = now.getUTCHours();
      const utcM = now.getUTCMinutes();
      const todayKey = now.toISOString().slice(0, 10);

      // Day of year (1–365/366) used to pick title and body independently
      const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86_400_000) + 1;

      const slot = MOTIVATION_SLOTS.find(s => s.utcH === utcH && s.utcM === utcM);
      if (!slot) return;

      const titles = MOTIVATION_TITLES[slot.slot];
      const bodies = MOTIVATION_BODIES[slot.slot];
      const title = titles[(dayOfYear - 1) % titles.length];         // cycles every 30 days
      const body  = bodies[(dayOfYear - 1) % bodies.length];         // cycles every 13 days
      // lcm(30, 13) = 390 → the same (title, body) pair won't repeat for 390 days

      const activeChallenges = await db.select().from(challenges)
        .where(and(eq(challenges.status, "active"), eq(challenges.isActive, true)));

      const uniqueUsers = new Set<string>();
      for (const challenge of activeChallenges) {
        const participants = await db.select().from(challengeParticipants)
          .where(and(
            eq(challengeParticipants.challengeId, challenge.id),
            eq(challengeParticipants.isActive, true),
          ));
        for (const p of participants) uniqueUsers.add(p.userId);
      }

      let total = 0;
      for (const userId of uniqueUsers) {
        const key = `${userId}:${todayKey}:${slot.slot}`;
        if (sentMotivations.has(key)) continue;
        sentMotivations.add(key);
        notificationService.notify(userId, {
          type: "motivation",
          title,
          body,
          actionUrl: "/",
        }).catch(() => {});
        total++;
      }

      if (total > 0) log(`[Motivation] ${slot.slot} — ${total} notificação(ões) enviada(s)`);
    } catch (err: any) {
      log(`[Motivation] Erro: ${err.message}`);
    }
  }, 60_000);

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
