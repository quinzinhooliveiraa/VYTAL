import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Activity, Eye, EyeOff, AlertCircle, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = "376587519485-an9p30conn0gk0hoou8a62977cphchan.apps.googleusercontent.com";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [socialLoading, setSocialLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFAUserId, setTwoFAUserId] = useState("");
  const [twoFACode, setTwoFACode] = useState("");
  const [verifying2FA, setVerifying2FA] = useState(false);
  
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
        const result = await login.mutateAsync({ email, password });
        if (result.requires2FA) {
          setRequires2FA(true);
          setTwoFAUserId(result.userId);
          return;
        }
        localStorage.setItem("fitstake-onboarding-done", "true");
        const savedRedirect = sessionStorage.getItem("vytal-redirect");
        sessionStorage.removeItem("vytal-redirect");
        setLocation(savedRedirect || "/dashboard");
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

  const handleVerify2FA = async () => {
    if (twoFACode.length !== 6) return;
    setError("");
    setVerifying2FA(true);
    try {
      const res = await apiRequest("POST", "/api/auth/verify-2fa", { userId: twoFAUserId, token: twoFACode });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Código inválido");
      }
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      localStorage.setItem("fitstake-onboarding-done", "true");
      const savedRedirect = sessionStorage.getItem("vytal-redirect");
      sessionStorage.removeItem("vytal-redirect");
      setLocation(savedRedirect || "/dashboard");
    } catch (err: any) {
      setError(err.message || "Código 2FA inválido.");
    } finally {
      setVerifying2FA(false);
    }
  };

  const handleGoogleCallback = useCallback(async (response: any) => {
    if (!response.credential) return;
    setSocialLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro na autenticação");
      
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      localStorage.setItem("fitstake-onboarding-done", "true");
      const savedRedirect = sessionStorage.getItem("vytal-redirect");
      sessionStorage.removeItem("vytal-redirect");
      setLocation(data.isNew ? "/onboarding" : (savedRedirect || "/dashboard"));
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login com Google");
    } finally {
      setSocialLoading(false);
    }
  }, [setLocation]);

  useEffect(() => {
    if (!window.google) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCallback,
      use_fedcm_for_prompt: false,
    });

    if (googleBtnRef.current) {
      googleBtnRef.current.innerHTML = "";
      const containerWidth = googleBtnRef.current.offsetWidth || 400;
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        width: containerWidth,
        text: "continue_with",
        logo_alignment: "center",
      });
      setGoogleReady(true);
    }
  }, [handleGoogleCallback, isLogin]);

  if (requires2FA) {
    return (
      <div className="min-h-[100dvh] flex flex-col p-6 items-center justify-center bg-background relative">
        <div className="w-full max-w-md space-y-8 z-0">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary border border-primary/20 shadow-xl shadow-primary/5">
              <ShieldCheck size={40} strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-display font-bold text-center" data-testid="text-2fa-title">
              Verificação 2FA
            </h1>
            <p className="text-muted-foreground text-center text-sm">
              Digite o código de 6 dígitos do seu app de autenticação.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <Input
              value={twoFACode}
              onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="text-center text-3xl font-mono tracking-[0.5em] h-16 rounded-2xl bg-card border-border shadow-sm"
              maxLength={6}
              inputMode="numeric"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleVerify2FA()}
              data-testid="input-2fa-login-code"
            />

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
              onClick={handleVerify2FA}
              disabled={twoFACode.length !== 6 || verifying2FA}
              data-testid="button-verify-2fa-login"
            >
              {verifying2FA ? (
                <div className="w-6 h-6 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                "Verificar"
              )}
            </Button>

            <button
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => { setRequires2FA(false); setTwoFACode(""); setError(""); }}
              data-testid="button-back-to-login"
            >
              <ArrowLeft size={14} className="inline mr-1" /> Voltar ao login
            </button>
          </div>
        </div>
      </div>
    );
  }

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

        <div className="space-y-3 pt-2">
          {!googleReady && (
            <div className="w-full h-[48px] rounded-xl border border-border bg-white dark:bg-muted flex items-center justify-center gap-3 text-sm font-medium text-muted-foreground opacity-50">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuar com Google
            </div>
          )}

          <div
            ref={googleBtnRef}
            className={`w-full rounded-xl overflow-hidden [&>div]:!w-full [&>div>div]:!w-full [&_iframe]:!w-full [&_iframe]:!rounded-xl [&_iframe]:!h-[48px] ${googleReady ? "" : "h-0 overflow-hidden"}`}
            data-testid="button-google-login"
          />

        </div>

        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-medium">ou com email</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="space-y-4">
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
