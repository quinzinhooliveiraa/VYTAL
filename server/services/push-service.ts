import webPush from "web-push";
import { storage } from "../storage";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    "mailto:contato@vytal.app",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

export const pushService = {
  async sendToUser(userId: string, payload: PushPayload) {
    const subs = await storage.getPushSubscriptions(userId);
    const results = await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webPush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify({
              ...payload,
              icon: payload.icon || "/favicon.png",
              badge: payload.badge || "/favicon.png",
            })
          );
        } catch (error: any) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            await storage.deletePushSubscription(sub.endpoint);
          }
          throw error;
        }
      })
    );
    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    return { sent, failed };
  },

  async sendToMultiple(userIds: string[], payload: PushPayload) {
    const results = await Promise.allSettled(
      userIds.map((uid) => pushService.sendToUser(uid, payload))
    );
    return results;
  },
};
