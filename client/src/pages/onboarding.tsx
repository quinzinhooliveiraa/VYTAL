import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  ArrowRight,
  Users,
  CheckCircle2,
  Bell,
  Share,
  TrendingUp,
  Activity,
  ChevronLeft,
  Calendar,
  Zap,
  Camera,
  Download,
  Smartphone,
  Plus,
  ExternalLink,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePwaInstall } from "@/hooks/use-pwa-install";

const slideIn = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, x: -60, transition: { duration: 0.25 } },
};

const Welcome = ({ onNext }: { onNext: () => void }) => (
  <motion.div {...slideIn} className="flex flex-col items-center text-center h-full justify-between py-8">
    <div />

    <div className="space-y-6">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-28 h-28 bg-primary/10 rounded-[2.5rem] flex items-center justify-center text-primary mx-auto border border-primary/20 shadow-2xl shadow-primary/10"
      >
        <Activity size={56} strokeWidth={2} />
      </motion.div>

      <div className="space-y-3">
        <h1 className="text-4xl font-display font-bold leading-[1.1]">
          Seja pago por ser{" "}
          <span className="text-primary relative">
            consistente.
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="absolute bottom-0 left-0 right-0 h-1 bg-primary/30 rounded-full origin-left"
            />
          </span>
        </h1>
        <p className="text-muted-foreground text-base px-2 leading-relaxed">
          Desafios esportivos com dinheiro real. Quem desiste, paga. Quem persiste, lucra.
        </p>
      </div>
    </div>

    <div className="w-full space-y-4">
      <Button
        className="w-full h-14 text-lg font-bold rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20"
        onClick={onNext}
        data-testid="button-onboarding-start"
      >
        Começar Jornada
      </Button>
      <p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-widest">FitStake Accountability System</p>
    </div>
  </motion.div>
);

