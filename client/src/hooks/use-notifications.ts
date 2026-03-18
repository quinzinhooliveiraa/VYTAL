import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "./use-auth";
import { useQueryClient, useQuery } from "@tanstack/react-query";

function playMoneySound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    const playTone = (freq: number, startTime: number, duration: number, gainPeak: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.6, startTime + 0.05);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playTone(1047, now,        0.18, 0.4);
    playTone(1319, now + 0.08, 0.18, 0.35);
    playTone(1568, now + 0.16, 0.22, 0.30);
    playTone(2093, now + 0.25, 0.32, 0.25);

    setTimeout(() => ctx.close(), 1000);
  } catch {}
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const { data } = useQuery({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications", { credentials: "include" });
      if (!res.ok) throw new Error("Erro ao carregar notificações");
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (data?.unreadCount !== undefined) setUnreadCount(data.unreadCount);
  }, [data?.unreadCount]);

  useEffect(() => {
    if (!user) return;

    const es = new EventSource("/api/notifications/stream", { withCredentials: true });
    eventSourceRef.current = es;

    es.addEventListener("notification", (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.unreadCount !== undefined) setUnreadCount(payload.unreadCount);
        if (payload.notification?.type === "deposit_confirmed") {
          playMoneySound();
        }
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      } catch {}
    });

    es.addEventListener("unread-count", (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.unreadCount !== undefined) setUnreadCount(payload.unreadCount);
      } catch {}
    });

    es.onerror = () => {
      es.close();
      setTimeout(() => {
        if (eventSourceRef.current === es) {
          eventSourceRef.current = null;
        }
      }, 5000);
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [user, queryClient]);

  const markRead = useCallback(async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: "POST", credentials: "include" });
    setUnreadCount((c) => Math.max(0, c - 1));
    queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
  }, [queryClient]);

  const markAllRead = useCallback(async () => {
    await fetch("/api/notifications/read-all", { method: "POST", credentials: "include" });
    setUnreadCount(0);
    queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
  }, [queryClient]);

  return {
    notifications: data?.notifications || [],
    unreadCount,
    markRead,
    markAllRead,
  };
}
