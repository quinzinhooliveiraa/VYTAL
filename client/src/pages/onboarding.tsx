import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, CheckCircle2, Activity } from "lucide-react";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
    else setLocation("/dashboard");
  };

  return (
    <div className="min-h-[100dvh] max-w-md mx-auto flex flex-col justify-between p-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-primary/20 blur-[100px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[250px] h-[250px] rounded-full bg-blue-500/10 blur-[100px]" />

      <div className="flex-1 flex flex-col justify-center relative z-10 pt-12">
        <div className="mb-12 flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground">
            <Activity size={24} strokeWidth={3} />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight">FitStake</span>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h1 className="text-4xl font-bold leading-tight">
                  Commit.<br/>
                  Sweat.<br/>
                  <span className="text-primary text-glow">Earn.</span>
                </h1>
                <p className="text-muted-foreground text-lg">
                  Join fitness challenges, stake your money via Pix, and win the prize pool by completing your goals.
                </p>
              </div>

              <div className="space-y-4 pt-8">
                <Button 
                  className="w-full h-14 text-lg font-semibold rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={nextStep}
                  data-testid="button-get-started"
                >
                  Get Started
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full h-14 text-lg rounded-2xl"
                  onClick={() => setLocation("/dashboard")}
                  data-testid="button-login"
                >
                  I already have an account
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
              className="space-y-6"
            >
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">Create Account</h1>
                <p className="text-muted-foreground">Basic info to track your progress.</p>
              </div>

              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input placeholder="John Doe" className="h-14 bg-white/5 border-white/10 rounded-xl px-4" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="john@example.com" className="h-14 bg-white/5 border-white/10 rounded-xl px-4" />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" placeholder="••••••••" className="h-14 bg-white/5 border-white/10 rounded-xl px-4" />
                </div>
              </div>

              <Button 
                className="w-full h-14 text-lg font-semibold rounded-2xl mt-8"
                onClick={nextStep}
                data-testid="button-continue-signup"
              >
                Continue <ArrowRight className="ml-2" size={20} />
              </Button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">Verify Identity</h1>
                <p className="text-muted-foreground">We need your CPF to process Pix deposits and withdrawals securely.</p>
              </div>

              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input placeholder="000.000.000-00" className="h-14 bg-white/5 border-white/10 rounded-xl px-4 font-mono text-lg tracking-wider" />
                </div>
                
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex gap-3 items-start mt-6">
                  <CheckCircle2 className="text-primary shrink-0 mt-0.5" size={20} />
                  <p className="text-sm text-primary/90">
                    Your data is encrypted and only used for financial transactions according to BACEN regulations.
                  </p>
                </div>
              </div>

              <Button 
                className="w-full h-14 text-lg font-semibold rounded-2xl mt-8"
                onClick={nextStep}
                data-testid="button-complete-kyc"
              >
                Complete Setup
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress Dots */}
      <div className="flex justify-center gap-2 pb-6 z-10">
        {[1, 2, 3].map((i) => (
          <div 
            key={i} 
            className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-primary' : 'w-2 bg-white/20'}`}
          />
        ))}
      </div>
    </div>
  );
}