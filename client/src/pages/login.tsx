import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Activity, Apple, X, CheckCircle2 } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  
  // Modal states for fake oauth
  const [showOAuth, setShowOAuth] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<"apple" | "google">("google");
  const [oauthStep, setOauthStep] = useState<"loading" | "account" | "success">("loading");

  const handleAuth = () => {
    if (!email.trim() || !email.includes("@")) {
       alert("Por favor, insira um e-mail válido.");
       return;
    }
    localStorage.setItem("fitstake-user-email", email);
    
    if (isLogin) {
      localStorage.setItem("fitstake-onboarding-done", "true");
      setLocation("/dashboard");
    } else {
      setLocation("/onboarding");
    }
  };

  const startSocialAuth = (provider: "apple" | "google") => {
    setOauthProvider(provider);
    setShowOAuth(true);
    setOauthStep("loading");
    
    // Simulate network delay to show the provider's screen
    setTimeout(() => {
      setOauthStep("account");
    }, 800);
  };

  const confirmSocialAuth = () => {
    setOauthStep("success");
    
    setTimeout(() => {
      localStorage.setItem("fitstake-user-email", `usuario@${oauthProvider}.com`);
      if (isLogin) {
        localStorage.setItem("fitstake-onboarding-done", "true");
        setLocation("/dashboard");
      } else {
        setLocation("/onboarding");
      }
    }, 1000);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col p-6 items-center justify-center bg-background relative">
      <div className="w-full max-w-md space-y-8 z-0">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary border border-primary/20 shadow-xl shadow-primary/5">
            <Activity size={40} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-display font-bold text-center">
            {isLogin ? "Bem-vindo de volta!" : "Crie sua conta"}
          </h1>
          <p className="text-muted-foreground text-center">
            {isLogin ? "Entre para continuar seus desafios." : "Comece a ser pago pela sua consistência."}
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <Input 
            placeholder="Seu e-mail" 
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-14 rounded-2xl bg-card border-border shadow-sm px-4"
          />
          <Button 
            className="w-full h-14 text-lg font-bold rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20"
            onClick={handleAuth}
          >
            {isLogin ? "Entrar" : "Criar Conta"}
          </Button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted-foreground">ou continue com</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full h-14 rounded-xl font-bold flex gap-3 border-border"
            onClick={() => startSocialAuth("apple")}
          >
            <Apple size={20} fill="currentColor" /> {isLogin ? "Entrar" : "Criar conta"} com Apple
          </Button>
          <Button 
            variant="outline" 
            className="w-full h-14 rounded-xl font-bold flex gap-3 border-border"
            onClick={() => startSocialAuth("google")}
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="" /> {isLogin ? "Entrar" : "Criar conta"} com Google
          </Button>
        </div>

        <div className="text-center pt-4">
          <button 
            className="text-sm font-bold text-primary hover:underline"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Não tem uma conta? Cadastre-se" : "Já tem uma conta? Entre aqui"}
          </button>
        </div>
      </div>

      {/* Fake OAuth Modal */}
      <AnimatePresence>
        {showOAuth && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-end sm:justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-background sm:rounded-[2rem] rounded-t-[2rem] overflow-hidden shadow-2xl"
            >
              {/* Fake Browser Header */}
              <div className="bg-muted px-4 py-3 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-2">
                  {oauthProvider === "apple" ? <Apple size={16} /> : <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="" />}
                  <span className="text-xs font-medium text-muted-foreground">
                    {oauthProvider === "apple" ? "apple.com" : "accounts.google.com"}
                  </span>
                </div>
                <button onClick={() => setShowOAuth(false)} className="p-1 rounded-full bg-background/50 hover:bg-background">
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-8 min-h-[350px] flex flex-col items-center justify-center">
                {oauthStep === "loading" && (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-muted-foreground text-sm font-medium">Conectando a {oauthProvider === "apple" ? "Apple" : "Google"}...</p>
                  </div>
                )}

                {oauthStep === "account" && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full space-y-6"
                  >
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 bg-muted rounded-full mx-auto flex items-center justify-center mb-4">
                        {oauthProvider === "apple" ? <Apple size={32} /> : <img src="https://www.google.com/favicon.ico" className="w-8 h-8" alt="" />}
                      </div>
                      <h3 className="font-display font-bold text-xl">Fazer login no FitStake</h3>
                      <p className="text-sm text-muted-foreground">Escolha uma conta para continuar</p>
                    </div>

                    <div className="space-y-3">
                      <button 
                        onClick={confirmSocialAuth}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center font-bold text-primary">
                          V
                        </div>
                        <div>
                          <p className="font-bold">Você (Teste)</p>
                          <p className="text-xs text-muted-foreground">usuario@{oauthProvider}.com</p>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}

                {oauthStep === "success" && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center space-y-4 text-center"
                  >
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                      <CheckCircle2 size={32} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-xl">Sucesso!</h3>
                      <p className="text-sm text-muted-foreground">Redirecionando...</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}