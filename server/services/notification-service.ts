import { storage } from "../storage";
import { pushService } from "./push-service";
import type { Response } from "express";
import type { InsertNotification } from "@shared/schema";

const sseClients = new Map<string, Set<Response>>();

export const notificationService = {
  addSSEClient(userId: string, res: Response) {
    if (!sseClients.has(userId)) sseClients.set(userId, new Set());
    sseClients.get(userId)!.add(res);
    res.on("close", () => {
      sseClients.get(userId)?.delete(res);
      if (sseClients.get(userId)?.size === 0) sseClients.delete(userId);
    });
  },

  sendSSE(userId: string, event: string, data: any) {
    const clients = sseClients.get(userId);
    if (!clients) return;
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    clients.forEach((res) => {
      try { res.write(payload); } catch {}
    });
  },

  async notify(userId: string, notif: Omit<InsertNotification, "userId">) {
    const saved = await storage.createNotification({ ...notif, userId });
    const unread = await storage.getUnreadNotificationCount(userId);

    this.sendSSE(userId, "notification", { notification: saved, unreadCount: unread });

    pushService.sendToUser(userId, {
      title: notif.title,
      body: notif.body,
      url: notif.actionUrl || undefined,
      tag: `notif-${saved.id}`,
    }).catch(() => {});

    return saved;
  },

  async notifyMultiple(userIds: string[], notif: Omit<InsertNotification, "userId">) {
    return Promise.allSettled(userIds.map((uid) => this.notify(uid, notif)));
  },

  async notifyChallengeParticipants(challengeId: string, excludeUserId: string, notif: Omit<InsertNotification, "userId" | "challengeId">) {
    const participants = await storage.getChallengeParticipants(challengeId);
    const userIds = participants
      .filter((p: any) => p.userId !== excludeUserId && p.isActive !== false)
      .map((p: any) => p.userId);
    return this.notifyMultiple(userIds, { ...notif, challengeId });
  },
};
