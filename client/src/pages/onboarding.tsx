import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Trophy } from "lucide-react";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);

  const nextStep = () => {
    if (step < 2) setStep(step + 1);
    else setLocation("/dashboard");
  };

  return (
    <div className="min-h-[100dvh] max-w-md mx-auto flex flex-col p-6 relative overflow-hidden bg-background">
      {/* Background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-primary/10 blur-[100px]" />
      
      <div className="flex-1 flex flex-col justify-center relative z-10 pt-12">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-4 border border-primary/20">
                <Trophy size={40} strokeWidth={2.5} />
              </div>
              
              <div className="space-y-4">
                <h1 className="text-4xl font-display font-bold leading-tight">
                  Sua saúde<br/>
                  Vale <span className="text-primary text-glow">Dinheiro.</span>
                </h1>
                <p className="text-muted-foreground text-lg px-4">
                  Cumpra seus treinos. Prove com fotos. Ganhe parte do prêmio de quem desistir.
                </p>
              </div>

              <div className="w-full space-y-4 pt-12">
                <Button 
                  className="w-full h-14 text-lg font-semibold rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={nextStep}
                  data-testid="button-get-started"
                >
                  Começar Agora
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full h-14 text-lg rounded-2xl text-muted-foreground hover:text-foreground"
                  onClick={() => setLocation("/dashboard")}
                  data-testid="button-login"
                >
                  Já tenho uma conta
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 flex flex-col h-full justify-center pb-20"
            >
              <div className="space-y-2">
                <h1 className="text-3xl font-display font-bold">Crie seu Perfil</h1>
                <p className="text-muted-foreground">Precisamos do seu CPF para saques via Pix.</p>
              </div>

              <div className="space-y-5 pt-6">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input placeholder="Seu nome" className="h-14 rounded-xl px-4" />
                </div>
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input placeholder="000.000.000-00" className="h-14 rounded-xl px-4 font-mono tracking-wider" />
                </div>
                <div className="space-y-2">
                  <Label>Telefone (WhatsApp)</Label>
                  <Input type="tel" placeholder="(11) 90000-0000" className="h-14 rounded-xl px-4" />
                </div>
              </div>

              <Button 
                className="w-full h-14 text-lg font-semibold rounded-2xl mt-auto shadow-lg shadow-primary/20"
                onClick={nextStep}
                data-testid="button-complete-signup"
              >
                Concluir <ArrowRight className="ml-2" size={20} />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}