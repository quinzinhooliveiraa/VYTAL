import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Activity, Eye, EyeOff, AlertCircle, ShieldCheck, ArrowLeft, Mail, KeyRound, CheckCircle2 } from "lucide-react";
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
    AppleID?: {
      auth: {
        init: (config: any) => void;
        signIn: () => Promise<any>;
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

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

  const [forgotMode, setForgotMode] = useState<"off" | "email" | "code" | "newpass" | "done">("off");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  
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
      if (msg.includes("já está cadastrado via")) setError(msg);
      else if (msg.includes("Email já")) setError("Este email já está cadastrado.");
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

  const handleForgotSendCode = async () => {
    setError("");
    setForgotMessage("");
    if (!resetEmail.trim() || !resetEmail.includes("@")) {
      setError("Insira um e-mail válido.");
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setForgotMessage("Código enviado! Verifique seu e-mail.");
      setForgotMode("code");
    } catch (err: any) {
      setError(err.message || "Erro ao enviar código.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotVerifyCode = async () => {
    setError("");
    if (resetCode.length !== 6) {
      setError("O código deve ter 6 dígitos.");
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, code: resetCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setForgotMode("newpass");
      setError("");
    } catch (err: any) {
      setError(err.message || "Código inválido.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotResetPassword = async () => {
    setError("");
    if (newPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, code: resetCode, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setForgotMode("done");
    } catch (err: any) {
      setError(err.message || "Erro ao redefinir senha.");
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotMode = () => {
    setForgotMode("off");
    setResetEmail("");
    setResetCode("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setForgotMessage("");
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

  const handleAppleLogin = useCallback(async () => {
    setSocialLoading(true);
    setError("");
    try {
      if (!window.AppleID) {
        throw new Error("Apple Sign In não disponível");
      }
      window.AppleID.auth.init({
        clientId: "com.vytal.webapp",
        scope: "name email",
        redirectURI: window.location.origin + "/login",
        usePopup: true,
      });
      const response = await window.AppleID.auth.signIn();
      const res = await fetch("/api/auth/apple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          identityToken: response.authorization?.id_token,
          user: response.authorization?.code,
          fullName: response.user?.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro na autenticação");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      localStorage.setItem("fitstake-onboarding-done", "true");
      const savedRedirect = sessionStorage.getItem("vytal-redirect");
      sessionStorage.removeItem("vytal-redirect");
      setLocation(data.isNew ? "/onboarding" : (savedRedirect || "/dashboard"));
    } catch (err: any) {
      if (err?.error === "popup_closed_by_user") {
      } else if (err?.error === "popup_blocked_by_browser") {
        setError("Popup bloqueado pelo navegador. Permita popups e tente novamente.");
      } else {
        setError("Login com Apple não disponível no momento. Use outra opção de login.");
      }
    } finally {
      setSocialLoading(false);
    }
  }, [setLocation]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "email_exists") {
      const provider = params.get("provider") || "outro método";
      setError(`Este e-mail já está cadastrado via ${provider}. Faça login usando ${provider}.`);
      window.history.replaceState({}, "", "/login");
    } else if (params.get("error") === "auth_failed") {
      setError("Erro na autenticação. Tente novamente.");
      window.history.replaceState({}, "", "/login");
    }
  }, []);

  useEffect(() => {
    const initGoogle = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
        use_fedcm_for_prompt: false,
      });
      if (googleBtnRef.current) {
        googleBtnRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          width: 400,
          text: "continue_with",
          logo_alignment: "center",
        });
        setGoogleReady(true);
      }
    };

    if (window.google) {
      initGoogle();
    } else {
      const script = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (script) {
        script.addEventListener("load", initGoogle);
        return () => script.removeEventListener("load", initGoogle);
      }
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
          <img src="/vytal-logo.png" alt="VYTAL" className="w-20 h-20 rounded-[2rem] object-cover shadow-xl" />
          <h1 className="text-3xl font-display font-bold text-center" data-testid="text-title">
            {isLogin ? "Bem-vindo de volta!" : "Crie sua conta"}
          </h1>
          <p className="text-muted-foreground text-center">
            {isLogin ? "Entre para continuar seus desafios." : "Comece a ser pago pela sua consistência."}
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <div
            ref={googleBtnRef}
            className="hidden"
            data-testid="button-google-login-hidden"
          />

          <button
            onClick={() => {
              if (googleReady && googleBtnRef.current) {
                const inner = googleBtnRef.current.querySelector('[role="button"]') as HTMLElement;
                if (inner) inner.click();
              }
            }}
            disabled={socialLoading}
            className="w-full h-14 rounded-2xl border border-border bg-white dark:bg-card flex items-center justify-center gap-3 text-sm font-semibold text-foreground shadow-sm hover:bg-gray-50 dark:hover:bg-muted transition-colors disabled:opacity-50"
            data-testid="button-google-login"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar com Google
          </button>

          <button
            onClick={handleAppleLogin}
            disabled={socialLoading}
            className="w-full h-14 rounded-2xl border border-border bg-black dark:bg-white flex items-center justify-center gap-3 text-sm font-semibold text-white dark:text-black shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            data-testid="button-apple-login"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Continuar com Apple
          </button>
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

          {isLogin && (
            <div className="text-right -mt-2">
              <button
                type="button"
                className="text-xs text-primary font-semibold hover:underline"
                onClick={() => { setForgotMode("email"); setError(""); setResetEmail(email); }}
                data-testid="button-forgot-password"
              >
                Esqueceu a senha?
              </button>
            </div>
          )}

          {error && forgotMode === "off" && (
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

      <AnimatePresence>
        {forgotMode !== "off" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) closeForgotMode(); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-card w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={forgotMode === "email" ? closeForgotMode : () => {
                    setError("");
                    if (forgotMode === "code") setForgotMode("email");
                    else if (forgotMode === "newpass") setForgotMode("code");
                  }}
                  className="text-muted-foreground"
                  data-testid="button-forgot-back"
                >
                  <ArrowLeft size={20} />
                </button>
                <h3 className="text-lg font-bold font-display">
                  {forgotMode === "email" && "Recuperar senha"}
                  {forgotMode === "code" && "Verificar código"}
                  {forgotMode === "newpass" && "Nova senha"}
                  {forgotMode === "done" && "Tudo pronto!"}
                </h3>
                <div className="w-5" />
              </div>

              {forgotMode === "email" && (
                <div className="space-y-4">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                    <Mail size={28} className="text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Informe o e-mail da sua conta. Enviaremos um código de 6 dígitos para redefinir sua senha.
                  </p>
                  <Input
                    placeholder="Seu e-mail"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleForgotSendCode()}
                    className="h-14 rounded-2xl bg-background border-border px-4"
                    data-testid="input-forgot-email"
                  />
                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                      <AlertCircle size={16} />
                      <span>{error}</span>
                    </div>
                  )}
                  <Button
                    className="w-full h-14 text-base font-bold rounded-2xl"
                    onClick={handleForgotSendCode}
                    disabled={forgotLoading}
                    data-testid="button-send-reset-code"
                  >
                    {forgotLoading ? (
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : "Enviar código"}
                  </Button>
                </div>
              )}

              {forgotMode === "code" && (
                <div className="space-y-4">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                    <KeyRound size={28} className="text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Digite o código de 6 dígitos enviado para <strong className="text-foreground">{resetEmail}</strong>
                  </p>
                  {forgotMessage && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm">
                      <CheckCircle2 size={16} />
                      <span>{forgotMessage}</span>
                    </div>
                  )}
                  <Input
                    placeholder="000000"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && handleForgotVerifyCode()}
                    className="h-16 rounded-2xl bg-background border-border px-4 text-center text-2xl font-bold tracking-[0.5em]"
                    data-testid="input-reset-code"
                  />
                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                      <AlertCircle size={16} />
                      <span>{error}</span>
                    </div>
                  )}
                  <Button
                    className="w-full h-14 text-base font-bold rounded-2xl"
                    onClick={handleForgotVerifyCode}
                    disabled={forgotLoading}
                    data-testid="button-verify-reset-code"
                  >
                    {forgotLoading ? (
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : "Verificar"}
                  </Button>
                  <button
                    type="button"
                    className="w-full text-xs text-muted-foreground hover:text-primary text-center"
                    onClick={() => { setForgotMode("email"); setError(""); setResetCode(""); }}
                    data-testid="button-resend-code"
                  >
                    Não recebeu? Reenviar código
                  </button>
                </div>
              )}

              {forgotMode === "newpass" && (
                <div className="space-y-4">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                    <ShieldCheck size={28} className="text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Escolha sua nova senha. Mínimo de 6 caracteres.
                  </p>
                  <Input
                    placeholder="Nova senha"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-14 rounded-2xl bg-background border-border px-4"
                    data-testid="input-new-password"
                  />
                  <Input
                    placeholder="Confirmar nova senha"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleForgotResetPassword()}
                    className="h-14 rounded-2xl bg-background border-border px-4"
                    data-testid="input-confirm-password"
                  />
                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                      <AlertCircle size={16} />
                      <span>{error}</span>
                    </div>
                  )}
                  <Button
                    className="w-full h-14 text-base font-bold rounded-2xl"
                    onClick={handleForgotResetPassword}
                    disabled={forgotLoading}
                    data-testid="button-reset-password"
                  >
                    {forgotLoading ? (
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : "Redefinir senha"}
                  </Button>
                </div>
              )}

              {forgotMode === "done" && (
                <div className="space-y-4 text-center">
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={32} className="text-green-500" />
                  </div>
                  <div>
                    <p className="text-base font-bold">Senha redefinida!</p>
                    <p className="text-sm text-muted-foreground mt-1">Agora você pode entrar com sua nova senha.</p>
                  </div>
                  <Button
                    className="w-full h-14 text-base font-bold rounded-2xl"
                    onClick={closeForgotMode}
                    data-testid="button-back-to-login"
                  >
                    Voltar ao login
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
