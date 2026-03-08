import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Activity, Apple } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [isLogin, setIsLogin] = useState(true);

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

  return (
    <div className="min-h-[100dvh] flex flex-col p-6 items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8">
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

          <Button variant="outline" className="w-full h-14 rounded-xl font-bold flex gap-3 border-border">
            <Apple size={20} fill="currentColor" /> {isLogin ? "Entrar" : "Criar conta"} com Apple
          </Button>
          <Button variant="outline" className="w-full h-14 rounded-xl font-bold flex gap-3 border-border">
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
    </div>
  );
}