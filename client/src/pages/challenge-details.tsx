import { Link, useLocation, useParams } from "wouter";
import { ChevronLeft, Share2, Camera, Trophy, Users, Clock, ShieldAlert, CheckCircle2, XCircle, AlertCircle, Info, Send, LogOut, Loader2, MessageCircle, Pencil, Lock, Unlock, Save, UserPlus, Hourglass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
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
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editRules, setEditRules] = useState("");
  const [editPrivate, setEditPrivate] = useState(false);

  const { data: challenge, isLoading } = useQuery({
    queryKey: [`/api/challenges/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/challenges/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Desafio não encontrado");
      return res.json();
    },
    enabled: !!id,
    refetchInterval: 15000,
  });

  const { data: chatMessages = [], refetch: refetchMessages } = useQuery({
    queryKey: [`/api/challenges/${id}/messages`],
    queryFn: async () => {
      const res = await fetch(`/api/challenges/${id}/messages`, { credentials: "include" });
      return res.ok ? res.json() : [];
    },
    enabled: !!id && activeTab === "chat" && challenge?.isParticipant,
    refetchInterval: 5000,
  });

  const { data: checkInHistory = [] } = useQuery({
    queryKey: [`/api/check-ins/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/check-ins/${id}`, { credentials: "include" });
      return res.ok ? res.json() : [];
    },
    enabled: !!id && !!challenge?.isParticipant,
    refetchInterval: 30000,
  });

  const { data: joinRequests = [], refetch: refetchJoinRequests } = useQuery({
    queryKey: [`/api/challenges/${id}/join-requests`],
    queryFn: async () => {
      const res = await fetch(`/api/challenges/${id}/join-requests`, { credentials: "include" });
      return res.ok ? res.json() : [];
    },
    enabled: !!id && user?.id === challenge?.createdBy,
    refetchInterval: 10000,
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

  const requestJoinMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/challenges/${id}/request-join`);
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Solicitação enviada!", description: "O moderador irá analisar seu pedido." });
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${id}`] });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const approveRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await apiRequest("POST", `/api/challenges/${id}/join-requests/${requestId}/approve`);
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Aprovado!", description: "Participante adicionado ao desafio." });
      refetchJoinRequests();
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${id}`] });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await apiRequest("POST", `/api/challenges/${id}/join-requests/${requestId}/reject`);
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Recusado", description: "Solicitação recusada." });
      refetchJoinRequests();
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const editChallengeMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/challenges/${id}`, data);
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Salvo!", description: "Desafio atualizado com sucesso" });
      setEditMode(false);
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${id}`] });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const startEdit = () => {
    if (!challenge) return;
    setEditTitle(challenge.title || "");
    setEditDescription(challenge.description || "");
    setEditRules(challenge.rules || "");
    setEditPrivate(challenge.isPrivate || false);
    setEditMode(true);
  };

  const saveEdit = () => {
    editChallengeMutation.mutate({
      title: editTitle,
      description: editDescription,
      rules: editRules,
      isPrivate: editPrivate,
    });
  };

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
  const hasStarted = challenge.hasStarted;
  const joinRequestStatus = challenge.joinRequestStatus;
  const pendingRequests = joinRequests.filter((r: any) => r.status === "pending");

  const daysLeft = challenge.startDate
    ? Math.max(0, Math.ceil((new Date(challenge.startDate).getTime() + (challenge.duration || 30) * 86400000 - Date.now()) / 86400000))
    : 0;

  const hasBanner = challenge.banner && challenge.banner.length > 10;

  const sportGradients: Record<string, string> = {
    corrida: "from-green-600/30 via-emerald-500/20 to-primary/10",
    academia: "from-blue-600/30 via-indigo-500/20 to-primary/10",
    ciclismo: "from-yellow-600/30 via-orange-500/20 to-primary/10",
    natacao: "from-cyan-600/30 via-blue-500/20 to-primary/10",
    funcional: "from-red-600/30 via-orange-500/20 to-primary/10",
  };
  const sportGradient = sportGradients[challenge.sport?.toLowerCase()] || "from-primary/30 via-primary/10 to-background";

  const tabCount = isCreator ? 4 : isParticipant ? 3 : 2;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background pb-24">
      <div className="h-52 relative">
        {hasBanner ? (
          <>
            <img src={challenge.banner} alt={challenge.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          </>
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${sportGradient}`} />
        )}
        <header className="absolute top-0 left-0 right-0 px-6 py-6 flex items-center justify-between z-10">
          <button onClick={() => setLocation("/dashboard")} className={`p-2 -ml-2 rounded-full backdrop-blur-md border ${hasBanner ? 'bg-black/40 border-white/10 text-white' : 'bg-background/60 border-border text-foreground'}`} data-testid="button-back">
            <ChevronLeft size={24} />
          </button>
          <button className={`p-2 -mr-2 rounded-full backdrop-blur-md border ${hasBanner ? 'bg-black/40 border-white/10 text-white' : 'bg-background/60 border-border text-foreground'}`} data-testid="button-share">
            <Share2 size={20} />
          </button>
        </header>
        <div className="absolute bottom-4 left-6 right-6">
          <div className="flex gap-2 mb-2 items-center">
            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/20 capitalize">{challenge.sport}</Badge>
            {isChallengeEnded && <Badge className="bg-red-500 text-white border-none">Finalizado</Badge>}
            {challenge.isPrivate && <Badge className="bg-yellow-600 text-white border-none flex gap-1 items-center px-2 py-0.5"><Lock size={10} /> Privado</Badge>}
            {isCreator && <Badge className="bg-orange-500 text-white border-none flex gap-1 items-center px-2 py-0.5"><ShieldAlert size={10} /> Criador</Badge>}
          </div>
          <h1 className={`text-3xl font-display font-bold drop-shadow-md ${hasBanner ? 'text-white' : 'text-foreground'}`}>{challenge.title}</h1>
        </div>
      </div>

      <div className="px-6 mt-6 space-y-6">
        {!isParticipant && !isCreator && !isChallengeEnded && (
          <div className="border border-primary/20 bg-primary/5 rounded-3xl p-6 space-y-4">
            {hasStarted ? (
              <>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Lock size={20} />
                  <div>
                    <p className="font-bold text-sm text-foreground">Desafio já começou</p>
                    <p className="text-xs">Não é mais possível entrar neste desafio.</p>
                  </div>
                </div>
              </>
            ) : joinRequestStatus === "pending" ? (
              <div className="flex items-center gap-3 text-yellow-600 dark:text-yellow-400">
                <Hourglass size={20} />
                <div>
                  <p className="font-bold text-sm">Solicitação pendente</p>
                  <p className="text-xs text-muted-foreground">Aguardando aprovação do moderador.</p>
                </div>
              </div>
            ) : joinRequestStatus === "rejected" ? (
              <div className="flex items-center gap-3 text-red-500">
                <XCircle size={20} />
                <div>
                  <p className="font-bold text-sm">Solicitação recusada</p>
                  <p className="text-xs text-muted-foreground">O moderador recusou sua participação neste desafio.</p>
                </div>
              </div>
            ) : (
              <>
                <h3 className="font-display font-bold text-lg">Quer participar?</h3>
                <p className="text-sm text-muted-foreground">
                  Envie uma solicitação para o moderador. Após aprovação, a taxa de entrada de <strong>{formatBRL(entryFee)}</strong> será cobrada.
                </p>
                <Button
                  className="w-full h-14 rounded-2xl font-bold bg-primary text-primary-foreground shadow-xl shadow-primary/20"
                  onClick={() => requestJoinMutation.mutate()}
                  disabled={requestJoinMutation.isPending}
                  data-testid="button-request-join"
                >
                  {requestJoinMutation.isPending ? (
                    <Loader2 className="animate-spin mr-2" size={18} />
                  ) : (
                    <UserPlus className="mr-2" size={20} />
                  )}
                  Pedir para Participar
                </Button>
              </>
            )}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid h-12 rounded-xl bg-muted p-1`} style={{ gridTemplateColumns: `repeat(${tabCount}, 1fr)` }}>
            <TabsTrigger value="progresso" className="rounded-lg font-bold">Resumo</TabsTrigger>
            <TabsTrigger value="ranking" className="rounded-lg font-bold">Ranking</TabsTrigger>
            {isParticipant && <TabsTrigger value="chat" className="rounded-lg font-bold">Chat</TabsTrigger>}
            {isCreator && (
              <TabsTrigger value="mod" className="rounded-lg font-bold flex gap-1 items-center text-orange-600 dark:text-orange-400">
                <ShieldAlert size={14}/>
                Mod
                {pendingRequests.length > 0 && (
                  <span className="ml-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">{pendingRequests.length}</span>
                )}
              </TabsTrigger>
            )}
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
                {hasStarted ? (
                  <>
                    <p className="text-sm text-muted-foreground">Você está participando deste desafio!</p>
                    <Button className="w-full h-14 rounded-2xl font-bold bg-foreground text-background dark:bg-white dark:text-black mt-2 shadow-xl" onClick={() => setLocation(`/check-in/${id}`)} data-testid="button-checkin">
                      <Camera className="mr-2" size={20} /> Fazer Check-in Hoje
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Hourglass size={20} className="text-yellow-500" />
                    <div>
                      <p className="font-bold text-sm text-foreground">Aguardando início</p>
                      <p className="text-xs">O desafio começa em {challenge.startDate ? new Date(challenge.startDate).toLocaleDateString("pt-BR") : "breve"}. Check-ins estarão disponíveis após o início.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground px-1">Regras & Info</h4>
              <div className="bg-card border border-border rounded-2xl p-4 space-y-3 text-sm">
                <div className="flex items-center gap-3"><Clock size={16} className="text-primary" /> <span>{isChallengeEnded ? "Desafio finalizado" : hasStarted ? `${daysLeft} dias restantes` : "Ainda não começou"}</span></div>
                <div className="flex items-center gap-3"><Users size={16} className="text-primary" /> <span>{activeParticipants.length} participantes ativos</span></div>
                <div className="flex items-center gap-3"><Info size={16} className="text-primary" /> <span>Validação: {challenge.validationType || "foto"}</span></div>
                {challenge.description && (
                  <div className="flex items-start gap-3"><Info size={16} className="text-primary shrink-0 mt-0.5" /> <span>{challenge.description}</span></div>
                )}
              </div>
            </div>

            {participants.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                  <Trophy size={14} /> Ranking
                </h4>
                <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
                  {[...participants].sort((a: any, b: any) => (b.score || 0) - (a.score || 0)).slice(0, 5).map((p: any, i: number) => (
                    <div key={p.userId} className={`flex items-center gap-3 p-3 ${p.userId === user?.id ? 'bg-primary/5' : ''} ${!p.isActive ? 'opacity-50' : ''}`}>
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-gray-300 text-black' : i === 2 ? 'bg-orange-600 text-white' : 'bg-muted text-muted-foreground'}`}>{i + 1}</span>
                      <Avatar className="w-8 h-8 border border-border">
                        <AvatarImage src={p.user?.avatar} />
                        <AvatarFallback className="text-[10px]">{(p.user?.name || "?").charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{p.user?.name || "Usuário"}{p.userId === user?.id ? " (Você)" : ""}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{p.score || 0}</p>
                        <p className="text-[8px] text-muted-foreground uppercase">check-ins</p>
                      </div>
                    </div>
                  ))}
                  {participants.length > 5 && (
                    <button className="w-full p-2 text-xs text-primary font-bold hover:bg-primary/5 transition-colors" onClick={() => setActiveTab("ranking")}>
                      Ver ranking completo
                    </button>
                  )}
                </div>
              </div>
            )}

            {isParticipant && checkInHistory.filter((c: any) => c.status === "completed" && c.userId === user?.id).length > 0 && (
              <div className="space-y-3">
                <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                  <Camera size={14} /> Seus Check-ins
                </h4>
                <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
                  {checkInHistory.filter((c: any) => c.status === "completed" && c.userId === user?.id).slice(0, 10).map((c: any) => (
                    <div key={c.id} className="flex items-center gap-3 p-3">
                      {c.photoUrl ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-border shrink-0">
                          <img src={c.photoUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <CheckCircle2 size={16} className="text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold">
                          {new Date(c.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                          {" às "}
                          {new Date(c.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          {c.durationMins && <span>{c.durationMins} min</span>}
                          {c.distanceKm && Number(c.distanceKm) > 0 && <span>• {Number(c.distanceKm).toFixed(2)} km</span>}
                          {c.caloriesBurned && <span>• {c.caloriesBurned} kcal</span>}
                        </div>
                      </div>
                      <CheckCircle2 size={16} className="text-primary shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                <div key={p.userId} className={`flex items-center gap-4 p-5 cursor-pointer hover:bg-muted/50 transition-colors ${p.userId === user?.id ? 'bg-primary/5' : ''} ${!p.isActive ? 'opacity-50 grayscale' : ''}`} onClick={() => p.user?.username && p.userId !== user?.id && setLocation(`/user/${p.user.username}`)} data-testid={`participant-${p.userId}`}>
                  <span className="w-6 font-display font-bold text-muted-foreground text-center">{i + 1}</span>
                  <Avatar className="w-12 h-12 border-2 border-border shadow-sm">
                    <AvatarImage src={p.user?.avatar} />
                    <AvatarFallback>{(p.user?.name || "?").charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{p.user?.name || "Usuário"}{p.userId === user?.id ? " (Você)" : ""}</p>
                    {p.user?.username && p.userId !== user?.id && <p className="text-[10px] text-muted-foreground">@{p.user.username}</p>}
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

          {isParticipant && (
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
              </div>
            </TabsContent>
          )}

          {isCreator && (
            <TabsContent value="mod" className="space-y-6 mt-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex gap-3 items-start">
                <ShieldAlert className="text-orange-500 shrink-0 mt-1" size={18} />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-orange-600 dark:text-orange-400">Área de Moderação</p>
                  <p className="text-xs text-orange-600/80 dark:text-orange-400/80">Você é o criador deste desafio. Aprove solicitações e gerencie participantes.</p>
                </div>
              </div>

              {pendingRequests.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                    <UserPlus size={14} /> Solicitações Pendentes
                    <span className="ml-auto bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-bold">{pendingRequests.length}</span>
                  </h4>
                  {pendingRequests.map((req: any) => (
                    <div key={req.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
                      <Avatar className="w-12 h-12 border-2 border-border">
                        <AvatarImage src={req.userAvatar} />
                        <AvatarFallback>{(req.userName || "?").charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{req.userName}</p>
                        <p className="text-[10px] text-muted-foreground">@{req.userUsername} · {req.createdAt ? new Date(req.createdAt).toLocaleDateString("pt-BR") : ""}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="icon"
                          variant="outline"
                          className="w-10 h-10 rounded-xl border-red-500/30 text-red-500 hover:bg-red-500/10"
                          onClick={() => rejectRequestMutation.mutate(req.id)}
                          disabled={rejectRequestMutation.isPending}
                          data-testid={`button-reject-${req.id}`}
                        >
                          <XCircle size={18} />
                        </Button>
                        <Button
                          size="icon"
                          className="w-10 h-10 rounded-xl bg-primary text-primary-foreground"
                          onClick={() => approveRequestMutation.mutate(req.id)}
                          disabled={approveRequestMutation.isPending}
                          data-testid={`button-approve-${req.id}`}
                        >
                          <CheckCircle2 size={18} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm flex items-center gap-2"><Pencil size={14} /> Editar Desafio</h4>
                  {!editMode ? (
                    <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl" onClick={startEdit} data-testid="button-start-edit">
                      Editar
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setEditMode(false)}>Cancelar</Button>
                      <Button size="sm" className="h-8 text-xs rounded-xl" onClick={saveEdit} disabled={editChallengeMutation.isPending} data-testid="button-save-edit">
                        {editChallengeMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <><Save size={14} className="mr-1" /> Salvar</>}
                      </Button>
                    </div>
                  )}
                </div>

                {editMode ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Título</label>
                      <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="rounded-xl" data-testid="input-edit-title" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Descrição</label>
                      <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} className="w-full bg-background border border-border rounded-xl p-3 focus:border-primary outline-none min-h-[80px] resize-none text-sm" data-testid="input-edit-description" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Regras</label>
                      <textarea value={editRules} onChange={e => setEditRules(e.target.value)} className="w-full bg-background border border-border rounded-xl p-3 focus:border-primary outline-none min-h-[80px] resize-none text-sm" data-testid="input-edit-rules" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                      <div className="flex items-center gap-2">
                        {editPrivate ? <Lock size={16} className="text-orange-500" /> : <Unlock size={16} className="text-primary" />}
                        <span className="text-sm font-bold">{editPrivate ? "Privado" : "Público"}</span>
                      </div>
                      <Switch checked={editPrivate} onCheckedChange={setEditPrivate} className="data-[state=checked]:bg-orange-500" data-testid="switch-edit-private" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {challenge.isPrivate ? <Lock size={14} /> : <Unlock size={14} />}
                      <span>{challenge.isPrivate ? "Desafio Privado" : "Desafio Público"}</span>
                    </div>
                    {challenge.description && <p className="text-muted-foreground text-xs">{challenge.description}</p>}
                  </div>
                )}
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
                  <div key={p.userId} className={`bg-card border border-border rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-primary/50 transition-colors ${!p.isActive ? 'opacity-50' : ''}`} onClick={() => p.user?.username && p.userId !== user?.id && setLocation(`/user/${p.user.username}`)}>
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

              {joinRequests.filter((r: any) => r.status !== "pending").length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground px-1">Histórico de Solicitações</h4>
                  {joinRequests.filter((r: any) => r.status !== "pending").map((req: any) => (
                    <div key={req.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 opacity-60">
                      <Avatar className="w-10 h-10 border border-border">
                        <AvatarImage src={req.userAvatar} />
                        <AvatarFallback>{(req.userName || "?").charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-bold text-sm">{req.userName}</p>
                        <p className="text-[10px] text-muted-foreground">@{req.userUsername}</p>
                      </div>
                      <Badge className={req.status === "approved" ? "bg-green-500/20 text-green-600 border-none" : "bg-red-500/20 text-red-500 border-none"}>
                        {req.status === "approved" ? "Aprovado" : "Recusado"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
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
