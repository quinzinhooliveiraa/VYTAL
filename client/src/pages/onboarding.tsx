import { useState, useEffect } from "react";
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
    <div className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary border border-primary/20 shadow-xl shadow-primary/5">
      <Activity size={48} strokeWidth={2.5} />
    </div>
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
    
    <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
      <div className="flex justify-between items-end gap-3">
        {[
          { week: "S1", value: 45, label: "início" },
          { week: "S2", value: 60, label: "consistência" },
          { week: "S3", value: 55, label: "comprometido" },
          { week: "S4", value: 70, label: "forte" },
          { week: "S5", value: 65, label: "dedicado" },
          { week: "S6", value: 80, label: "disciplinado" },
          { week: "S7", value: 90, label: "campeão" }
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-2 flex-1">
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: `${item.value * 1.5}px`, opacity: 1 }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="w-full bg-gradient-to-t from-primary to-primary/70 rounded-t-lg shadow-lg shadow-primary/20 relative"
            >
              <motion.div 
                className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-primary whitespace-nowrap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 + 0.4 }}
              >
                {item.value}%
              </motion.div>
            </motion.div>
            <p className="text-[9px] font-bold text-muted-foreground">{item.week}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground pt-2 border-t border-border">
        <span>Progressão de 7 Semanas</span>
        <span className="font-bold text-primary">Média: 67%</span>
      </div>
    </div>
    <p className="text-muted-foreground text-center">
      Veja como nossos usuários mantêm consistência: treinos diários, provas registradas, sequência garantida.
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
    <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 mx-auto border border-blue-500/20">
      <Users size={40} />
    </div>
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
    className="space-y-6"
  >
    <div className="space-y-2 text-center">
      <h2 className="text-3xl font-display font-bold">Entenda o Jogo</h2>
      <p className="text-muted-foreground text-sm">O FitStake usa psicologia comportamental e risco financeiro para garantir sua constância.</p>
    </div>
    
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 pb-4">
      {[
        { 
          icon: Zap, 
          title: "1. A Regra do Pix (Skin in the game)", 
          text: "Você não entra de graça. Você aposta em você mesmo fazendo um depósito via Pix (ex: R$50). Esse dinheiro seu, junto com o dos outros, forma o 'Pote de Prêmio'." 
        },
        { 
          icon: Calendar, 
          title: "2. Consistência é Tudo", 
          text: "Você DEVE cumprir a meta do desafio (ex: 5 treinos na semana). Se faltar 1 dia e não atingir a meta semanal, você é ELIMINADO e perde o que pagou." 
        },
        { 
          icon: Camera, 
          title: "3. Check-in Antifraude", 
          text: "Para provar que treinou, você usa nossa câmera embutida (estilo BeReal). Não é possível enviar foto da galeria. A câmera captura o momento ao vivo e a sua localização GPS exata." 
        },
        {
          icon: Users,
          title: "4. Moderação Comunitária",
          text: "Todos podem ver os check-ins uns dos outros. Se alguém postar foto fake, a comunidade vota para invalidar. Quem trapaceia é banido do desafio."
        },
        { 
          icon: Trophy, 
          title: "5. A Divisão do Lucro", 
          text: "Quem for disciplinado e chegar até o fim, recupera o seu dinheiro e AINDA divide TODO o dinheiro das pessoas que desistiram ou falharam. Você sai no lucro!" 
        }
      ].map((item, i) => (
        <div key={i} className="flex gap-4 p-4 bg-card border border-border rounded-2xl items-start shadow-sm">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 mt-1">
            <item.icon size={24} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-primary mb-1">{item.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
          </div>
        </div>
      ))}
    </div>
    
    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
      <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mb-1">Aviso Importante</p>
      <p className="text-xs text-red-400">O app cobra 10% de taxa sobre o pote final para cobrir custos de operação, saques e moderação.</p>
    </div>

    <Button className="w-full h-16 text-lg font-bold rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 shrink-0" onClick={onNext}>
      Entendi as Regras <ArrowRight className="ml-2" />
    </Button>
  </motion.div>
);

