import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, DollarSign, TrendingUp, Users, ArrowDownLeft, ArrowUpRight, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Admin() {
  const [, navigate] = useLocation();

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
      if (!res.ok) return [];
      return res.json();
    },
  });

  const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  const typeLabels: Record<string, string> = {
    deposit: "Depósito",
    withdraw_request: "Saque",
    withdraw_completed: "Saque concluído",
    challenge_entry: "Entrada desafio",
    challenge_win: "Prêmio",
    platform_fee: "Taxa plataforma",
    refund: "Reembolso",
  };

  const statusColors: Record<string, string> = {
    completed: "text-green-500",
    pending: "text-yellow-500",
    processing: "text-blue-500",
    failed: "text-red-500",
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate("/profile")} data-testid="button-admin-back">
          <ArrowLeft size={20} />
        </Button>
        <h1 className="font-display font-bold text-lg">Painel Admin</h1>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 space-y-1">
            <div className="flex items-center gap-2 text-green-500">
              <Percent size={18} />
              <span className="text-xs font-bold uppercase">Receita (10%)</span>
            </div>
            <p className="text-2xl font-bold text-green-500" data-testid="text-platform-revenue">
              {formatBRL(stats?.platformFees?.total || 0)}
            </p>
            <p className="text-[10px] text-muted-foreground">{stats?.platformFees?.count || 0} cobranças</p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 space-y-1">
            <div className="flex items-center gap-2 text-blue-500">
              <DollarSign size={18} />
              <span className="text-xs font-bold uppercase">Em carteiras</span>
            </div>
            <p className="text-2xl font-bold text-blue-500" data-testid="text-users-balance">
              {formatBRL(stats?.usersBalance?.total || 0)}
            </p>
            <p className="text-[10px] text-muted-foreground">{formatBRL(stats?.usersBalance?.locked || 0)} travado</p>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 space-y-1">
            <div className="flex items-center gap-2 text-primary">
              <ArrowDownLeft size={18} />
              <span className="text-xs font-bold uppercase">Depósitos</span>
            </div>
            <p className="text-xl font-bold" data-testid="text-total-deposits">
              {formatBRL(stats?.deposits?.total || 0)}
            </p>
            <p className="text-[10px] text-muted-foreground">{stats?.deposits?.count || 0} transações</p>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 space-y-1">
            <div className="flex items-center gap-2 text-orange-500">
              <ArrowUpRight size={18} />
              <span className="text-xs font-bold uppercase">Saques</span>
            </div>
            <p className="text-xl font-bold" data-testid="text-total-withdrawals">
              {formatBRL(stats?.withdrawals?.total || 0)}
            </p>
            <p className="text-[10px] text-muted-foreground">{stats?.withdrawals?.count || 0} transações</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-primary" />
            <span className="text-sm font-bold">Como funciona a receita</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            A cada desafio finalizado, 10% do valor total das entradas é retido como taxa da plataforma.
            Esse valor fica na sua conta AbacatePay — os depósitos dos usuários entram direto lá,
            e só 90% é distribuído como prêmio (via saque Pix).
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="font-bold text-sm px-1">Últimas transações</h2>
          <div className="space-y-2">
            {txs.map((tx: any) => (
              <div key={tx.id} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between" data-testid={`admin-tx-${tx.id}`}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{typeLabels[tx.type] || tx.type}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{tx.description}</p>
                  <p className="text-[10px] text-muted-foreground">{formatDate(tx.createdAt)}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-bold">{formatBRL(Number(tx.amount))}</p>
                  <p className={`text-[10px] font-semibold ${statusColors[tx.status] || ""}`}>
                    {tx.status === "completed" ? "Concluído" : tx.status === "pending" ? "Pendente" : tx.status === "processing" ? "Processando" : "Falhou"}
                  </p>
                </div>
              </div>
            ))}
            {txs.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">Nenhuma transação ainda</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
