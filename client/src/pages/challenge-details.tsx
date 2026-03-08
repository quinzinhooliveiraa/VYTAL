import { Link, useLocation, useParams } from "wouter";
import { ChevronLeft, Share2, Camera, Trophy, Flame, Users, Clock, ShieldAlert, CheckCircle2, XCircle, AlertCircle, Info, ArrowUpRight, Check, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ChallengeDetails() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("progresso");

  // Mock data
  const isAdmin = true; // In a real app, check if user is in moderators list
  const isChallengeEnded = false;

  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { id: 1, user: "Maria S.", avatar: "https://i.pravatar.cc/150?u=maria", text: "Bora time! Mais 5km hoje 🏃‍♀️", time: "10:30" },
    { id: 2, user: "João P.", avatar: "https://i.pravatar.cc/150?u=joao", text: "Aí sim! O treino hoje tá pago aqui também.", time: "11:45" }
  ]);

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    setChatMessages([...chatMessages, {
      id: Date.now(),
      user: "Alex C. (Você)",
      avatar: "https://i.pravatar.cc/150?u=alex",
      text: chatMessage,
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }]);
    setChatMessage("");
  };

  const participants = [
    { id: 1, name: "Maria S.", score: 15, avatar: "https://i.pravatar.cc/150?u=maria", active: true },
    { id: 2, name: "Alex C. (Você)", score: 13, avatar: "https://i.pravatar.cc/150?u=alex", active: true, isUser: true },
    { id: 3, name: "João P.", score: 12, avatar: "https://i.pravatar.cc/150?u=joao", active: true },
    { id: 4, name: "Ana L.", score: 10, avatar: "https://i.pravatar.cc/150?u=ana", active: false },
  ];

  const checkins = [
    { id: 1, user: "Alex C.", time: "10 min atrás", status: "pending", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80", flagged: false },
    { id: 2, user: "Maria S.", time: "1 hora atrás", status: "approved", image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80", flagged: false },
    { id: 3, user: "João P.", time: "5 horas atrás", status: "flagged", image: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=400&q=80", flagged: true, reason: "Localização suspeita" },
  ];

  const winners = participants.filter(p => p.active);

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
            {isAdmin && <Badge className="bg-orange-500 text-white border-none flex gap-1 items-center px-2 py-0.5"><ShieldAlert size={10} /> Você é moderador</Badge>}
          </div>
          <h1 className="text-3xl font-display font-bold text-white drop-shadow-md">Projeto Verão 2024</h1>
        </div>
      </div>

      <div className="px-6 mt-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 h-12 rounded-xl bg-muted p-1">
            <TabsTrigger value="progresso" className="rounded-lg font-bold">Resumo</TabsTrigger>
            <TabsTrigger value="ranking" className="rounded-lg font-bold">Ranking</TabsTrigger>
            <TabsTrigger value="chat" className="rounded-lg font-bold">Chat</TabsTrigger>
            {isAdmin && <TabsTrigger value="mod" className="rounded-lg font-bold flex gap-1 items-center text-orange-600 dark:text-orange-400"><ShieldAlert size={14}/> Mod</TabsTrigger>}
          </TabsList>

          <TabsContent value="progresso" className="space-y-6 mt-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                <p className="text-muted-foreground text-[10px] uppercase font-bold mb-1 tracking-wider">Pote Estimado</p>
                <p className="text-2xl font-display font-bold text-primary">R$ 6.200</p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                <p className="text-muted-foreground text-[10px] uppercase font-bold mb-1 tracking-wider">Investimento</p>
                <p className="text-2xl font-display font-bold">R$ 50</p>
              </div>
            </div>

            <div className="border border-primary/20 bg-primary/5 rounded-3xl p-6 space-y-4">
              <h3 className="font-display font-bold text-lg">Seu Status</h3>
              <div className="flex justify-between items-end">
                <p className="text-sm text-muted-foreground">Meta: 5 check-ins/semana</p>
                <p className="font-display font-bold text-xl"><span className="text-primary">3</span>/5</p>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((d) => (
                  <div key={d} className={`h-2.5 flex-1 rounded-full ${d <= 3 ? 'bg-primary shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-muted'}`} />
                ))}
              </div>
              <Button className="w-full h-14 rounded-2xl font-bold bg-foreground text-background dark:bg-white dark:text-black mt-2 shadow-xl" onClick={() => setLocation(`/check-in/${id}`)}>
                <Camera className="mr-2" size={20} /> Fazer Check-in Hoje
              </Button>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground px-1">Regras & Info</h4>
              <div className="bg-card border border-border rounded-2xl p-4 space-y-3 text-sm">
                <div className="flex items-center gap-3"><Clock size={16} className="text-primary" /> <span>Termina em 12 dias</span></div>
                <div className="flex items-center gap-3"><Users size={16} className="text-primary" /> <span>{participants.length} participantes ativos</span></div>
                <div className="flex items-center gap-3"><Info size={16} className="text-primary" /> <span>Validação via Foto + GPS</span></div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ranking" className="mt-4 animate-in fade-in slide-in-from-bottom-2">
             <div className="bg-card border border-border rounded-[2rem] overflow-hidden divide-y divide-border shadow-sm">
                {participants.sort((a,b) => b.score - a.score).map((user, i) => (
                  <div key={user.id} className={`flex items-center gap-4 p-5 ${user.isUser ? 'bg-primary/5' : ''} ${!user.active ? 'opacity-50 grayscale' : ''}`}>
                    <span className="w-6 font-display font-bold text-muted-foreground text-center">{i + 1}</span>
                    <Avatar className="w-12 h-12 border-2 border-border shadow-sm">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Link href={`/user/${user.name.split(' ')[0].toLowerCase()}`}>
                      <div className="flex-1 cursor-pointer hover:opacity-80">
                        <p className="font-bold text-sm">{user.name}</p>
                        {!user.active && <Badge variant="destructive" className="text-[8px] h-4 py-0 font-bold uppercase tracking-tighter">Eliminado</Badge>}
                      </div>
                    </Link>
                    <div className="text-right">
                      <p className="font-display font-bold text-lg">{user.score}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Check-ins</p>
                    </div>
                  </div>
                ))}
             </div>
          </TabsContent>

          <TabsContent value="chat" className="mt-4 animate-in fade-in slide-in-from-bottom-2 h-[50vh] flex flex-col">
            <div className="flex-1 bg-card border border-border rounded-[2rem] p-4 flex flex-col shadow-sm">
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {chatMessages.map(msg => (
                    <div key={msg.id} className={`flex gap-3 ${msg.user.includes('Você') ? 'flex-row-reverse' : ''}`}>
                      <Link href={msg.user.includes('Você') ? '/profile' : `/user/${msg.user.split(' ')[0].toLowerCase().replace('.', '')}`}>
                        <Avatar className="w-8 h-8 cursor-pointer hover:opacity-80 transition-opacity">
                          <AvatarImage src={msg.avatar} />
                          <AvatarFallback>{msg.user.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className={`flex flex-col ${msg.user.includes('Você') ? 'items-end' : ''}`}>
                        <div className="flex items-baseline gap-2 mb-1">
                          <Link href={msg.user.includes('Você') ? '/profile' : `/user/${msg.user.split(' ')[0].toLowerCase().replace('.', '')}`}>
                            <span className="text-[10px] font-bold text-muted-foreground cursor-pointer hover:text-primary">{msg.user}</span>
                          </Link>
                          <span className="text-[8px] text-muted-foreground/60">{msg.time}</span>
                        </div>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm relative ${
                          msg.user.includes('Você') 
                            ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                            : 'bg-muted rounded-tl-sm'
                        }`}>
                          {msg.text}
                          {/* Mock Notification badge if not from me */}
                          {!msg.user.includes('Você') && msg.id === 2 && (
                             <span className="absolute -top-1 -right-1 flex h-3 w-3">
                               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                               <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500 border border-background"></span>
                             </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="mt-4 flex gap-2 pt-4 border-t border-border">
                <Input 
                  placeholder="Mande uma mensagem pro grupo..." 
                  className="rounded-full bg-muted/50 border-none"
                  value={chatMessage}
                  onChange={e => setChatMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                />
                <Button size="icon" className="rounded-full shrink-0" onClick={handleSendMessage}>
                  <Send size={18} />
                </Button>
              </div>
            </div>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="mod" className="space-y-6 mt-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex gap-3 items-start">
                <ShieldAlert className="text-orange-500 shrink-0 mt-1" size={18} />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-orange-600 dark:text-orange-400">Área de Moderação</p>
                  <p className="text-xs text-orange-600/80 dark:text-orange-400/80">Você deve revisar as evidências. Eliminações são permanentes após a confirmação.</p>
                </div>
              </div>

              {isChallengeEnded && (
                <div className="bg-primary/10 border border-primary/20 rounded-[2rem] p-8 text-center space-y-6 animate-bounce">
                  <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary">
                    <Trophy size={40} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-display font-bold">Aprovação Final</h3>
                    <p className="text-sm text-muted-foreground">O desafio terminou. Confirme os {winners.length} vencedores para distribuir <strong>R$ 6.200</strong>.</p>
                  </div>
                  <Button className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold shadow-xl shadow-primary/20">
                    <CheckCircle2 className="mr-2" size={20} /> Liberar Pagamentos
                  </Button>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Revisões Pendentes</h4>
                  <Badge className="bg-orange-500">{checkins.filter(c => c.status !== 'approved').length}</Badge>
                </div>
                
                <div className="space-y-6 pb-20">
                  {checkins.filter(c => c.status !== 'approved').map(c => (
                    <div key={c.id} className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-md">
                      <div className="p-4 flex justify-between items-center border-b border-border bg-muted/30">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8 border border-border">
                            <AvatarImage src={`https://i.pravatar.cc/150?u=${c.user}`} />
                            <AvatarFallback>{c.user.charAt(0)}</AvatarFallback>
                          </Avatar>
                        <Link href={`/user/${c.user.split(' ')[0].toLowerCase()}`}>
                          <div className="cursor-pointer hover:opacity-80">
                            <p className="font-bold text-sm">{c.user}</p>
                            <p className="text-[10px] text-muted-foreground font-medium">{c.time}</p>
                          </div>
                        </Link>
                        </div>
                        {c.flagged && <Badge variant="destructive" className="animate-pulse flex gap-1 items-center px-2 py-0.5"><AlertCircle size={10} /> Suspeito</Badge>}
                      </div>
                      
                      <div className="h-56 bg-zinc-900 relative group">
                        <img src={c.image} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                        {c.flagged && (
                          <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-bold shadow-xl border border-red-400">
                             <AlertCircle size={14} /> {c.reason}
                          </div>
                        )}
                        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] text-white flex items-center gap-2 border border-white/10">
                           <Clock size={12} /> Enviado às 08:42 AM
                        </div>
                      </div>

                      <div className="p-3 grid grid-cols-2 gap-3 bg-card">
                        <Button variant="outline" className="h-12 rounded-xl text-red-500 border-red-500/20 hover:bg-red-500/5 font-bold">
                          <XCircle size={18} className="mr-2"/> Rejeitar
                        </Button>
                        <Button className="h-12 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 border-none">
                          <CheckCircle2 size={18} className="mr-2"/> Aprovar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}