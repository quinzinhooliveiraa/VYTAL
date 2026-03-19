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
  Info,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePwaInstall } from "@/hooks/use-pwa-install";

const pageTransition = {
  initial: { opacity: 0, x: 40, scale: 0.97 },
  animate: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, x: -40, scale: 0.97, transition: { duration: 0.25, ease: "easeIn" } },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
};

const fadeUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 200, damping: 20 } },
};

const Step1Terms = ({ onNext }: { onNext: () => void }) => {
  const [accepted, setAccepted] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const sections = [
    { id: "uso", icon: FileText, title: "Termos de Uso", color: "text-blue-500 bg-blue-500/10", summary: "Regras gerais de uso da plataforma VYTAL", content: "Ao usar o VYTAL, você concorda com nossas regras de participação em desafios, sistema de check-in por câmera ao vivo, e distribuição de prêmios. Participantes devem ter 18 anos ou mais. A plataforma cobra uma taxa operacional de 10% sobre o pote final de cada desafio. É proibido o uso de fraudes, fotos de galeria ou qualquer artifício para burlar o sistema de verificação." },
    { id: "privacidade", icon: Lock, title: "Política de Privacidade", color: "text-purple-500 bg-purple-500/10", summary: "Como tratamos seus dados pessoais", content: "Coletamos dados como nome, e-mail, localização (GPS para check-ins), imagens de câmera para verificação de atividades, e informações técnicas do dispositivo e navegador utilizado (como sistema operacional, tipo de navegador e se o app foi instalado como PWA) para fins de suporte, segurança e melhoria contínua da plataforma. Dados financeiros sensíveis como CPF e telefone são armazenados com criptografia AES-256-GCM — ilegíveis mesmo em caso de acesso não autorizado ao banco de dados. Seus dados são protegidos conforme a LGPD. Não compartilhamos informações pessoais com terceiros sem seu consentimento. Você pode solicitar a exclusão dos seus dados a qualquer momento." },
    { id: "financeiro", icon: Scale, title: "Termos Financeiros", color: "text-green-500 bg-green-500/10", summary: "Regras sobre depósitos, saques e prêmios", content: "Os depósitos são feitos via Pix e são utilizados exclusivamente para formação do pote de prêmios dos desafios. Saques são processados em até 3 dias úteis. Em caso de desistência, o valor depositado é redistribuído entre os participantes que completarem o desafio. A VYTAL não é uma plataforma de apostas — é um sistema de accountability financeira." },
    { id: "imagem", icon: Eye, title: "Uso de Imagem", color: "text-orange-500 bg-orange-500/10", summary: "Consentimento para câmera e check-ins", content: "Ao participar dos desafios, você autoriza o uso da câmera do dispositivo para check-ins ao vivo. As imagens são utilizadas exclusivamente para verificação de atividade e moderação comunitária." },
  ];

  return (
    <motion.div {...pageTransition} className="flex flex-col h-full justify-between">
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3 flex-1 overflow-y-auto pb-4">
        <motion.div variants={fadeUp} className="text-center space-y-1">
          <motion.div variants={scaleIn} className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto border border-primary/20">
            <Shield size={28} />
          </motion.div>
          <h2 className="text-2xl font-display font-bold">Termos e Condições</h2>
          <p className="text-xs text-muted-foreground">Leia e aceite para continuar.</p>
        </motion.div>

        <div className="space-y-2">
          {sections.map((section, i) => (
            <motion.div key={section.id} variants={staggerItem}>
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
                  <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-300 ${expanded === section.id ? "rotate-180" : ""}`} />
                </div>
              </button>
              <AnimatePresence>
                {expanded === section.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
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
          variants={staggerItem}
          className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all ${accepted ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
          onClick={() => setAccepted(!accepted)}
          data-testid="button-accept-terms"
        >
          <motion.div
            animate={accepted ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.3 }}
            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${accepted ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            {accepted && <Check size={14} strokeWidth={3} />}
          </motion.div>
          <p className="text-sm text-left">
            Li e aceito os <strong>Termos de Uso</strong>, <strong>Política de Privacidade</strong> e demais condições.
          </p>
        </motion.button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Button
          className="w-full h-14 text-lg font-bold rounded-2xl shrink-0 shadow-lg shadow-primary/20"
          onClick={onNext}
          disabled={!accepted}
          data-testid="button-onboarding-terms-accept"
        >
          Aceitar e Continuar <ArrowRight className="ml-2" size={18} />
        </Button>
      </motion.div>
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
    <motion.div {...pageTransition} className="flex flex-col h-full justify-between">
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4 flex-1 overflow-y-auto pb-4">
        <motion.div variants={fadeUp} className="text-center space-y-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-16 h-16 rounded-[1.5rem] mx-auto overflow-hidden"
          >
            <img src="/vytal-logo.png" alt="VYTAL" className="w-full h-full object-cover" />
          </motion.div>
          <h2 className="text-2xl font-display font-bold">Como funciona</h2>
          <p className="text-sm text-muted-foreground px-2">
            Desafios esportivos com dinheiro real.<br />Quem desiste, paga. Quem persiste, lucra.
          </p>
        </motion.div>

        <div className="space-y-2.5">
          {steps.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.12, duration: 0.4, ease: "easeOut" }}
              className="flex gap-3 p-3.5 bg-card border border-border rounded-2xl items-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.12, type: "spring", stiffness: 300 }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}
              >
                <item.icon size={20} />
              </motion.div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="p-3 bg-blue-500/5 border border-blue-500/15 rounded-2xl"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <Info size={16} className="text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400">Taxa operacional</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                A VYTAL destina <strong className="text-foreground">10% do pote final</strong> para manutenção e moderação. Os outros <strong className="text-foreground">90% vão para os vencedores</strong>!
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
        <Button
          className="w-full h-14 text-lg font-bold rounded-2xl shrink-0 shadow-lg shadow-primary/20"
          onClick={onNext}
          data-testid="button-onboarding-rules"
        >
          Entendi <ArrowRight className="ml-2" size={18} />
        </Button>
      </motion.div>
    </motion.div>
  );
};

const StepChallengeTypes = ({ onNext }: { onNext: () => void }) => {
  const [selected, setSelected] = useState<number | null>(null);

  const types = [
    {
      icon: Camera,
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
      activeColor: "border-purple-500 bg-purple-500/10",
      title: "Check-in Foto",
      short: "Prove que treinou",
      detail: "Tire uma foto ao vivo no local do treino. Moderadores da comunidade validam a autenticidade — sem foto de galeria.",
    },
    {
      icon: Activity,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      activeColor: "border-blue-500 bg-blue-500/10",
      title: "Corrida / GPS",
      short: "Registre sua distância",
      detail: "O GPS do celular registra o percurso em tempo real. Defina uma distância mínima diária e prove que correu.",
    },
    {
      icon: Trophy,
      color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
      activeColor: "border-yellow-500 bg-yellow-500/10",
      title: "Ranking",
      short: "Compita por posição",
      detail: "Cada check-in acumula pontos. Ao fim do desafio, 1º, 2º e 3º lugar dividem o pote conforme o peso definido.",
    },
    {
      icon: Flame,
      color: "text-red-500 bg-red-500/10 border-red-500/20",
      activeColor: "border-red-500 bg-red-500/10",
      title: "Survival",
      short: "Sem falhas permitidas",
      detail: "Falhou um único dia? Foi eliminado e perdeu o depósito. O último de pé leva o pote inteiro. Alta adrenalina!",
    },
  ];

  return (
    <motion.div {...pageTransition} className="flex flex-col h-full justify-between">
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4 flex-1 overflow-y-auto pb-4">
        <motion.div variants={fadeUp} className="text-center space-y-1">
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto border border-primary/20"
          >
            <Trophy size={28} />
          </motion.div>
          <h2 className="text-2xl font-display font-bold">Tipos de Desafio</h2>
          <p className="text-xs text-muted-foreground">Toque para conhecer cada modalidade</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-2">
          {types.map((t, i) => {
            const isOpen = selected === i;
            return (
              <motion.button
                key={i}
                variants={staggerItem}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelected(isOpen ? null : i)}
                className={`text-left p-3 rounded-2xl border-2 transition-all flex flex-col gap-2 ${isOpen ? t.activeColor : "border-border bg-card hover:border-primary/30"}`}
                data-testid={`button-challenge-type-${i}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${t.color}`}>
                  <t.icon size={18} />
                </div>
                <div>
                  <p className="font-bold text-sm">{t.title}</p>
                  <p className="text-[11px] text-muted-foreground">{t.short}</p>
                </div>
                <AnimatePresence>
                  {isOpen && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-[11px] text-foreground leading-relaxed overflow-hidden"
                    >
                      {t.detail}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-3.5 bg-primary/5 border border-primary/15 rounded-2xl space-y-2"
        >
          <p className="text-xs font-bold text-primary flex items-center gap-1.5">
            <Zap size={13} /> Como funciona o pote
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px] shrink-0">1</span>
              <span>10 pessoas entram × R$50 = <strong className="text-foreground">R$500 no pote</strong></span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-5 h-5 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 font-bold text-[10px] shrink-0">2</span>
              <span>3 pessoas desistem → R$150 fica no pote</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-5 h-5 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500 font-bold text-[10px] shrink-0">3</span>
              <span>7 completam e <strong className="text-foreground">dividem R$450</strong> — cada um sai no lucro!</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="space-y-1.5"
        >
          {[
            { icon: Plus, text: "Crie desafios para seus grupos ou amigos" },
            { icon: Users, text: "Públicos (aparecem no Explorar) ou privados" },
            { icon: CheckCircle2, text: "Prêmio automático via Pix ao finalizar" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 bg-card border border-border rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <item.icon size={14} className="text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">{item.text}</p>
            </div>
          ))}

          <div className="flex items-start gap-3 p-3 bg-blue-500/5 border border-blue-500/15 rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <Calendar size={14} className="text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400">Dias de folga</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">Ao criar o desafio, você define quais dias da semana são folga — fim de semana, por exemplo. Nesses dias ninguém precisa fazer check-in e ninguém é eliminado.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-yellow-500/5 border border-yellow-500/15 rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <Scale size={14} className="text-yellow-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-yellow-600 dark:text-yellow-400">Empate no Ranking</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">Se dois participantes empatarem numa posição premiada, o moderador pode declarar o empate — o prêmio das posições é somado e dividido igualmente entre os empatados.</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
        <Button
          className="w-full h-14 text-lg font-bold rounded-2xl shrink-0 shadow-lg shadow-primary/20"
          onClick={onNext}
          data-testid="button-onboarding-challenge-types"
        >
          Entendi, vamos lá! <ArrowRight className="ml-2" size={18} />
        </Button>
      </motion.div>
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
    <motion.div {...pageTransition} className="flex flex-col h-full justify-between">
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6 flex-1">
        <motion.div variants={fadeUp} className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Personalização</p>
          <h2 className="text-2xl font-display font-bold">Sobre você</h2>
        </motion.div>

        <motion.div variants={staggerItem} className="space-y-2">
          <label className="text-sm font-bold">Como quer ser chamado?</label>
          <Input
            placeholder="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-14 rounded-2xl bg-card border-border shadow-sm px-4 text-base"
            data-testid="input-onboarding-name"
          />
        </motion.div>

        <motion.div variants={staggerItem} className="space-y-3">
          <label className="text-sm font-bold">Seus objetivos <span className="text-muted-foreground font-normal">(opcional)</span></label>
          <div className="grid grid-cols-2 gap-2">
            {goalOptions.map((o, i) => {
              const selected = goals.includes(o.label);
              return (
                <motion.button
                  key={o.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-3.5 rounded-2xl border-2 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                  onClick={() => setGoals(selected ? goals.filter((g) => g !== o.label) : [...goals, o.label])}
                  data-testid={`button-goal-${o.label}`}
                >
                  {o.emoji} {o.label}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Button
          className="w-full h-14 text-lg font-bold rounded-2xl shrink-0 mt-4 shadow-lg shadow-primary/20"
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

const Step4NotifPwa = ({ onNext }: { onNext: () => void }) => {
  const { canInstall, isInstalled, install, isIOS } = usePwaInstall();
  const [installing, setInstalling] = useState(false);
  const [showContinue, setShowContinue] = useState(false);
  const [notifState, setNotifState] = useState<"idle" | "granted" | "denied">(
    typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted" ? "granted" : "idle"
  );

  useEffect(() => {
    const timer = setTimeout(() => setShowContinue(true), 2500);
    return () => clearTimeout(timer);
  }, []);

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
        localStorage.setItem("vytal-notif-prefs", JSON.stringify({
          pushEnabled: true,
          checkinReminders: true,
          challengeUpdates: true,
          challengeResults: true,
          newMessages: true,
          friendActivity: true,
          payments: true,
          promotions: false,
          dailyMotivation: true,
        }));
      }
    } catch {
      setNotifState("denied");
    }
  };

  const showIosInstructions = isIOS && !isInstalled;
  const showAndroidInstructions = !isIOS && !canInstall && !isInstalled;

  return (
    <motion.div {...pageTransition} className="flex flex-col h-full justify-between">
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4 flex-1 overflow-y-auto pb-4">
        <motion.div variants={fadeUp} className="text-center space-y-1">
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto border border-primary/20"
          >
            <Bell size={28} />
          </motion.div>
          <h2 className="text-2xl font-display font-bold">Não perca nada!</h2>
          <p className="text-xs text-muted-foreground">Ative as notificações para receber lembretes de check-in, resultados e prêmios.</p>
        </motion.div>

        <div className="space-y-2.5">
          {notifState === "idle" ? (
            <motion.button
              variants={staggerItem}
              whileTap={{ scale: 0.97 }}
              onClick={handleNotifications}
              className="w-full flex items-center gap-4 p-5 bg-primary/5 border-2 border-primary/30 rounded-2xl text-left hover:border-primary/50 transition-all"
              data-testid="button-onboarding-notifications"
            >
              <motion.div
                animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", repeatDelay: 1 }}
                className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"
              >
                <Bell size={24} className="text-primary" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold">Ativar notificações</p>
                <p className="text-xs text-muted-foreground mt-0.5">Receba lembretes de check-in, resultados de desafios e prêmios.</p>
              </div>
              <ArrowRight size={18} className="text-primary shrink-0" />
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className={`flex items-center gap-3 p-4 rounded-2xl ${
                notifState === "granted" ? "bg-green-500/5 border border-green-500/20" : "bg-muted border border-border"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                notifState === "granted" ? "bg-green-500/10" : "bg-muted"
              }`}>
                {notifState === "granted" ? <Check size={20} className="text-green-500" /> : <Bell size={20} className="text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${notifState === "granted" ? "text-green-600 dark:text-green-400" : ""}`}>
                  {notifState === "granted" ? "Notificações ativadas!" : "Notificações bloqueadas"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {notifState === "granted"
                    ? "Você receberá alertas de check-in e prêmios."
                    : "Você pode ativar depois nas configurações."}
                </p>
              </div>
            </motion.div>
          )}

          {canInstall && !isInstalled && (
            <motion.button
              variants={staggerItem}
              whileTap={{ scale: 0.98 }}
              onClick={handleInstall}
              disabled={installing}
              className="w-full flex items-center gap-3 p-4 bg-card border border-border rounded-2xl text-left hover:border-primary/30 transition-all"
              data-testid="button-install-pwa"
            >
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0"
              >
                <Download size={20} className="text-blue-500" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">{installing ? "Instalando..." : "Instalar na tela inicial"}</p>
                <p className="text-[11px] text-muted-foreground">Acesso rápido como um app nativo</p>
              </div>
              <ArrowRight size={16} className="text-blue-500 shrink-0" />
            </motion.button>
          )}

          {isInstalled && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="flex items-center gap-3 p-4 bg-green-500/5 border border-green-500/20 rounded-2xl"
            >
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                <Check size={20} className="text-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-green-600 dark:text-green-400">App instalado!</p>
                <p className="text-[11px] text-muted-foreground">O VYTAL já está na sua tela inicial.</p>
              </div>
            </motion.div>
          )}

          {showIosInstructions && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="bg-card border border-blue-500/20 rounded-2xl p-4 space-y-3"
            >
              <p className="text-xs font-bold text-center">Como instalar no iPhone / iPad</p>
              <div className="space-y-3">
                {[
                  { n: "1", color: "bg-blue-500/10 text-blue-500", text: <>Toque no botão de <strong className="text-foreground">Compartilhar</strong> (ícone de quadrado com seta) na barra do Safari</> },
                  { n: "2", color: "bg-green-500/10 text-green-500", text: <>Role e toque em <strong className="text-foreground">"Adicionar à Tela de Início"</strong></> },
                  { n: "3", color: "bg-yellow-500/10 text-yellow-500", text: <>Toque em <strong className="text-foreground">"Adicionar"</strong> para confirmar</> },
                ].map((step, i) => (
                  <motion.div
                    key={step.n}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.15 }}
                    className="flex items-start gap-3"
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold ${step.color}`}>{step.n}</div>
                    <p className="text-xs text-muted-foreground">{step.text}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {showAndroidInstructions && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="bg-card border border-blue-500/20 rounded-2xl p-4 space-y-3"
            >
              <p className="text-xs font-bold text-center">Como instalar o app</p>
              <div className="space-y-3">
                {[
                  { n: "1", color: "bg-blue-500/10 text-blue-500", text: <>Toque nos <strong className="text-foreground">3 pontos (⋮)</strong> no canto superior do navegador</> },
                  { n: "2", color: "bg-green-500/10 text-green-500", text: <>Toque em <strong className="text-foreground">"Instalar aplicativo"</strong> ou <strong className="text-foreground">"Adicionar à tela inicial"</strong></> },
                ].map((step, i) => (
                  <motion.div
                    key={step.n}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.15 }}
                    className="flex items-start gap-3"
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold ${step.color}`}>{step.n}</div>
                    <p className="text-xs text-muted-foreground">{step.text}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showContinue && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <Button
              className="w-full h-14 text-lg font-bold rounded-2xl shrink-0 shadow-lg shadow-primary/20"
              onClick={onNext}
              data-testid="button-onboarding-setup-next"
            >
              Continuar <ArrowRight className="ml-2" size={18} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Step5Final = ({ onComplete }: { onComplete: () => void }) => (
  <motion.div {...pageTransition} className="flex flex-col items-center text-center h-full justify-between py-4">
    <div />

    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6 w-full">
      <motion.div variants={scaleIn} className="flex items-center justify-center">
        <motion.div
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(34,197,94,0)",
              "0 0 0 20px rgba(34,197,94,0.1)",
              "0 0 0 40px rgba(34,197,94,0)",
            ],
          }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
          className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 border border-green-500/20"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            <CheckCircle2 size={40} />
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div variants={fadeUp} className="space-y-2">
        <h2 className="text-3xl font-display font-bold">Tudo pronto!</h2>
        <p className="text-muted-foreground text-sm px-4">
          Sua jornada para a consistência começa agora.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="px-2"
      >
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
      </motion.div>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="w-full"
    >
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
  </motion.div>
);

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const totalSteps = 6;

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
            <motion.div
              key={i}
              animate={{
                width: i + 1 === step ? 32 : i + 1 < step ? 12 : 6,
                backgroundColor: i + 1 <= step
                  ? "hsl(var(--primary))"
                  : "hsl(var(--muted))",
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="h-1.5 rounded-full"
              style={{ opacity: i + 1 < step ? 0.5 : 1 }}
            />
          ))}
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex flex-col relative z-10 min-h-0">
        <AnimatePresence mode="wait">
          {step === 1 && <Step1Terms key="1" onNext={next} />}
          {step === 2 && <Step4NotifPwa key="2" onNext={next} />}
          {step === 3 && <Step2HowItWorks key="3" onNext={next} />}
          {step === 4 && <StepChallengeTypes key="4" onNext={next} />}
          {step === 5 && <Step3Personalize key="5" onNext={next} />}
          {step === 6 && <Step5Final key="6" onComplete={next} />}
        </AnimatePresence>
      </div>
    </div>
  );
}
