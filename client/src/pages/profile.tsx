import { Settings, LogOut, Moon, Sun, ShieldCheck, CheckCircle2, Camera, Eye, Smartphone, Palette, CreditCard, ChevronRight, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";

export default function Profile() {
  const { theme, setTheme } = useTheme();
  const [showEarnings, setShowEarnings] = useState(true);

  return (
    <div className="pb-32">
      <header className="px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <h1 className="text-2xl font-display font-bold">Meu Perfil</h1>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Settings size={20} />
        </Button>
      </header>

      <div className="px-6 space-y-8">
        {/* User Card */}
        <div className="flex items-center gap-4 bg-card border border-border p-5 rounded-[2rem] shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <UserCircle size={80} />
          </div>
          <div className="relative">
            <Avatar className="w-20 h-20 border-2 border-primary/20">
              <AvatarImage src="https://i.pravatar.cc/150?u=alex_costa" />
              <AvatarFallback>AC</AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full shadow-lg">
              <Camera size={14} />
            </button>
          </div>
          <div className="flex-1 space-y-1">
            <h2 className="font-bold text-lg leading-none">Alex Costa</h2>
            <p className="text-sm text-muted-foreground">@alex_costa</p>
            <Link href="/user/alex_costa">
              <Button variant="link" className="text-primary text-[11px] h-auto p-0 font-bold">Ver Perfil Público</Button>
            </Link>
          </div>
        </div>

        {/* User Stats Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <ShieldCheck className="text-primary mb-1" size={20} />
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Moderações</p>
            <p className="text-xl font-display font-bold">42</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="text-green-500 mb-1" size={20} />
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Precisão</p>
            <p className="text-xl font-display font-bold">98%</p>
          </div>
        </div>

        {/* Account Settings */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground px-2">Configurações de Conta</h3>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="px-2 text-xs">Nome de Exibição</Label>
              <Input defaultValue="Alex Costa" className="h-12 rounded-xl bg-card border-border" />
            </div>
            <div className="space-y-2">
              <Label className="px-2 text-xs">Username</Label>
              <Input defaultValue="@alex_costa" className="h-12 rounded-xl bg-card border-border" />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground px-2">Preferências do App</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3"><Palette size={18} className="text-primary" /><span>Tema Visual</span></div>
              <div className="flex bg-muted p-1 rounded-lg gap-1">
                <button onClick={() => setTheme("light")} className={`p-1.5 rounded-md ${theme === 'light' ? 'bg-background shadow-sm' : 'opacity-50'}`}><Sun size={14} /></button>
                <button onClick={() => setTheme("dark")} className={`p-1.5 rounded-md ${theme === 'dark' ? 'bg-background shadow-sm' : 'opacity-50'}`}><Moon size={14} /></button>
                <button onClick={() => setTheme("system")} className={`p-1.5 rounded-md ${theme === 'system' ? 'bg-background shadow-sm' : 'opacity-50'}`}><Smartphone size={14} /></button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3"><CreditCard size={18} className="text-primary" /><span>Chave Pix</span></div>
              <Button variant="link" size="sm" className="text-primary text-xs h-auto p-0">Configurar</Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3"><Eye size={18} className="text-primary" /><span>Visibilidade de Ganhos</span></div>
              <Switch checked={showEarnings} onCheckedChange={setShowEarnings} />
            </div>
          </div>
        </div>

        <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 h-14 rounded-2xl font-bold">
          <LogOut className="mr-2" size={20} /> Sair da Conta
        </Button>
      </div>
    </div>
  );
}