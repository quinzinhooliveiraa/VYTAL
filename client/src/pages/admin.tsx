import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, DollarSign, TrendingUp, Users, ArrowDownLeft, ArrowUpRight,
  Percent, Shield, ShieldOff, Trash2, Ban, AlertTriangle, Activity,
  Trophy, ChevronRight, ChevronDown, Loader2, Bell, BellOff, Volume2,
  MessageSquare, Search, Eye, X, Calendar, Hash, Send, Megaphone, CheckCircle2, Link2,
  Smartphone, Wifi, WifiOff, Clock, RotateCcw, Wallet, ShieldAlert, Landmark, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

type Tab = "overview" | "transactions" | "users" | "challenges" | "suspicious" | "support" | "push";

const playMoneySound = () => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    const notes = [523, 659, 784, 1047];
    let t = ctx.currentTime;
    notes.forEach((freq, i) => {
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.3 - i * 0.05, t);
      t += 0.12;
    });
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.start();
    osc.stop(t + 0.3);
  } catch (e) {}
};

const playNotifSound = () => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
};

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

const typeLabels: Record<string, string> = {
  deposit: "Depósito", withdraw_request: "Saque", withdraw_completed: "Saque OK",
  challenge_entry: "Entrada", challenge_win: "Prêmio", platform_fee: "Taxa 10%", refund: "Reembolso",
};
const typeIcons: Record<string, string> = {
  deposit: "↓", withdraw_request: "↑", withdraw_completed: "✓", challenge_entry: "→", challenge_win: "★", platform_fee: "%", refund: "←",
};
const statusLabels: Record<string, string> = {
  completed: "OK", pending: "Pendente", processing: "Processando", failed: "Falhou",
};
const statusColors: Record<string, string> = {
  completed: "text-green-500", pending: "text-yellow-500", processing: "text-blue-500", failed: "text-red-500",
};
const typeColors: Record<string, string> = {
  deposit: "text-green-500", withdraw_request: "text-orange-500", withdraw_completed: "text-orange-500",
  challenge_entry: "text-blue-500", challenge_win: "text-yellow-500", platform_fee: "text-emerald-500", refund: "text-red-500",
};

type DatePreset = "all" | "today" | "7d" | "30d" | "month" | "year" | "custom";

