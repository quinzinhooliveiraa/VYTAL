import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
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
  BellRing,
  FileText,
  Lock,
  Eye,
  Scale,
  Sparkles,
  Star,
  Heart,
  Target,
  Flame,
  Dumbbell,
  Timer,
  Wifi,
  WifiOff,
  Check,
  X,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePwaInstall } from "@/hooks/use-pwa-install";

const slideIn = {
  initial: { opacity: 0, x: 30, scale: 0.98 },
  animate: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, x: -30, scale: 0.98, transition: { duration: 0.15 } },
};

const FloatingParticle = ({ delay, x, size = 4, color = "bg-primary/20" }: { delay: number; x: string; size?: number; color?: string }) => (
  <motion.div
    className={`absolute rounded-full ${color} pointer-events-none`}
    style={{ width: size, height: size, left: x, bottom: "-5%" }}
    animate={{ y: [0, -600], opacity: [0, 0.8, 0.8, 0], x: [0, Math.random() * 40 - 20] }}
    transition={{ duration: 4 + Math.random() * 2, delay, repeat: Infinity, ease: "easeOut" }}
  />
);

const PulseRing = ({ delay = 0, size = "w-32 h-32" }: { delay?: number; size?: string }) => (
  <motion.div
    className={`absolute ${size} rounded-full border border-primary/20 pointer-events-none`}
    initial={{ scale: 0.8, opacity: 0.6 }}
    animate={{ scale: 2, opacity: 0 }}
    transition={{ duration: 3, delay, repeat: Infinity, ease: "easeOut" }}
  />
);

const AnimatedCounter = ({ target, duration = 2 }: { target: number; duration?: number }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(count, target, { duration });
    const unsub = rounded.on("change", (v) => setDisplay(v));
    return () => { controls.stop(); unsub(); };
  }, [target, duration]);

  return <>{display}</>;
};

