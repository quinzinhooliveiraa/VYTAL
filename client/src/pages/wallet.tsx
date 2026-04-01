import { ArrowDownLeft, ArrowUpRight, History, Info, Eye, EyeOff, Copy, Loader2, CheckCircle2, Clock, XCircle, AlertCircle, User, Check, Pencil } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";

export default function Wallet() {
  const { user } = useAuth();
  const [showBalance, setShowBalance] = useState(true);
  const fromRecharge = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("recharge") === "1";
  const [depositOpen, setDepositOpen] = useState(fromRecharge);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [cpfDialogOpen, setCpfDialogOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState("CPF");
  const [cpfInput, setCpfInput] = useState(user?.cpf || "");
  const [phoneInput, setPhoneInput] = useState(user?.phone || "");
  const [pixData, setPixData] = useState<{ qrCode?: string; qrCodeBase64?: string; url?: string; transactionId?: string } | null>(null);
  const [pixPaid, setPixPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const openEditPaymentData = () => {
    setCpfInput(user?.cpf || "");
    setPhoneInput(user?.phone || "");
    setCpfDialogOpen(true);
  };

  useEffect(() => {
    if (pixData?.transactionId && !pixPaid) {
      pollingRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/wallet/deposit/${pixData.transactionId}/status`, { credentials: "include" });
          if (res.ok) {
            const data = await res.json();
            if (data.status === "completed") {
              setPixPaid(true);
              queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
              queryClient.invalidateQueries({ queryKey: ["/api/wallet/transactions"] });
              if (pollingRef.current) clearInterval(pollingRef.current);
            }
          }
        } catch {}
      }, 4000);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [pixData?.transactionId, pixPaid]);

  const { data: walletData } = useQuery({
    queryKey: ["/api/wallet/balance"],
    queryFn: async () => {
      const res = await fetch("/api/wallet/balance", { credentials: "include" });
      return res.ok ? res.json() : { balance: 0, lockedBalance: 0, availableBalance: 0 };
    },
    refetchInterval: 10000,
  });

  const { data: txs = [] } = useQuery({
    queryKey: ["/api/wallet/transactions"],
    queryFn: async () => {
      const res = await fetch("/api/wallet/transactions", { credentials: "include" });
      return res.ok ? res.json() : [];
    },
    refetchInterval: 10000,
  });

  const saveCpfMutation = useMutation({
    mutationFn: async (data: { cpf: string; phone: string }) => {
      const res = await apiRequest("PATCH", "/api/users/me", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setCpfDialogOpen(false);
      if (depositAmount) {
        depositMutation.mutate(Number(depositAmount));
      }
    },
  });

  const depositMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.needsCpf) {
          setCpfDialogOpen(true);
        }
        throw new Error(data.message || "Erro ao depositar");
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/transactions"] });
      if (data.pix) {
        setPixPaid(false);
        setCopied(false);
        setPixData({ ...data.pix, transactionId: data.transaction?.id });
      } else {
        setDepositOpen(false);
        setDepositAmount("");
      }
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (params: { amount: number; pixKey: string; pixKeyType: string; testMode?: boolean }) => {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao sacar");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/transactions"] });
      setWithdrawSuccess(true);
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

      {fromRecharge && (
        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30 flex items-center gap-3">
          <Info size={18} className="text-primary shrink-0" />
          <div className="text-xs flex-1">
            <p className="font-bold text-primary">Recarregue para criar seu desafio</p>
            <p className="text-muted-foreground">Deposite o valor necessário e volte para finalizar a criação.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 rounded-xl border-primary text-primary hover:bg-primary/10 font-bold text-xs"
            onClick={() => { window.location.href = "/create"; }}
            data-testid="button-back-to-challenge"
          >
            Voltar ao Desafio
          </Button>
        </div>
      )}

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
        {showBalance && (
          <div className="flex gap-4 mb-4 text-[11px]">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-background/60 dark:text-white/50">Total: {formatBRL(balance + lockedBalance)}</span>
            </div>
            {lockedBalance > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-background/60 dark:text-white/50">Em desafios: {formatBRL(lockedBalance)}</span>
              </div>
            )}
          </div>
        )}
        {!showBalance && <div className="mb-4" />}

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
            onClick={() => { setWithdrawOpen(true); setWithdrawAmount(""); setPixKey(""); setWithdrawSuccess(false); }}
            disabled={availableBalance <= 0}
            data-testid="button-withdraw"
          >
            <ArrowUpRight className="mr-2" size={18} />
            Sacar Pix
          </Button>
        </div>
      </div>

      <div className="px-4 py-3 rounded-xl bg-primary/5 border border-primary/20 text-[11px] text-primary flex items-center gap-2">
        <Info size={16} className="shrink-0" />
        <p>Valores em desafios ficam <strong>bloqueados</strong> até o resultado. Só o saldo disponível pode ser sacado. Taxa de <strong>10%</strong> apenas sobre prêmios.</p>
      </div>

      {user?.cpf && (
        <button
          onClick={openEditPaymentData}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-border hover:bg-muted/50 transition-colors"
          data-testid="button-edit-payment-data"
        >
          <div className="flex items-center gap-3">
            <User size={16} className="text-muted-foreground" />
            <div className="text-left">
              <p className="text-xs font-bold">Dados de pagamento</p>
              <p className="text-[10px] text-muted-foreground">
                CPF: {user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.***.**$4")}
                {user.phone ? ` · Tel: ***${user.phone.slice(-4)}` : ""}
              </p>
            </div>
          </div>
          <Pencil size={14} className="text-muted-foreground" />
        </button>
      )}

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
            <div className="space-y-5 py-4">
              {pixPaid ? (
                <div className="text-center space-y-4 py-6">
                  <div className="w-20 h-20 mx-auto bg-primary/15 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="text-primary" size={44} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-xl">Pagamento confirmado!</p>
                    <p className="text-sm text-muted-foreground">
                      R$ {depositAmount},00 adicionado ao seu saldo
                    </p>
                  </div>
                  {fromRecharge ? (
                    <div className="space-y-3 mt-4">
                      <Button
                        className="w-full h-12 rounded-xl font-bold bg-primary"
                        onClick={() => { window.location.href = "/create"; }}
                        data-testid="button-back-to-challenge-success"
                      >
                        Continuar Criando o Desafio
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full h-12 rounded-xl font-bold"
                        onClick={() => { setPixData(null); setPixPaid(false); setDepositOpen(false); setDepositAmount(""); }}
                        data-testid="button-close-deposit-success"
                      >
                        Ficar na Carteira
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full h-12 rounded-xl font-bold mt-4"
                      onClick={() => { setPixData(null); setPixPaid(false); setDepositOpen(false); setDepositAmount(""); }}
                      data-testid="button-close-deposit-success"
                    >
                      Voltar para carteira
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="text-center space-y-1">
                    <p className="font-bold text-lg">R$ {depositAmount},00</p>
                    <p className="text-sm text-muted-foreground">Escaneie o QR Code ou copie o código Pix</p>
                  </div>

                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-2xl">
                      {pixData.qrCodeBase64 ? (
                        <img src={pixData.qrCodeBase64} alt="QR Code Pix" width={200} height={200} className="rounded-lg" />
                      ) : (
                        <QRCodeSVG
                          value={pixData.qrCode || ""}
                          size={200}
                          level="H"
                          bgColor="#ffffff"
                          fgColor="#000000"
                        />
                      )}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full h-11 rounded-xl font-semibold gap-2"
                    onClick={() => {
                      navigator.clipboard.writeText(pixData.qrCode || "");
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2500);
                    }}
                    data-testid="button-copy-pix"
                  >
                    {copied ? (
                      <>
                        <Check size={16} className="text-primary" />
                        Código copiado!
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        Copiar Pix Copia e Cola
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="animate-spin" size={14} />
                    <p className="text-xs">Aguardando pagamento...</p>
                  </div>

                  <Button
                    variant="ghost"
                    className="w-full h-10 rounded-xl text-muted-foreground text-sm"
                    onClick={() => { setPixData(null); setPixPaid(false); setDepositOpen(false); setDepositAmount(""); }}
                  >
                    Cancelar
                  </Button>
                </>
              )}
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

      <Dialog open={withdrawOpen} onOpenChange={(open) => {
        setWithdrawOpen(open);
        if (!open) { setWithdrawSuccess(false); setWithdrawAmount(""); setPixKey(""); }
      }}>
        <DialogContent className="rounded-3xl max-w-[380px] max-h-[90vh] overflow-y-auto">
          {withdrawSuccess ? (
            <div className="text-center space-y-4 py-8">
              <div className="w-20 h-20 mx-auto bg-primary/15 rounded-full flex items-center justify-center">
                <Clock className="text-primary" size={40} />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-xl">Saque solicitado!</p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-bold text-foreground">{formatBRL(Number(withdrawAmount) - 1.60)}</span> será enviado para sua chave Pix
                </p>
                <p className="text-xs text-muted-foreground">(Taxa de R$ 1,60 deduzida)</p>
              </div>
              <div className="px-3 py-2 rounded-lg bg-muted text-[11px] text-muted-foreground text-left space-y-1">
                <p><span className="font-bold">Chave:</span> {pixKey}</p>
                <p><span className="font-bold">Tipo:</span> {pixKeyType}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                O processamento pode levar alguns minutos. Você será notificado quando o Pix for enviado.
              </p>
              <div className="space-y-2">
                <Button
                  className="w-full h-12 rounded-xl font-bold"
                  onClick={() => { setWithdrawOpen(false); setWithdrawSuccess(false); setWithdrawAmount(""); setPixKey(""); }}
                  data-testid="button-close-withdraw-success"
                >
                  Voltar para carteira
                </Button>
                <Button
                  variant="ghost"
                  className="w-full h-10 rounded-xl text-xs text-muted-foreground"
                  onClick={() => { openEditPaymentData(); }}
                  data-testid="button-edit-data-after-withdraw"
                >
                  <Pencil size={14} className="mr-1.5" /> Editar dados de pagamento
                </Button>
              </div>
            </div>
          ) : (
            <>
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
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || Number(val) <= availableBalance) {
                        setWithdrawAmount(val);
                      } else {
                        setWithdrawAmount(String(Math.floor(availableBalance)));
                      }
                    }}
                    className="h-12 rounded-xl text-lg font-bold"
                    min={30}
                    max={availableBalance}
                    data-testid="input-withdraw-amount"
                  />
                  {Number(withdrawAmount) > availableBalance && (
                    <p className="text-destructive text-[10px] font-semibold">Valor máximo: {formatBRL(availableBalance)}</p>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[30, 50, 100, Math.floor(availableBalance)].filter((v, i, a) => v >= 30 && a.indexOf(v) === i).map(v => (
                    <button
                      key={v}
                      onClick={() => setWithdrawAmount(String(v))}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        Number(withdrawAmount) === v ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
                      }`}
                      data-testid={`quick-withdraw-${v}`}
                    >
                      {v === Math.floor(availableBalance) ? "Tudo" : `R$ ${v}`}
                    </button>
                  ))}
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
                  <p className="text-[10px] text-muted-foreground">Confira a chave antes de confirmar. Saques enviados não podem ser desfeitos.</p>
                </div>

                {Number(withdrawAmount) >= 30 && (
                  <div className="bg-card border border-border rounded-xl p-3 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Valor solicitado</span>
                      <span className="font-bold">{formatBRL(Number(withdrawAmount))}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Taxa de processamento</span>
                      <span className="font-bold text-destructive">- R$ 1,60</span>
                    </div>
                    <div className="border-t border-border pt-2 flex justify-between text-sm">
                      <span className="font-bold">Você recebe via Pix</span>
                      <span className="font-bold text-primary">{formatBRL(Number(withdrawAmount) - 1.60)}</span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-2">
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
                </div>

                {withdrawMutation.isError && (
                  <p className="text-destructive text-xs text-center flex items-center justify-center gap-1">
                    <AlertCircle size={14} />
                    {(withdrawMutation.error as any)?.message || "Erro ao sacar"}
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={cpfDialogOpen} onOpenChange={setCpfDialogOpen}>
        <DialogContent className="rounded-3xl max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="font-display">
              {user?.cpf ? "Editar dados de pagamento" : "Dados para pagamento"}
            </DialogTitle>
            <DialogDescription>
              {user?.cpf
                ? "Atualize seu CPF e telefone. Seus dados são protegidos."
                : "Para usar Pix, precisamos do seu CPF e telefone. Seus dados são protegidos."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold">CPF</Label>
              <Input
                placeholder="000.000.000-00"
                value={cpfInput}
                onChange={(e) => setCpfInput(e.target.value.replace(/\D/g, ""))}
                className="h-12 rounded-xl"
                maxLength={11}
                data-testid="input-cpf"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">Telefone com DDD</Label>
              <Input
                placeholder="55 11 99999-9999"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ""))}
                className="h-12 rounded-xl"
                maxLength={13}
                data-testid="input-phone"
              />
            </div>

            {saveCpfMutation.isError && (
              <p className="text-destructive text-xs text-center flex items-center justify-center gap-1">
                <AlertCircle size={14} />
                {(saveCpfMutation.error as any)?.message || "Erro ao salvar dados"}
              </p>
            )}

            <DialogFooter className="flex flex-col gap-2 sm:flex-col">
              <Button
                className="w-full h-12 rounded-xl font-bold"
                disabled={cpfInput.length !== 11 || phoneInput.length < 10 || saveCpfMutation.isPending}
                onClick={() => saveCpfMutation.mutate({ cpf: cpfInput, phone: phoneInput })}
                data-testid="button-save-cpf"
              >
                {saveCpfMutation.isPending ? (
                  <Loader2 className="animate-spin mr-2" size={18} />
                ) : (
                  <Check className="mr-2" size={18} />
                )}
                {user?.cpf ? "Atualizar dados" : "Salvar e continuar"}
              </Button>
              {user?.cpf && (
                <Button
                  variant="ghost"
                  className="w-full h-10 rounded-xl text-muted-foreground text-xs"
                  onClick={() => setCpfDialogOpen(false)}
                >
                  Cancelar
                </Button>
              )}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
