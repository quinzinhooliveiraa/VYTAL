import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Users, Trophy, DollarSign, TrendingUp, Plus, Crown, Shield, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";

export default function CommunityDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [tab, setTab] = useState("overview");

  if (!user?.isAdmin) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 p-6">
        <Shield size={48} className="text-muted-foreground" />
        <p className="text-lg font-bold">Acesso restrito</p>
        <p className="text-sm text-muted-foreground text-center">Apenas administradores podem acessar esta página.</p>
        <Button onClick={() => setLocation("/dashboard")} data-testid="button-back-dashboard">Voltar</Button>
      </div>
    );
  }

  const communities = [
    { name: "CrossFit Arena", members: 48, challenges: 12, commission: 847, initials: "CF", verified: true },
    { name: "Runners SP", members: 124, challenges: 8, commission: 1230, initials: "RS", verified: true },
    { name: "Box Titans", members: 32, challenges: 5, commission: 320, initials: "BT", verified: false },
  ];

  const recentCommissions = [
    { name: "Desafio 30 Dias", community: "CrossFit Arena", amount: 125, date: "Hoje" },
    { name: "WOD Semanal #8", community: "CrossFit Arena", amount: 67.5, date: "Há 3 dias" },
    { name: "Maratona 10K", community: "Runners SP", amount: 240, date: "Há 1 semana" },
    { name: "Sprint Challenge", community: "Runners SP", amount: 180, date: "Há 2 semanas" },
  ];

  const challenges = [
    { title: "Desafio 30 Dias Fit", community: "CrossFit Arena", participants: 24, pot: 2400, status: "active" },
    { title: "WOD Semanal #9", community: "CrossFit Arena", participants: 16, pot: 800, status: "active" },
    { title: "Maratona São Paulo", community: "Runners SP", participants: 32, pot: 4800, status: "ended" },
    { title: "Burpee Challenge", community: "Box Titans", participants: 12, pot: 600, status: "scheduled" },
  ];

  const members = [
    { name: "João Silva", community: "CrossFit Arena", role: "Admin", challenges: 8, initials: "JS" },
    { name: "Maria Costa", community: "Runners SP", role: "Membro", challenges: 12, initials: "MC" },
    { name: "Pedro Santos", community: "CrossFit Arena", role: "Membro", challenges: 6, initials: "PS" },
    { name: "Ana Oliveira", community: "Runners SP", role: "Moderador", challenges: 10, initials: "AO" },
    { name: "Lucas Ferreira", community: "Box Titans", role: "Membro", challenges: 4, initials: "LF" },
  ];

  const totalCommission = communities.reduce((sum, c) => sum + c.commission, 0);
  const totalMembers = communities.reduce((sum, c) => sum + c.members, 0);
  const totalChallenges = communities.reduce((sum, c) => sum + c.challenges, 0);

  const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const statusLabel = (s: string) => s === "active" ? "Ativo" : s === "ended" ? "Finalizado" : "Agendado";
  const statusColor = (s: string) => s === "active" ? "bg-primary text-white" : s === "ended" ? "bg-muted text-muted-foreground" : "bg-yellow-500 text-white";

  return (
    <div className="max-w-md mx-auto pb-24">
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setLocation("/settings")} className="p-2 -ml-2 rounded-full hover:bg-muted" data-testid="button-back">
            <ChevronLeft size={22} />
          </button>
          <div>
            <h1 className="text-xl font-display font-bold">Painel de Comunidades</h1>
            <p className="text-xs text-muted-foreground">Gerencie organizadores e comunidades</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-card border rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold text-primary">{formatBRL(totalCommission)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Comissão Total</p>
          </div>
          <div className="bg-card border rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold">{totalChallenges}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Desafios</p>
          </div>
          <div className="bg-card border rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold">{totalMembers}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Membros</p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-4 h-10 rounded-xl mb-4">
            <TabsTrigger value="overview" className="rounded-lg text-xs font-bold">Geral</TabsTrigger>
            <TabsTrigger value="communities" className="rounded-lg text-xs font-bold">Grupos</TabsTrigger>
            <TabsTrigger value="challenges" className="rounded-lg text-xs font-bold">Desafios</TabsTrigger>
            <TabsTrigger value="members" className="rounded-lg text-xs font-bold">Membros</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-0">
            <div className="bg-card border rounded-2xl p-4">
              <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                <DollarSign size={16} className="text-primary" /> Comissões Recentes
              </h3>
              <div className="space-y-3">
                {recentCommissions.map((c, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground">{c.community} • {c.date}</p>
                    </div>
                    <span className="text-primary font-bold text-sm">+{formatBRL(c.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border rounded-2xl p-4">
              <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-blue-500" /> Engajamento
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Taxa de participação", value: 78, color: "bg-primary" },
                  { label: "Check-ins em dia", value: 92, color: "bg-blue-500" },
                  { label: "Retenção mensal", value: 85, color: "bg-purple-500" },
                ].map((m, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{m.label}</span>
                      <span className="font-bold">{m.value}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${m.color} rounded-full transition-all`} style={{ width: `${m.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="communities" className="space-y-3 mt-0">
            {communities.map((c, i) => (
              <div key={i} className="bg-card border rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {c.initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold">{c.name}</p>
                        {c.verified && <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] px-1.5 py-0">Verificado</Badge>}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{c.members} membros • {c.challenges} desafios</p>
                    </div>
                  </div>
                  <span className="text-primary font-bold text-sm">{formatBRL(c.commission)}</span>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="challenges" className="space-y-3 mt-0">
            {challenges.map((c, i) => (
              <div key={i} className="bg-card border rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">{c.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {c.community} • {c.participants} participantes • {formatBRL(c.pot)}
                    </p>
                  </div>
                  <Badge className={`${statusColor(c.status)} border-none text-[10px]`}>{statusLabel(c.status)}</Badge>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="members" className="space-y-3 mt-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">{totalMembers} membros no total</p>
            </div>
            {members.map((m, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Avatar className="w-9 h-9">
                    <AvatarFallback className="text-xs bg-muted">{m.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-[10px] text-muted-foreground">{m.community} • {m.challenges} desafios</p>
                  </div>
                </div>
                <Badge variant="outline" className={`text-[10px] ${m.role === "Admin" ? "text-primary border-primary/30" : m.role === "Moderador" ? "text-orange-500 border-orange-500/30" : "text-muted-foreground"}`}>
                  {m.role}
                </Badge>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
