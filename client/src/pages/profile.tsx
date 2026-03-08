import { Settings, CheckCircle2, Camera, Trophy, Flame, Medal, Award, PlusCircle, Zap, Activity, History, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { useState } from "react";

export default function Profile() {
  const [activeTab, setActiveTab] = useState("ativos");

  const stats = [
    { label: "Seguidores", value: "1.2k" },
    { label: "Seguindo", value: "245" },
    { label: "Desafios", value: "12" },
  ];

  return (
    <div className="pb-32 animate-in fade-in duration-500 bg-background min-h-screen">
      <header className="px-6 pt-6 pb-4 flex items-center justify-between sticky top-0 bg-background/90 backdrop-blur-xl z-50 border-b border-border/50">
        <h1 className="text-xl font-bold flex items-center gap-2">alex_costa <Badge variant="secondary" className="text-[9px] bg-primary/10 text-primary border-none">PRO</Badge></h1>
        <div className="flex gap-2">
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
              <Settings size={22} />
            </Button>
          </Link>
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
              <div key={i} className="flex flex-col cursor-pointer hover:opacity-70 transition-opacity">
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
            onClick={() => setActiveTab("ativos")} 
            className={`flex-1 py-3 flex justify-center items-center gap-2 border-b-2 transition-all ${activeTab === 'ativos' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}
          >
            <Zap size={18} />
            <span className="text-xs font-bold">Ativos</span>
          </button>
          <button 
            onClick={() => setActiveTab("concluidos")} 
            className={`flex-1 py-3 flex justify-center items-center gap-2 border-b-2 transition-all ${activeTab === 'concluidos' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}
          >
            <History size={18} />
            <span className="text-xs font-bold">Concluídos</span>
          </button>
        </div>

        {/* Challenges List */}
        {activeTab === "ativos" && (
          <div className="space-y-4 px-2">
            {[
              { title: "Projeto Verão 2024", progress: "15/30 dias", isPublic: true, users: 45, prize: "R$ 6.200" },
              { title: "Maratona de Leitura", progress: "5/10 livros", isPublic: false, users: 4, prize: "R$ 400" }
            ].map((challenge, i) => (
              <div key={i} className="p-4 rounded-2xl border border-border/50 bg-card flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm">{challenge.title}</h4>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                      {challenge.isPublic ? "Público" : "Privado"} • {challenge.users} participantes
                    </p>
                  </div>
                  <Badge variant="default" className="text-[9px] bg-primary/10 text-primary border-none">
                    ATIVO
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Activity size={14} className="text-accent" />
                    <span>Progresso: {challenge.progress}</span>
                  </div>
                  <div className="font-bold text-primary">Pote: {challenge.prize}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "concluidos" && (
          <div className="space-y-4 px-2">
            {[
              { title: "Desafio 5h da manhã", result: "Vencedor 🥇", isPublic: false, prize: "+ R$ 150" },
              { title: "10k em 30 dias", result: "Desistiu ❌", isPublic: true, prize: "- R$ 50" },
              { title: "Sem Açúcar", result: "Vencedor 🥈", isPublic: true, prize: "+ R$ 80" }
            ].map((challenge, i) => (
              <div key={i} className="p-4 rounded-2xl border border-border/50 bg-muted/20 flex flex-col gap-3 opacity-80">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm">{challenge.title}</h4>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {challenge.result}
                    </p>
                  </div>
                  <Badge variant="secondary" className={`text-[9px] ${challenge.prize.startsWith('+') ? 'text-primary bg-primary/10' : 'text-destructive bg-destructive/10'}`}>
                    {challenge.prize}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}