const LegalTerms = ({ onNext }: { onNext: () => void }) => {
  const [accepted, setAccepted] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const sections = [
    {
      id: "uso",
      icon: FileText,
      title: "Termos de Uso",
      color: "text-blue-500 bg-blue-500/10",
      summary: "Regras gerais de uso da plataforma VYTAL",
      content: "Ao usar o VYTAL, você concorda com nossas regras de participação em desafios, sistema de check-in por câmera ao vivo, e distribuição de prêmios. Participantes devem ter 18 anos ou mais. A plataforma cobra uma taxa operacional de 10% sobre o pote final de cada desafio. É proibido o uso de fraudes, fotos de galeria ou qualquer artifício para burlar o sistema de verificação.",
    },
    {
      id: "privacidade",
      icon: Lock,
      title: "Política de Privacidade",
      color: "text-purple-500 bg-purple-500/10",
      summary: "Como tratamos seus dados pessoais",
      content: "Coletamos dados como nome, e-mail, localização (GPS para check-ins) e imagens de câmera para verificação de atividades. Seus dados são protegidos conforme a LGPD (Lei Geral de Proteção de Dados). Não compartilhamos informações pessoais com terceiros sem seu consentimento. Você pode solicitar a exclusão dos seus dados a qualquer momento.",
    },
    {
      id: "financeiro",
      icon: Scale,
      title: "Termos Financeiros",
      color: "text-green-500 bg-green-500/10",
      summary: "Regras sobre depósitos, saques e prêmios",
      content: "Os depósitos são feitos via Pix e são utilizados exclusivamente para formação do pote de prêmios dos desafios. Saques são processados em até 3 dias úteis. Em caso de desistência, o valor depositado é redistribuído entre os participantes que completarem o desafio. A VYTAL não é uma plataforma de apostas — é um sistema de accountability financeira.",
    },
    {
      id: "imagem",
      icon: Eye,
      title: "Uso de Imagem",
      color: "text-orange-500 bg-orange-500/10",
      summary: "Consentimento para câmera e check-ins",
      content: "Ao participar dos desafios, você autoriza o uso da câmera do dispositivo para check-ins ao vivo. As imagens são utilizadas exclusivamente para verificação de atividade e moderação comunitária. Suas fotos de check-in podem ser visualizadas por outros participantes do mesmo desafio para fins de validação.",
    },
  ];

  return (
    <motion.div {...slideIn} className="flex flex-col h-full justify-between">
      <div className="space-y-4 flex-1 overflow-y-auto pb-4">
        <div className="space-y-2 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto border border-primary/20"
          >
            <Shield size={32} />
          </motion.div>
          <h2 className="text-2xl font-display font-bold">Termos e Condições</h2>
          <p className="text-sm text-muted-foreground px-2">
            Para sua segurança, leia e aceite nossos termos antes de continuar.
          </p>
        </div>

        <div className="space-y-2">
          {sections.map((section, i) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
            >
              <button
                className="w-full text-left p-3.5 bg-card border border-border rounded-2xl transition-all hover:border-primary/30"
                onClick={() => setExpanded(expanded === section.id ? null : section.id)}
                data-testid={`button-terms-${section.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${section.color}`}>
                    <section.icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm">{section.title}</h3>
                    <p className="text-[11px] text-muted-foreground">{section.summary}</p>
                  </div>
                  <motion.div animate={{ rotate: expanded === section.id ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={16} className="text-muted-foreground" />
                  </motion.div>
                </div>
              </button>
              <AnimatePresence>
                {expanded === section.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 py-3 text-xs text-muted-foreground leading-relaxed bg-muted/30 rounded-b-2xl -mt-2 border border-t-0 border-border">
                      {section.content}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
            accepted
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/30"
          }`}
          onClick={() => setAccepted(!accepted)}
          data-testid="button-accept-terms"
        >
          <motion.div
            animate={accepted ? { scale: [1, 1.3, 1], backgroundColor: "hsl(var(--primary))" } : { scale: 1 }}
            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              accepted ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}
          >
            {accepted && <Check size={14} strokeWidth={3} />}
          </motion.div>
          <p className="text-sm text-left">
            Li e aceito os <strong>Termos de Uso</strong>, <strong>Política de Privacidade</strong> e demais condições acima.
          </p>
        </motion.button>
      </div>

      <Button
        className="w-full h-14 text-lg font-bold rounded-2xl shrink-0 mt-4 shadow-xl shadow-primary/20"
        onClick={onNext}
        disabled={!accepted}
        data-testid="button-onboarding-terms-accept"
      >
        Aceitar e Continuar <ArrowRight className="ml-2" size={18} />
      </Button>
    </motion.div>
  );
};

const Welcome = ({ onNext }: { onNext: () => void }) => (
  <motion.div {...slideIn} className="flex flex-col items-center text-center h-full justify-between py-6 relative overflow-hidden">
    <FloatingParticle delay={0} x="10%" size={6} color="bg-primary/30" />
    <FloatingParticle delay={1.5} x="80%" size={4} color="bg-green-500/20" />
    <FloatingParticle delay={3} x="50%" size={5} color="bg-yellow-500/20" />
    <FloatingParticle delay={0.8} x="30%" size={3} color="bg-blue-500/20" />
    <FloatingParticle delay={2.2} x="70%" size={7} color="bg-primary/15" />
    <FloatingParticle delay={4} x="20%" size={4} color="bg-purple-500/20" />

    <div />

    <div className="space-y-6">
      <div className="relative flex items-center justify-center">
        <PulseRing delay={0} />
        <PulseRing delay={1} />
        <PulseRing delay={2} />
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 180, damping: 12 }}
          className="w-28 h-28 bg-primary/10 rounded-[2.5rem] flex items-center justify-center text-primary border border-primary/20 shadow-2xl shadow-primary/10 relative z-10"
        >
          <Activity size={56} strokeWidth={2} />
        </motion.div>
        <motion.div
          className="absolute -top-2 -right-2 z-20"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.25, type: "spring" }}
        >
          <Sparkles size={20} className="text-yellow-500" />
        </motion.div>
      </div>

      <div className="space-y-3">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-4xl font-display font-bold leading-[1.1]"
        >
          Seja pago por ser{" "}
          <span className="text-primary relative inline-block">
            consistente.
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.25, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute bottom-0 left-0 right-0 h-1.5 bg-primary/30 rounded-full origin-left"
            />
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground text-base px-2 leading-relaxed"
        >
          Desafios esportivos com dinheiro real. Quem desiste, paga. Quem persiste, lucra.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-center gap-4 pt-2"
      >
        {[
          { icon: Trophy, label: "Prêmios", color: "text-yellow-500" },
          { icon: Target, label: "Metas", color: "text-blue-500" },
          { icon: Users, label: "Comunidade", color: "text-purple-500" },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 + i * 0.15, type: "spring" }}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center">
              <item.icon size={18} className={item.color} />
            </div>
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{item.label}</span>
          </motion.div>
        ))}
      </motion.div>
    </div>

    <div className="w-full space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button
          className="w-full h-14 text-lg font-bold rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20 relative overflow-hidden group"
          onClick={onNext}
          data-testid="button-onboarding-start"
        >
          <motion.div
            className="absolute inset-0 bg-white/10"
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
          />
          Começar Jornada
        </Button>
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-widest"
      >
        VYTAL Accountability System
      </motion.p>
    </div>
  </motion.div>
);

const HowItWorks = ({ onNext }: { onNext: () => void }) => (
  <motion.div {...slideIn} className="flex flex-col h-full justify-between">
    <div className="space-y-5 flex-1 overflow-y-auto pb-4">
      <div className="space-y-1 text-center">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "3rem" }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="h-1 bg-primary rounded-full mx-auto mb-3"
        />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Como funciona</p>
        <h2 className="text-2xl font-display font-bold">Entenda o Jogo</h2>
      </div>

      <div className="space-y-3 relative">
        <div className="absolute left-[27px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-yellow-500/30 via-purple-500/30 to-primary/30 rounded-full" />

        {[
          { icon: Zap, color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20", title: "Aposte em você", text: "Deposite via Pix (ex: R$ 50). Seu dinheiro + o dos outros formam o pote de prêmio." },
          { icon: Calendar, color: "text-blue-500 bg-blue-500/10 border-blue-500/20", title: "Cumpra a meta", text: "Seja consistente (ex: 5 treinos/semana). Se não bater a meta, você é eliminado." },
          { icon: Camera, color: "text-purple-500 bg-purple-500/10 border-purple-500/20", title: "Check-in ao vivo", text: "Prove que treinou com nossa câmera. Sem foto da galeria — só ao vivo com GPS." },
          { icon: Shield, color: "text-orange-500 bg-orange-500/10 border-orange-500/20", title: "Moderação", text: "A comunidade valida os check-ins. Quem trapaceia é banido." },
          { icon: Trophy, color: "text-primary bg-primary/10 border-primary/20", title: "Lucre!", text: "Quem persiste divide o dinheiro dos desistentes. Você sai no lucro!" },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.1, duration: 0.4 }}
            className="flex gap-3 p-4 bg-card border border-border rounded-2xl items-start relative"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 300 }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${item.color}`}
            >
              <item.icon size={20} />
            </motion.div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm mb-0.5">{item.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
            </div>
            <div className="absolute -right-1 -top-1">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground"
              >
                {i + 1}
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-3 bg-red-500/5 border border-red-500/15 rounded-xl text-center"
      >
        <p className="text-[10px] text-red-500/80 font-medium flex items-center justify-center gap-1.5">
          <AlertTriangle size={12} />
          Taxa de 10% sobre o pote final para custos de operação.
        </p>
      </motion.div>
    </div>

    <Button className="w-full h-14 text-lg font-bold rounded-2xl shrink-0 mt-4 shadow-xl shadow-primary/20" onClick={onNext} data-testid="button-onboarding-rules">
      Entendi <ArrowRight className="ml-2" size={18} />
    </Button>
  </motion.div>
);

const Stats = ({ onNext }: { onNext: () => void }) => (
  <motion.div {...slideIn} className="flex flex-col items-center text-center h-full justify-between py-6 relative">
    <FloatingParticle delay={0} x="15%" size={5} color="bg-green-500/20" />
    <FloatingParticle delay={2} x="85%" size={6} color="bg-primary/20" />
    <FloatingParticle delay={1} x="45%" size={4} color="bg-yellow-500/15" />

    <div />

    <div className="space-y-8">
      <div className="relative flex items-center justify-center">
        <PulseRing delay={0} size="w-24 h-24" />
        <PulseRing delay={1.5} size="w-24 h-24" />
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary border border-primary/20 relative z-10"
        >
          <TrendingUp size={40} />
        </motion.div>
      </div>

      <div className="space-y-6">
        <div>
          <motion.p
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="text-6xl font-display font-bold text-primary"
          >
            <AnimatedCounter target={83} />%
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg font-medium mt-2 px-6"
          >
            dos nossos usuários mantêm a sequência por mais de <strong>30 dias</strong>.
          </motion.p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "2.4k", label: "Usuários ativos", icon: Users, color: "text-blue-500" },
            { value: "R$ 340k", label: "Distribuídos", icon: Trophy, color: "text-yellow-500" },
            { value: "4.8★", label: "Avaliação", icon: Star, color: "text-orange-500" },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.12, type: "spring" }}
              className="bg-card border border-border rounded-2xl p-3 relative overflow-hidden"
            >
              <motion.div
                className="absolute top-1 right-1 opacity-10"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }}
              >
                <s.icon size={24} className={s.color} />
              </motion.div>
              <p className="text-lg font-display font-bold relative z-10">{s.value}</p>
              <p className="text-[9px] text-muted-foreground font-medium relative z-10">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1 }}
      className="w-full"
    >
      <Button className="w-full h-14 text-lg font-bold rounded-2xl mt-8 shadow-xl shadow-primary/20" onClick={onNext} data-testid="button-onboarding-stats">
        Quero fazer parte <ArrowRight className="ml-2" size={18} />
      </Button>
    </motion.div>
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

  const goalOptions = [
    { label: "Perda de Peso", emoji: "🔥", icon: Flame, color: "from-orange-500/20 to-red-500/20" },
    { label: "Hipertrofia", emoji: "💪", icon: Dumbbell, color: "from-blue-500/20 to-indigo-500/20" },
    { label: "Cardio", emoji: "🏃", icon: Heart, color: "from-pink-500/20 to-rose-500/20" },
    { label: "Disciplina", emoji: "🎯", icon: Target, color: "from-purple-500/20 to-violet-500/20" },
  ];

  return (
    <motion.div {...slideIn} className="flex flex-col h-full justify-between">
      <div className="space-y-6 flex-1">
        <div className="space-y-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "3rem" }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="h-1 bg-primary rounded-full"
          />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Personalização</p>
          <h2 className="text-2xl font-display font-bold">Sobre você</h2>
          <p className="text-sm text-muted-foreground">Precisamos de algumas informações para personalizar sua experiência.</p>
        </div>

        <div className="space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Seu nome</Label>
            <div className="relative">
              <Input
                placeholder="Nome completo"
                className="h-12 rounded-xl text-base pl-4 pr-10"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="input-onboarding-name"
              />
              {name.trim() && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500"
                >
                  <CheckCircle2 size={18} />
                </motion.div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="space-y-2"
          >
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Qual seu foco?</Label>
            <div className="grid grid-cols-2 gap-2">
              {goalOptions.map((o, i) => {
                const selected = goals.includes(o.label);
                return (
                  <motion.button
                    key={o.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.08 }}
                    whileTap={{ scale: 0.95 }}
                    className={`h-14 rounded-xl text-sm font-bold border transition-all relative overflow-hidden ${
                      selected
                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                        : "bg-card border-border hover:border-primary/40"
                    }`}
                    onClick={() => {
                      if (selected) setGoals(goals.filter((g) => g !== o.label));
                      else setGoals([...goals, o.label]);
                    }}
                    data-testid={`button-goal-${o.label}`}
                  >
                    {selected && (
                      <motion.div
                        layoutId={`goal-bg-${o.label}`}
                        className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"
                      />
                    )}
                    <span className="relative z-10 flex items-center justify-center gap-1.5">
                      {o.emoji} {o.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          className="w-full h-14 text-lg font-bold rounded-2xl mt-6 shrink-0 shadow-xl shadow-primary/20"
          onClick={handleNext}
          disabled={!name.trim()}
          data-testid="button-onboarding-personalize"
        >
          Continuar <ArrowRight className="ml-2" size={18} />
        </Button>
      </motion.div>
    </motion.div>
  );
};

const InstallPWA = ({ onNext }: { onNext: () => void }) => {
  const { canInstall, isInstalled, install, isIOS } = usePwaInstall();
  const [showContinue, setShowContinue] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    if (isInstalled) {
      setShowContinue(true);
      setCountdown(0);
      return;
    }
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowContinue(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isInstalled]);

  const handleInstall = async () => {
    if (canInstall) {
      setInstalling(true);
      await install();
      setInstalling(false);
      setShowContinue(true);
      setCountdown(0);
    }
  };

  const benefits = [
    { icon: Zap, title: "Acesso instantâneo", desc: "Abra direto da tela inicial", color: "text-yellow-500 bg-yellow-500/10" },
    { icon: Bell, title: "Notificações push", desc: "Nunca perca um check-in", color: "text-blue-500 bg-blue-500/10" },
    { icon: Wifi, title: "Funciona offline", desc: "Acesse mesmo sem internet", color: "text-green-500 bg-green-500/10" },
    { icon: Timer, title: "Mais rápido", desc: "Performance nativa", color: "text-purple-500 bg-purple-500/10" },
  ];

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isAndroid = !isIOS && /android/i.test(ua);
  const isChrome = /chrome/i.test(ua) && !/edg/i.test(ua);
  const isFirefox = /firefox/i.test(ua);
  const isSamsung = /samsungbrowser/i.test(ua);
  const isEdge = /edg/i.test(ua);
  const isOpera = /opr\//i.test(ua);

  const getBrowserName = () => {
    if (isSamsung) return "Samsung Internet";
    if (isOpera) return "Opera";
    if (isEdge) return "Edge";
    if (isFirefox) return "Firefox";
    if (isChrome) return "Chrome";
    return "navegador";
  };

  const getMenuInstruction = () => {
    if (isSamsung) return "Toque no ícone de 3 linhas (☰) no canto inferior direito";
    if (isOpera) return "Toque no ícone de 3 pontos no canto inferior direito";
    if (isFirefox) return "Toque no ícone de 3 pontos (⋮) no canto inferior direito";
    if (isEdge) return "Toque no ícone de 3 pontos (⋯) na barra inferior";
    return "Toque nos 3 pontos (⋮) no canto superior direito";
  };

  const getInstallLabel = () => {
    if (isSamsung) return '"Adicionar página a" → "Tela inicial"';
    if (isFirefox) return '"Instalar" no banner ou menu';
    if (isEdge) return '"Adicionar ao telefone"';
    if (isOpera) return '"Tela inicial" no menu';
    return '"Instalar aplicativo" ou "Adicionar à tela inicial"';
  };

  return (
    <motion.div {...slideIn} className="flex flex-col h-full justify-between py-4">
      <div className="space-y-5 flex-1 overflow-y-auto">
        <div className="text-center space-y-4">
          <div className="relative flex items-center justify-center">
            <PulseRing delay={0} size="w-24 h-24" />
            <PulseRing delay={1.5} size="w-24 h-24" />
            <motion.div
              initial={{ y: -10 }}
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="w-20 h-20 bg-primary/10 rounded-[1.8rem] flex items-center justify-center text-primary border border-primary/20 shadow-2xl shadow-primary/10 relative z-10"
            >
              {isInstalled ? <Check size={40} strokeWidth={3} /> : <Smartphone size={40} />}
              {isInstalled && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center border-2 border-background"
                >
                  <Check size={14} className="text-white" strokeWidth={3} />
                </motion.div>
              )}
            </motion.div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-display font-bold">
              {isInstalled ? "App instalado!" : "Instale o VYTAL"}
            </h2>
            <p className="text-muted-foreground text-sm px-4 leading-relaxed">
              {isInstalled
                ? "Você já tem o VYTAL instalado. Tudo pronto para começar!"
                : "Para a melhor experiência, instale o app na sua tela inicial."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {benefits.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="bg-card border border-border rounded-xl p-3 flex flex-col items-center text-center gap-2"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${b.color}`}>
                <b.icon size={18} />
              </div>
              <div>
                <p className="text-xs font-bold">{b.title}</p>
                <p className="text-[10px] text-muted-foreground">{b.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {!isInstalled && canInstall && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              className="w-full h-14 text-lg font-bold rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20"
              onClick={handleInstall}
              disabled={installing}
              data-testid="button-install-pwa"
            >
              {installing ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                  <Download size={20} className="mr-2" />
                </motion.div>
              ) : (
                <Download className="mr-2" size={20} />
              )}
              {installing ? "Instalando..." : "Instalar App Agora"}
            </Button>
          </motion.div>
        )}

        {!isInstalled && isIOS && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card border border-primary/20 rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center gap-2 justify-center">
              <div className="w-6 h-6 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Smartphone size={14} className="text-blue-500" />
              </div>
              <p className="text-sm font-bold">Como instalar no iPhone / iPad</p>
            </div>

            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0 relative border border-blue-500/20">
                  <ExternalLink size={20} />
                  <span className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-primary text-[10px] text-primary-foreground font-bold rounded-full flex items-center justify-center shadow-sm">1</span>
                </div>
                <div>
                  <p className="text-sm font-bold">Toque no botão de Compartilhar</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">O ícone de quadrado com seta na barra inferior do Safari</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 shrink-0 relative border border-green-500/20">
                  <Plus size={20} />
                  <span className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-primary text-[10px] text-primary-foreground font-bold rounded-full flex items-center justify-center shadow-sm">2</span>
                </div>
                <div>
                  <p className="text-sm font-bold">"Adicionar à Tela de Início"</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Role para baixo no menu e toque nesta opção</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1 }}
                className="flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 shrink-0 relative border border-yellow-500/20">
                  <CheckCircle2 size={20} />
                  <span className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-primary text-[10px] text-primary-foreground font-bold rounded-full flex items-center justify-center shadow-sm">3</span>
                </div>
                <div>
                  <p className="text-sm font-bold">Toque em "Adicionar"</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Confirme e o VYTAL aparecerá na sua tela inicial</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {!isInstalled && !isIOS && !canInstall && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card border border-primary/20 rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center gap-2 justify-center">
              <div className="w-6 h-6 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Smartphone size={14} className="text-blue-500" />
              </div>
              <p className="text-sm font-bold">Como instalar via {getBrowserName()}</p>
            </div>

            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0 relative border border-blue-500/20">
                  <ExternalLink size={20} />
                  <span className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-primary text-[10px] text-primary-foreground font-bold rounded-full flex items-center justify-center shadow-sm">1</span>
                </div>
                <div>
                  <p className="text-sm font-bold">Abra o menu do {getBrowserName()}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{getMenuInstruction()}</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 shrink-0 relative border border-green-500/20">
                  <Download size={20} />
                  <span className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-primary text-[10px] text-primary-foreground font-bold rounded-full flex items-center justify-center shadow-sm">2</span>
                </div>
                <div>
                  <p className="text-sm font-bold">Toque em {getInstallLabel()}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Procure essa opção no menu que abriu</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1 }}
                className="flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 shrink-0 relative border border-yellow-500/20">
                  <CheckCircle2 size={20} />
                  <span className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-primary text-[10px] text-primary-foreground font-bold rounded-full flex items-center justify-center shadow-sm">3</span>
                </div>
                <div>
                  <p className="text-sm font-bold">Confirme a instalação</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">O VYTAL aparecerá na sua tela inicial como um app</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="w-full space-y-3 shrink-0 mt-4">
        {!showContinue && countdown > 0 && (
          <p className="text-center text-[11px] text-muted-foreground">
            Leia as instruções acima — continuar em {countdown}s
          </p>
        )}
        <AnimatePresence>
          {showContinue && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Button
                className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20"
                onClick={onNext}
                data-testid="button-onboarding-install-next"
              >
                {isInstalled ? "Continuar" : "Continuar sem instalar"} <ArrowRight className="ml-2" size={18} />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const NotificationsStep = ({ onNext }: { onNext: () => void }) => {
  const [permState, setPermState] = useState<"default" | "granted" | "denied" | "unsupported">(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission === "default" ? "default" : Notification.permission as "granted" | "denied"
      : "unsupported"
  );
  const [requesting, setRequesting] = useState(false);
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    if (permState !== "default") return;
    const timer = setTimeout(() => setShowSkip(true), 6000);
    return () => clearTimeout(timer);
  }, [permState]);

  const requestNotifications = async () => {
    if (!("Notification" in window)) {
      setPermState("unsupported");
      return;
    }

    setRequesting(true);
    try {
      const result = await Notification.requestPermission();
      setPermState(result as "granted" | "denied");

      if (result === "granted") {
        const { subscribeToPush, sendTestPush } = await import("@/lib/push-notifications");
        await subscribeToPush();
        await sendTestPush();

        setTimeout(() => onNext(), 1500);
      }
    } catch (e) {
      setPermState("denied");
    }
    setRequesting(false);
  };

  const notifFeatures = [
    { icon: Timer, title: "Lembretes de check-in", desc: "Nunca esqueça de registrar seu treino", color: "text-blue-500 bg-blue-500/10" },
    { icon: Trophy, title: "Novos desafios", desc: "Seja o primeiro a entrar", color: "text-yellow-500 bg-yellow-500/10" },
    { icon: Users, title: "Atualizações do grupo", desc: "Veja quem está treinando", color: "text-purple-500 bg-purple-500/10" },
    { icon: Zap, title: "Resultados", desc: "Saiba quando ganhou prêmios", color: "text-green-500 bg-green-500/10" },
  ];

  return (
    <motion.div {...slideIn} className="flex flex-col h-full justify-between py-4">
      <div className="space-y-5 flex-1 overflow-y-auto">
        <div className="text-center space-y-4">
          <div className="relative flex items-center justify-center">
            <PulseRing delay={0} size="w-24 h-24" />
            <PulseRing delay={1.5} size="w-24 h-24" />
            <motion.div
              animate={permState === "granted" ? { scale: [1, 1.1, 1] } : { rotate: [0, -12, 12, -12, 0] }}
              transition={permState === "granted" ? { duration: 0.5 } : { repeat: Infinity, duration: 2, repeatDelay: 2 }}
              className={`w-20 h-20 rounded-full flex items-center justify-center border relative z-10 ${
                permState === "granted"
                  ? "bg-green-500/10 text-green-500 border-green-500/20"
                  : permState === "denied"
                  ? "bg-red-500/10 text-red-500 border-red-500/20"
                  : "bg-primary/10 text-primary border-primary/20"
              }`}
            >
              {permState === "granted" ? <CheckCircle2 size={40} /> : permState === "denied" ? <X size={40} /> : <BellRing size={40} />}
            </motion.div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-display font-bold">
              {permState === "granted" ? "Notificações ativadas!" : permState === "denied" ? "Notificações bloqueadas" : "Ative as notificações"}
            </h2>
            <p className="text-muted-foreground text-sm px-4 leading-relaxed">
              {permState === "granted"
                ? "Perfeito! Você receberá todos os alertas importantes."
                : permState === "denied"
                ? "Você pode ativar depois nas configurações do navegador."
                : "Sem notificações você pode perder check-ins, prazos de desafios e prêmios."}
            </p>
          </div>
        </div>

        {permState === "default" && (
          <>
            <div className="grid grid-cols-2 gap-2">
              {notifFeatures.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="bg-card border border-border rounded-xl p-3 flex flex-col items-center text-center gap-2"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${f.color}`}>
                    <f.icon size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold">{f.title}</p>
                    <p className="text-[10px] text-muted-foreground">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle size={16} className="text-yellow-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-yellow-600 dark:text-yellow-400">Importante</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Ao clicar, seu dispositivo vai pedir permissão. Toque em "Permitir" para receber alertas.</p>
              </div>
            </motion.div>
          </>
        )}

        {permState === "denied" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 text-center space-y-2"
          >
            <p className="text-sm font-bold text-red-500">Permissão negada</p>
            <p className="text-xs text-muted-foreground">Para ativar depois, vá nas configurações do navegador e permita notificações para este site.</p>
          </motion.div>
        )}

        {permState === "granted" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/5 border border-green-500/20 rounded-2xl p-4 text-center space-y-2"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
              className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto"
            >
              <Bell size={24} className="text-green-500" />
            </motion.div>
            <p className="text-sm font-bold text-green-600">Tudo configurado!</p>
            <p className="text-xs text-muted-foreground">Enviamos uma notificação de teste para confirmar.</p>
          </motion.div>
        )}
      </div>

      <div className="w-full space-y-3 shrink-0 mt-4">
        {permState === "default" && (
          <>
            <Button
              className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 relative overflow-hidden"
              onClick={requestNotifications}
              disabled={requesting}
              data-testid="button-onboarding-notifications"
            >
              {requesting ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                  <Bell size={20} className="mr-2" />
                </motion.div>
              ) : (
                <Bell size={20} className="mr-2" />
              )}
              {requesting ? "Aguardando permissão..." : "Ativar Notificações"}
            </Button>
            <AnimatePresence>
              {showSkip && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                  <Button variant="ghost" className="w-full text-muted-foreground text-sm" onClick={onNext}>
                    Continuar sem notificações
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
        {(permState === "granted" || permState === "denied" || permState === "unsupported") && (
          <Button
            className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20"
            onClick={onNext}
            data-testid="button-onboarding-notifications-next"
          >
            Continuar <ArrowRight className="ml-2" size={18} />
          </Button>
        )}
      </div>
    </motion.div>
  );
};

const Final = ({ onComplete }: { onComplete: () => void }) => (
  <motion.div {...slideIn} className="flex flex-col items-center text-center h-full justify-between py-6 relative">
    <FloatingParticle delay={0} x="10%" size={5} color="bg-green-500/20" />
    <FloatingParticle delay={1} x="90%" size={4} color="bg-primary/20" />
    <FloatingParticle delay={2} x="50%" size={6} color="bg-yellow-500/15" />
    <FloatingParticle delay={0.5} x="30%" size={3} color="bg-blue-500/20" />
    <FloatingParticle delay={1.5} x="70%" size={5} color="bg-purple-500/20" />

    <div />

    <div className="space-y-6">
      <div className="relative flex items-center justify-center">
        <PulseRing delay={0} size="w-28 h-28" />
        <PulseRing delay={1} size="w-28 h-28" />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 border border-green-500/20 relative z-10"
        >
          <CheckCircle2 size={48} />
        </motion.div>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute -top-1 right-[calc(50%-60px)] z-20"
        >
          <Sparkles size={20} className="text-yellow-500" />
        </motion.div>
      </div>

      <div className="space-y-2">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-3xl font-display font-bold"
        >
          Tudo pronto!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground text-base px-4"
        >
          Sua jornada para a consistência começa agora.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-card border border-border rounded-2xl p-4 mx-2 text-left"
      >
        <div className="flex items-center gap-3 mb-3">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"
          >
            <Users size={20} />
          </motion.div>
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
                title: "Convite VYTAL",
                text: "Entre no VYTAL comigo! Desafios esportivos com dinheiro real.",
                url: window.location.origin,
              }).catch(() => {});
            }
          }}
          data-testid="button-share-invite"
        >
          <ExternalLink size={14} className="mr-2" /> Compartilhar Link
        </Button>
      </motion.div>
    </div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1 }}
      className="w-full"
    >
      <Button
        className="w-full h-14 text-lg font-bold rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20 relative overflow-hidden"
        onClick={() => {
          localStorage.setItem("fitstake-onboarding-done", "true");
          onComplete();
        }}
        data-testid="button-onboarding-complete"
      >
        <motion.div
          className="absolute inset-0 bg-white/10"
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
        />
        Explorar Desafios <ArrowRight className="ml-2" size={18} />
      </Button>
    </motion.div>
  </motion.div>
);

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const totalSteps = 8;

  const next = () => {
    if (step < totalSteps) setStep(step + 1);
    else setLocation("/dashboard");
  };

  const back = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="h-[100dvh] max-w-md mx-auto flex flex-col p-6 relative overflow-hidden bg-background">
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-15%] right-[-15%] w-[350px] h-[350px] rounded-full bg-primary/5 blur-[120px] pointer-events-none"
      />
      <motion.div
        animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] left-[-10%] w-[250px] h-[250px] rounded-full bg-primary/3 blur-[100px] pointer-events-none"
      />

      <div className="flex items-center justify-between mb-4 z-10 shrink-0">
        {step > 1 && step < totalSteps ? (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={back}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
            data-testid="button-onboarding-back"
          >
            <ChevronLeft size={22} />
          </motion.button>
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
          {step === 1 && <LegalTerms key="1" onNext={next} />}
          {step === 2 && <InstallPWA key="2" onNext={next} />}
          {step === 3 && <Welcome key="3" onNext={next} />}
          {step === 4 && <HowItWorks key="4" onNext={next} />}
          {step === 5 && <Stats key="5" onNext={next} />}
          {step === 6 && <Personalization key="6" onNext={next} />}
          {step === 7 && <NotificationsStep key="7" onNext={next} />}
          {step === 8 && <Final key="8" onComplete={next} />}
        </AnimatePresence>
      </div>
    </div>
  );
}
