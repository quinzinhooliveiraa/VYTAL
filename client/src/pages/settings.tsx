import { ArrowLeft, Moon, Sun, Smartphone, Eye, ShieldCheck, LogOut, Award, Star, Bell, BellOff, MessageSquare, Lightbulb, HelpCircle, ChevronDown, ChevronUp, Send, CheckCircle2, Loader2, Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [isPrivate, setIsPrivate] = useState(user?.isPrivate || false);
  const [showEarnings, setShowEarnings] = useState(user?.publicEarnings !== false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(localStorage.getItem("fitstake-notifications") !== "false");
  const [showMedals, setShowMedals] = useState(false);

  const [feedbackType, setFeedbackType] = useState<"feedback" | "suporte" | "ideia">("feedback");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  const [show2FASetup, setShow2FASetup] = useState(false);
  const [show2FADisable, setShow2FADisable] = useState(false);
  const [twoFAData, setTwoFAData] = useState<{ qrCode: string; secret: string } | null>(null);
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFAEnabled, setTwoFAEnabled] = useState(user?.twoFactorEnabled || false);

  const setup2FA = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/2fa/setup");
      if (!res.ok) throw new Error("Erro");
      return res.json();
    },
    onSuccess: (data) => {
      setTwoFAData(data);
      setShow2FASetup(true);
    },
    onError: () => toast({ title: "Erro", description: "Não foi possível configurar 2FA.", variant: "destructive" }),
  });

  const verify2FA = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/2fa/verify", { token: twoFACode });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      return res.json();
    },
    onSuccess: () => {
      setTwoFAEnabled(true);
      setShow2FASetup(false);
      setTwoFACode("");
      setTwoFAData(null);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "2FA Ativado", description: "Sua conta agora tem proteção extra!" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message || "Código inválido", variant: "destructive" }),
  });

  const disable2FA = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/2fa/disable", { token: twoFACode });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      return res.json();
    },
    onSuccess: () => {
      setTwoFAEnabled(false);
      setShow2FADisable(false);
      setTwoFACode("");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "2FA Desativado", description: "Autenticação de dois fatores removida." });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message || "Código inválido", variant: "destructive" }),
  });

  const updatePrivacy = useMutation({
    mutationFn: async (data: { isPrivate?: boolean; publicEarnings?: boolean }) => {
      const res = await apiRequest("PATCH", "/api/users/me", data);
      if (!res.ok) throw new Error("Erro ao atualizar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Salvo", description: "Configuração atualizada." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível salvar.", variant: "destructive" });
    },
  });

  const submitFeedback = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/support", { type: feedbackType, message: feedbackMessage });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      return res.json();
    },
    onSuccess: () => {
      setFeedbackMessage("");
      setFeedbackSent(true);
      toast({ title: "Enviado!", description: "Recebemos sua mensagem. Obrigado!" });
      setTimeout(() => setFeedbackSent(false), 4000);
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-background pb-32 animate-in fade-in duration-300">
      <header className="px-6 py-6 flex items-center gap-4 sticky top-0 bg-background/90 backdrop-blur-xl z-50 border-b border-border/50">
        <button onClick={() => setLocation("/profile")} className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors" data-testid="button-back">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold text-xl">Configurações</h1>
      </header>

      <div className="px-6 space-y-8 pt-6">
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Aparência</h3>
          <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-3"><span className="text-sm font-bold">Tema Visual</span></div>
            <div className="flex bg-muted p-1 rounded-xl gap-1">
              <button onClick={() => setTheme("light")} className={`p-2 rounded-lg transition-all ${theme === 'light' ? 'bg-background shadow-md text-primary scale-110' : 'opacity-50 hover:opacity-100'}`} data-testid="button-theme-light"><Sun size={14} /></button>
              <button onClick={() => setTheme("dark")} className={`p-2 rounded-lg transition-all ${theme === 'dark' ? 'bg-background shadow-md text-primary scale-110' : 'opacity-50 hover:opacity-100'}`} data-testid="button-theme-dark"><Moon size={14} /></button>
              <button onClick={() => setTheme("system")} className={`p-2 rounded-lg transition-all ${theme === 'system' ? 'bg-background shadow-md text-primary scale-110' : 'opacity-50 hover:opacity-100'}`} data-testid="button-theme-system"><Smartphone size={14} /></button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Conta e Privacidade</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3">
                {notificationsEnabled ? <Bell size={18} className="text-primary" /> : <BellOff size={18} className="text-foreground" />}
                <span className="text-sm font-bold">Notificações</span>
              </div>
              <Switch checked={notificationsEnabled} onCheckedChange={(checked) => {
                setNotificationsEnabled(checked);
                localStorage.setItem("fitstake-notifications", checked.toString());
              }} className="data-[state=checked]:bg-primary" data-testid="switch-notifications" />
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3"><Eye size={18} className={isPrivate ? "text-primary" : "text-foreground"} /> <span className="text-sm font-bold">Perfil Privado</span></div>
              <Switch checked={isPrivate} onCheckedChange={(checked) => {
                setIsPrivate(checked);
                updatePrivacy.mutate({ isPrivate: checked });
              }} className="data-[state=checked]:bg-primary" data-testid="switch-private-profile" />
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3"><Eye size={18} className={showEarnings ? "text-primary" : "text-foreground"} /> <span className="text-sm font-bold">Mostrar Ganhos</span></div>
              <Switch checked={showEarnings} onCheckedChange={(checked) => {
                setShowEarnings(checked);
                updatePrivacy.mutate({ publicEarnings: checked });
              }} className="data-[state=checked]:bg-primary" data-testid="switch-earnings-privacy" />
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3">
                <ShieldCheck size={18} className={twoFAEnabled ? "text-primary" : "text-foreground"} />
                <div>
                  <span className="text-sm font-bold">Autenticação 2FA</span>
                  {twoFAEnabled && <p className="text-[10px] text-primary font-medium">Ativado</p>}
                </div>
              </div>
              <Switch
                checked={twoFAEnabled}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setup2FA.mutate();
                  } else {
                    setTwoFACode("");
                    setShow2FADisable(true);
                  }
                }}
                disabled={setup2FA.isPending}
                className="data-[state=checked]:bg-primary"
                data-testid="switch-2fa"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Negócios & Parcerias</h3>

          {user?.isAdmin && (
            <>
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 space-y-4 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl transition-transform" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                    <Award size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-foreground">Painel de Comunidades</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Gerencie organizadores, comunidades, comissões e membros.</p>
                  </div>
                </div>
                <Button className="w-full rounded-xl bg-primary text-primary-foreground font-bold text-xs h-10 shadow-lg shadow-primary/20" onClick={() => setLocation("/community-dashboard")} data-testid="button-community-dashboard">
                  ABRIR PAINEL
                </Button>
              </div>

              <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 space-y-4 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl transition-transform" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">
                    <Star size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-foreground">Painel de Parceiros</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Gerencie parcerias, campanhas, cupons e métricas.</p>
                  </div>
                </div>
                <Button className="w-full rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs h-10 shadow-lg shadow-blue-500/20" onClick={() => setLocation("/partner-dashboard")} data-testid="button-partner-dashboard">
                  ABRIR PAINEL
                </Button>
              </div>
            </>
          )}

          {!user?.isAdmin && (
            <>
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 space-y-4 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl transition-transform" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                    <Award size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-foreground">Organizador de Eventos</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Crie desafios para centenas de pessoas e receba comissão sobre as entradas.</p>
                  </div>
                </div>
                <Button className="w-full rounded-xl bg-primary text-primary-foreground font-bold text-xs h-10 shadow-lg shadow-primary/20" onClick={() => setLocation("/communities")} data-testid="button-organizer">
                  CANDIDATAR-SE
                </Button>
              </div>

              <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5 space-y-4 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-accent/10 rounded-full blur-2xl transition-transform" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
                    <Star size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-foreground">Parceiro do App</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Academias, nutricionistas ou marcas. Ofereça benefícios e ganhe destaque.</p>
                  </div>
                </div>
                <Button className="w-full rounded-xl bg-accent text-accent-foreground font-bold text-xs h-10 shadow-lg shadow-accent/20" onClick={() => setLocation("/partner")} data-testid="button-partner">
                  SEJA UM PARCEIRO
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Feedback & Suporte</h3>
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex gap-2">
              {([
                { key: "feedback" as const, label: "Feedback", icon: MessageSquare },
                { key: "suporte" as const, label: "Suporte", icon: HelpCircle },
                { key: "ideia" as const, label: "Ideia", icon: Lightbulb },
              ]).map(t => (
                <button
                  key={t.key}
                  onClick={() => setFeedbackType(t.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    feedbackType === t.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                  data-testid={`button-feedback-type-${t.key}`}
                >
                  <t.icon size={14} />
                  {t.label}
                </button>
              ))}
            </div>
            <textarea
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              placeholder={
                feedbackType === "feedback" ? "O que você achou do app? O que pode melhorar?" :
                feedbackType === "suporte" ? "Descreva o problema que está enfrentando..." :
                "Que funcionalidade você gostaria de ver?"
              }
              className="w-full bg-background border border-border rounded-xl p-4 focus:border-primary outline-none min-h-[100px] resize-none text-sm"
              data-testid="input-feedback-message"
            />
            {feedbackSent ? (
              <div className="flex items-center justify-center gap-2 text-primary font-bold py-3">
                <CheckCircle2 size={20} />
                <span className="text-sm">Enviado com sucesso!</span>
              </div>
            ) : (
              <Button
                className="w-full rounded-xl font-bold h-11"
                disabled={!feedbackMessage.trim() || submitFeedback.isPending}
                onClick={() => submitFeedback.mutate()}
                data-testid="button-submit-feedback"
              >
                <Send size={16} className="mr-2" />
                {submitFeedback.isPending ? "Enviando..." : "Enviar"}
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => setShowMedals(!showMedals)}
            className="w-full flex items-center justify-between font-bold text-sm text-muted-foreground uppercase tracking-wider"
            data-testid="button-toggle-medals"
          >
            <span>Significado das Medalhas</span>
            {showMedals ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showMedals && (
            <div className="space-y-3 p-4 rounded-2xl bg-card border border-border animate-in fade-in slide-in-from-top-2 duration-200">
              {[
                { name: "Invicto", desc: "Participando de desafios ativos sem desistir." },
                { name: "Maratona", desc: "Completou 5 ou mais desafios." },
                { name: "Top 1%", desc: "Ganhou R$ 500+ em prêmios." },
                { name: "Ouro", desc: "Acumulou mais de R$ 1.000 em prêmios." },
                { name: "Veterano", desc: "Participou de 10 ou mais desafios." },
                { name: "Estreante", desc: "Completou o primeiro desafio." },
              ].map((m, i) => (
                <div key={i} className="flex justify-between items-center text-sm border-b border-border/50 last:border-0 pb-3 mb-1 last:pb-0 last:mb-0">
                  <span className="font-bold">{m.name}</span>
                  <span className="text-muted-foreground text-xs text-right w-2/3">{m.desc}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          onClick={() => {
            logout.mutate();
          }}
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 h-16 rounded-[1.5rem] font-bold text-sm border border-destructive/20 bg-destructive/5 mt-8"
          data-testid="button-logout"
        >
          <LogOut className="mr-3" size={20} /> Encerrar Sessão
        </Button>
      </div>

      <Dialog open={show2FASetup} onOpenChange={(open) => { if (!open) { setShow2FASetup(false); setTwoFACode(""); setTwoFAData(null); } }}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-primary" /> Ativar 2FA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Escaneie o QR code com o Google Authenticator, Authy ou outro app de autenticação.
            </p>
            {twoFAData && (
              <>
                <div className="flex justify-center p-4 bg-white rounded-xl">
                  <img src={twoFAData.qrCode} alt="QR Code 2FA" className="w-48 h-48" data-testid="img-2fa-qr" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Ou copie a chave manualmente:</p>
                  <div className="flex items-center gap-2 bg-muted rounded-xl p-3">
                    <code className="text-xs font-mono flex-1 break-all select-all">{twoFAData.secret}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(twoFAData.secret);
                        toast({ title: "Copiado!" });
                      }}
                      data-testid="button-copy-2fa-secret"
                    >
                      <Copy size={14} />
                    </Button>
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <p className="text-sm font-bold">Digite o código de 6 dígitos:</p>
              <Input
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="text-center text-2xl font-mono tracking-[0.5em] h-14 rounded-xl"
                maxLength={6}
                inputMode="numeric"
                data-testid="input-2fa-code"
              />
            </div>
            <Button
              className="w-full h-12 rounded-xl font-bold"
              onClick={() => verify2FA.mutate()}
              disabled={twoFACode.length !== 6 || verify2FA.isPending}
              data-testid="button-verify-2fa"
            >
              {verify2FA.isPending ? <Loader2 className="animate-spin mr-2" size={18} /> : <ShieldCheck className="mr-2" size={18} />}
              Ativar 2FA
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={show2FADisable} onOpenChange={(open) => { if (!open) { setShow2FADisable(false); setTwoFACode(""); } }}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-destructive" /> Desativar 2FA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Para desativar a autenticação de dois fatores, digite o código atual do seu app de autenticação.
            </p>
            <div className="space-y-2">
              <p className="text-sm font-bold">Código de 6 dígitos:</p>
              <Input
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="text-center text-2xl font-mono tracking-[0.5em] h-14 rounded-xl"
                maxLength={6}
                inputMode="numeric"
                data-testid="input-2fa-disable-code"
              />
            </div>
            <Button
              variant="destructive"
              className="w-full h-12 rounded-xl font-bold"
              onClick={() => disable2FA.mutate()}
              disabled={twoFACode.length !== 6 || disable2FA.isPending}
              data-testid="button-disable-2fa"
            >
              {disable2FA.isPending ? <Loader2 className="animate-spin mr-2" size={18} /> : <X className="mr-2" size={18} />}
              Desativar 2FA
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
