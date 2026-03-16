import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Trophy,
  Camera,
  TrendingUp,
  Wallet,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Clock,
  Users,
  Zap,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "vytal-quick-start-seen";

interface QuickStartGuideProps {
  onClose?: () => void;
  forceShow?: boolean;
}

const steps = [
  {
    id: "join",
    icon: Trophy,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
    title: "Entre em um Desafio",
    subtitle: "Escolha e participe",
    items: [
      { icon: Sparkles, text: "Explore desafios na aba Explorar", color: "text-yellow-500 bg-yellow-500/10" },
      { icon: Wallet, text: "Deposite via Pix para entrar", color: "text-green-500 bg-green-500/10" },
      { icon: Users, text: "Quanto mais gente, maior o pote", color: "text-blue-500 bg-blue-500/10" },
    ],
    tip: "Comece com desafios de valor baixo para conhecer a dinâmica!",
  },
  {
    id: "checkin",
    icon: Camera,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    title: "Faça seu Check-in",
    subtitle: "Prove que treinou",
    items: [
      { icon: Camera, text: "Tire uma foto ao vivo da atividade", color: "text-purple-500 bg-purple-500/10" },
      { icon: MapPin, text: "GPS confirma sua localização", color: "text-orange-500 bg-orange-500/10" },
      { icon: Clock, text: "Respeite o prazo diário de check-in", color: "text-red-500 bg-red-500/10" },
    ],
    tip: "Fotos de galeria não são aceitas. A câmera abre ao vivo!",
  },
  {
    id: "track",
    icon: TrendingUp,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    title: "Acompanhe e Lucre",
    subtitle: "Veja seu progresso",
    items: [
      { icon: TrendingUp, text: "Acompanhe seu progresso no painel", color: "text-blue-500 bg-blue-500/10" },
      { icon: CheckCircle2, text: "Quem desiste perde — você ganha!", color: "text-green-500 bg-green-500/10" },
      { icon: Zap, text: "Prêmios vão direto para sua carteira", color: "text-yellow-500 bg-yellow-500/10" },
    ],
    tip: "Mantenha a consistência e divida o pote dos desistentes!",
  },
];

export function QuickStartGuide({ onClose, forceShow }: QuickStartGuideProps) {
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (forceShow) {
      setVisible(true);
      return;
    }
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  const handleClose = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "true");
    onClose?.();
  };

  const goNext = () => {
    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

  if (!visible) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-[101] max-w-md mx-auto"
          >
            <div className="bg-background rounded-t-3xl border border-b-0 border-border shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 pt-5 pb-2">
                <div className="flex items-center gap-2">
                  <motion.div
                    key={step.id + "-badge"}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${step.bg} ${step.color}`}
                  >
                    Passo {currentStep + 1} de {steps.length}
                  </motion.div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 -mr-2 rounded-full hover:bg-muted transition-colors"
                  data-testid="button-close-quickstart"
                >
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>

              <div className="px-5 pb-2 min-h-[320px] flex flex-col">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={step.id}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="flex-1 flex flex-col"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center ${step.bg} border ${step.border}`}
                      >
                        <step.icon size={28} className={step.color} />
                      </motion.div>
                      <div>
                        <h3 className="text-xl font-display font-bold">{step.title}</h3>
                        <p className="text-xs text-muted-foreground">{step.subtitle}</p>
                      </div>
                    </div>

                    <div className="space-y-2.5 mb-4">
                      {step.items.map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.15 + i * 0.1, duration: 0.35 }}
                          className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl"
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                            <item.icon size={17} />
                          </div>
                          <p className="text-sm font-medium">{item.text}</p>
                        </motion.div>
                      ))}
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className={`p-3 rounded-xl ${step.bg} border ${step.border}`}
                    >
                      <p className="text-xs font-medium">
                        <span className={`font-bold ${step.color}`}>Dica: </span>
                        {step.tip}
                      </p>
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="px-5 pb-6 pt-2 flex items-center gap-3">
                {currentStep > 0 ? (
                  <Button
                    variant="outline"
                    onClick={goPrev}
                    className="h-12 px-4 rounded-xl font-bold"
                    data-testid="button-quickstart-prev"
                  >
                    <ChevronLeft size={18} />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={handleClose}
                    className="h-12 px-4 rounded-xl font-bold text-muted-foreground"
                    data-testid="button-quickstart-skip"
                  >
                    Pular
                  </Button>
                )}

                <Button
                  onClick={goNext}
                  className="flex-1 h-12 rounded-xl font-bold text-base shadow-lg shadow-primary/20"
                  data-testid="button-quickstart-next"
                >
                  {isLast ? (
                    <>
                      Começar! <Zap className="ml-2" size={18} />
                    </>
                  ) : (
                    <>
                      Próximo <ChevronRight className="ml-1" size={18} />
                    </>
                  )}
                </Button>
              </div>

              <div className="flex justify-center gap-2 pb-5">
                {steps.map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      width: i === currentStep ? 24 : 8,
                      backgroundColor: i === currentStep
                        ? "hsl(var(--primary))"
                        : i < currentStep
                        ? "hsl(var(--primary) / 0.4)"
                        : "hsl(var(--muted))",
                    }}
                    transition={{ duration: 0.3 }}
                    className="h-2 rounded-full"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function useQuickStartGuide() {
  const hasSeen = localStorage.getItem(STORAGE_KEY) === "true";

  const reset = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  return { hasSeen, reset };
}
