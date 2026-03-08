import { ArrowDownLeft, ArrowUpRight, History, Settings, LogOut, Moon, Sun, ShieldCheck, CheckCircle2, Camera, Eye, Smartphone, Palette, CreditCard, UserCircle, Trophy, Flame, Medal, Award, PlusCircle, LayoutGrid, Bookmark } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("posts");

  const stats = [
    { label: "Publicações", value: "34" },
    { label: "Desafios", value: "12" },
    { label: "Seguidores", value: "1.2k" },
  ];

  return (
    <div className="pb-32 animate-in fade-in duration-500 bg-background min-h-screen">
      <header className="px-6 pt-6 pb-4 flex items-center justify-between sticky top-0 bg-background/90 backdrop-blur-xl z-50 border-b border-border/50">
        <h1 className="text-xl font-bold flex items-center gap-2">alex_costa <Badge variant="secondary" className="text-[9px] bg-primary/10 text-primary border-none">PRO</Badge></h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
            <PlusCircle size={22} />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
            <Settings size={22} />
          </Button>
        </div>
      </header>

      <div className="px-4 space-y-6 pt-4">
        {/* Profile Info - Insta Vibe */}
        <div className="flex items-center gap-6 px-2">
          <div className="relative">
            <div className="w-22 h-22 rounded-full border-2 border-background p-0.5 bg-gradient-to-tr from-yellow-400 via-primary to-accent">
              <Avatar className="w-20 h-20 border-2 border-background">
                <AvatarImage src="https://i.pravatar.cc/150?u=alex_costa" className="object-cover" />
                <AvatarFallback>AC</AvatarFallback>
              </Avatar>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-3 gap-2 text-center">
            {stats.map((stat, i) => (
              <div key={i} className="flex flex-col">
                <span className="font-bold text-lg">{stat.value}</span>
                <span className="text-[10px] text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-2 space-y-1">
          <h2 className="font-bold">Alex Costa</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            Em busca da consistência diária. 🏃‍♂️💨
            Criador do #ProjetoVerão2024
            📍 São Paulo, SP
          </p>
          <div className="flex gap-2 pt-2">
            <Link href="/wallet" className="flex-1">
              <Button className="w-full bg-primary/10 text-primary hover:bg-primary/20 font-bold h-9 text-xs">Minha Carteira</Button>
            </Link>
            <Button variant="outline" className="flex-1 font-bold h-9 text-xs">Editar Perfil</Button>
          </div>
        </div>

        {/* Highlights / Badges */}
        <div className="flex gap-4 px-2 overflow-x-auto no-scrollbar pb-2 pt-2">
          {[
            { name: "Invicto", icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10" },
            { name: "Maratona", icon: Medal, color: "text-blue-500", bg: "bg-blue-500/10" },
            { name: "Top 1%", icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-500/10" },
          ].map((badge, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
              <div className={`w-16 h-16 rounded-full border-2 border-border p-0.5 flex items-center justify-center ${badge.bg}`}>
                <badge.icon className={badge.color} size={24} />
              </div>
              <span className="text-[10px] text-foreground">{badge.name}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-t border-border/50 pt-1">
          <button 
            onClick={() => setActiveTab("posts")} 
            className={`flex-1 py-3 flex justify-center items-center gap-2 border-b-2 transition-all ${activeTab === 'posts' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}
          >
            <LayoutGrid size={20} />
          </button>
          <button 
            onClick={() => setActiveTab("saved")} 
            className={`flex-1 py-3 flex justify-center items-center gap-2 border-b-2 transition-all ${activeTab === 'saved' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}
          >
            <Bookmark size={20} />
          </button>
        </div>

        {/* Grid Content */}
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square bg-muted/30 relative group cursor-pointer overflow-hidden">
              <img 
                src={`https://source.unsplash.com/random/400x400?fitness,workout&sig=${i}`} 
                alt="Workout" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <CheckCircle2 className="text-white" size={24} />
              </div>
            </div>
          ))}
        </div>

        {/* Private Settings Refinement */}
        <div className="space-y-4 pt-6 border-t border-border/50">
          <h3 className="font-bold text-sm px-2">Ajustes da Conta</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3"><Palette size={18} className="text-primary" /> <span className="text-sm font-bold">Tema Visual</span></div>
              <div className="flex bg-muted p-1 rounded-xl gap-1">
                <button onClick={() => setTheme("light")} className={`p-2 rounded-lg transition-all ${theme === 'light' ? 'bg-background shadow-md text-primary scale-110' : 'opacity-50 hover:opacity-100'}`}><Sun size={14} /></button>
                <button onClick={() => setTheme("dark")} className={`p-2 rounded-lg transition-all ${theme === 'dark' ? 'bg-background shadow-md text-primary scale-110' : 'opacity-50 hover:opacity-100'}`}><Moon size={14} /></button>
                <button onClick={() => setTheme("system")} className={`p-2 rounded-lg transition-all ${theme === 'system' ? 'bg-background shadow-md text-primary scale-110' : 'opacity-50 hover:opacity-100'}`}><Smartphone size={14} /></button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3"><CreditCard size={18} className="text-primary" /> <span className="text-sm font-bold">Chave Pix</span></div>
              <Button variant="link" size="sm" className="text-primary text-[10px] h-auto p-0 font-bold uppercase tracking-widest border-b border-primary/30 rounded-none">Configurar</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}