const HowItWorks = ({ onNext }: { onNext: () => void }) => (
  <motion.div {...slideIn} className="flex flex-col h-full justify-between">
    <div className="space-y-5 flex-1 overflow-y-auto pb-4">
      <div className="space-y-1 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Como funciona</p>
        <h2 className="text-2xl font-display font-bold">Entenda o Jogo</h2>
      </div>

      <div className="space-y-3">
        {[
          { icon: Zap, color: "text-yellow-500 bg-yellow-500/10", title: "Aposte em você", text: "Deposite via Pix (ex: R$ 50). Seu dinheiro + o dos outros formam o pote de prêmio." },
          { icon: Calendar, color: "text-blue-500 bg-blue-500/10", title: "Cumpra a meta", text: "Seja consistente (ex: 5 treinos/semana). Se não bater a meta, você é eliminado." },
          { icon: Camera, color: "text-purple-500 bg-purple-500/10", title: "Check-in ao vivo", text: "Prove que treinou com nossa câmera. Sem foto da galeria — só ao vivo com GPS." },
          { icon: Shield, color: "text-orange-500 bg-orange-500/10", title: "Moderação", text: "A comunidade valida os check-ins. Quem trapaceia é banido." },
          { icon: Trophy, color: "text-primary bg-primary/10", title: "Lucre!", text: "Quem persiste divide o dinheiro dos desistentes. Você sai no lucro!" },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex gap-3 p-4 bg-card border border-border rounded-2xl items-start"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
              <item.icon size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm mb-0.5">{item.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-3 bg-red-500/5 border border-red-500/15 rounded-xl text-center">
        <p className="text-[10px] text-red-500/80 font-medium">Taxa de 10% sobre o pote final para custos de operação.</p>
      </div>
    </div>

    <Button className="w-full h-14 text-lg font-bold rounded-2xl shrink-0 mt-4" onClick={onNext} data-testid="button-onboarding-rules">
      Entendi <ArrowRight className="ml-2" size={18} />
    </Button>
  </motion.div>
);

const Stats = ({ onNext }: { onNext: () => void }) => (
  <motion.div {...slideIn} className="flex flex-col items-center text-center h-full justify-between py-8">
    <div />

    <div className="space-y-8">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
        className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto border border-primary/20"
      >
        <TrendingUp size={40} />
      </motion.div>

      <div className="space-y-6">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-6xl font-display font-bold text-primary"
          >
            83%
          </motion.p>
          <p className="text-lg font-medium mt-2 px-6">
            dos nossos usuários mantêm a sequência por mais de <strong>30 dias</strong>.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "2.4k", label: "Usuários ativos" },
            { value: "R$ 340k", label: "Distribuídos" },
            { value: "4.8★", label: "Avaliação" },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="bg-card border border-border rounded-2xl p-3"
            >
              <p className="text-lg font-display font-bold">{s.value}</p>
              <p className="text-[9px] text-muted-foreground font-medium">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>

    <Button className="w-full h-14 text-lg font-bold rounded-2xl mt-8" onClick={onNext} data-testid="button-onboarding-stats">
      Quero fazer parte <ArrowRight className="ml-2" size={18} />
    </Button>
  </motion.div>
);

const Personalization = ({ onNext }: { onNext: () => void }) => {
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

  return (
    <motion.div {...slideIn} className="flex flex-col h-full justify-between">
      <div className="space-y-6 flex-1">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Personalização</p>
          <h2 className="text-2xl font-display font-bold">Sobre você</h2>
          <p className="text-sm text-muted-foreground">Precisamos de algumas informações para personalizar sua experiência.</p>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Seu nome</Label>
            <Input
              placeholder="Nome completo"
              className="h-12 rounded-xl text-base"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="input-onboarding-name"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Qual seu foco?</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Perda de Peso", emoji: "🔥" },
                { label: "Hipertrofia", emoji: "💪" },
                { label: "Cardio", emoji: "🏃" },
                { label: "Disciplina", emoji: "🎯" },
              ].map((o) => (
                <button
                  key={o.label}
                  className={`h-12 rounded-xl text-sm font-bold border transition-all ${
                    goals.includes(o.label)
                      ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                      : "bg-card border-border hover:border-primary/40"
                  }`}
                  onClick={() => {
                    if (goals.includes(o.label)) setGoals(goals.filter((g) => g !== o.label));
                    else setGoals([...goals, o.label]);
                  }}
                  data-testid={`button-goal-${o.label}`}
                >
                  {o.emoji} {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Button
        className="w-full h-14 text-lg font-bold rounded-2xl mt-6 shrink-0"
        onClick={handleNext}
        disabled={!name.trim()}
        data-testid="button-onboarding-personalize"
      >
        Continuar <ArrowRight className="ml-2" size={18} />
      </Button>
    </motion.div>
  );
};

const InstallPWA = ({ onNext }: { onNext: () => void }) => {
  const { canInstall, isInstalled, install, isIOS } = usePwaInstall();

  const handleInstall = async () => {
    if (canInstall) {
      await install();
    }
    onNext();
  };

  return (
    <motion.div {...slideIn} className="flex flex-col items-center text-center h-full justify-between py-8">
      <div />

      <div className="space-y-6">
        <motion.div
          initial={{ y: -10 }}
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary mx-auto border border-primary/20 shadow-2xl shadow-primary/10"
        >
          <Smartphone size={48} />
        </motion.div>

        <div className="space-y-3">
          <h2 className="text-2xl font-display font-bold">
            {isInstalled ? "App instalado!" : "Instale o FitStake"}
          </h2>
          <p className="text-muted-foreground text-sm px-4 leading-relaxed">
            {isInstalled
              ? "Você já tem o FitStake instalado. Tudo pronto para começar!"
              : "Adicione à tela inicial para a melhor experiência. Acesso rápido, notificações e modo offline."}
          </p>
        </div>

        {!isInstalled && isIOS && (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3 text-left mx-2">
            <p className="text-xs font-bold text-center text-muted-foreground uppercase tracking-widest">No iPhone / iPad:</p>
            <div className="space-y-2">
              {[
                { icon: Share, text: "Toque no botão Compartilhar" },
                { icon: Plus, text: 'Selecione "Adicionar à Tela de Início"' },
                { icon: CheckCircle2, text: "Confirme tocando em Adicionar" },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <step.icon size={16} />
                  </div>
                  <p className="text-sm">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isInstalled && !isIOS && canInstall && (
          <Button
            className="w-full h-14 text-lg font-bold rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20"
            onClick={handleInstall}
            data-testid="button-install-pwa"
          >
            <Download className="mr-2" size={20} /> Instalar App
          </Button>
        )}
      </div>

      <div className="w-full space-y-3">
        {(isInstalled || (!canInstall && !isIOS)) && (
          <Button
            className="w-full h-14 text-lg font-bold rounded-2xl"
            onClick={onNext}
            data-testid="button-onboarding-install-next"
          >
            Continuar <ArrowRight className="ml-2" size={18} />
          </Button>
        )}
        {!isInstalled && (canInstall || isIOS) && (
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={onNext}>
            Pular por enquanto
          </Button>
        )}
      </div>
    </motion.div>
  );
};

const NotificationsStep = ({ onNext }: { onNext: () => void }) => {
  const requestNotifications = async () => {
    if ("Notification" in window) {
      await Notification.requestPermission();
    }
    onNext();
  };

  return (
    <motion.div {...slideIn} className="flex flex-col items-center text-center h-full justify-between py-8">
      <div />

      <div className="space-y-6">
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2, repeatDelay: 2 }}
          className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto border border-primary/20"
        >
          <Bell size={48} />
        </motion.div>
        <div className="space-y-3">
          <h2 className="text-2xl font-display font-bold">Não perca o ritmo</h2>
          <p className="text-muted-foreground text-sm px-6 leading-relaxed">
            Receba lembretes para fazer check-in, alertas de novos desafios e avisos importantes da comunidade.
          </p>
        </div>
      </div>

      <div className="w-full space-y-3">
        <Button
          className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20"
          onClick={requestNotifications}
          data-testid="button-onboarding-notifications"
        >
          Ativar Notificações
        </Button>
        <Button variant="ghost" className="w-full text-muted-foreground" onClick={onNext}>
          Pular
        </Button>
      </div>
    </motion.div>
  );
};

const Final = ({ onComplete }: { onComplete: () => void }) => (
  <motion.div {...slideIn} className="flex flex-col items-center text-center h-full justify-between py-8">
    <div />

    <div className="space-y-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
        className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mx-auto border border-green-500/20"
      >
        <CheckCircle2 size={48} />
      </motion.div>

      <div className="space-y-2">
        <h2 className="text-3xl font-display font-bold">Tudo pronto!</h2>
        <p className="text-muted-foreground text-base px-4">Sua jornada para a consistência começa agora.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 mx-2 text-left">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Users size={20} />
          </div>
          <div>
            <p className="font-bold text-sm">Convide amigos</p>
            <p className="text-[10px] text-muted-foreground">Treinar com amigos é 3x mais eficaz</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full h-10 font-bold rounded-xl border-primary/30 text-primary hover:bg-primary/5 text-xs"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: "Convite FitStake",
                text: "Entre no FitStake comigo! Desafios esportivos com dinheiro real.",
                url: window.location.origin,
              }).catch(() => {});
            }
          }}
          data-testid="button-share-invite"
        >
          <ExternalLink size={14} className="mr-2" /> Compartilhar Link
        </Button>
      </div>
    </div>

    <Button
      className="w-full h-14 text-lg font-bold rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20"
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
  const totalSteps = 7;

  const next = () => {
    if (step < totalSteps) setStep(step + 1);
    else setLocation("/dashboard");
  };

  const back = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="h-[100dvh] max-w-md mx-auto flex flex-col p-6 relative overflow-hidden bg-background">
      <div className="absolute top-[-15%] right-[-15%] w-[350px] h-[350px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[250px] h-[250px] rounded-full bg-primary/3 blur-[100px] pointer-events-none" />

      <div className="flex items-center justify-between mb-4 z-10 shrink-0">
        {step > 1 && step < totalSteps ? (
          <button onClick={back} className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors" data-testid="button-onboarding-back">
            <ChevronLeft size={22} />
          </button>
        ) : (
          <div className="w-10" />
        )}

        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <motion.div
              key={i}
              layout
              className={`h-1.5 rounded-full transition-colors duration-300 ${
                i + 1 === step
                  ? "w-8 bg-primary shadow-[0_0_8px_rgba(34,197,94,0.4)]"
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
          {step === 1 && <Welcome key="1" onNext={next} />}
          {step === 2 && <HowItWorks key="2" onNext={next} />}
          {step === 3 && <Stats key="3" onNext={next} />}
          {step === 4 && <Personalization key="4" onNext={next} />}
          {step === 5 && <InstallPWA key="5" onNext={next} />}
          {step === 6 && <NotificationsStep key="6" onNext={next} />}
          {step === 7 && <Final key="7" onComplete={next} />}
        </AnimatePresence>
      </div>
    </div>
  );
}
