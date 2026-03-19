import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ArrowDownLeft, CheckCircle2, Copy, Check, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

const quickAmounts = [30, 50, 100, 200];

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface DepositDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultAmount?: number;
  onSuccess?: () => void;
  title?: string;
  description?: string;
}

export function DepositDrawer({
  open,
  onOpenChange,
  defaultAmount,
  onSuccess,
  title = "Depositar via Pix",
  description = "Mínimo R$ 30,00. Sem taxas.",
}: DepositDrawerProps) {
  const [depositAmount, setDepositAmount] = useState(defaultAmount ? String(defaultAmount) : "");
  const [pixData, setPixData] = useState<{ qrCode?: string; qrCodeBase64?: string; transactionId?: string } | null>(null);
  const [pixPaid, setPixPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (defaultAmount) setDepositAmount(String(defaultAmount));
  }, [defaultAmount]);

  useEffect(() => {
    if (pixData?.transactionId && !pixPaid) {
      pollingRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/wallet/deposit/${pixData.transactionId}/status`, { credentials: "include" });
          const data = await res.json();
          if (data.status === "paid" || data.paid) {
            setPixPaid(true);
            clearInterval(pollingRef.current!);
            queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
            queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
          }
        } catch {}
      }, 3000);
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [pixData?.transactionId, pixPaid]);

  const depositMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao depositar");
      return data;
    },
    onSuccess: (data) => {
      if (data.pix) {
        setPixPaid(false);
        setPixData({ ...data.pix, transactionId: data.transaction?.id });
      }
    },
  });

  const reset = () => {
    setPixData(null);
    setPixPaid(false);
    setDepositAmount(defaultAmount ? String(defaultAmount) : "");
    setCopied(false);
    depositMutation.reset();
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="px-4 pb-8">
        <DrawerHeader className="text-center pb-2">
          <DrawerTitle className="font-display">{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>

        {pixData ? (
          <div className="space-y-4 py-2">
            {pixPaid ? (
              <div className="text-center space-y-4 py-6">
                <div className="w-20 h-20 mx-auto bg-primary/15 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="text-primary" size={44} />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-xl">Pagamento confirmado!</p>
                  <p className="text-sm text-muted-foreground">
                    {formatBRL(Number(depositAmount))} adicionado ao seu saldo
                  </p>
                </div>
                <Button
                  className="w-full h-12 rounded-xl font-bold"
                  onClick={() => { handleClose(false); onSuccess?.(); }}
                  data-testid="button-deposit-success-close"
                >
                  Continuar
                </Button>
              </div>
            ) : (
              <>
                <div className="text-center space-y-1">
                  <p className="font-bold text-lg">{formatBRL(Number(depositAmount))}</p>
                  <p className="text-sm text-muted-foreground">Escaneie o QR Code ou copie o código Pix</p>
                </div>

                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-2xl">
                    {pixData.qrCodeBase64 ? (
                      <img src={pixData.qrCodeBase64} alt="QR Code Pix" width={200} height={200} className="rounded-lg" />
                    ) : (
                      <QRCodeSVG value={pixData.qrCode || ""} size={200} level="H" bgColor="#ffffff" fgColor="#000000" />
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
                  data-testid="button-copy-pix-drawer"
                >
                  {copied ? <><Check size={16} className="text-primary" />Código copiado!</> : <><Copy size={16} />Copiar Pix Copia e Cola</>}
                </Button>

                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="animate-spin" size={14} />
                  <p className="text-xs">Aguardando pagamento...</p>
                </div>

                <Button variant="ghost" className="w-full h-10 rounded-xl text-muted-foreground text-sm" onClick={() => handleClose(false)}>
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
                data-testid="input-deposit-amount-drawer"
              />
            </div>

            <Button
              className="w-full h-12 rounded-xl font-bold"
              disabled={!depositAmount || Number(depositAmount) < 30 || depositMutation.isPending}
              onClick={() => depositMutation.mutate(Number(depositAmount))}
              data-testid="button-confirm-deposit-drawer"
            >
              {depositMutation.isPending ? (
                <Loader2 className="animate-spin mr-2" size={18} />
              ) : (
                <ArrowDownLeft className="mr-2" size={18} />
              )}
              Depositar {depositAmount ? formatBRL(Number(depositAmount)) : ""}
            </Button>

            {depositMutation.isError && (
              <p className="text-destructive text-xs text-center flex items-center justify-center gap-1">
                <AlertCircle size={14} />
                {(depositMutation.error as any)?.message || "Erro ao depositar"}
              </p>
            )}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
