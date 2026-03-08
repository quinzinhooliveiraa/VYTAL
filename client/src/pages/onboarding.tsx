import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  ArrowRight, 
  Users, 
  CheckCircle2, 
  Bell, 
  Apple, 
  Mail, 
  Share2, 
  TrendingUp,
  Activity,
  ChevronLeft,
  Calendar,
  Zap,
  Camera
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// --- Step Components ---

const Welcome = ({ onNext }: { onNext: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
    className="flex flex-col items-center text-center space-y-8"
  >
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="w-32 h-32 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-primary/20"
    >
      <img 
        src="/onboarding-hero-fitness.png" 
        alt="Pessoa exercitando" 
        className="w-full h-full object-cover"
      />
    </motion.div>
    <div className="space-y-4">
      <h1 className="text-4xl font-display font-bold leading-tight">
        Seja pago por ser <span className="text-primary">Consistente.</span>
      </h1>
      <p className="text-muted-foreground text-lg px-4">
        O FitStake recompensa sua disciplina através de desafios sociais e compromisso financeiro.
      </p>
    </div>
    <Button className="w-full h-16 text-lg font-bold rounded-2xl bg-primary text-primary-foreground mt-12 shadow-lg shadow-primary/20" onClick={onNext}>
      Começar Jornada
    </Button>
  </motion.div>
);

const ValueProp = ({ onNext }: { onNext: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
    className="space-y-8"
  >
    <div className="space-y-4 text-center">
      <Badge className="bg-primary/10 text-primary border-primary/20 mb-2">Mentalidade</Badge>
      <h2 className="text-3xl font-display font-bold italic">"Consistência vence a motivação."</h2>
    </div>
    
    <div className="bg-card border border-border rounded-3xl p-6 h-48 flex items-end justify-between relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
      {[40, 30, 55, 45, 70, 60, 90].map((h, i) => (
        <motion.div 
          key={i}
          initial={{ height: 0 }} animate={{ height: `${h}%` }}
          transition={{ delay: i * 0.1 }}
          className="w-8 bg-primary rounded-t-lg shadow-lg shadow-primary/10"
        />
      ))}
    </div>
    <p className="text-muted-foreground text-center">
      Criamos o ambiente perfeito para você manter o ritmo a longo prazo, não apenas por uma semana.
    </p>
    <Button className="w-full h-16 text-lg font-bold rounded-2xl" onClick={onNext}>
      Entendi <ArrowRight className="ml-2" />
    </Button>
  </motion.div>
);

const SocialProof = ({ onNext }: { onNext: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
    className="space-y-8 text-center"
  >
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="w-32 h-32 rounded-full overflow-hidden shadow-2xl border-4 border-primary/20 mx-auto"
    >
      <img 
        src="/onboarding-hero-community.png" 
        alt="Comunidade exercitando" 
        className="w-full h-full object-cover"
      />
    </motion.div>
    <div className="space-y-4">
      <h2 className="text-5xl font-display font-bold text-primary">83%</h2>
      <p className="text-xl font-medium px-4">
        Dos nossos usuários mantêm sua sequência por mais de 30 dias.
      </p>
      <p className="text-muted-foreground">
        Junte-se a milhares de pessoas que decidiram não falhar mais consigo mesmas.
      </p>
    </div>
    <Button className="w-full h-16 text-lg font-bold rounded-2xl" onClick={onNext}>
      Quero fazer parte
    </Button>
  </motion.div>
);

const HowItWorks = ({ onNext }: { onNext: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
    className="space-y-8"
  >
    <h2 className="text-3xl font-display font-bold text-center">Como funciona?</h2>
    <div className="space-y-4">
      {[
        { icon: Zap, title: "Entre em um Desafio", text: "Escolha uma meta e faça seu depósito Pix." },
        { icon: Camera, title: "Envie Provas", text: "Tire fotos BeReal dos seus treinos diariamente." },
        { icon: Trophy, title: "Ganhe Recompensas", text: "Mantenha o foco e divida o pote dos desistentes." }
      ].map((item, i) => (
        <div key={i} className="flex gap-4 p-4 bg-card border border-border rounded-2xl items-center">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
            <item.icon size={24} />
          </div>
          <div>
            <h3 className="font-bold text-sm">{item.title}</h3>
            <p className="text-xs text-muted-foreground">{item.text}</p>
          </div>
        </div>
      ))}
    </div>
    <Button className="w-full h-16 text-lg font-bold rounded-2xl" onClick={onNext}>
      Continuar
    </Button>
  </motion.div>
);

const Personalization = ({ onNext }: { onNext: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
    className="space-y-6"
  >
    <div className="space-y-2">
      <h2 className="text-3xl font-display font-bold">Conte sobre você</h2>
      <p className="text-muted-foreground">Isso ajuda a personalizar sua experiência.</p>
    </div>
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Nome</Label>
        <Input placeholder="Seu nome" className="h-14 rounded-xl" />
      </div>
      <div className="space-y-2">
        <Label>Objetivo Principal</Label>
        <div className="grid grid-cols-2 gap-2">
          {["Perder Peso", "Ganhar Músculo", "Saúde Mental", "Consistência"].map(o => (
            <Button key={o} variant="outline" className="h-12 rounded-xl text-xs">{o}</Button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Treinos por semana</Label>
        <div className="flex justify-between gap-2">
          {[3, 4, 5, 7].map(n => (
            <Button key={n} variant="outline" className="flex-1 h-12 rounded-xl">{n}x</Button>
          ))}
        </div>
      </div>
    </div>
    <Button className="w-full h-16 text-lg font-bold rounded-2xl mt-4" onClick={onNext}>
      Salvar Perfil
    </Button>
  </motion.div>
);

const Notifications = ({ onNext }: { onNext: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
    className="space-y-8 text-center py-12"
  >
    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto animate-bounce shadow-xl shadow-primary/5">
      <Bell size={48} />
    </div>
    <div className="space-y-4">
      <h2 className="text-3xl font-display font-bold">Não perca o ritmo</h2>
      <p className="text-muted-foreground px-4 text-lg">
        Lembretes diários para você nunca esquecer sua sequência de treinos.
      </p>
    </div>
    <Button className="w-full h-16 text-lg font-bold rounded-2xl mt-8 shadow-lg shadow-primary/20" onClick={onNext}>
      Ativar Notificações
    </Button>
    <Button variant="ghost" className="w-full" onClick={onNext}>Pular por enquanto</Button>
  </motion.div>
);

const Auth = ({ onNext }: { onNext: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
    className="space-y-8"
  >
    <div className="space-y-2 text-center">
      <h2 className="text-3xl font-display font-bold">Crie sua conta</h2>
      <p className="text-muted-foreground">Salve seu progresso e histórico.</p>
    </div>
    <div className="space-y-3 pt-4">
      <Button variant="outline" className="w-full h-14 rounded-xl font-bold flex gap-3 border-border">
        <Apple size={20} fill="currentColor" /> Continuar com Apple
      </Button>
      <Button variant="outline" className="w-full h-14 rounded-xl font-bold flex gap-3 border-border">
        <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="" /> Continuar com Google
      </Button>
      <Button variant="outline" className="w-full h-14 rounded-xl font-bold flex gap-3 border-border" onClick={onNext}>
        <Mail size={20} /> Continuar com Email
      </Button>
    </div>
    <p className="text-[10px] text-center text-muted-foreground px-8 leading-relaxed">
      Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade.
    </p>
  </motion.div>
);

const Final = ({ onComplete }: { onComplete: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
    className="space-y-8 flex flex-col items-center text-center justify-center h-full"
  >
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="w-32 h-32 rounded-full overflow-hidden shadow-2xl border-4 border-primary/20"
    >
      <img 
        src="/onboarding-hero-success.png" 
        alt="Celebração de sucesso" 
        className="w-full h-full object-cover"
      />
    </motion.div>
    <div className="space-y-2">
      <h2 className="text-3xl font-display font-bold">Tudo pronto!</h2>
      <p className="text-muted-foreground text-lg">Sua jornada para a consistência começa agora.</p>
    </div>
    <div className="w-full space-y-3 pt-8">
      <Button className="w-full h-16 text-lg font-bold rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20" onClick={onComplete}>
        Explorar Desafios
      </Button>
      <Button variant="outline" className="w-full h-16 text-lg font-bold rounded-2xl border-border" onClick={onComplete}>
        Convidar Amigo
      </Button>
    </div>
  </motion.div>
);

// --- Main Container ---

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
    <div className="min-h-[100dvh] max-w-md mx-auto flex flex-col p-6 relative overflow-hidden bg-background">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
      
      {/* Header with Back & Progress */}
      <div className="flex items-center justify-between mb-8 z-10">
        {step > 1 && step < totalSteps ? (
          <button onClick={back} className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
            <ChevronLeft size={24} />
          </button>
        ) : <div className="w-10" />}
        
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i + 1 === step ? 'w-8 bg-primary shadow-[0_0_8px_rgba(34,197,94,0.4)]' : i + 1 < step ? 'w-1.5 bg-primary/40' : 'w-1.5 bg-muted'
              }`}
            />
          ))}
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex flex-col justify-center relative z-10">
        <AnimatePresence mode="wait">
          {step === 1 && <Welcome key="1" onNext={next} />}
          {step === 2 && <ValueProp key="2" onNext={next} />}
          {step === 3 && <SocialProof key="3" onNext={next} />}
          {step === 4 && <HowItWorks key="4" onNext={next} />}
          {step === 5 && <Personalization key="5" onNext={next} />}
          {step === 6 && <Notifications key="6" onNext={next} />}
          {step === 7 && <Auth key="7" onNext={next} />}
          {step === 8 && <Final key="8" onComplete={next} />}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      {step === 1 && (
        <div className="pb-6 text-center space-y-2 opacity-50 z-10">
          <p className="text-[10px] font-bold uppercase tracking-widest">FitStake Accountability System</p>
        </div>
      )}
    </div>
  );
}