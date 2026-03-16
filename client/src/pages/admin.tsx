import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  ArrowLeft, DollarSign, TrendingUp, Users, ArrowDownLeft, ArrowUpRight,
  Percent, Shield, ShieldOff, Trash2, Ban, AlertTriangle, Activity,
  Trophy, UserPlus, Eye, ChevronRight, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useLocation } from "wouter";

type Tab = "overview" | "transactions" | "users" | "suspicious";

export default function Admin() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("overview");
  const [confirmDialog, setConfirmDialog] = useState<{ type: string; userId: string; userName: string } | null>(null);
  const [txFilter, setTxFilter] = useState<string>("all");

  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats", { credentials: "include" });
      if (!res.ok) throw new Error("Acesso negado");
      return res.json();
    },
  });

  const { data: txs = [] } = useQuery({
    queryKey: ["/api/admin/transactions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/transactions", { credentials: "include" });
      return res.ok ? res.json() : [];
    },
    enabled: tab === "overview" || tab === "transactions",
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      return res.ok ? res.json() : [];
    },
    enabled: tab === "users",
  });

  const { data: suspicious } = useQuery({
    queryKey: ["/api/admin/suspicious"],
    queryFn: async () => {
      const res = await fetch("/api/admin/suspicious", { credentials: "include" });
      return res.ok ? res.json() : { highVolume: [], failedTxs: [], rapidDeposits: [] };
    },
    enabled: tab === "suspicious",
  });

  const toggleAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}/toggle-admin`, { method: "POST", credentials: "include" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setConfirmDialog(null);
    },
  });

  const blockUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}/block`, { method: "POST", credentials: "include" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setConfirmDialog(null);
    },
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

  const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  const typeLabels: Record<string, string> = {
    deposit: "Depósito", withdraw_request: "Saque", withdraw_completed: "Saque OK",
    challenge_entry: "Entrada", challenge_win: "Prêmio", platform_fee: "Taxa 10%", refund: "Reembolso",
  };
  const statusLabels: Record<string, string> = {
    completed: "OK", pending: "Pendente", processing: "Processando", failed: "Falhou",
  };
  const statusColors: Record<string, string> = {
    completed: "text-green-500", pending: "text-yellow-500", processing: "text-blue-500", failed: "text-red-500",
  };

  const filteredTxs = txFilter === "all" ? txs : txs.filter((tx: any) => tx.type === txFilter);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "overview", label: "Resumo", icon: TrendingUp },
    { key: "transactions", label: "Transações", icon: Activity },
    { key: "users", label: "Usuários", icon: Users },
    { key: "suspicious", label: "Alertas", icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate("/profile")} data-testid="button-admin-back">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="font-display font-bold text-lg">Painel Admin</h1>
        </div>
        <div className="flex px-2 pb-2 gap-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
              data-testid={`tab-${t.key}`}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {tab === "overview" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Percent} label="Receita (10%)" value={formatBRL(stats?.platformFees?.total || 0)} sub={`${stats?.platformFees?.count || 0} cobranças`} color="green" testId="text-platform-revenue" />
              <StatCard icon={DollarSign} label="Saldo usuários" value={formatBRL(stats?.usersBalance?.total || 0)} sub={`${formatBRL(stats?.usersBalance?.locked || 0)} travado`} color="blue" testId="text-users-balance" />
              <StatCard icon={ArrowDownLeft} label="Depósitos OK" value={formatBRL(stats?.depositsCompleted?.total || 0)} sub={`${stats?.depositsCompleted?.count || 0} confirmados`} color="primary" testId="text-deposits" />
              <StatCard icon={ArrowUpRight} label="Saques" value={formatBRL(stats?.withdrawals?.total || 0)} sub={`${stats?.withdrawals?.count || 0} solicitados`} color="orange" testId="text-withdrawals" />
              <StatCard icon={Trophy} label="Desafios" value={`${stats?.activeChallenges || 0} ativos`} sub={`${stats?.totalChallenges || 0} total`} color="violet" testId="text-challenges" />
              <StatCard icon={Users} label="Usuários" value={String(stats?.totalUsers || 0)} sub={`${stats?.challengeEntries?.count || 0} entradas`} color="cyan" testId="text-users" />
            </div>

            <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
              <p className="text-sm font-bold flex items-center gap-2"><TrendingUp size={16} className="text-primary" /> Movimentação total</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><span className="text-muted-foreground">Entradas em desafios:</span> <span className="font-bold">{formatBRL(stats?.challengeEntries?.total || 0)}</span></div>
                <div><span className="text-muted-foreground">Prêmios pagos:</span> <span className="font-bold">{formatBRL(stats?.challengeWins?.total || 0)}</span></div>
                <div><span className="text-muted-foreground">Total depositado:</span> <span className="font-bold">{formatBRL(stats?.depositsAll?.total || 0)}</span></div>
                <div><span className="text-muted-foreground">Total sacado:</span> <span className="font-bold">{formatBRL(stats?.withdrawals?.total || 0)}</span></div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-sm px-1">Últimas transações</p>
              {txs.slice(0, 10).map((tx: any) => <TxRow key={tx.id} tx={tx} typeLabels={typeLabels} statusLabels={statusLabels} statusColors={statusColors} formatBRL={formatBRL} formatDate={formatDate} />)}
              {txs.length > 10 && (
                <Button variant="ghost" className="w-full text-xs text-primary" onClick={() => setTab("transactions")}>
                  Ver todas <ChevronRight size={14} />
                </Button>
              )}
            </div>
          </>
        )}

        {tab === "transactions" && (
          <>
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
                    txFilter === f.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                  data-testid={`filter-${f.key}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">{filteredTxs.length} transações</p>
            <div className="space-y-2">
              {filteredTxs.map((tx: any) => <TxRow key={tx.id} tx={tx} typeLabels={typeLabels} statusLabels={statusLabels} statusColors={statusColors} formatBRL={formatBRL} formatDate={formatDate} />)}
              {filteredTxs.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Nenhuma transação</p>}
            </div>
          </>
        )}

        {tab === "users" && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{allUsers.length} usuários cadastrados</p>
            {allUsers.map((u: any) => (
              <div key={u.id} className="bg-card border border-border rounded-xl p-3" data-testid={`user-${u.id}`}>
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold truncate">{u.name || u.username}</p>
                      {u.isAdmin && <Badge className="text-[8px] px-1.5 py-0 bg-primary/20 text-primary border-none">ADMIN</Badge>}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{u.email}</p>
                    <p className="text-[10px] text-muted-foreground">Saldo: {formatBRL(Number(u.balance || 0))} | Travado: {formatBRL(Number(u.lockedBalance || 0))}</p>
                    <p className="text-[10px] text-muted-foreground">Desde {formatDate(u.createdAt)}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => setConfirmDialog({ type: "toggle-admin", userId: u.id, userName: u.name })} data-testid={`btn-toggle-admin-${u.id}`}>
                      {u.isAdmin ? <ShieldOff size={16} /> : <Shield size={16} />}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-yellow-500" onClick={() => setConfirmDialog({ type: "block", userId: u.id, userName: u.name })} data-testid={`btn-block-${u.id}`}>
                      <Ban size={16} />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setConfirmDialog({ type: "delete", userId: u.id, userName: u.name })} data-testid={`btn-delete-${u.id}`}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "suspicious" && suspicious && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="font-bold text-sm flex items-center gap-2"><AlertTriangle size={16} className="text-yellow-500" /> Depósitos rápidos (24h)</p>
              {suspicious.rapidDeposits?.length > 0 ? suspicious.rapidDeposits.map((r: any) => (
                <div key={r.userId} className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                  <p className="text-sm font-bold">{r.userName || "Sem nome"}</p>
                  <p className="text-[10px] text-muted-foreground">{r.userEmail}</p>
                  <p className="text-xs mt-1"><span className="font-bold text-yellow-500">{r.depositCount} depósitos</span> totalizando <span className="font-bold">{formatBRL(Number(r.totalDeposited))}</span></p>
                </div>
              )) : <p className="text-xs text-muted-foreground">Nenhuma atividade suspeita</p>}
            </div>

            <div className="space-y-2">
              <p className="font-bold text-sm flex items-center gap-2"><Activity size={16} className="text-blue-500" /> Maior volume (todos)</p>
              {suspicious.highVolume?.map((h: any) => (
                <div key={h.userId} className="bg-card border border-border rounded-xl p-3">
                  <p className="text-sm font-bold">{h.userName || "Sem nome"}</p>
                  <p className="text-[10px] text-muted-foreground">{h.userEmail}</p>
                  <p className="text-xs mt-1">{h.txCount} transações | {formatBRL(Number(h.totalAmount))}</p>
                </div>
              ))}
              {suspicious.highVolume?.length === 0 && <p className="text-xs text-muted-foreground">Sem dados</p>}
            </div>

            <div className="space-y-2">
              <p className="font-bold text-sm flex items-center gap-2"><AlertTriangle size={16} className="text-red-500" /> Transações falhadas</p>
              {suspicious.failedTxs?.map((tx: any) => (
                <div key={tx.id} className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-bold">{typeLabels[tx.type] || tx.type}</p>
                      <p className="text-[10px] text-muted-foreground">{tx.userName} | {formatDate(tx.createdAt)}</p>
                    </div>
                    <p className="text-sm font-bold text-red-500">{formatBRL(Number(tx.amount))}</p>
                  </div>
                </div>
              ))}
              {suspicious.failedTxs?.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma falha</p>}
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent className="rounded-3xl max-w-[340px]">
          <DialogHeader>
            <DialogTitle className="font-display">
              {confirmDialog?.type === "toggle-admin" && "Alterar permissão"}
              {confirmDialog?.type === "block" && "Bloquear usuário"}
              {confirmDialog?.type === "delete" && "Apagar usuário"}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog?.type === "toggle-admin" && `Alternar admin para ${confirmDialog?.userName}?`}
              {confirmDialog?.type === "block" && `Bloquear ${confirmDialog?.userName}? A conta será desativada.`}
              {confirmDialog?.type === "delete" && `Apagar ${confirmDialog?.userName}? Isso remove todos os dados e transações. Essa ação é irreversível.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setConfirmDialog(null)}>Cancelar</Button>
            <Button
              className={`flex-1 rounded-xl ${confirmDialog?.type === "delete" ? "bg-destructive hover:bg-destructive/90" : ""}`}
              onClick={() => {
                if (!confirmDialog) return;
                if (confirmDialog.type === "toggle-admin") toggleAdminMutation.mutate(confirmDialog.userId);
                if (confirmDialog.type === "block") blockUserMutation.mutate(confirmDialog.userId);
                if (confirmDialog.type === "delete") deleteUserMutation.mutate(confirmDialog.userId);
              }}
              disabled={toggleAdminMutation.isPending || blockUserMutation.isPending || deleteUserMutation.isPending}
            >
              {(toggleAdminMutation.isPending || blockUserMutation.isPending || deleteUserMutation.isPending) ? (
                <Loader2 className="animate-spin" size={16} />
              ) : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color, testId }: { icon: any; label: string; value: string; sub: string; color: string; testId: string }) {
  const colorMap: Record<string, string> = {
    green: "bg-green-500/10 border-green-500/20 text-green-500",
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-500",
    primary: "bg-primary/10 border-primary/20 text-primary",
    orange: "bg-orange-500/10 border-orange-500/20 text-orange-500",
    violet: "bg-violet-500/10 border-violet-500/20 text-violet-500",
    cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-500",
  };
  const c = colorMap[color] || colorMap.primary;
  return (
    <div className={`${c.split(" ").slice(0, 2).join(" ")} border rounded-2xl p-4 space-y-1`}>
      <div className={`flex items-center gap-2 ${c.split(" ")[2]}`}>
        <Icon size={16} />
        <span className="text-[10px] font-bold uppercase">{label}</span>
      </div>
      <p className={`text-xl font-bold ${c.split(" ")[2]}`} data-testid={testId}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function TxRow({ tx, typeLabels, statusLabels, statusColors, formatBRL, formatDate }: any) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 flex items-center justify-between" data-testid={`admin-tx-${tx.id}`}>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate">{typeLabels[tx.type] || tx.type}</p>
        <p className="text-[10px] text-muted-foreground truncate">{tx.userName || tx.description}</p>
        <p className="text-[10px] text-muted-foreground">{formatDate(tx.createdAt)}</p>
      </div>
      <div className="text-right shrink-0 ml-3">
        <p className="text-sm font-bold">{formatBRL(Number(tx.amount))}</p>
        <p className={`text-[10px] font-semibold ${statusColors[tx.status] || ""}`}>{statusLabels[tx.status] || tx.status}</p>
      </div>
    </div>
  );
}
