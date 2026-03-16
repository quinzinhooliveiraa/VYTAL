import { Link, useLocation, useParams } from "wouter";
import { ChevronLeft, Share2, Camera, Trophy, Users, Clock, ShieldAlert, CheckCircle2, XCircle, AlertCircle, Info, Send, LogOut, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ChallengeDetails() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("progresso");
  const [quitDialogOpen, setQuitDialogOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: challenge, isLoading } = useQuery({
    queryKey: [`/api/challenges/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/challenges/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Desafio não encontrado");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: chatMessages = [], refetch: refetchMessages } = useQuery({
    queryKey: [`/api/challenges/${id}/messages`],
    queryFn: async () => {
      const res = await fetch(`/api/challenges/${id}/messages`, { credentials: "include" });
      return res.ok ? res.json() : [];
    },
    enabled: !!id && activeTab === "chat",
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest("POST", `/api/challenges/${id}/messages`, { text });
      return res.json();
    },
    onSuccess: () => {
      setChatMessage("");
      refetchMessages();
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const quitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/challenges/${id}/quit`);
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Desistência confirmada", description: data.message });
      setQuitDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const handleSendMessage = () => {
    if (!chatMessage.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(chatMessage);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 p-6">
        <AlertCircle size={48} className="text-muted-foreground" />
        <p className="text-lg font-bold">Desafio não encontrado</p>
        <Button onClick={() => setLocation("/dashboard")} data-testid="button-back-dashboard">Voltar</Button>
      </div>
    );
  }

  const participants = challenge.participants || [];
  const activeParticipants = participants.filter((p: any) => p.isActive);
  const isCreator = user?.id === challenge.createdBy;
  const isParticipant = challenge.isParticipant;
  const entryFee = Number(challenge.entryFee);
  const prizePool = activeParticipants.length * entryFee;
  const isChallengeEnded = !challenge.isActive || challenge.status === "completed";

  const daysLeft = challenge.startDate
    ? Math.max(0, Math.ceil((new Date(challenge.startDate).getTime() + (challenge.duration || 30) * 86400000 - Date.now()) / 86400000))
    : 0;

  const sportImages: Record<string, string> = {
    corrida: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80",
    academia: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
    ciclismo: "https://images.unsplash.com/photo-1541625602330-2277a4c4bb98?w=800&q=80",
    natacao: "https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=800&q=80",
    funcional: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80",
  };
  const heroImage = sportImages[challenge.sport?.toLowerCase()] || sportImages.academia;

  const tabCount = isCreator ? 4 : 3;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background pb-24">
      <div className="h-64 relative">
        <img src={heroImage} alt={challenge.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <header className="absolute top-0 left-0 right-0 px-6 py-6 flex items-center justify-between z-10">
          <button onClick={() => setLocation("/dashboard")} className="p-2 -ml-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white" data-testid="button-back">
            <ChevronLeft size={24} />
          </button>
          <button className="p-2 -mr-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white" data-testid="button-share">
            <Share2 size={20} />
          </button>
        </header>
        <div className="absolute bottom-4 left-6 right-6">
          <div className="flex gap-2 mb-2 items-center">
            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/20 capitalize">{challenge.sport}</Badge>
            {isChallengeEnded && <Badge className="bg-red-500 text-white border-none">Finalizado</Badge>}
            {isCreator && <Badge className="bg-orange-500 text-white border-none flex gap-1 items-center px-2 py-0.5"><ShieldAlert size={10} /> Criador</Badge>}
          </div>
          <h1 className="text-3xl font-display font-bold text-white drop-shadow-md">{challenge.title}</h1>
        </div>
      </div>

      <div className="px-6 mt-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid h-12 rounded-xl bg-muted p-1`} style={{ gridTemplateColumns: `repeat(${tabCount}, 1fr)` }}>
            <TabsTrigger value="progresso" className="rounded-lg font-bold">Resumo</TabsTrigger>
            <TabsTrigger value="ranking" className="rounded-lg font-bold">Ranking</TabsTrigger>
            <TabsTrigger value="chat" className="rounded-lg font-bold">Chat</TabsTrigger>
            {isCreator && <TabsTrigger value="mod" className="rounded-lg font-bold flex gap-1 items-center text-orange-600 dark:text-orange-400"><ShieldAlert size={14}/> Mod</TabsTrigger>}
          </TabsList>

          <TabsContent value="progresso" className="space-y-6 mt-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                <p className="text-muted-foreground text-[10px] uppercase font-bold mb-1 tracking-wider">Pote Total</p>
                <p className="text-2xl font-display font-bold text-primary" data-testid="text-prize-pool">{formatBRL(prizePool)}</p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                <p className="text-muted-foreground text-[10px] uppercase font-bold mb-1 tracking-wider">Seu Investimento</p>
                <p className="text-2xl font-display font-bold" data-testid="text-entry-fee">{formatBRL(entryFee)}</p>
              </div>
            </div>

            {isParticipant && !isChallengeEnded && (
              <div className="border border-primary/20 bg-primary/5 rounded-3xl p-6 space-y-4">
                <h3 className="font-display font-bold text-lg">Seu Status</h3>
                <p className="text-sm text-muted-foreground">Você está participando deste desafio!</p>
                <Button className="w-full h-14 rounded-2xl font-bold bg-foreground text-background dark:bg-white dark:text-black mt-2 shadow-xl" onClick={() => setLocation(`/check-in/${id}`)} data-testid="button-checkin">
                  <Camera className="mr-2" size={20} /> Fazer Check-in Hoje
                </Button>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground px-1">Regras & Info</h4>
              <div className="bg-card border border-border rounded-2xl p-4 space-y-3 text-sm">
                <div className="flex items-center gap-3"><Clock size={16} className="text-primary" /> <span>{isChallengeEnded ? "Desafio finalizado" : `${daysLeft} dias restantes`}</span></div>
                <div className="flex items-center gap-3"><Users size={16} className="text-primary" /> <span>{activeParticipants.length} participantes ativos</span></div>
                <div className="flex items-center gap-3"><Info size={16} className="text-primary" /> <span>Validação: {challenge.validationType || "foto"}</span></div>
                {challenge.description && (
                  <div className="flex items-start gap-3"><Info size={16} className="text-primary shrink-0 mt-0.5" /> <span>{challenge.description}</span></div>
                )}
              </div>
            </div>

            {isParticipant && !isCreator && !isChallengeEnded && (
              <Button
                variant="outline"
                className="w-full h-12 rounded-2xl text-red-500 border-red-500/20 hover:bg-red-500/10 font-bold"
                onClick={() => setQuitDialogOpen(true)}
                data-testid="button-quit-challenge"
              >
                <LogOut className="mr-2" size={18} /> Desistir do Desafio
              </Button>
            )}
          </TabsContent>

          <TabsContent value="ranking" className="mt-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-card border border-border rounded-[2rem] overflow-hidden divide-y divide-border shadow-sm">
              {participants.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">Nenhum participante ainda</p>
              )}
              {[...participants].sort((a: any, b: any) => (b.score || 0) - (a.score || 0)).map((p: any, i: number) => (
                <div key={p.userId} className={`flex items-center gap-4 p-5 ${p.userId === user?.id ? 'bg-primary/5' : ''} ${!p.isActive ? 'opacity-50 grayscale' : ''}`}>
                  <span className="w-6 font-display font-bold text-muted-foreground text-center">{i + 1}</span>
                  <Avatar className="w-12 h-12 border-2 border-border shadow-sm">
                    <AvatarImage src={p.user?.avatar} />
                    <AvatarFallback>{(p.user?.name || "?").charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{p.user?.name || "Usuário"}{p.userId === user?.id ? " (Você)" : ""}</p>
                    {!p.isActive && <Badge variant="destructive" className="text-[8px] h-4 py-0 font-bold uppercase tracking-tighter">Desistiu</Badge>}
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-lg">{p.score || 0}</p>
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
                  {chatMessages.length === 0 && (
                    <div className="text-center py-12 space-y-2">
                      <MessageCircle className="mx-auto text-muted-foreground" size={32} />
                      <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>
                      <p className="text-xs text-muted-foreground">Seja o primeiro a mandar uma mensagem!</p>
                    </div>
                  )}
                  {chatMessages.map((msg: any) => {
                    const isMe = msg.userId === user?.id;
                    return (
                      <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={msg.user?.avatar} />
                          <AvatarFallback>{(msg.user?.name || "?").charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className={`flex flex-col ${isMe ? 'items-end' : ''}`}>
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-[10px] font-bold text-muted-foreground">{isMe ? "Você" : msg.user?.name}</span>
                            <span className="text-[8px] text-muted-foreground/60">
                              {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : ""}
                            </span>
                          </div>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                            isMe
                              ? 'bg-primary text-primary-foreground rounded-tr-sm'
                              : 'bg-muted rounded-tl-sm'
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>
              {isParticipant && (
                <div className="mt-4 flex gap-2 pt-4 border-t border-border">
                  <Input
                    placeholder="Mande uma mensagem pro grupo..."
                    className="rounded-full bg-muted/50 border-none"
                    value={chatMessage}
                    onChange={e => setChatMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    data-testid="input-chat-message"
                  />
                  <Button size="icon" className="rounded-full shrink-0" onClick={handleSendMessage} disabled={sendMessageMutation.isPending} data-testid="button-send-message">
                    {sendMessageMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                  </Button>
                </div>
              )}
              {!isParticipant && (
                <p className="text-center text-xs text-muted-foreground py-2">Participe do desafio para enviar mensagens</p>
              )}
            </div>
          </TabsContent>

          {isCreator && (
            <TabsContent value="mod" className="space-y-6 mt-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex gap-3 items-start">
                <ShieldAlert className="text-orange-500 shrink-0 mt-1" size={18} />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-orange-600 dark:text-orange-400">Área de Moderação</p>
                  <p className="text-xs text-orange-600/80 dark:text-orange-400/80">Você é o criador deste desafio. Revise as evidências e gerencie os participantes.</p>
                </div>
              </div>

              {isChallengeEnded && (
                <div className="bg-primary/10 border border-primary/20 rounded-[2rem] p-8 text-center space-y-6">
                  <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary">
                    <Trophy size={40} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-display font-bold">Aprovação Final</h3>
                    <p className="text-sm text-muted-foreground">O desafio terminou. Confirme os vencedores para distribuir <strong>{formatBRL(prizePool)}</strong>.</p>
                  </div>
                  <Button className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold shadow-xl shadow-primary/20" data-testid="button-finalize">
                    <CheckCircle2 className="mr-2" size={20} /> Liberar Pagamentos
                  </Button>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground px-1">Participantes</h4>
                {participants.map((p: any) => (
                  <div key={p.userId} className={`bg-card border border-border rounded-xl p-3 flex items-center gap-3 ${!p.isActive ? 'opacity-50' : ''}`}>
                    <Avatar className="w-10 h-10 border border-border">
                      <AvatarImage src={p.user?.avatar} />
                      <AvatarFallback>{(p.user?.name || "?").charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{p.user?.name}</p>
                      <p className="text-[10px] text-muted-foreground">{p.isActive ? `Score: ${p.score || 0}` : "Desistiu"}</p>
                    </div>
                    {!p.isActive && <Badge variant="destructive" className="text-[8px]">Inativo</Badge>}
                  </div>
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      <Dialog open={quitDialogOpen} onOpenChange={setQuitDialogOpen}>
        <DialogContent className="rounded-3xl max-w-[380px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="w-16 h-16 mx-auto bg-red-500/15 rounded-full flex items-center justify-center mb-2">
              <AlertCircle className="text-red-500" size={32} />
            </div>
            <DialogTitle className="text-center text-xl">Desistir do Desafio?</DialogTitle>
            <DialogDescription className="text-center">
              Tem certeza que deseja desistir?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 space-y-2 text-sm">
            <p className="font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle size={16} /> Atenção — você vai perder dinheiro!
            </p>
            <ul className="space-y-1 text-red-600/80 dark:text-red-400/80 text-xs list-disc pl-5">
              <li>Seu valor de entrada de <strong>{formatBRL(entryFee)}</strong> não será devolvido</li>
              <li>O dinheiro ficará no pote do desafio para os vencedores</li>
              <li>Você <strong>não poderá voltar</strong> ao desafio depois</li>
              <li>Essa ação é <strong>irreversível</strong></li>
            </ul>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl font-bold"
              onClick={() => setQuitDialogOpen(false)}
              data-testid="button-cancel-quit"
            >
              Voltar ao Desafio
            </Button>
            <Button
              variant="destructive"
              className="w-full h-12 rounded-xl font-bold"
              disabled={quitMutation.isPending}
              onClick={() => quitMutation.mutate()}
              data-testid="button-confirm-quit"
            >
              {quitMutation.isPending ? (
                <Loader2 className="animate-spin mr-2" size={18} />
              ) : (
                <LogOut className="mr-2" size={18} />
              )}
              Sim, quero desistir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