const getDateRange = (preset: DatePreset, customFrom?: string, customTo?: string): { from?: string; to?: string } => {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  switch (preset) {
    case "today": return { from: fmt(now), to: fmt(now) };
    case "7d": { const d = new Date(now); d.setDate(d.getDate() - 7); return { from: fmt(d), to: fmt(now) }; }
    case "30d": { const d = new Date(now); d.setDate(d.getDate() - 30); return { from: fmt(d), to: fmt(now) }; }
    case "month": return { from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`, to: fmt(now) };
    case "year": return { from: `${now.getFullYear()}-01-01`, to: fmt(now) };
    case "custom": return { from: customFrom || undefined, to: customTo || undefined };
    default: return {};
  }
};

const presetLabels: Record<DatePreset, string> = {
  all: "Tudo", today: "Hoje", "7d": "7 dias", "30d": "30 dias", month: "Este mês", year: "Este ano", custom: "Personalizado",
};

export default function Admin() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [confirmDialog, setConfirmDialog] = useState<{ type: string; userId?: string; userName?: string; challengeId?: string; challengeName?: string; isBanned?: boolean | null } | null>(null);
  const [txFilter, setTxFilter] = useState<string>("all");
  const [userSearch, setUserSearch] = useState("");
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [resetWalletDialog, setResetWalletDialog] = useState(false);
  const [resetConfirmInput, setResetConfirmInput] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem("admin-notif") !== "off");
  const prevTxCountRef = useRef<number | null>(null);
  const prevStatsRef = useRef<any>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const dateRange = getDateRange(datePreset, customFrom, customTo);
  const dateParams = new URLSearchParams();
  if (dateRange.from) dateParams.set("from", dateRange.from);
  if (dateRange.to) dateParams.set("to", dateRange.to);
  const dateQS = dateParams.toString() ? `?${dateParams.toString()}` : "";

  const toggleNotifications = useCallback(() => {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    localStorage.setItem("admin-notif", next ? "on" : "off");
  }, [notificationsEnabled]);

  const { data: stats, isLoading, refetch: refetchStats } = useQuery({
    queryKey: ["/api/admin/stats", dateRange.from, dateRange.to],
    queryFn: async () => {
      const res = await fetch(`/api/admin/stats${dateQS}`, { credentials: "include" });
      if (!res.ok) throw new Error("Acesso negado");
      return res.json();
    },
    refetchInterval: 15000,
  });

  const { data: txs = [], refetch: refetchTxs } = useQuery({
    queryKey: ["/api/admin/transactions", dateRange.from, dateRange.to],
    queryFn: async () => {
      const res = await fetch(`/api/admin/transactions${dateQS}`, { credentials: "include" });
      return res.ok ? res.json() : [];
    },
    enabled: tab === "overview" || tab === "transactions",
    refetchInterval: 15000,
  });

  const handleRefresh = useCallback(() => {
    refetchStats();
    refetchTxs();
  }, [refetchStats, refetchTxs]);

  const { data: allUsers = [] } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      return res.ok ? res.json() : [];
    },
    enabled: tab === "users",
  });

  const { data: adminChallenges = [] } = useQuery({
    queryKey: ["/api/admin/challenges"],
    queryFn: async () => {
      const res = await fetch("/api/admin/challenges", { credentials: "include" });
      return res.ok ? res.json() : [];
    },
    enabled: tab === "challenges",
  });

  const { data: suspicious } = useQuery({
    queryKey: ["/api/admin/suspicious"],
    queryFn: async () => {
      const res = await fetch("/api/admin/suspicious", { credentials: "include" });
      return res.ok ? res.json() : { highVolume: [], failedTxs: [], rapidDeposits: [] };
    },
    enabled: tab === "suspicious",
  });

  const { data: supportTickets = [] } = useQuery({
    queryKey: ["/api/admin/support"],
    queryFn: async () => {
      const res = await fetch("/api/admin/support", { credentials: "include" });
      return res.ok ? res.json() : [];
    },
    enabled: tab === "support",
    refetchInterval: 15000,
  });

  const deleteChallengeM = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/challenges/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/challenges"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setConfirmDialog(null);
    },
  });

  const toggleAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}/toggle-admin`, { method: "POST", credentials: "include" });
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] }); setConfirmDialog(null); },
  });

  const blockUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}/block`, { method: "POST", credentials: "include" });
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] }); setConfirmDialog(null); },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setConfirmDialog(null);
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/admin/support/${id}`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/support"] }); },
  });

  const [pushTitle, setPushTitle] = useState("");
  const [pushBody, setPushBody] = useState("");
  const [pushUrl, setPushUrl] = useState("");
  const [broadcastResult, setBroadcastResult] = useState<{ sent: number; failed: number; total: number } | null>(null);

  const { data: pushStats } = useQuery({
    queryKey: ["/api/admin/push/stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/push/stats", { credentials: "include" });
      return res.ok ? res.json() : { subscribedUsers: 0 };
    },
    enabled: tab === "push",
  });

  const resetWalletsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/reset-wallets", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "RESETAR_SALDOS" }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
      setResetWalletDialog(false);
      setResetConfirmInput("");
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: async (payload: { title: string; body: string; url: string }) => {
      const res = await fetch("/api/admin/push/broadcast", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: (data) => {
      setBroadcastResult(data);
      setPushTitle("");
      setPushBody("");
      setPushUrl("");
    },
  });

  useEffect(() => {
    if (!notificationsEnabled || !txs.length) return;
    if (prevTxCountRef.current !== null && txs.length > prevTxCountRef.current) {
      const newTxs = txs.slice(0, txs.length - prevTxCountRef.current);
      if (newTxs.some((tx: any) => tx.type === "platform_fee")) playMoneySound();
      else if (newTxs.some((tx: any) => tx.type === "deposit" && tx.status === "completed")) playNotifSound();
    }
    prevTxCountRef.current = txs.length;
  }, [txs, notificationsEnabled]);

  useEffect(() => {
    if (!notificationsEnabled || !stats) return;
    if (prevStatsRef.current !== null && stats.totalChallenges > prevStatsRef.current.totalChallenges) playNotifSound();
    prevStatsRef.current = stats;
  }, [stats, notificationsEnabled]);

  const filteredTxs = txs.filter((tx: any) => txFilter === "all" || tx.type === txFilter);
  const filteredUsers = allUsers.filter((u: any) => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || (u.username || "").toLowerCase().includes(q);
  });

  const openTickets = supportTickets.filter((t: any) => t.status === "open").length;
  const alertCount = (suspicious?.rapidDeposits?.length || 0) + (suspicious?.failedTxs?.length || 0);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* HEADER */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate("/profile")} data-testid="button-admin-back">
            <ArrowLeft size={20} />
          </Button>
          <div className="flex-1">
            <h1 className="font-display font-bold text-lg">Admin</h1>
            <p className="text-[10px] text-muted-foreground">{stats?.totalUsers || 0} usuários · {stats?.activeChallenges || 0} desafios ativos</p>
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" onClick={handleRefresh} data-testid="button-refresh-stats" title="Atualizar dados">
            <RefreshCw size={16} />
          </Button>
          <Button variant="ghost" size="icon" className={`h-9 w-9 ${notificationsEnabled ? 'text-primary' : 'text-muted-foreground'}`} onClick={toggleNotifications} data-testid="button-toggle-notif">
            {notificationsEnabled ? <Bell size={18} /> : <BellOff size={18} />}
          </Button>
        </div>

        {/* TABS - scrollable, bigger touch targets */}
        <div className="flex px-3 pb-2 gap-2 overflow-x-auto no-scrollbar">
          {([
            { key: "overview" as Tab, label: "Resumo", icon: TrendingUp, badge: null },
            { key: "transactions" as Tab, label: "Transações", icon: DollarSign, badge: null },
            { key: "users" as Tab, label: "Usuários", icon: Users, badge: null },
            { key: "challenges" as Tab, label: "Desafios", icon: Trophy, badge: null },
            { key: "suspicious" as Tab, label: "Alertas", icon: AlertTriangle, badge: alertCount > 0 ? alertCount : null },
            { key: "support" as Tab, label: "Suporte", icon: MessageSquare, badge: openTickets > 0 ? openTickets : null },
            { key: "push" as Tab, label: "Push", icon: Megaphone, badge: null },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                tab === t.key ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
              }`}
              data-testid={`tab-${t.key}`}
            >
              <t.icon size={14} />
              {t.label}
              {t.badge && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{t.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">

        {(tab === "overview" || tab === "transactions") && (
          <div className="space-y-3">
            <div className="flex gap-1.5 flex-wrap">
              {(["all", "today", "7d", "30d", "month", "year", "custom"] as DatePreset[]).map(p => (
                <button
                  key={p}
                  onClick={() => {
                    setDatePreset(p);
                    if (p === "custom") setShowDatePicker(true);
                    else setShowDatePicker(false);
                  }}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                    datePreset === p ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                  data-testid={`date-filter-${p}`}
                >
                  {p === "custom" ? <><Calendar size={10} className="inline mr-1" />{presetLabels[p]}</> : presetLabels[p]}
                </button>
              ))}
            </div>
            {showDatePicker && datePreset === "custom" && (
              <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-3">
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">De</label>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-background border border-border text-xs"
                    data-testid="input-date-from"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">Até</label>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-background border border-border text-xs"
                    data-testid="input-date-to"
                  />
                </div>
              </div>
            )}
            {datePreset !== "all" && (
              <p className="text-[10px] text-primary font-bold px-1">
                <Calendar size={10} className="inline mr-1" />
                Filtrando: {dateRange.from ? new Date(dateRange.from + "T12:00:00").toLocaleDateString("pt-BR") : "..."} 
                {dateRange.to ? ` até ${new Date(dateRange.to + "T12:00:00").toLocaleDateString("pt-BR")}` : ""}
              </p>
            )}
          </div>
        )}

        {/* ====== OVERVIEW ====== */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* KPI Principal - Receita */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <Percent size={16} className="text-emerald-500" />
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Receita da plataforma (10%)</span>
              </div>
              <p className="text-3xl font-bold text-emerald-500" data-testid="text-platform-revenue">{formatBRL(stats?.platformFees?.total || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">{stats?.platformFees?.count || 0} cobranças realizadas</p>
            </div>

            {/* Gateway - Painel financeiro completo */}
            {stats?.gateway && (
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Landmark size={16} className="text-blue-400" />
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Gateway AbacatePay</span>
                </div>

                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-muted-foreground">Saldo estimado no gateway</span>
                  <span className="text-2xl font-bold text-blue-400">{formatBRL(stats.gateway.estimatedBalance)}</span>
                </div>

                <div className="border-t border-blue-500/20 pt-3 space-y-2">
                  <p className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert size={12} />
                    Obrigações (pior cenário)
                  </p>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Saldos disponíveis dos usuários</span>
                    <span className="text-orange-400 font-medium">{formatBRL(stats.gateway.obligations.userAvailableBalances)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Custo gateway se todos sacarem ({stats.gateway.withdrawableUsersCount} aptos)</span>
                    <span className="text-orange-400 font-medium">{formatBRL(stats.gateway.obligations.worstCaseWithdrawCost)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Desafios ativos (90% volta ao vencedor)</span>
                    <span className="text-orange-400 font-medium">{formatBRL(stats.gateway.obligations.challengeLockedFunds)}</span>
                  </div>
                  <div className="flex justify-between text-xs pt-1 border-t border-blue-500/10">
                    <span className="font-semibold text-orange-400">Total de obrigações</span>
                    <span className="font-bold text-orange-400">- {formatBRL(stats.gateway.obligations.total)}</span>
                  </div>
                </div>

                <div className="border-t border-blue-500/20 pt-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Seguro para sacar</span>
                    <span className="text-emerald-400 font-bold">{formatBRL(stats.gateway.safeToWithdraw)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Taxa do seu saque</span>
                    <span className="text-destructive font-medium">- {formatBRL(stats.gateway.adminWithdrawFee)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-emerald-500/20">
                    <span className="font-bold text-emerald-400 text-sm">Você pode sacar</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-emerald-400 text-xl">{formatBRL(stats.gateway.adminWithdrawable)}</span>
                      <Button
                        size="sm"
                        className="h-8 px-3 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl"
                        onClick={() => navigate("/wallet")}
                        data-testid="button-admin-go-wallet"
                        disabled={stats.gateway.adminWithdrawable <= 0}
                      >
                        <Wallet size={12} className="mr-1" /> Sacar
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg ${
                    stats.gateway.safetyMargin > 20 ? 'bg-emerald-500/10 text-emerald-400' :
                    stats.gateway.safetyMargin > 5 ? 'bg-yellow-500/10 text-yellow-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>
                    <Shield size={14} />
                    Margem de segurança: {stats.gateway.safetyMargin}%
                    {stats.gateway.safetyMargin > 20 ? ' — Saudável' :
                     stats.gateway.safetyMargin > 5 ? ' — Atenção' :
                     ' — Crítico'}
                  </div>
                </div>
              </div>
            )}

            {/* Cards secundários */}
            <div className="grid grid-cols-2 gap-3">
              <MiniCard icon={ArrowDownLeft} label="Depósitos" value={formatBRL(stats?.depositsCompleted?.total || 0)} sub={`${stats?.depositsCompleted?.count || 0} confirmados`} color="green" testId="text-deposits" />
              <MiniCard icon={ArrowUpRight} label="Saques" value={formatBRL(stats?.withdrawals?.total || 0)} sub={`${stats?.withdrawals?.count || 0} solicitados`} color="orange" testId="text-withdrawals" />
              <MiniCard icon={Wallet} label="Saldo em contas" value={formatBRL(stats?.usersBalance?.available || 0)} sub={`${formatBRL(stats?.usersBalance?.locked || 0)} em desafios · total ${formatBRL(stats?.usersBalance?.total || 0)}`} color="blue" testId="text-users-balance" />
              <MiniCard icon={Trophy} label="Desafios" value={`${stats?.activeChallenges || 0} ativos`} sub={`${stats?.totalChallenges || 0} total`} color="violet" testId="text-challenges" />
            </div>

            {/* Resumo de movimentação */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-bold flex items-center gap-2"><Activity size={14} className="text-primary" /> Movimentação geral</p>
              </div>
              <div className="divide-y divide-border">
                <MovRow label="Entradas em desafios (concluídas)" value={formatBRL(stats?.challengeEntries?.total || 0)} count={stats?.challengeEntries?.count} />
                {(stats?.challengeEntries?.pendingTotal || 0) > 0 && (
                  <MovRow label="Entradas pendentes (em desafios ativos)" value={formatBRL(stats?.challengeEntries?.pendingTotal || 0)} count={stats?.challengeEntries?.pendingCount} />
                )}
                <MovRow label="Prêmios distribuídos" value={formatBRL(stats?.challengeWins?.total || 0)} count={stats?.challengeWins?.count} />
                <MovRow label="Total depositado" value={formatBRL(stats?.depositsCompleted?.total || 0)} count={stats?.depositsCompleted?.count} />
                <MovRow label="Total sacado" value={formatBRL(stats?.withdrawals?.total || 0)} count={stats?.withdrawals?.count} />
              </div>
            </div>

            {/* Últimas transações */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm">Últimas transações</p>
                <button onClick={() => setTab("transactions")} className="text-xs text-primary font-bold flex items-center gap-1">
                  Ver todas <ChevronRight size={14} />
                </button>
              </div>
              <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
                {txs.slice(0, 6).map((tx: any) => (
                  <TxRow key={tx.id} tx={tx} currentUserId={user?.id} />
                ))}
                {txs.length === 0 && <p className="text-center text-xs text-muted-foreground py-6">Nenhuma transação</p>}
              </div>
            </div>

            {/* Ferramentas Admin */}
            <div className="space-y-3">
              <p className="font-bold text-sm">Ferramentas</p>
              <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center">
                      <RotateCcw size={16} className="text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Resetar saldos</p>
                      <p className="text-[10px] text-muted-foreground">Zerar todos os saldos (usar ao sair do dev mode)</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-bold"
                    onClick={() => { setResetWalletDialog(true); setResetConfirmInput(""); }}
                    data-testid="button-open-reset-wallets"
                  >
                    Resetar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====== TRANSACTIONS ====== */}
        {tab === "transactions" && (
          <div className="space-y-4">
            <div className="flex gap-1.5 flex-wrap">
              {[
                { key: "all", label: "Todos" },
                { key: "deposit", label: "Depósitos" },
                { key: "withdraw_request", label: "Saques" },
                { key: "challenge_entry", label: "Entradas" },
                { key: "challenge_win", label: "Prêmios" },
                { key: "platform_fee", label: "Taxas" },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setTxFilter(f.key)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                    txFilter === f.key ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                  }`}
                  data-testid={`filter-${f.key}`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <p className="text-[10px] text-muted-foreground px-1">
              <Hash size={10} className="inline" /> {filteredTxs.length} transações {txFilter !== "all" ? `(${typeLabels[txFilter]})` : ""}
            </p>

            <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
              {filteredTxs.map((tx: any) => (
                <TxRow key={tx.id} tx={tx} currentUserId={user?.id} showUser />
              ))}
              {filteredTxs.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Nenhuma transação</p>}
            </div>
          </div>
        )}

        {/* ====== USERS ====== */}
        {tab === "users" && (
          <div className="space-y-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou username..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="h-10 pl-9 rounded-xl"
                data-testid="input-user-search"
              />
              {userSearch && (
                <button onClick={() => setUserSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <X size={14} />
                </button>
              )}
            </div>

            <p className="text-[10px] text-muted-foreground px-1">{filteredUsers.length} usuário{filteredUsers.length !== 1 ? "s" : ""}</p>

            <div className="space-y-2">
              {filteredUsers.map((u: any) => (
                <div key={u.id} className="bg-card border border-border rounded-2xl p-4" data-testid={`user-${u.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-bold truncate">{u.name || u.username}</p>
                        {u.isAdmin && <Badge className="text-[8px] px-1.5 py-0 bg-primary/20 text-primary border-none">ADMIN</Badge>}
                        {(u.role === "organizer" || u.role === "organizer_partner") && <Badge className="text-[8px] px-1.5 py-0 bg-orange-500/20 text-orange-500 border-none">ORGANIZADOR</Badge>}
                        {(u.role === "partner" || u.role === "organizer_partner") && <Badge className="text-[8px] px-1.5 py-0 bg-cyan-500/20 text-cyan-500 border-none">PARCEIRO</Badge>}
                        {u.id === user?.id && <Badge className="text-[8px] px-1.5 py-0 bg-blue-500/20 text-blue-500 border-none">VOCÊ</Badge>}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{u.email}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {u.pwaInstalled && <Badge className="text-[8px] px-1.5 py-0 bg-green-500/20 text-green-500 border-none gap-0.5"><Smartphone size={9} /> PWA</Badge>}
                        {!u.pwaInstalled && <Badge className="text-[8px] px-1.5 py-0 bg-muted text-muted-foreground border-none gap-0.5">Sem PWA</Badge>}
                        {u.deviceInfo && <Badge className="text-[8px] px-1.5 py-0 bg-blue-500/10 text-blue-400 border-none gap-0.5"><Smartphone size={9} /> {u.deviceInfo}</Badge>}
                        {u.isBanned && <Badge className="text-[8px] px-1.5 py-0 bg-red-500/20 text-red-500 border-none gap-0.5"><Ban size={9} /> BANIDO</Badge>}
                        {(() => {
                          if (!u.lastActiveAt) return <Badge className="text-[8px] px-1.5 py-0 bg-red-500/20 text-red-500 border-none gap-0.5"><WifiOff size={9} /> Nunca ativo</Badge>;
                          const diff = Date.now() - new Date(u.lastActiveAt).getTime();
                          const mins = Math.floor(diff / 60000);
                          if (mins < 5) return <Badge className="text-[8px] px-1.5 py-0 bg-green-500/20 text-green-500 border-none gap-0.5"><Wifi size={9} /> Online agora</Badge>;
                          if (mins < 60) return <Badge className="text-[8px] px-1.5 py-0 bg-yellow-500/20 text-yellow-500 border-none gap-0.5"><Clock size={9} /> {mins}min atrás</Badge>;
                          const hours = Math.floor(mins / 60);
                          if (hours < 24) return <Badge className="text-[8px] px-1.5 py-0 bg-yellow-500/20 text-yellow-500 border-none gap-0.5"><Clock size={9} /> {hours}h atrás</Badge>;
                          const days = Math.floor(hours / 24);
                          if (days <= 7) return <Badge className="text-[8px] px-1.5 py-0 bg-orange-500/20 text-orange-500 border-none gap-0.5"><Clock size={9} /> {days}d atrás</Badge>;
                          return <Badge className="text-[8px] px-1.5 py-0 bg-red-500/20 text-red-500 border-none gap-0.5"><WifiOff size={9} /> Inativo ({days}d)</Badge>;
                        })()}
                      </div>
                      <div className="flex gap-4 mt-2">
                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase">Saldo</p>
                          <p className="text-xs font-bold text-green-500">{formatBRL(Number(u.balance || 0))}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase">Travado</p>
                          <p className="text-xs font-bold text-yellow-500">{formatBRL(Number(u.lockedBalance || 0))}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase">Desde</p>
                          <p className="text-xs font-bold">{formatDate(u.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <select
                        value={u.role || "user"}
                        onChange={async (e) => {
                          try {
                            await apiRequest("POST", `/api/admin/users/${u.id}/set-role`, { role: e.target.value });
                            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
                            toast({ title: "Papel atualizado!" });
                          } catch { toast({ title: "Erro ao atualizar", variant: "destructive" }); }
                        }}
                        className="h-8 text-[10px] font-bold rounded-lg bg-card border border-border px-1.5 outline-none cursor-pointer"
                        data-testid={`select-role-${u.id}`}
                      >
                        <option value="user">Usuário</option>
                        <option value="organizer">Organizador</option>
                        <option value="partner">Parceiro</option>
                        <option value="organizer_partner">Org + Parceiro</option>
                      </select>
                      <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg" onClick={() => setConfirmDialog({ type: "toggle-admin", userId: u.id, userName: u.name })} data-testid={`btn-toggle-admin-${u.id}`}>
                        {u.isAdmin ? <ShieldOff size={14} /> : <Shield size={14} />}
                      </Button>
                      <Button size="icon" variant="outline" className={`h-8 w-8 rounded-lg ${u.isBanned ? "text-green-500 border-green-500/30" : "text-red-500 border-red-500/30"}`} onClick={() => setConfirmDialog({ type: "block", userId: u.id, userName: u.name, isBanned: u.isBanned })} data-testid={`btn-block-${u.id}`}>
                        <Ban size={14} />
                      </Button>
                      <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg text-destructive border-destructive/30" onClick={() => setConfirmDialog({ type: "delete", userId: u.id, userName: u.name })} data-testid={`btn-delete-${u.id}`}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && <p className="text-center text-xs text-muted-foreground py-8">Nenhum usuário encontrado</p>}
            </div>
          </div>
        )}

        {/* ====== CHALLENGES ====== */}
        {tab === "challenges" && (
          <div className="space-y-3">
            <p className="text-[10px] text-muted-foreground px-1">{adminChallenges.length} desafio{adminChallenges.length !== 1 ? "s" : ""} no total</p>
            {adminChallenges.map((c: any) => {
              const isEnded = c.endDate && new Date(c.endDate) < new Date();
              return (
                <div key={c.id} className={`bg-card border rounded-2xl p-4 ${isEnded ? 'border-border opacity-60' : 'border-primary/20'}`} data-testid={`admin-challenge-${c.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold truncate">{c.title}</p>
                        <Badge className={`text-[8px] px-1.5 py-0 border-none ${isEnded ? 'bg-muted text-muted-foreground' : 'bg-green-500/20 text-green-500'}`}>
                          {isEnded ? "Finalizado" : "Ativo"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                        <span className="text-[10px] text-muted-foreground">
                          <Users size={10} className="inline mr-1" />{c.participantCount} participantes
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          <DollarSign size={10} className="inline mr-1" />R$ {Number(c.entryFee || 0).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          <Trophy size={10} className="inline mr-1" />{{ checkin: "Check-in", survival: "Sobrevivência", corrida: "Corrida", ranking: "Ranking" }[c.type as string] || c.type}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          <Calendar size={10} className="inline mr-1" />{formatDate(c.createdAt)}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">Criado por: {c.creatorName}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 rounded-lg text-destructive border-destructive/30 shrink-0"
                      onClick={() => setConfirmDialog({ type: "delete-challenge", challengeId: c.id, challengeName: c.title })}
                      data-testid={`btn-delete-challenge-${c.id}`}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              );
            })}
            {adminChallenges.length === 0 && <p className="text-center text-xs text-muted-foreground py-8">Nenhum desafio</p>}
          </div>
        )}

        {/* ====== SUSPICIOUS ====== */}
        {tab === "suspicious" && suspicious && (
          <div className="space-y-6">
            {/* Depósitos rápidos */}
            <Section
              icon={AlertTriangle}
              iconColor="text-yellow-500"
              title="Depósitos rápidos (24h)"
              count={suspicious.rapidDeposits?.length || 0}
              empty="Nenhuma atividade suspeita"
            >
              {suspicious.rapidDeposits?.map((r: any) => (
                <div key={r.userId} className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold">{r.userName || "Sem nome"}</p>
                      <p className="text-[10px] text-muted-foreground">{r.userEmail}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-yellow-500">{r.depositCount}x</p>
                      <p className="text-xs font-bold">{formatBRL(Number(r.totalDeposited))}</p>
                    </div>
                  </div>
                </div>
              ))}
            </Section>

            {/* Transações falhadas */}
            <Section
              icon={AlertTriangle}
              iconColor="text-red-500"
              title="Transações falhadas"
              count={suspicious.failedTxs?.length || 0}
              empty="Nenhuma falha registrada"
            >
              {suspicious.failedTxs?.map((tx: any) => (
                <div key={tx.id} className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold">{typeLabels[tx.type] || tx.type}</p>
                      <p className="text-[10px] text-muted-foreground">{tx.userName} · {formatDate(tx.createdAt)}</p>
                    </div>
                    <p className="text-sm font-bold text-red-500">{formatBRL(Number(tx.amount))}</p>
                  </div>
                </div>
              ))}
            </Section>

            {/* Maior volume */}
            <Section
              icon={Activity}
              iconColor="text-blue-500"
              title="Maior volume geral"
              count={suspicious.highVolume?.length || 0}
              empty="Sem dados"
            >
              {suspicious.highVolume?.map((h: any) => (
                <div key={h.userId} className="bg-card border border-border rounded-xl p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold">{h.userName || "Sem nome"}</p>
                      <p className="text-[10px] text-muted-foreground">{h.userEmail}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{h.txCount} transações</p>
                      <p className="text-sm font-bold">{formatBRL(Number(h.totalAmount))}</p>
                    </div>
                  </div>
                </div>
              ))}
            </Section>
          </div>
        )}

        {/* ====== SUPPORT ====== */}
        {tab === "support" && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <p className="text-[10px] text-muted-foreground flex-1">{supportTickets.length} ticket{supportTickets.length !== 1 ? "s" : ""} · {openTickets} aberto{openTickets !== 1 ? "s" : ""}</p>
            </div>

            {supportTickets.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare size={32} className="mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum ticket de suporte</p>
              </div>
            )}

            {supportTickets.map((ticket: any) => {
              const isOpen = ticket.status === "open";
              const isResolved = ticket.status === "resolved";
              const isExpanded = expandedTicket === ticket.id;
              return (
                <div
                  key={ticket.id}
                  className={`bg-card border rounded-2xl overflow-hidden transition-all ${
                    isOpen ? "border-yellow-500/30" : isResolved ? "border-green-500/20" : "border-border"
                  }`}
                  data-testid={`ticket-${ticket.id}`}
                >
                  <button
                    onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                    className="w-full p-4 flex items-start gap-3 text-left"
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isOpen ? "bg-yellow-500" : isResolved ? "bg-green-500" : "bg-muted-foreground"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge className={`text-[8px] px-1.5 py-0 border-none ${
                          ticket.type === "feedback" ? "bg-blue-500/20 text-blue-500" :
                          ticket.type === "suporte" ? "bg-red-500/20 text-red-500" :
                          ticket.type === "organizador" ? "bg-orange-500/20 text-orange-500" :
                          ticket.type === "parceiro" ? "bg-cyan-500/20 text-cyan-500" :
                          "bg-purple-500/20 text-purple-500"
                        }`}>
                          {ticket.type === "feedback" ? "Feedback" : ticket.type === "suporte" ? "Suporte" : ticket.type === "organizador" ? "Organizador" : ticket.type === "parceiro" ? "Parceiro" : "Ideia"}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{formatDate(ticket.createdAt)}</span>
                      </div>
                      <p className="text-xs font-bold">{ticket.userName}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{ticket.message}</p>
                    </div>
                    <ChevronDown size={16} className={`text-muted-foreground shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                      <p className="text-[10px] text-muted-foreground">{ticket.userEmail}</p>
                      <div className="bg-muted/50 rounded-xl p-3">
                        <p className="text-sm whitespace-pre-line">{ticket.message}</p>
                      </div>
                      {isOpen && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 h-9 text-xs rounded-xl bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => updateTicketMutation.mutate({ id: ticket.id, status: "resolved" })}
                            disabled={updateTicketMutation.isPending}
                            data-testid={`button-resolve-${ticket.id}`}
                          >
                            Resolver
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-9 text-xs rounded-xl"
                            onClick={() => updateTicketMutation.mutate({ id: ticket.id, status: "closed" })}
                            disabled={updateTicketMutation.isPending}
                            data-testid={`button-close-${ticket.id}`}
                          >
                            Fechar
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ====== PUSH BROADCAST ====== */}
        {tab === "push" && (
          <div className="space-y-5">
            <div className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <Megaphone size={16} className="text-violet-500" />
                <span className="text-xs font-bold text-violet-500 uppercase tracking-wider">Notificações Push</span>
              </div>
              <p className="text-3xl font-display font-black">{pushStats?.subscribedUsers ?? "—"}</p>
              <p className="text-[10px] text-muted-foreground">dispositivos inscritos</p>
            </div>

            <div className="bg-card border rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Send size={16} className="text-primary" />
                <p className="text-sm font-bold">Enviar para todos</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Título *</label>
                  <Input
                    placeholder="Ex: Novo desafio disponível!"
                    value={pushTitle}
                    onChange={e => setPushTitle(e.target.value)}
                    className="rounded-xl h-10 text-sm"
                    maxLength={100}
                    data-testid="input-push-title"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Mensagem *</label>
                  <textarea
                    placeholder="Ex: Participe do desafio de corrida e ganhe prêmios!"
                    value={pushBody}
                    onChange={e => setPushBody(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    maxLength={300}
                    data-testid="input-push-body"
                  />
                  <p className="text-[10px] text-muted-foreground text-right">{pushBody.length}/300</p>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Link2 size={10} /> Link (opcional)
                  </label>
                  <Input
                    placeholder="Ex: /challenges"
                    value={pushUrl}
                    onChange={e => setPushUrl(e.target.value)}
                    className="rounded-xl h-10 text-sm"
                    data-testid="input-push-url"
                  />
                </div>
              </div>

              <Button
                className="w-full h-11 rounded-xl font-bold text-sm gap-2"
                disabled={!pushTitle.trim() || !pushBody.trim() || broadcastMutation.isPending}
                onClick={() => broadcastMutation.mutate({ title: pushTitle.trim(), body: pushBody.trim(), url: pushUrl.trim() || "/" })}
                data-testid="button-send-broadcast"
              >
                {broadcastMutation.isPending ? (
                  <><Loader2 size={16} className="animate-spin" /> Enviando...</>
                ) : (
                  <><Send size={16} /> Enviar notificação</>
                )}
              </Button>

              {broadcastResult && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-500" />
                    <p className="text-sm font-bold text-green-600">Enviado!</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {broadcastResult.sent} entregue{broadcastResult.sent !== 1 ? "s" : ""} · {broadcastResult.failed} falha{broadcastResult.failed !== 1 ? "s" : ""} · {broadcastResult.total} usuário{broadcastResult.total !== 1 ? "s" : ""}
                  </p>
                </div>
              )}

              {broadcastMutation.isError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <p className="text-xs text-red-500 font-bold">Erro: {(broadcastMutation.error as Error).message}</p>
                </div>
              )}
            </div>

            <div className="bg-muted/30 rounded-xl p-4">
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                A notificação será enviada para todos os dispositivos inscritos. Certifique-se de que o conteúdo é relevante para evitar que os usuários desativem as notificações.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* CONFIRM DIALOG */}
      <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent className="rounded-3xl max-w-[340px]">
          <DialogHeader>
            <DialogTitle className="font-display">
              {confirmDialog?.type === "toggle-admin" && "Alterar permissão"}
              {confirmDialog?.type === "block" && (confirmDialog?.isBanned ? "Desbanir usuário" : "Banir usuário")}
              {confirmDialog?.type === "delete" && "Apagar usuário"}
              {confirmDialog?.type === "delete-challenge" && "Apagar desafio"}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog?.type === "toggle-admin" && `Alternar admin para ${confirmDialog?.userName}?`}
              {confirmDialog?.type === "block" && (confirmDialog?.isBanned
                ? `Remover banimento de ${confirmDialog?.userName}? O usuário poderá acessar o app novamente.`
                : `Banir ${confirmDialog?.userName}? A conta será suspensa e o usuário não poderá mais acessar o app.`
              )}
              {confirmDialog?.type === "delete" && `Apagar ${confirmDialog?.userName}? Todos os dados serão removidos permanentemente.`}
              {confirmDialog?.type === "delete-challenge" && `Apagar "${confirmDialog?.challengeName}"? Todos os participantes e dados serão removidos.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setConfirmDialog(null)}>Cancelar</Button>
            <Button
              className={`flex-1 rounded-xl ${(confirmDialog?.type === "delete" || confirmDialog?.type === "delete-challenge") ? "bg-destructive hover:bg-destructive/90" : ""}`}
              onClick={() => {
                if (!confirmDialog) return;
                if (confirmDialog.type === "toggle-admin") toggleAdminMutation.mutate(confirmDialog.userId!);
                if (confirmDialog.type === "block") blockUserMutation.mutate(confirmDialog.userId!);
                if (confirmDialog.type === "delete") deleteUserMutation.mutate(confirmDialog.userId!);
                if (confirmDialog.type === "delete-challenge") deleteChallengeM.mutate(confirmDialog.challengeId!);
              }}
              disabled={toggleAdminMutation.isPending || blockUserMutation.isPending || deleteUserMutation.isPending || deleteChallengeM.isPending}
            >
              {(toggleAdminMutation.isPending || blockUserMutation.isPending || deleteUserMutation.isPending || deleteChallengeM.isPending) ? (
                <Loader2 className="animate-spin" size={16} />
              ) : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetWalletDialog} onOpenChange={(open) => { setResetWalletDialog(open); if (!open) setResetConfirmInput(""); }}>
        <DialogContent className="rounded-3xl max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="font-display text-destructive">Resetar todos os saldos</DialogTitle>
            <DialogDescription>
              Esta ação vai zerar o saldo de TODOS os usuários e cancelar transações pendentes. Use apenas ao migrar do modo de desenvolvimento para produção.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30">
              <p className="text-xs text-destructive font-bold mb-1">Atenção!</p>
              <p className="text-[11px] text-destructive/80">Esta ação é irreversível. Todos os saldos serão zerados permanentemente.</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Digite <span className="font-mono font-bold text-foreground">RESETAR</span> para confirmar:
              </p>
              <Input
                value={resetConfirmInput}
                onChange={(e) => setResetConfirmInput(e.target.value)}
                placeholder="RESETAR"
                className="h-12 rounded-xl font-mono text-center text-lg tracking-widest"
                data-testid="input-reset-confirm"
              />
            </div>

            {resetWalletsMutation.isSuccess && (
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 text-center">
                <CheckCircle2 size={20} className="mx-auto text-primary mb-1" />
                <p className="text-xs font-bold text-primary">Saldos zerados com sucesso!</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {(resetWalletsMutation.data as any)?.usersAffected} usuários afetados · {formatBRL(Number((resetWalletsMutation.data as any)?.totalCleared || 0))} zerados
                </p>
              </div>
            )}

            {resetWalletsMutation.isError && (
              <p className="text-destructive text-xs text-center">
                <AlertTriangle size={14} className="inline mr-1" />
                {(resetWalletsMutation.error as any)?.message || "Erro ao resetar"}
              </p>
            )}

            <DialogFooter className="flex gap-2 sm:flex-row">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setResetWalletDialog(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-xl font-bold"
                disabled={resetConfirmInput !== "RESETAR" || resetWalletsMutation.isPending}
                onClick={() => resetWalletsMutation.mutate()}
                data-testid="button-confirm-reset-wallets"
              >
                {resetWalletsMutation.isPending ? (
                  <Loader2 className="animate-spin mr-2" size={16} />
                ) : (
                  <RotateCcw size={16} className="mr-2" />
                )}
                Resetar Tudo
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MiniCard({ icon: Icon, label, value, sub, color, testId }: { icon: any; label: string; value: string; sub: string; color: string; testId: string }) {
  const styles: Record<string, string> = {
    green: "bg-green-500/5 border-green-500/15 text-green-500",
    blue: "bg-blue-500/5 border-blue-500/15 text-blue-500",
    orange: "bg-orange-500/5 border-orange-500/15 text-orange-500",
    violet: "bg-violet-500/5 border-violet-500/15 text-violet-500",
  };
  const s = styles[color] || styles.blue;
  const textColor = s.split(" ")[2];
  return (
    <div className={`${s.split(" ").slice(0, 2).join(" ")} border rounded-2xl p-4`}>
      <div className={`flex items-center gap-1.5 mb-1 ${textColor}`}>
        <Icon size={14} />
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-lg font-bold ${textColor}`} data-testid={testId}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}

function MovRow({ label, value, count }: { label: string; value: string; count?: number }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {count !== undefined && <span className="text-[10px] text-muted-foreground">{count}x</span>}
        <span className="text-xs font-bold">{value}</span>
      </div>
    </div>
  );
}

function TxRow({ tx, currentUserId, showUser }: { tx: any; currentUserId?: string; showUser?: boolean }) {
  const isMine = tx.userId === currentUserId;
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [gwCheck, setGwCheck] = useState<null | "loading" | { label: string; isPaid: boolean; isFailed: boolean; hasId: boolean; gatewayStatus: string | null; error?: string }>(null);

  const canForceComplete =
    tx.type === "withdraw_request" &&
    (tx.status === "failed" || tx.status === "pending");

  // When the dialog opens, immediately check the gateway status so the admin
  // can make an informed decision before confirming.
  useEffect(() => {
    if (!confirmOpen || !canForceComplete) return;
    setGwCheck("loading");
    fetch(`/api/admin/transactions/${tx.id}/gateway-status`, { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        if (data.message && !data.gatewayStatus && !data.hasId) {
          setGwCheck({ label: data.message, isPaid: false, isFailed: false, hasId: false, gatewayStatus: null, error: data.message });
        } else {
          setGwCheck(data);
        }
      })
      .catch(e => setGwCheck({ label: `Erro ao consultar gateway: ${e.message}`, isPaid: false, isFailed: false, hasId: false, gatewayStatus: null, error: e.message }));
  }, [confirmOpen]);

  const forceComplete = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/transactions/${tx.id}/force-complete`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Erro ao forçar conclusão");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Saque concluído", description: data.message });
      setConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
      setConfirmOpen(false);
    },
  });

  return (
    <>
      <div className={`flex items-center gap-3 px-4 py-3 ${isMine ? 'bg-primary/5' : ''}`} data-testid={`admin-tx-${tx.id}`}>
        <span className={`text-sm w-5 text-center shrink-0 ${typeColors[tx.type] || 'text-muted-foreground'}`}>
          {typeIcons[tx.type] || "·"}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold truncate">{typeLabels[tx.type] || tx.type}</span>
            {isMine && <span className="text-[8px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">EU</span>}
          </div>
          <p className="text-[10px] text-muted-foreground truncate">
            {showUser ? (tx.userName || tx.description || "") : ""} {formatDate(tx.createdAt)}
          </p>
        </div>
        <div className="text-right shrink-0 flex flex-col items-end gap-1">
          <p className="text-xs font-bold">{formatBRL(Number(tx.amount))}</p>
          <p className={`text-[9px] font-bold ${statusColors[tx.status] || ""}`}>{statusLabels[tx.status] || tx.status}</p>
          {canForceComplete && (
            <button
              onClick={() => setConfirmOpen(true)}
              className="text-[9px] font-bold text-orange-500 underline underline-offset-2"
              data-testid={`btn-force-complete-${tx.id}`}
            >
              Forçar conclusão
            </button>
          )}
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={(open) => { setConfirmOpen(open); if (!open) setGwCheck(null); }}>
        <DialogContent className="max-w-sm" data-testid="dialog-force-complete">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-orange-500" />
              Forçar conclusão do saque
            </DialogTitle>
            <DialogDescription className="text-left space-y-2 pt-1" asChild>
              <div>
                <div className="text-xs bg-muted rounded-lg p-2 space-y-0.5">
                  <p><span className="text-muted-foreground">Usuário:</span> <strong>{tx.userName || tx.userId}</strong></p>
                  <p><span className="text-muted-foreground">Valor:</span> <strong>{formatBRL(Number(tx.amount))}</strong></p>
                  <p><span className="text-muted-foreground">Status plataforma:</span> <strong>{statusLabels[tx.status] || tx.status}</strong></p>
                </div>

                {/* Gateway status — fetched automatically when dialog opens */}
                <div className="mt-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Status real no gateway (AbacatePay)</p>
                  {gwCheck === null || gwCheck === "loading" ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-lg p-2">
                      <Loader2 size={12} className="animate-spin" />
                      Consultando gateway...
                    </div>
                  ) : gwCheck.isPaid ? (
                    <div className="text-xs font-bold bg-green-500/10 text-green-600 rounded-lg p-2" data-testid="gw-status-paid">
                      ✓ {gwCheck.label}
                    </div>
                  ) : gwCheck.isFailed ? (
                    <div className="text-xs font-bold bg-red-500/10 text-red-600 rounded-lg p-2" data-testid="gw-status-failed">
                      ✗ {gwCheck.label}
                      <p className="text-[10px] font-normal mt-1 text-red-500/80">O gateway confirma que o dinheiro NÃO foi enviado. Não force-complete.</p>
                    </div>
                  ) : (
                    <div className="text-xs bg-yellow-500/10 text-yellow-700 rounded-lg p-2" data-testid="gw-status-other">
                      ⚠ {gwCheck.label}
                      {gwCheck.error && <p className="text-[10px] mt-1 text-yellow-600/80">Você pode forçar por sua própria conta e risco.</p>}
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground mt-2">
                  Ao confirmar: transação vira <strong>Concluído</strong> e o saldo do usuário é descontado automaticamente.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => { setConfirmOpen(false); setGwCheck(null); }} disabled={forceComplete.isPending}>
              Cancelar
            </Button>
            <Button
              size="sm"
              className={gwCheck !== "loading" && gwCheck !== null && gwCheck.isFailed
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-600 text-white"}
              onClick={() => forceComplete.mutate()}
              disabled={forceComplete.isPending || gwCheck === "loading" || (gwCheck !== null && gwCheck !== "loading" && gwCheck.isFailed)}
              data-testid="btn-confirm-force-complete"
            >
              {forceComplete.isPending ? <Loader2 size={14} className="animate-spin" /> : "Confirmar mesmo assim"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Section({ icon: Icon, iconColor, title, count, empty, children }: { icon: any; iconColor: string; title: string; count: number; empty: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon size={16} className={iconColor} />
        <p className="text-sm font-bold flex-1">{title}</p>
        <span className="text-[10px] text-muted-foreground">{count} item{count !== 1 ? "s" : ""}</span>
      </div>
      {count === 0 ? (
        <p className="text-xs text-muted-foreground py-3 text-center">{empty}</p>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </div>
  );
}
