import { ArrowDownLeft, ArrowUpRight, History, Info, Eye, EyeOff, Copy, QrCode, Loader2, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Wallet() {
  const [showBalance, setShowBalance] = useState(true);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState("CPF");
  const [pixData, setPixData] = useState<{ qrCode?: string; qrCodeBase64?: string; url?: string } | null>(null);

  const { data: walletData } = useQuery({
    queryKey: ["/api/wallet/balance"],
    queryFn: async () => {
      const res = await fetch("/api/wallet/balance", { credentials: "include" });
      return res.ok ? res.json() : { balance: 0, lockedBalance: 0, availableBalance: 0 };
    },
  });

  const { data: txs = [] } = useQuery({
    queryKey: ["/api/wallet/transactions"],
    queryFn: async () => {
      const res = await fetch("/api/wallet/transactions", { credentials: "include" });
      return res.ok ? res.json() : [];
    },
  });

  const depositMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await apiRequest("POST", "/api/wallet/deposit", { amount });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/transactions"] });
      if (data.pix) {
        setPixData(data.pix);
      } else {
        setDepositOpen(false);
        setDepositAmount("");
      }
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (params: { amount: number; pixKey: string; pixKeyType: string }) => {
      const res = await apiRequest("POST", "/api/wallet/withdraw", params);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/transactions"] });
      setWithdrawOpen(false);
      setWithdrawAmount("");
      setPixKey("");
    },
  });

  const balance = Number(walletData?.balance || 0);
  const lockedBalance = Number(walletData?.lockedBalance || 0);
  const availableBalance = Number(walletData?.availableBalance || 0);

  const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return `Hoje, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    if (days === 1) return `Ontem, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      deposit: "Depósito Pix",
      challenge_entry: "Entrada em Desafio",
      challenge_win: "Prêmio de Desafio",
      withdraw_request: "Saque Pix",
      withdraw_completed: "Saque Concluído",
      platform_fee: "Taxa Plataforma",
      refund: "Reembolso",
    };
    return labels[type] || type;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 size={14} className="text-green-500" />;
      case "processing": return <Clock size={14} className="text-yellow-500" />;
      case "pending": return <Clock size={14} className="text-muted-foreground" />;
      case "failed": return <XCircle size={14} className="text-red-500" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pendente",
      processing: "Processando",
      completed: "Concluído",
      failed: "Falhou",
    };
    return labels[status] || status;
  };

  const isCredit = (type: string) => ["deposit", "challenge_win", "refund"].includes(type);

  const quickAmounts = [30, 50, 100, 200, 500];

  return (
    <div className="p-6 pb-32 space-y-8">
      <header className="pt-4">
        <h1 className="text-2xl font-display font-bold">Minha Carteira</h1>
      </header>

      <div className="bg-foreground text-background dark:bg-zinc-900 dark:text-white rounded-[2rem] p-6 relative overflow-hidden shadow-xl">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 blur-[50px] rounded-full" />
        <div className="flex justify-between items-start mb-2">
          <p className="text-background/70 dark:text-muted-foreground text-sm font-medium">Saldo Disponível</p>
          <button onClick={() => setShowBalance(!showBalance)} className="text-background/50 dark:text-white/30" data-testid="button-toggle-balance">
            {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>
        <h2 className="text-4xl font-display font-bold mb-1" data-testid="text-balance">
          {showBalance ? formatBRL(availableBalance) : "••••••"}
        </h2>
        {lockedBalance > 0 && showBalance && (
          <p className="text-background/50 dark:text-white/40 text-xs mb-4">
            {formatBRL(lockedBalance)} bloqueado em desafios
          </p>
        )}
        {lockedBalance === 0 && <div className="mb-4" />}

        <div className="flex gap-3">
          <Button
            className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 border-none shadow-lg shadow-primary/20"
            onClick={() => { setDepositOpen(true); setPixData(null); setDepositAmount(""); }}
            data-testid="button-deposit"
          >
            <ArrowDownLeft className="mr-2" size={18} />
            Depositar
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-xl bg-white/10 dark:bg-white/5 border-transparent text-background dark:text-white hover:bg-white/20 dark:hover:bg-white/10"
            onClick={() => { setWithdrawOpen(true); setWithdrawAmount(""); setPixKey(""); }}
            data-testid="button-withdraw"
          >
            <ArrowUpRight className="mr-2" size={18} />
            Sacar Pix
          </Button>
        </div>
      </div>

      <div className="px-4 py-3 rounded-xl bg-primary/5 border border-primary/20 text-[11px] text-primary flex items-center gap-2">
        <Info size={16} className="shrink-0" />
        <p>A plataforma retém <strong>10%</strong> apenas sobre o prêmio final dos desafios. Depósitos e saques são isentos de taxas. Mínimo: R$ 30,00.</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2"><History size={18} /> Histórico</h3>
        </div>

        <div className="space-y-3">
          {txs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <History size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhuma transação ainda</p>
              <p className="text-xs mt-1">Faça seu primeiro depósito para começar!</p>
            </div>
          )}
          {txs.map((tx: any) => (
            <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border shadow-sm" data-testid={`transaction-${tx.id}`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isCredit(tx.type) ? "bg-primary/20 text-primary" : "bg-muted text-foreground"
                }`}>
                  {isCredit(tx.type) ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                </div>
                <div>
                  <p className="font-bold text-sm">{tx.description || getTypeLabel(tx.type)}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] text-muted-foreground font-medium">{formatDate(tx.createdAt)}</p>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(tx.status)}
                      <span className="text-[10px] text-muted-foreground">{getStatusLabel(tx.status)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className={`font-display font-bold ${isCredit(tx.type) ? "text-primary" : "text-foreground"}`}>
                {isCredit(tx.type) ? "+" : "-"} {formatBRL(Number(tx.amount))}
              </p>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent className="rounded-3xl max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="font-display">Depositar via Pix</DialogTitle>
            <DialogDescription>Mínimo R$ 30,00. Sem taxas.</DialogDescription>
          </DialogHeader>

          {pixData ? (
            <div className="space-y-4 py-4">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <QrCode size={32} />
                </div>
                <p className="font-bold text-lg">Pague o Pix</p>
                <p className="text-sm text-muted-foreground">Escaneie o QR Code ou copie o código</p>
              </div>

              {pixData.qrCodeBase64 && (
                <div className="flex justify-center">
                  <img src={`data:image/png;base64,${pixData.qrCodeBase64}`} alt="QR Code Pix" className="w-48 h-48 rounded-xl border border-border" />
                </div>
              )}

              {pixData.qrCode && (
                <div className="bg-muted rounded-xl p-3 flex items-center justify-between border border-border">
                  <p className="font-mono text-[9px] text-muted-foreground truncate mr-2">{pixData.qrCode}</p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 text-primary"
                    onClick={() => navigator.clipboard.writeText(pixData.qrCode!)}
                    data-testid="button-copy-pix"
                  >
                    <Copy size={16} />
                  </Button>
                </div>
              )}

              {pixData.url && (
                <Button
                  variant="outline"
                  className="w-full rounded-xl"
                  onClick={() => window.open(pixData.url, "_blank")}
                >
                  Abrir link de pagamento
                </Button>
              )}

              <p className="text-[11px] text-center text-muted-foreground">
                Após o pagamento, o saldo será creditado automaticamente.
              </p>

              <Button
                className="w-full rounded-xl"
                onClick={() => { setPixData(null); setDepositOpen(false); }}
              >
                Fechar
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map(v => (
                  <Button
                    key={v}
                    variant={depositAmount === String(v) ? "default" : "outline"}
                    size="sm"
                    className="rounded-xl flex-1 min-w-[60px]"
                    onClick={() => setDepositAmount(String(v))}
                    data-testid={`button-quick-deposit-${v}`}
                  >
                    R$ {v}
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold">Outro valor</Label>
                <Input
                  type="number"
                  placeholder="R$ 0,00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="h-12 rounded-xl text-lg font-bold"
                  min={30}
                  data-testid="input-deposit-amount"
                />
              </div>

              <DialogFooter>
                <Button
                  className="w-full h-12 rounded-xl font-bold"
                  disabled={!depositAmount || Number(depositAmount) < 30 || depositMutation.isPending}
                  onClick={() => depositMutation.mutate(Number(depositAmount))}
                  data-testid="button-confirm-deposit"
                >
                  {depositMutation.isPending ? (
                    <Loader2 className="animate-spin mr-2" size={18} />
                  ) : (
                    <ArrowDownLeft className="mr-2" size={18} />
                  )}
                  Depositar {depositAmount ? formatBRL(Number(depositAmount)) : ""}
                </Button>
              </DialogFooter>

              {depositMutation.isError && (
                <p className="text-destructive text-xs text-center flex items-center justify-center gap-1">
                  <AlertCircle size={14} />
                  {(depositMutation.error as any)?.message || "Erro ao depositar"}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="rounded-3xl max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="font-display">Sacar via Pix</DialogTitle>
            <DialogDescription>
              Disponível: {formatBRL(availableBalance)}. Mínimo R$ 30,00.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold">Valor do saque</Label>
              <Input
                type="number"
                placeholder="R$ 0,00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="h-12 rounded-xl text-lg font-bold"
                min={30}
                max={availableBalance}
                data-testid="input-withdraw-amount"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">Tipo de chave</Label>
              <Select value={pixKeyType} onValueChange={setPixKeyType}>
                <SelectTrigger className="h-12 rounded-xl" data-testid="select-pix-key-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CPF">CPF</SelectItem>
                  <SelectItem value="CNPJ">CNPJ</SelectItem>
                  <SelectItem value="EMAIL">E-mail</SelectItem>
                  <SelectItem value="PHONE">Telefone</SelectItem>
                  <SelectItem value="RANDOM">Chave aleatória</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">Chave Pix</Label>
              <Input
                placeholder={pixKeyType === "CPF" ? "000.000.000-00" : pixKeyType === "EMAIL" ? "email@exemplo.com" : "Sua chave Pix"}
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                className="h-12 rounded-xl"
                data-testid="input-pix-key"
              />
            </div>

            <div className="px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-[11px] text-yellow-700 dark:text-yellow-400 flex items-start gap-2">
              <Clock size={14} className="shrink-0 mt-0.5" />
              <p>Saques são processados de forma assíncrona. O valor pode levar alguns minutos para ser creditado.</p>
            </div>

            <DialogFooter>
              <Button
                className="w-full h-12 rounded-xl font-bold"
                disabled={
                  !withdrawAmount ||
                  Number(withdrawAmount) < 30 ||
                  Number(withdrawAmount) > availableBalance ||
                  !pixKey ||
                  withdrawMutation.isPending
                }
                onClick={() => withdrawMutation.mutate({ amount: Number(withdrawAmount), pixKey, pixKeyType })}
                data-testid="button-confirm-withdraw"
              >
                {withdrawMutation.isPending ? (
                  <Loader2 className="animate-spin mr-2" size={18} />
                ) : (
                  <ArrowUpRight className="mr-2" size={18} />
                )}
                Sacar {withdrawAmount ? formatBRL(Number(withdrawAmount)) : ""}
              </Button>
            </DialogFooter>

            {withdrawMutation.isError && (
              <p className="text-destructive text-xs text-center flex items-center justify-center gap-1">
                <AlertCircle size={14} />
                {(withdrawMutation.error as any)?.message || "Erro ao sacar"}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
