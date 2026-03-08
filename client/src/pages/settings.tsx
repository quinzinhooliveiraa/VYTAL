import { ArrowLeft, Moon, Sun, Smartphone, CreditCard, Eye, ShieldCheck, Database, LogOut, Award, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [showEarnings, setShowEarnings] = useState(true);

  return (
    <div className="min-h-screen bg-background pb-32 animate-in fade-in duration-300">
      <header className="px-6 py-6 flex items-center gap-4 sticky top-0 bg-background/90 backdrop-blur-xl z-50 border-b border-border/50">
        <button onClick={() => setLocation("/profile")} className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold text-xl">Configurações</h1>
      </header>

      <div className="px-6 space-y-8 pt-6">
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Aparência (Padrão do Sistema)</h3>
          <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-3"><span className="text-sm font-bold">Tema Visual</span></div>
            <div className="flex bg-muted p-1 rounded-xl gap-1">
              <button onClick={() => setTheme("light")} className={`p-2 rounded-lg transition-all ${theme === 'light' ? 'bg-background shadow-md text-primary scale-110' : 'opacity-50 hover:opacity-100'}`}><Sun size={14} /></button>
              <button onClick={() => setTheme("dark")} className={`p-2 rounded-lg transition-all ${theme === 'dark' ? 'bg-background shadow-md text-primary scale-110' : 'opacity-50 hover:opacity-100'}`}><Moon size={14} /></button>
              <button onClick={() => setTheme("system")} className={`p-2 rounded-lg transition-all ${theme === 'system' ? 'bg-background shadow-md text-primary scale-110' : 'opacity-50 hover:opacity-100'}`}><Smartphone size={14} /></button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Negócios & Parcerias</h3>
          
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 space-y-4 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl transition-transform" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                <Award size={24} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-foreground">Organizador de Eventos</p>
                <p className="text-[10px] text-muted-foreground mt-1">Crie desafios para centenas de pessoas e receba comissão sobre as entradas.</p>
              </div>
            </div>
            <Button className="w-full rounded-xl bg-primary text-primary-foreground font-bold text-xs h-10 shadow-lg shadow-primary/20">
              CANDIDATAR-SE
            </Button>
          </div>

          <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5 space-y-4 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-accent/10 rounded-full blur-2xl transition-transform" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
                <Star size={24} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-foreground">Parceiro do App</p>
                <p className="text-[10px] text-muted-foreground mt-1">Academias, nutricionistas ou marcas. Ofereça benefícios e ganhe destaque.</p>
              </div>
            </div>
            <Button className="w-full rounded-xl bg-accent text-accent-foreground font-bold text-xs h-10 shadow-lg shadow-accent/20">
              SEJA UM PARCEIRO
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Conta e Pagamentos</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3"><CreditCard size={18} className="text-foreground" /> <span className="text-sm font-bold">Chave Pix</span></div>
              <Button variant="link" size="sm" className="text-primary text-[10px] h-auto p-0 font-bold uppercase tracking-widest">Configurar</Button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3"><Eye size={18} className="text-foreground" /> <span className="text-sm font-bold">Privacidade de Ganhos</span></div>
              <Switch checked={showEarnings} onCheckedChange={setShowEarnings} className="data-[state=checked]:bg-primary" />
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3"><ShieldCheck size={18} className="text-foreground" /> <span className="text-sm font-bold">Autenticação 2FA</span></div>
              <Switch />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Avançado</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3"><Database size={18} className="text-foreground" /> <span className="text-sm font-bold">Limpar Cache Local</span></div>
              <Button variant="outline" size="sm" className="h-8">Limpar</Button>
            </div>
          </div>
        </div>

        <Button 
          variant="ghost" 
          onClick={() => {
            localStorage.clear();
            window.location.href = '/';
          }}
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 h-16 rounded-[1.5rem] font-bold text-sm border border-destructive/20 bg-destructive/5 mt-8"
        >
          <LogOut className="mr-3" size={20} /> Encerrar Sessão
        </Button>
      </div>
    </div>
  );
}