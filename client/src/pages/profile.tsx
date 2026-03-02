import { ArrowDownLeft, ArrowUpRight, History, Settings, LogOut, Moon, Sun, ShieldCheck, CheckCircle2, Camera, Eye, Smartphone, Palette, CreditCard, UserCircle, Trophy, Flame, Medal, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function Profile() {
  const { theme, setTheme } = useTheme();
  const [showEarnings, setShowEarnings] = useState(true);

  const stats = [
    { label: "Vencidos", value: "12", icon: Trophy, color: "text-yellow-500" },
    { label: "Streak", value: "15d", icon: Flame, color: "text-accent" },
    { label: "Moderações", value: "42", icon: ShieldCheck, color: "text-primary" },
    { label: "Precisão", value: "98%", icon: CheckCircle2, color: "text-green-500" },
  ];

  const badges = [
    { name: "Pioneiro", icon: Medal, color: "text-primary" },
    { name: "Invicto", icon: Award, color: "text-yellow-500" },
    { name: "Doador", icon: Award, color: "text-blue-500" },
  ];

  return (
    <div className="pb-32 animate-in fade-in duration-500">
      <header className="px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <h1 className="text-2xl font-display font-bold">Configurações</h1>
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
          <Settings size={22} />
        </Button>
      </header>

      <div className="px-6 space-y-8">
        {/* User Card - Premium Style */}
        <div className="bg-card border border-border p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
            <UserCircle size={100} />
          </div>
          
          <div className="flex items-center gap-5 relative z-10">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-primary/20 shadow-lg">
                <AvatarImage src="https://i.pravatar.cc/150?u=alex_costa" />
                <AvatarFallback>AC</AvatarFallback>
              </Avatar>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-2xl shadow-xl border-4 border-card"
              >
                <Camera size={16} />
              </motion.button>
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <h2 className="font-display font-bold text-2xl leading-none">Alex Costa</h2>
                <p className="text-sm text-muted-foreground mt-1">@alex_costa</p>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase tracking-widest px-2 py-0.5">ELITE</Badge>
                <Link href="/user/alex_costa">
                  <Button variant="link" className="text-primary text-[10px] h-auto p-0 font-black uppercase tracking-widest border-b border-primary/30 rounded-none">Ver Perfil</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Gamified Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-3xl p-5 flex flex-col items-center justify-center text-center shadow-sm hover:border-primary/30 transition-all cursor-default"
            >
              <stat.icon className={`${stat.color} mb-2`} size={24} fill="currentColor" fillOpacity={0.1} />
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">{stat.label}</p>
              <p className="text-2xl font-display font-bold">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Badges / Medalhas Section */}
        <div className="space-y-4">
          <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground px-2">Suas Medalhas</h3>
          <div className="flex gap-4 px-2 overflow-x-auto no-scrollbar pb-2">
            {badges.map((badge, i) => (
              <div key={i} className="flex flex-col items-center gap-2 shrink-0">
                <div className={`w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer`}>
                  <badge.icon className={badge.color} size={32} />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground">{badge.name}</span>
              </div>
            ))}
            <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-border flex items-center justify-center shrink-0 opacity-30">
              <PlusCircle size={24} />
            </div>
          </div>
        </div>

        {/* Organizer Options - Branding Refined */}
        <div className="space-y-4">
          <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground px-2">Organização</h3>
          <div className="bg-primary/5 border-2 border-primary/20 rounded-[2rem] p-8 space-y-6 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-lg">
                <Award size={28} />
              </div>
              <div className="flex-1">
                <p className="font-display font-bold text-lg leading-tight text-foreground">Organizar como Evento</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Torne-se um organizador oficial e lucre com seus desafios.</p>
              </div>
            </div>
            <Button className="w-full rounded-2xl bg-primary text-primary-foreground font-black text-sm h-14 shadow-lg shadow-primary/20 btn-primary-glow border-none">
              SOLICITAR ACESSO
            </Button>
          </div>
        </div>

        {/* Private Settings Refinement */}
        <div className="space-y-5">
          <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground px-2">Ajustes Privados</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-5 rounded-3xl bg-card border border-border shadow-sm">
              <div className="flex items-center gap-3"><Palette size={18} className="text-primary" /> <span className="text-sm font-bold">Tema Visual</span></div>
              <div className="flex bg-muted p-1 rounded-xl gap-1">
                <button onClick={() => setTheme("light")} className={`p-2 rounded-lg transition-all ${theme === 'light' ? 'bg-background shadow-md text-primary scale-110' : 'opacity-50 hover:opacity-100'}`}><Sun size={16} /></button>
                <button onClick={() => setTheme("dark")} className={`p-2 rounded-lg transition-all ${theme === 'dark' ? 'bg-background shadow-md text-primary scale-110' : 'opacity-50 hover:opacity-100'}`}><Moon size={16} /></button>
                <button onClick={() => setTheme("system")} className={`p-2 rounded-lg transition-all ${theme === 'system' ? 'bg-background shadow-md text-primary scale-110' : 'opacity-50 hover:opacity-100'}`}><Smartphone size={16} /></button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-5 rounded-3xl bg-card border border-border shadow-sm">
              <div className="flex items-center gap-3"><CreditCard size={18} className="text-primary" /> <span className="text-sm font-bold">Chave Pix</span></div>
              <Button variant="link" size="sm" className="text-primary text-[10px] h-auto p-0 font-black uppercase tracking-widest border-b border-primary/30 rounded-none">Configurar</Button>
            </div>

            <div className="flex items-center justify-between p-5 rounded-3xl bg-card border border-border shadow-sm">
              <div className="flex items-center gap-3"><Eye size={18} className="text-primary" /> <span className="text-sm font-bold">Privacidade de Ganhos</span></div>
              <Switch checked={showEarnings} onCheckedChange={setShowEarnings} className="data-[state=checked]:bg-primary" />
            </div>
          </div>
        </div>

        <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 h-16 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs">
          <LogOut className="mr-3" size={20} /> Encerrar Sessão
        </Button>
      </div>
    </div>
  );
}