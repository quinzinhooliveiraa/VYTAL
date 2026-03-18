import { useState } from "react";
import { Bell, CheckCheck, MessageCircle, Trophy, UserPlus, MapPin, Shield, ChevronRight, Clock, DollarSign } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { useLocation } from "wouter";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<string, any> = {
  join_request: UserPlus,
  join_approved: Trophy,
  moderator_transfer: Shield,
  checkout_reminder: MapPin,
  new_message: MessageCircle,
  follow_request: UserPlus,
  new_follower: UserPlus,
  follow_accepted: UserPlus,
  challenge_started: Trophy,
  challenge_completed: Trophy,
  eliminated: Trophy,
  new_user: UserPlus,
  deposit_confirmed: DollarSign,
  new_challenge: Trophy,
};

const TYPE_COLORS: Record<string, string> = {
  join_request: "bg-blue-500/20 text-blue-400",
  join_approved: "bg-green-500/20 text-green-400",
  moderator_transfer: "bg-yellow-500/20 text-yellow-400",
  checkout_reminder: "bg-orange-500/20 text-orange-400",
  new_message: "bg-purple-500/20 text-purple-400",
  follow_request: "bg-blue-500/20 text-blue-400",
  new_follower: "bg-green-500/20 text-green-400",
  follow_accepted: "bg-green-500/20 text-green-400",
  challenge_started: "bg-green-500/20 text-green-400",
  challenge_completed: "bg-yellow-500/20 text-yellow-400",
  eliminated: "bg-red-500/20 text-red-400",
  new_user: "bg-cyan-500/20 text-cyan-400",
  deposit_confirmed: "bg-emerald-500/20 text-emerald-400",
  new_challenge: "bg-violet-500/20 text-violet-400",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-white/10 transition-colors" data-testid="button-notifications">
          <Bell size={22} />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center border-2 border-background px-1" data-testid="badge-unread-count">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-sm p-0 bg-background border-l border-white/10">
        <SheetHeader className="px-4 pt-4 pb-2 flex flex-row items-center justify-between border-b border-white/5">
          <SheetTitle className="text-lg font-bold">Notificações</SheetTitle>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-primary flex items-center gap-1 hover:underline"
              data-testid="button-mark-all-read"
            >
              <CheckCheck size={14} />
              Marcar todas como lidas
            </button>
          )}
        </SheetHeader>

        <div className="overflow-y-auto max-h-[calc(100dvh-80px)] no-scrollbar">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Bell size={40} className="mb-3 opacity-30" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notifications.map((n: any) => {
                const Icon = TYPE_ICONS[n.type] || Bell;
                const colorClass = TYPE_COLORS[n.type] || "bg-white/10 text-muted-foreground";

                return (
                  <button
                    key={n.id}
                    className={cn(
                      "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5",
                      !n.isRead && "bg-primary/5"
                    )}
                    data-testid={`notification-item-${n.id}`}
                    onClick={() => {
                      if (!n.isRead) markRead(n.id);
                      if (n.actionUrl) {
                        setOpen(false);
                        setLocation(n.actionUrl);
                      }
                    }}
                  >
                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5", colorClass)}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm leading-snug", !n.isRead ? "font-semibold" : "text-muted-foreground")}>
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground/60">
                        <Clock size={10} />
                        {timeAgo(n.createdAt)}
                      </div>
                    </div>
                    {n.actionUrl && (
                      <ChevronRight size={16} className="text-muted-foreground/40 mt-2 flex-shrink-0" />
                    )}
                    {!n.isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
