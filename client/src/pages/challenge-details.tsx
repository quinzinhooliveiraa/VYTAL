import { useLocation, useParams } from "wouter";
import { ChevronLeft, Share2, Camera, Trophy, Flame, Users, Clock, ShieldAlert, CheckCircle2, XCircle, AlertCircle, History, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export default function ChallengeDetails() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("progresso");

  // Mock data
  const isAdmin = true;
  const isChallengeEnded = false;

  const checkins = [
    { id: 1, user: "Alex C.", time: "10 min ago", status: "pending", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80", flagged: false },
    { id: 2, user: "Maria S.", time: "1 hour ago", status: "approved", image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80", flagged: false },
    { id: 3, user: "João P.", time: "5 hours ago", status: "flagged", image: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=400&q=80", flagged: true, reason: "Localização suspeita" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background pb-24">
      {/* Hero Image */}
      <div className="h-64 relative">
        <img src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80" alt="Hero" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <header className="absolute top-0 left-0 right-0 px-6 py-6 flex items-center justify-between z-10">
          <button onClick={() => setLocation("/dashboard")} className="p-2 -ml-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white"><ChevronLeft size={24} /></button>
          <button className="p-2 -mr-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white"><Share2 size={20} /></button>
        </header>
        <div className="absolute bottom-4 left-6 right-6">
          <div className="flex gap-2 mb-2 items-center">
            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/20">Academia</Badge>
            {isAdmin && <Badge className="bg-orange-500 text-white border-none flex gap-1"><ShieldAlert size={10} /> Moderador</Badge>}
          </div>
          <h1 className="text-3xl font-display font-bold text-white drop-shadow-md">Projeto Verão 2024</h1>
        </div>
      </div>

      <div className="px-6 mt-6 space-y-6">
        <Tabs defaultValue="progresso" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 h-12 rounded-xl bg-muted p-1">
            <TabsTrigger value="progresso" className="rounded-lg">Progresso</TabsTrigger>
            <TabsTrigger value="ranking" className="rounded-lg">Ranking</TabsTrigger>
            {isAdmin && <TabsTrigger value="mod" className="rounded-lg flex gap-1"><ShieldAlert size={14}/> Mod</TabsTrigger>}
          </TabsList>

          <TabsContent value="progresso" className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                <p className="text-muted-foreground text-[10px] uppercase font-bold mb-1">Pote Total</p>
                <p className="text-2xl font-display font-bold text-primary">R$ 6.200</p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                <p className="text-muted-foreground text-[10px] uppercase font-bold mb-1">Sua Aposta</p>
                <p className="text-2xl font-display font-bold">R$ 50</p>
              </div>
            </div>

            <div className="border border-primary/20 bg-primary/5 rounded-3xl p-5 space-y-4">
              <h3 className="font-display font-bold">Seu Check-in Semanal</h3>
              <div className="flex justify-between text-sm items-end">
                <p className="text-muted-foreground">Faltam 2 para o objetivo</p>
                <p className="font-bold text-lg"><span className="text-primary">3</span>/5</p>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((d) => (
                  <div key={d} className={`h-2 flex-1 rounded-full ${d <= 3 ? 'bg-primary shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-muted'}`} />
                ))}
              </div>
              <Button className="w-full h-14 rounded-xl font-bold bg-foreground text-background dark:bg-white dark:text-black mt-2" onClick={() => setLocation(`/check-in/${id}`)}>
                <Camera className="mr-2" size={20} /> Fazer Check-in
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="ranking" className="mt-4">
             <div className="bg-card border border-border rounded-3xl overflow-hidden divide-y divide-border">
                {[
                  { pos: 1, name: "Maria S.", score: 15, avatar: "https://i.pravatar.cc/150?u=maria" },
                  { pos: 2, name: "Alex C. (Você)", score: 13, avatar: "https://i.pravatar.cc/150?u=alex", isUser: true },
                  { pos: 3, name: "João P.", score: 12, avatar: "https://i.pravatar.cc/150?u=joao" },
                ].map((user, i) => (
                  <div key={i} className={`flex items-center gap-4 p-4 ${user.isUser ? 'bg-primary/5' : ''}`}>
                    <span className="w-6 font-display font-bold text-muted-foreground">{user.pos}</span>
                    <div className="w-10 h-10 rounded-full overflow-hidden"><img src={user.avatar} className="w-full h-full object-cover" /></div>
                    <div className="flex-1"><p className="font-semibold text-sm">{user.name}</p></div>
                    <div className="text-right"><p className="font-bold">{user.score} ck</p></div>
                  </div>
                ))}
             </div>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="mod" className="space-y-6 mt-4">
              <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-4 flex gap-3 items-start">
                <Info className="text-orange-500 shrink-0 mt-1" size={18} />
                <p className="text-xs text-orange-700 dark:text-orange-400">Como moderador, você deve aprovar fotos e GPS. Desafios finalizam automaticamente após 48h sem ação.</p>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold flex items-center gap-2"><AlertCircle size={16} className="text-orange-500" /> Pendentes ({checkins.filter(c => c.status !== 'approved').length})</h4>
                <div className="space-y-4">
                  {checkins.filter(c => c.status !== 'approved').map(c => (
                    <div key={c.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                      <div className="p-3 flex justify-between items-center border-b border-border">
                        <div>
                          <p className="font-bold text-sm">{c.user}</p>
                          <p className="text-[10px] text-muted-foreground">{c.time}</p>
                        </div>
                        {c.flagged && <Badge variant="destructive" className="text-[8px] py-0 px-1.5 h-4 uppercase">Suspeito</Badge>}
                      </div>
                      <div className="h-32 bg-muted relative">
                        <img src={c.image} className="w-full h-full object-cover" />
                        {c.flagged && <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center"><AlertCircle className="text-red-500" /></div>}
                      </div>
                      <div className="p-2 grid grid-cols-2 gap-2">
                        <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-500/10"><XCircle size={14} className="mr-1"/> Rejeitar</Button>
                        <Button size="sm" className="bg-primary text-primary-foreground"><CheckCircle2 size={14} className="mr-1"/> Aprovar</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {isChallengeEnded && (
                <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 text-center space-y-4">
                  <Trophy className="mx-auto text-primary" size={40} />
                  <h3 className="font-bold">Desafio Encerrado!</h3>
                  <p className="text-sm text-muted-foreground">Aprove a lista final de vencedores para liberar o Pix.</p>
                  <Button className="w-full bg-primary text-primary-foreground font-bold">Liberar Premiação (R$ 6.200)</Button>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}