const Personalization = ({ onNext }: { onNext: () => void }) => {
  const [level, setLevel] = useState(50);
  const [name, setName] = useState(localStorage.getItem("fitstake-user-name") || "");
  const [goals, setGoals] = useState<string[]>([]);

  const handleNext = () => {
    if (name.trim()) localStorage.setItem("fitstake-user-name", name.trim());
    localStorage.setItem("fitstake-user-goals", JSON.stringify(goals));
    onNext();
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <h2 className="text-3xl font-display font-bold">Inteligência do App</h2>
        <p className="text-muted-foreground text-sm">Nosso algoritmo precisa conhecer você para recomendar desafios e calcular probabilidades de sucesso.</p>
      </div>
      
      <div className="space-y-5 pt-4 bg-card border border-border p-5 rounded-3xl shadow-sm">
        <div className="space-y-2">
          <Label className="text-xs font-bold text-primary uppercase tracking-widest">Identidade</Label>
          <Input 
            placeholder="Seu nome real completo" 
            className="h-12 rounded-xl" 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <p className="text-[10px] text-muted-foreground">Usamos nomes reais para manter a comunidade autêntica e inibir fraudes.</p>
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs font-bold text-primary uppercase tracking-widest">Nível de Atividade Atual</Label>
          <div className="pt-4 pb-2">
            <input 
              type="range" 
              min="0" max="100" 
              value={level} 
              onChange={(e) => setLevel(parseInt(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
          <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
            <span>Sedentário</span>
            <span className="text-primary">{level < 30 ? "Iniciante" : level < 70 ? "Intermediário" : "Avançado"}</span>
            <span>Atleta</span>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-border">
          <Label className="text-xs font-bold text-primary uppercase tracking-widest">Foco Principal do Algoritmo</Label>
          <div className="grid grid-cols-2 gap-2">
            {["Perda de Peso", "Hipertrofia", "Cardio/Endurance", "Hábito/Disciplina"].map(o => (
              <Button 
                key={o} 
                variant={goals.includes(o) ? "default" : "outline"} 
                className={`h-10 rounded-xl text-[10px] font-bold ${goals.includes(o) ? '' : 'border-border/60 hover:bg-primary/5 hover:border-primary/30 hover:text-primary'}`}
                onClick={() => {
                  if (goals.includes(o)) {
                    setGoals(goals.filter(g => g !== o));
                  } else {
                    setGoals([...goals, o]);
                  }
                }}
              >
                {o}
              </Button>
            ))}
          </div>
        </div>
      </div>
      
      <Button className="w-full h-16 text-lg font-bold rounded-2xl mt-4 bg-primary text-primary-foreground shadow-lg shadow-primary/20" onClick={handleNext}>
        Otimizar Algoritmo <Zap size={18} className="ml-2" />
      </Button>
    </motion.div>
  );
};

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

const Final = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const shareData = {
      title: 'Convite FitStake',
      text: 'Crie sua conta no FitStake com meu link e ganhe R$ 10 de bônus no seu primeiro desafio!',
      url: 'https://fitstake.app/invite/alex_costa'
    };
    if (navigator.share) {
      setTimeout(() => navigator.share(shareData).catch(console.error), 800);
    }
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="space-y-8 flex flex-col items-center text-center justify-center h-full"
    >
      <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-4 border border-green-500/20">
        <CheckCircle2 size={48} />
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-display font-bold">Tudo pronto!</h2>
        <p className="text-muted-foreground text-lg">Sua jornada para a consistência começa agora.</p>
      </div>
      <div className="w-full space-y-3 pt-8">
        <Button className="w-full h-16 text-lg font-bold rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20" onClick={() => {
          localStorage.setItem("fitstake-onboarding-done", "true");
          onComplete();
        }}>
          Explorar Desafios
        </Button>
        <div className="bg-card border border-border rounded-2xl p-4 text-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Users size={20} />
            </div>
            <div>
              <p className="font-bold text-sm">Treinar com amigos é 3x mais eficaz</p>
              <p className="text-[10px] text-muted-foreground leading-tight">Envie seu link. Se seu amigo criar uma conta através dele, ambos ganham R$ 10 de bônus no primeiro desafio.</p>
            </div>
          </div>
          <Button variant="outline" className="w-full h-12 font-bold rounded-xl border-primary text-primary hover:bg-primary/5" onClick={() => {
            const shareData = {
              title: 'Convite FitStake',
              text: 'Crie sua conta no FitStake com meu link e ganhe R$ 10 de bônus no seu primeiro desafio!',
              url: 'https://fitstake.app/invite/alex_costa'
            };
            if (navigator.share) {
              navigator.share(shareData).catch(console.error);
            } else {
              alert("Link copiado! Seu amigo precisa baixar o app e criar a conta pelo seu link para vocês ganharem o bônus.");
            }
          }}>
            Compartilhar Link de Convite
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

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