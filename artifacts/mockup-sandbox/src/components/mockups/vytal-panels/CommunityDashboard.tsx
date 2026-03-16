import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PRIMARY = "hsl(145 65% 38%)";

function Icon({ children, bg }: { children: React.ReactNode; bg: string }) {
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
      {children}
    </div>
  );
}

export function CommunityDashboard() {
  const [tab, setTab] = useState("overview");

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      <div className="max-w-md mx-auto">
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-lg">
                CF
              </div>
              <div>
                <h1 className="text-lg font-bold">CrossFit Arena</h1>
                <p className="text-xs text-gray-400">48 membros ativos</p>
              </div>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
              Verificado
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 px-5 mb-5">
          <Card className="bg-[#141414] border-[#222] rounded-2xl">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-emerald-400">R$ 847</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Comissão Total</p>
            </CardContent>
          </Card>
          <Card className="bg-[#141414] border-[#222] rounded-2xl">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-white">12</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Desafios Criados</p>
            </CardContent>
          </Card>
          <Card className="bg-[#141414] border-[#222] rounded-2xl">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-white">48</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Membros</p>
            </CardContent>
          </Card>
        </div>

        <div className="px-5">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid grid-cols-3 bg-[#141414] rounded-xl h-10 mb-4">
              <TabsTrigger value="overview" className="rounded-lg text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Visão Geral</TabsTrigger>
              <TabsTrigger value="challenges" className="rounded-lg text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Desafios</TabsTrigger>
              <TabsTrigger value="members" className="rounded-lg text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Membros</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-0">
              <Card className="bg-[#141414] border-[#222] rounded-2xl">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <span className="text-emerald-400">💰</span> Comissões Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  {[
                    { name: "Desafio 30 Dias", amount: "R$ 125,00", date: "Hoje" },
                    { name: "WOD Semanal #8", amount: "R$ 67,50", date: "Há 3 dias" },
                    { name: "Maratona CrossFit", amount: "R$ 240,00", date: "Há 1 semana" },
                  ].map((c, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-[10px] text-gray-500">{c.date}</p>
                      </div>
                      <span className="text-emerald-400 font-bold text-sm">+{c.amount}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-[#141414] border-[#222] rounded-2xl">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <span>📊</span> Engajamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Taxa de participação</span>
                        <span className="font-bold">78%</span>
                      </div>
                      <div className="h-2 bg-[#222] rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: "78%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Check-ins em dia</span>
                        <span className="font-bold">92%</span>
                      </div>
                      <div className="h-2 bg-[#222] rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: "92%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Retenção mensal</span>
                        <span className="font-bold">85%</span>
                      </div>
                      <div className="h-2 bg-[#222] rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: "85%" }} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="challenges" className="space-y-3 mt-0">
              {[
                { title: "Desafio 30 Dias Fit", sport: "CrossFit", participants: 24, pot: "R$ 2.400", status: "Ativo", statusColor: "bg-emerald-500" },
                { title: "WOD Semanal #9", sport: "CrossFit", participants: 16, pot: "R$ 800", status: "Ativo", statusColor: "bg-emerald-500" },
                { title: "Maratona CrossFit", sport: "Corrida", participants: 32, pot: "R$ 4.800", status: "Finalizado", statusColor: "bg-gray-500" },
                { title: "Burpee Challenge", sport: "CrossFit", participants: 12, pot: "R$ 600", status: "Agendado", statusColor: "bg-yellow-500" },
              ].map((c, i) => (
                <Card key={i} className="bg-[#141414] border-[#222] rounded-2xl">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold">{c.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-500">{c.sport}</span>
                        <span className="text-[10px] text-gray-600">•</span>
                        <span className="text-[10px] text-gray-500">{c.participants} participantes</span>
                        <span className="text-[10px] text-gray-600">•</span>
                        <span className="text-[10px] text-emerald-400 font-medium">{c.pot}</span>
                      </div>
                    </div>
                    <Badge className={`${c.statusColor} text-white border-none text-[10px]`}>{c.status}</Badge>
                  </CardContent>
                </Card>
              ))}

              <Button className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-bold mt-2">
                + Criar Novo Desafio
              </Button>
            </TabsContent>

            <TabsContent value="members" className="space-y-3 mt-0">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-400">48 membros</p>
                <Button variant="outline" size="sm" className="text-xs h-8 rounded-xl border-[#333] bg-transparent text-white">
                  Convidar
                </Button>
              </div>
              {[
                { name: "João Silva", role: "Admin", challenges: 8, initials: "JS" },
                { name: "Maria Costa", role: "Membro", challenges: 12, initials: "MC" },
                { name: "Pedro Santos", role: "Membro", challenges: 6, initials: "PS" },
                { name: "Ana Oliveira", role: "Moderador", challenges: 10, initials: "AO" },
                { name: "Lucas Ferreira", role: "Membro", challenges: 4, initials: "LF" },
              ].map((m, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className="bg-[#222] text-xs">{m.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="text-[10px] text-gray-500">{m.challenges} desafios</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] border-[#333] ${m.role === "Admin" ? "text-emerald-400 border-emerald-500/30" : m.role === "Moderador" ? "text-orange-400 border-orange-500/30" : "text-gray-400"}`}>
                    {m.role}
                  </Badge>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        <div className="h-20" />
      </div>
    </div>
  );
}
