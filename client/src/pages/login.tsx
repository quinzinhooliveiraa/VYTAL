import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Activity, Apple, X, CheckCircle2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  
  const { login, register } = useAuth();

  const handleAuth = async () => {
    setError("");
    
    if (!email.trim() || !email.includes("@")) {
      setError("Por favor, insira um e-mail válido.");
      return;
    }
    if (!password.trim() || password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    try {
      if (isLogin) {
        await login.mutateAsync({ email, password });
        localStorage.setItem("fitstake-onboarding-done", "true");
        setLocation("/dashboard");
      } else {
        if (!name.trim()) {
          setError("Insira seu nome.");
          return;
        }
        if (!username.trim() || username.length < 3) {
          setError("Username deve ter pelo menos 3 caracteres.");
          return;
        }
        await register.mutateAsync({ email, password, name, username });
        setLocation("/onboarding");
      }
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("Email já")) setError("Este email já está cadastrado.");
      else if (msg.includes("Username já")) setError("Este username já está em uso.");
      else if (msg.includes("inválidos")) setError("Email ou senha incorretos.");
      else setError(isLogin ? "Erro ao fazer login. Verifique seus dados." : "Erro ao criar conta.");
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col p-6 items-center justify-center bg-background relative">
      <div className="w-full max-w-md space-y-8 z-0">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary border border-primary/20 shadow-xl shadow-primary/5">
            <Activity size={40} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-display font-bold text-center" data-testid="text-title">
            {isLogin ? "Bem-vindo de volta!" : "Crie sua conta"}
          </h1>
          <p className="text-muted-foreground text-center">
            {isLogin ? "Entre para continuar seus desafios." : "Comece a ser pago pela sua consistência."}
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <Input 
                  placeholder="Seu nome completo"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-14 rounded-2xl bg-card border-border shadow-sm px-4"
                  data-testid="input-name"
                />
                <Input 
                  placeholder="Username (ex: joao_silva)"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="h-14 rounded-2xl bg-card border-border shadow-sm px-4"
                  data-testid="input-username"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <Input 
            placeholder="Seu e-mail" 
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-14 rounded-2xl bg-card border-border shadow-sm px-4"
            data-testid="input-email"
          />
          
          <div className="relative">
            <Input 
              placeholder="Senha"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAuth()}
              className="h-14 rounded-2xl bg-card border-border shadow-sm px-4 pr-12"
              data-testid="input-password"
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm"
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </motion.div>
          )}

          <Button 
            className="w-full h-14 text-lg font-bold rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20"
            onClick={handleAuth}
            disabled={login.isPending || register.isPending}
            data-testid="button-submit"
          >
            {(login.isPending || register.isPending) ? (
              <div className="w-6 h-6 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              isLogin ? "Entrar" : "Criar Conta"
            )}
          </Button>
        </div>

        <div className="text-center pt-4">
          <button 
            className="text-sm font-bold text-primary hover:underline"
            onClick={() => { setIsLogin(!isLogin); setError(""); }}
            data-testid="button-toggle-mode"
          >
            {isLogin ? "Não tem uma conta? Cadastre-se" : "Já tem uma conta? Entre aqui"}
          </button>
        </div>
      </div>
    </div>
  );
}
