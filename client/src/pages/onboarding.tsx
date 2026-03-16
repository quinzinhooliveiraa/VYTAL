import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  ArrowRight,
  Users,
  CheckCircle2,
  Bell,
  Activity,
  ChevronLeft,
  Zap,
  Camera,
  Download,
  Smartphone,
  Shield,
  FileText,
  Lock,
  Eye,
  Scale,
  Flame,
  Dumbbell,
  Heart,
  Target,
  Check,
  ChevronDown,
  AlertTriangle,
  ExternalLink,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePwaInstall } from "@/hooks/use-pwa-install";

const slideIn = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.2, ease: "easeOut" } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.12 } },
};

const Step1Terms = ({ onNext }: { onNext: () => void }) => {
  const [accepted, setAccepted] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const sections = [
    { id: "uso", icon: FileText, title: "Termos de Uso", color: "text-blue-500 bg-blue-500/10", summary: "Regras gerais de uso da plataforma VYTAL", content: "Ao usar o VYTAL, você concorda com nossas regras de participação em desafios, sistema de check-in por câmera ao vivo, e distribuição de prêmios. Participantes devem ter 18 anos ou mais. A plataforma cobra uma taxa operacional de 10% sobre o pote final de cada desafio. É proibido o uso de fraudes, fotos de galeria ou qualquer artifício para burlar o sistema de verificação." },
    { id: "privacidade", icon: Lock, title: "Política de Privacidade", color: "text-purple-500 bg-purple-500/10", summary: "Como tratamos seus dados pessoais", content: "Coletamos dados como nome, e-mail, localização (GPS para check-ins) e imagens de câmera para verificação de atividades. Seus dados são protegidos conforme a LGPD. Não compartilhamos informações pessoais com terceiros sem seu consentimento. Você pode solicitar a exclusão dos seus dados a qualquer momento." },
    { id: "financeiro", icon: Scale, title: "Termos Financeiros", color: "text-green-500 bg-green-500/10", summary: "Regras sobre depósitos, saques e prêmios", content: "Os depósitos são feitos via Pix e são utilizados exclusivamente para formação do pote de prêmios dos desafios. Saques são processados em até 3 dias úteis. Em caso de desistência, o valor depositado é redistribuído entre os participantes que completarem o desafio. A VYTAL não é uma plataforma de apostas — é um sistema de accountability financeira." },
    { id: "imagem", icon: Eye, title: "Uso de Imagem", color: "text-orange-500 bg-orange-500/10", summary: "Consentimento para câmera e check-ins", content: "Ao participar dos desafios, você autoriza o uso da câmera do dispositivo para check-ins ao vivo. As imagens são utilizadas exclusivamente para verificação de atividade e moderação comunitária." },
  ];

  return (
    <motion.div {...slideIn} className="flex flex-col h-full justify-between">
      <div className="space-y-3 flex-1 overflow-y-auto pb-4">
        <div className="text-center space-y-1">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto border border-primary/20">
            <Shield size={28} />
          </div>
          <h2 className="text-2xl font-display font-bold">Termos e Condições</h2>
          <p className="text-xs text-muted-foreground">Leia e aceite para continuar.</p>
        </div>

        <div className="space-y-2">
          {sections.map((section) => (
            <div key={section.id}>
              <button
                className="w-full text-left p-3 bg-card border border-border rounded-2xl transition-all hover:border-primary/30"
                onClick={() => setExpanded(expanded === section.id ? null : section.id)}
                data-testid={`button-terms-${section.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${section.color}`}>
                    <section.icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm">{section.title}</h3>
                    <p className="text-[11px] text-muted-foreground">{section.summary}</p>
                  </div>
                  <ChevronDown size={14} className={`text-muted-foreground transition-transform ${expanded === section.id ? "rotate-180" : ""}`} />
                </div>
              </button>
              <AnimatePresence>
                {expanded === section.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 py-3 text-xs text-muted-foreground leading-relaxed bg-muted/30 rounded-b-2xl -mt-2 border border-t-0 border-border">
                      {section.content}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <button
          className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all ${accepted ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
          onClick={() => setAccepted(!accepted)}
          data-testid="button-accept-terms"
        >
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${accepted ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
            {accepted && <Check size={14} strokeWidth={3} />}
          </div>
          <p className="text-sm text-left">
            Li e aceito os <strong>Termos de Uso</strong>, <strong>Política de Privacidade</strong> e demais condições.
          </p>
        </button>
      </div>

      <Button
        className="w-full h-14 text-lg font-bold rounded-2xl shrink-0 shadow-lg shadow-primary/20"
        onClick={onNext}
        disabled={!accepted}
        data-testid="button-onboarding-terms-accept"
      >
        Aceitar e Continuar <ArrowRight className="ml-2" size={18} />
      </Button>
    </motion.div>
  );
};

const Step2HowItWorks = ({ onNext }: { onNext: () => void }) => {
  const steps = [
    { icon: Zap, color: "text-yellow-500 bg-yellow-500/10", title: "Aposte em você", text: "Deposite via Pix. Seu dinheiro + o dos outros formam o pote de prêmio." },
    { icon: Camera, color: "text-purple-500 bg-purple-500/10", title: "Check-in ao vivo", text: "Prove que treinou com câmera ao vivo e GPS. Sem foto da galeria." },
    { icon: Shield, color: "text-orange-500 bg-orange-500/10", title: "Moderação justa", text: "A comunidade valida os check-ins. Quem trapaceia é banido." },
    { icon: Trophy, color: "text-primary bg-primary/10", title: "Lucre!", text: "Quem persiste divide o dinheiro dos desistentes. Você sai no lucro!" },
  ];

  return (
    <motion.div {...slideIn} className="flex flex-col h-full justify-between">
      <div className="space-y-4 flex-1 overflow-y-auto pb-4">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center text-primary mx-auto border border-primary/20">
            <Activity size={32} strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-display font-bold">Como funciona</h2>
          <p className="text-sm text-muted-foreground px-2">
            Desafios esportivos com dinheiro real.<br />Quem desiste, paga. Quem persiste, lucra.
          </p>
        </div>

        <div className="space-y-2.5">
          {steps.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex gap-3 p-3.5 bg-card border border-border rounded-2xl items-center"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                <item.icon size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
              <AlertTriangle size={16} className="text-yellow-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-yellow-600 dark:text-yellow-400">Taxa operacional</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                A VYTAL cobra <strong className="text-foreground">10% sobre o pote final</strong> de cada desafio para custos de operação, manutenção e moderação da plataforma.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Button
        className="w-full h-14 text-lg font-bold rounded-2xl shrink-0 shadow-lg shadow-primary/20"
        onClick={onNext}
        data-testid="button-onboarding-rules"
      >
        Entendi <ArrowRight className="ml-2" size={18} />
      </Button>
    </motion.div>
  );
};

const Step3Personalize = ({ onNext }: { onNext: () => void }) => {
  const [name, setName] = useState(localStorage.getItem("fitstake-user-name") || "");
  const [goals, setGoals] = useState<string[]>([]);

  const handleNext = () => {
    if (name.trim()) {
      localStorage.setItem("fitstake-user-name", name.trim());
      fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), goals }),
      }).catch(() => {});
    }
    localStorage.setItem("fitstake-user-goals", JSON.stringify(goals));
    onNext();
  };

  const goalOptions = [
    { label: "Perda de Peso", emoji: "🔥", icon: Flame },
    { label: "Hipertrofia", emoji: "💪", icon: Dumbbell },
    { label: "Cardio", emoji: "🏃", icon: Heart },
    { label: "Disciplina", emoji: "🎯", icon: Target },
  ];

  return (
    <motion.div {...slideIn} className="flex flex-col h-full justify-between">
      <div className="space-y-6 flex-1">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Personalização</p>
          <h2 className="text-2xl font-display font-bold">Sobre você</h2>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold">Como quer ser chamado?</label>
          <Input
            placeholder="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-14 rounded-2xl bg-card border-border shadow-sm px-4 text-base"
            data-testid="input-onboarding-name"
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-bold">Seus objetivos <span className="text-muted-foreground font-normal">(opcional)</span></label>
          <div className="grid grid-cols-2 gap-2">
            {goalOptions.map((o) => {
              const selected = goals.includes(o.label);
              return (
                <button
                  key={o.label}
                  className={`p-3.5 rounded-2xl border-2 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                  onClick={() => setGoals(selected ? goals.filter((g) => g !== o.label) : [...goals, o.label])}
                  data-testid={`button-goal-${o.label}`}
                >
                  {o.emoji} {o.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Button
        className="w-full h-14 text-lg font-bold rounded-2xl shrink-0 mt-4 shadow-lg shadow-primary/20"
        onClick={handleNext}
        disabled={!name.trim()}
        data-testid="button-onboarding-personalize"
      >
        Continuar <ArrowRight className="ml-2" size={18} />
      </Button>
    </motion.div>
  );
};

const Step4NotifPwa = ({ onNext }: { onNext: () => void }) => {
  const { canInstall, isInstalled, install, isIOS } = usePwaInstall();
  const [installing, setInstalling] = useState(false);
  const [notifState, setNotifState] = useState<"idle" | "granted" | "denied">(
    typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted" ? "granted" : "idle"
  );

  const handleInstall = async () => {
    if (canInstall) {
      setInstalling(true);
      await install();
      setInstalling(false);
    }
  };

  const handleNotifications = async () => {
    if (!("Notification" in window)) return;
    try {
      const result = await Notification.requestPermission();
      setNotifState(result === "granted" ? "granted" : "denied");
      if (result === "granted") {
        const { subscribeToPush, sendTestPush } = await import("@/lib/push-notifications");
        await subscribeToPush();
        await sendTestPush();
      }
    } catch {
      setNotifState("denied");
    }
  };

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const showIosInstructions = isIOS && !isInstalled;
  const showAndroidInstructions = !isIOS && !canInstall && !isInstalled;

  return (
    <motion.div {...slideIn} className="flex flex-col h-full justify-between">
      <div className="space-y-4 flex-1 overflow-y-auto pb-4">
        <div className="text-center space-y-1">
          <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mx-auto border border-blue-500/20">
            <Smartphone size={28} />
          </div>
          <h2 className="text-2xl font-display font-bold">Configure o app</h2>
          <p className="text-xs text-muted-foreground">Para a melhor experiência possível.</p>
        </div>

        <div className="space-y-2.5">
          <button
            onClick={handleNotifications}
            disabled={notifState !== "idle"}
            className={`w-full flex items-center gap-3 p-4 bg-card border rounded-2xl text-left transition-all ${
              notifState === "granted" ? "border-green-500/30 bg-green-500/5" : "border-border hover:border-primary/30"
            }`}
            data-testid="button-onboarding-notifications"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              notifState === "granted" ? "bg-green-500/10" : "bg-yellow-500/10"
            }`}>
              {notifState === "granted" ? <Check size={20} className="text-green-500" /> : <Bell size={20} className="text-yellow-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">{notifState === "granted" ? "Notificações ativadas!" : "Ativar notificações"}</p>
              <p className="text-[11px] text-muted-foreground">
                {notifState === "granted"
                  ? "Você receberá alertas de check-in e prêmios."
                  : notifState === "denied"
                  ? "Você pode ativar depois nas configurações."
                  : "Lembretes de check-in, desafios e prêmios."}
              </p>
            </div>
          </button>

          {canInstall && !isInstalled && (
            <button
              onClick={handleInstall}
              disabled={installing}
              className="w-full flex items-center gap-3 p-4 bg-card border border-border rounded-2xl text-left hover:border-primary/30 transition-all"
              data-testid="button-install-pwa"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <Download size={20} className="text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">{installing ? "Instalando..." : "Instalar na tela inicial"}</p>
                <p className="text-[11px] text-muted-foreground">Acesso instantâneo, performance nativa</p>
              </div>
            </button>
          )}

          {isInstalled && (
            <div className="flex items-center gap-3 p-4 bg-green-500/5 border border-green-500/20 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                <Check size={20} className="text-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-green-600 dark:text-green-400">App instalado!</p>
                <p className="text-[11px] text-muted-foreground">O VYTAL já está na sua tela inicial.</p>
              </div>
            </div>
          )}

          {showIosInstructions && (
            <div className="bg-card border border-blue-500/20 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-center">Como instalar no iPhone / iPad</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0 text-[10px] font-bold">1</div>
                  <p className="text-xs text-muted-foreground">Toque no botão de <strong className="text-foreground">Compartilhar</strong> (ícone de quadrado com seta) na barra do Safari</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500 shrink-0 text-[10px] font-bold">2</div>
                  <p className="text-xs text-muted-foreground">Role e toque em <strong className="text-foreground">"Adicionar à Tela de Início"</strong></p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500 shrink-0 text-[10px] font-bold">3</div>
                  <p className="text-xs text-muted-foreground">Toque em <strong className="text-foreground">"Adicionar"</strong> para confirmar</p>
                </div>
              </div>
            </div>
          )}

          {showAndroidInstructions && (
            <div className="bg-card border border-blue-500/20 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-center">Como instalar o app</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0 text-[10px] font-bold">1</div>
                  <p className="text-xs text-muted-foreground">Toque nos <strong className="text-foreground">3 pontos (⋮)</strong> no canto superior do navegador</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500 shrink-0 text-[10px] font-bold">2</div>
                  <p className="text-xs text-muted-foreground">Toque em <strong className="text-foreground">"Instalar aplicativo"</strong> ou <strong className="text-foreground">"Adicionar à tela inicial"</strong></p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Button
        className="w-full h-14 text-lg font-bold rounded-2xl shrink-0 shadow-lg shadow-primary/20"
        onClick={onNext}
        data-testid="button-onboarding-setup-next"
      >
        Continuar <ArrowRight className="ml-2" size={18} />
      </Button>
    </motion.div>
  );
};

const Step5Final = ({ onComplete }: { onComplete: () => void }) => (
  <motion.div {...slideIn} className="flex flex-col items-center text-center h-full justify-between py-4">
    <div />

    <div className="space-y-6 w-full">
      <div className="flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 border border-green-500/20"
        >
          <CheckCircle2 size={40} />
        </motion.div>
      </div>

      <div className="space-y-2">
        <h2 className="text-3xl font-display font-bold">Tudo pronto!</h2>
        <p className="text-muted-foreground text-sm px-4">
          Sua jornada para a consistência começa agora.
        </p>
      </div>

      <div className="px-2">
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: "Convite VYTAL",
                text: "Entre no VYTAL comigo! Desafios esportivos com dinheiro real.",
                url: window.location.origin,
              }).catch(() => {});
            }
          }}
          className="w-full flex items-center gap-3 p-4 bg-card border border-border rounded-2xl text-left hover:border-primary/30 transition-all"
          data-testid="button-share-invite"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
            <Users size={20} className="text-purple-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">Convide amigos</p>
            <p className="text-[11px] text-muted-foreground">Treinar com amigos é 3x mais eficaz</p>
          </div>
          <ExternalLink size={14} className="text-muted-foreground shrink-0" />
        </button>
      </div>
    </div>

    <Button
      className="w-full h-14 text-lg font-bold rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20"
      onClick={() => {
        localStorage.setItem("fitstake-onboarding-done", "true");
        onComplete();
      }}
      data-testid="button-onboarding-complete"
    >
      Explorar Desafios <ArrowRight className="ml-2" size={18} />
    </Button>
  </motion.div>
);

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const next = () => {
    if (step < totalSteps) setStep(step + 1);
    else setLocation("/dashboard");
  };

  const back = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="h-[100dvh] max-w-md mx-auto flex flex-col p-6 relative overflow-hidden bg-background">
      <div className="flex items-center justify-between mb-4 z-10 shrink-0">
        {step > 1 && step < totalSteps ? (
          <button
            onClick={back}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
            data-testid="button-onboarding-back"
          >
            <ChevronLeft size={22} />
          </button>
        ) : (
          <div className="w-10" />
        )}

        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i + 1 === step
                  ? "w-8 bg-primary"
                  : i + 1 < step
                  ? "w-3 bg-primary/50"
                  : "w-1.5 bg-muted"
              }`}
            />
          ))}
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex flex-col relative z-10 min-h-0">
        <AnimatePresence mode="wait">
          {step === 1 && <Step1Terms key="1" onNext={next} />}
          {step === 2 && <Step2HowItWorks key="2" onNext={next} />}
          {step === 3 && <Step3Personalize key="3" onNext={next} />}
          {step === 4 && <Step4NotifPwa key="4" onNext={next} />}
          {step === 5 && <Step5Final key="5" onComplete={next} />}
        </AnimatePresence>
      </div>
    </div>
  );
}
