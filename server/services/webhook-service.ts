import { walletService } from "./wallet-service";
import { transactionService } from "./transaction-service";
import { TRANSACTION_TYPES, TRANSACTION_STATUS } from "@shared/schema";

export class WebhookService {
  async processPaymentConfirmed(externalId: string, metadata?: Record<string, any>) {
    const tx = await transactionService.getByExternalId(externalId);
    if (!tx) {
      console.error("[Webhook] Transaction not found for externalId:", externalId);
      return { success: false, message: "Transação não encontrada" };
    }

    if (tx.status === TRANSACTION_STATUS.COMPLETED) {
      return { success: true, message: "Já processado" };
    }

    if (tx.type === TRANSACTION_TYPES.DEPOSIT) {
      await walletService.addBalance(tx.userId, Number(tx.amount));
      await transactionService.updateStatus(tx.id, TRANSACTION_STATUS.COMPLETED, {
        ...(tx.metadata as any || {}),
        webhookReceivedAt: new Date().toISOString(),
        ...metadata,
      });
      return { success: true, message: "Depósito confirmado" };
    }

    return { success: false, message: "Tipo de transação não suportado" };
  }

  async processWithdrawCompleted(externalId: string, metadata?: Record<string, any>) {
    const tx = await transactionService.getByExternalId(externalId);
    if (!tx) {
      console.error("[Webhook] Transaction not found for externalId:", externalId);
      return { success: false, message: "Transação não encontrada" };
    }

    if (tx.status === TRANSACTION_STATUS.COMPLETED) {
      return { success: true, message: "Já processado" };
    }

    await transactionService.updateStatus(tx.id, TRANSACTION_STATUS.COMPLETED, {
      ...(tx.metadata as any || {}),
      withdrawCompletedAt: new Date().toISOString(),
      ...metadata,
    });

    return { success: true, message: "Saque confirmado" };
  }

  async processWithdrawFailed(externalId: string, metadata?: Record<string, any>) {
    const tx = await transactionService.getByExternalId(externalId);
    if (!tx) {
      return { success: false, message: "Transação não encontrada" };
    }

    if (tx.status === TRANSACTION_STATUS.FAILED) {
      return { success: true, message: "Já processado" };
    }

    // When status was PROCESSING or COMPLETED, the withdrawal was already counted in
    // getBalance() formula (and wallet.balance was decremented via deductBalance).
    // Changing status to FAILED removes it from the formula, which automatically
    // restores the balance on the next getBalance() call. We also add back via
    // addBalance() to keep the wallet cache immediately consistent.
    if (tx.status === TRANSACTION_STATUS.PROCESSING || tx.status === TRANSACTION_STATUS.COMPLETED) {
      try {
        await walletService.addBalance(tx.userId, Number(tx.amount));
      } catch (e: any) {
        console.error("[Webhook] addBalance on withdraw failed:", e.message);
      }
    }

    await transactionService.updateStatus(tx.id, TRANSACTION_STATUS.FAILED, {
      ...(tx.metadata as any || {}),
      failedAt: new Date().toISOString(),
      ...metadata,
    });

    return { success: true, message: "Saque falhou, saldo restaurado" };
  }
}

export const webhookService = new WebhookService();
