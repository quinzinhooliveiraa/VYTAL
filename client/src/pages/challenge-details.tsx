import { Link, useLocation, useParams } from "wouter";
import { ChevronLeft, Share2, Camera, Trophy, Users, Clock, ShieldAlert, CheckCircle2, XCircle, AlertCircle, Info, Send, LogOut, Loader2, MessageCircle, Pencil, Lock, Unlock, Save, UserPlus, Hourglass, MapPin, AlertTriangle, Flag, Zap, Copy, Check, ExternalLink, Coffee, MinusCircle, PlusCircle, UserX, Scale, ArrowDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { DepositDrawer } from "@/components/deposit-drawer";
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
  const [editMaxParticipants, setEditMaxParticipants] = useState(50);
  const [editSkipWeekends, setEditSkipWeekends] = useState(false);
  const [editRestDays, setEditRestDays] = useState<string[]>([]);
  const [editRestDaysAllowed, setEditRestDaysAllowed] = useState(0);
  const [editStartDate, setEditStartDate] = useState("");
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedNewMod, setSelectedNewMod] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false);
  const [selectedWinners, setSelectedWinners] = useState<string[]>([]);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [tieWith2nd, setTieWith2nd] = useState(false);
  const [tieWith3rd, setTieWith3rd] = useState(false);
  const [depositDrawerOpen, setDepositDrawerOpen] = useState(false);

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
    refetchInterval: 10000,
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

  const { data: flaggedCheckIns = [] } = useQuery({
    queryKey: [`/api/check-ins/${id}/flagged`],
    queryFn: async () => {
      const res = await fetch(`/api/check-ins/${id}/flagged`, { credentials: "include" });
      return res.ok ? res.json() : [];
    },
    enabled: !!id && !!(challenge?.isCreator || challenge?.isCoModerator),
    refetchInterval: 30000,
  });

  const unflagMutation = useMutation({
    mutationFn: (checkInId: string) => apiRequest("POST", `/api/check-ins/${checkInId}/unflag`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/check-ins/${id}/flagged`] });
      toast({ title: "Atividade aprovada", description: "O alerta foi removido." });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const invalidateMutation = useMutation({
    mutationFn: (checkInId: string) => apiRequest("POST", `/api/check-ins/${checkInId}/invalidate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/check-ins/${id}/flagged`] });
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${id}`] });
      toast({ title: "Check-in invalidado", description: "Ponto deduzido do participante." });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const eliminateMutation = useMutation({
    mutationFn: (participantUserId: string) => apiRequest("POST", `/api/challenges/${id}/participants/${participantUserId}/eliminate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/check-ins/${id}/flagged`] });
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${id}`] });
      toast({ title: "Participante eliminado", description: "O usuário foi removido do desafio." });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const adjustMissedDaysMutation = useMutation({
    mutationFn: ({ userId, delta }: { userId: string; delta: 1 | -1 }) =>
      apiRequest("POST", `/api/challenges/${id}/participants/${userId}/adjust-missed-days`, { delta }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${id}`] });
      toast({ title: "Faltas ajustadas" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const finalizeMutation = useMutation({
    mutationFn: (payload: { winnerUserIds?: string[], winnerGroups?: string[][] }) =>
      apiRequest("POST", `/api/challenges/${id}/finalize`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${id}`] });
      setFinalizeDialogOpen(false);
      setTieWith2nd(false);
      setTieWith3rd(false);
      toast({ title: "Desafio finalizado!", description: "Os prêmios foram distribuídos." });
    },
    onError: (e: any) => toast({ title: "Erro ao finalizar", description: e.message, variant: "destructive" }),
  });

  const { data: joinRequests = [], refetch: refetchJoinRequests } = useQuery({
    queryKey: [`/api/challenges/${id}/join-requests`],
    queryFn: async () => {
      const res = await fetch(`/api/challenges/${id}/join-requests`, { credentials: "include" });
      return res.ok ? res.json() : [];
    },
    enabled: !!id && !!(user?.id === challenge?.createdBy || challenge?.isCoModerator),
    refetchInterval: 30000,
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

  const transferCreatorMutation = useMutation({
    mutationFn: async (newCreatorId: string) => {
      const res = await apiRequest("POST", `/api/challenges/${id}/transfer-creator`, { newCreatorId });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Transferido!", description: data.message });
      setTransferDialogOpen(false);
      setSelectedNewMod(null);
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${id}`] });
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

  const addCoModMutation = useMutation({
    mutationFn: (targetUserId: string) => apiRequest("POST", `/api/challenges/${id}/comoderator/${targetUserId}`),
    onSuccess: (res: any) => {
      res.json().then((d: any) => toast({ title: "Co-moderador adicionado", description: d.message }));
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${id}`] });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const removeCoModMutation = useMutation({
    mutationFn: (targetUserId: string) => apiRequest("DELETE", `/api/challenges/${id}/comoderator/${targetUserId}`),
    onSuccess: () => {
      toast({ title: "Co-moderador removido" });
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${id}`] });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
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

  const useRestDayMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/challenges/${id}/use-rest-day`);
      const d = await res.json();
      if (!res.ok) throw new Error(d.message);
      return d;
    },
    onSuccess: (data) => {
      toast({ title: "Dia de descanso!", description: `${data.restDaysRemaining} dia${data.restDaysRemaining !== 1 ? "s" : ""} restante${data.restDaysRemaining !== 1 ? "s" : ""}` });
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${id}`] });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const isoToDatetimeLocal = (iso: string | Date | null | undefined) => {
    if (!iso) return "";
    const d = new Date(iso as string);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const startEdit = () => {
    if (!challenge) return;
    setEditTitle(challenge.title || "");
    setEditDescription(challenge.description || "");
    setEditRules(challenge.rules || "");
    setEditPrivate(challenge.isPrivate || false);
    setEditMaxParticipants(challenge.maxParticipants || 50);
    setEditSkipWeekends((challenge as any).skipWeekends || false);
    setEditRestDays((challenge as any).restDays || []);
    setEditRestDaysAllowed((challenge as any).restDaysAllowed || 0);
    setEditStartDate(isoToDatetimeLocal(challenge.startDate));
    setEditMode(true);
  };

  const saveEdit = () => {
    editChallengeMutation.mutate({
      title: editTitle,
      description: editDescription,
      rules: editRules,
      isPrivate: editPrivate,
      maxParticipants: editMaxParticipants,
      skipWeekends: editSkipWeekends,
      restDays: editRestDays.length > 0 ? editRestDays : undefined,
      restDaysAllowed: editRestDaysAllowed,
      startDate: editStartDate ? new Date(editStartDate).toISOString() : undefined,
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
  const isCoModerator = !isCreator && !!challenge.isCoModerator;
  const canModerate = isCreator || isCoModerator;
  const isParticipant = challenge.isParticipant;
  const entryFee = Number(challenge.entryFee);
  const prizePool = activeParticipants.length * entryFee;

  const cType = challenge.type || "checkin";
  const cVType = challenge.validationType || "foto";

  const formatScore = (p: any) => {
    if (cType === "corrida" && cVType === "distancia") return `${((p.score || 0) / 100).toFixed(1)} km`;
    if (cType === "corrida" && cVType === "tempo") return `${p.score || 0} min`;
    if (cType === "ranking" && cVType === "distancia") return `${((p.score || 0) / 100).toFixed(1)} km`;
    if (cType === "ranking" && cVType === "tempo") return `${p.score || 0} min`;
    if (cVType === "repeticoes") return `${p.score || 0} reps`;
    return `${p.score || 0}`;
  };
  const scoreUnit = (() => {
    if ((cType === "corrida" || cType === "ranking") && cVType === "distancia") return "km total";
    if ((cType === "corrida" || cType === "ranking") && cVType === "tempo") return "minutos";
    if (cVType === "repeticoes") return "repetições";
    return "check-ins";
  })();
  const isChallengeEnded = !challenge.isActive || challenge.status === "completed";
  const hasStarted = challenge.hasStarted;
  const joinRequestStatus = challenge.joinRequestStatus;
  const pendingRequests = joinRequests.filter((r: any) => r.status === "pending");

  const daysLeft = challenge.startDate
    ? Math.max(0, Math.ceil((new Date(challenge.startDate).getTime() + (challenge.duration || 30) * 86400000 - Date.now()) / 86400000))
    : 0;

  const hasBanner = (challenge.image || challenge.banner) && (challenge.image || challenge.banner).length > 10;

  const sportGradients: Record<string, string> = {
    corrida: "from-green-600/30 via-emerald-500/20 to-primary/10",
    academia: "from-blue-600/30 via-indigo-500/20 to-primary/10",
    ciclismo: "from-yellow-600/30 via-orange-500/20 to-primary/10",
    natacao: "from-cyan-600/30 via-blue-500/20 to-primary/10",
    funcional: "from-red-600/30 via-orange-500/20 to-primary/10",
  };
  const sportGradient = sportGradients[challenge.sport?.toLowerCase()] || "from-primary/30 via-primary/10 to-background";

  const tabCount = canModerate ? 4 : isParticipant ? 3 : 2;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background pb-24">
      <div className="h-52 relative">
        {hasBanner ? (
          <>
            <img src={challenge.image || challenge.banner} alt={challenge.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          </>
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${sportGradient}`} />
        )}
        <header className="absolute top-0 left-0 right-0 px-6 py-6 flex items-center justify-between z-10">
          <button onClick={() => setLocation("/dashboard")} className={`p-2 -ml-2 rounded-full backdrop-blur-md border ${hasBanner ? 'bg-black/40 border-white/10 text-white' : 'bg-background/60 border-border text-foreground'}`} data-testid="button-back">
            <ChevronLeft size={24} />
          </button>
          <button
            className={`p-2 -mr-2 rounded-full backdrop-blur-md border ${hasBanner ? 'bg-black/40 border-white/10 text-white' : 'bg-background/60 border-border text-foreground'}`}
            data-testid="button-share"
            onClick={() => setShareDialogOpen(true)}
          >
            <Share2 size={20} />
          </button>
        </header>
        <div className="absolute bottom-4 left-6 right-6">
          <div className="flex gap-2 mb-2 items-center">
            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/20 capitalize">{challenge.sport}</Badge>
            {isChallengeEnded && <Badge className="bg-red-500 text-white border-none">Finalizado</Badge>}
            {challenge.isPrivate && <Badge className="bg-yellow-600 text-white border-none flex gap-1 items-center px-2 py-0.5"><Lock size={10} /> Privado</Badge>}
            {isCreator && <Badge className="bg-orange-500 text-white border-none flex gap-1 items-center px-2 py-0.5"><ShieldAlert size={10} /> Criador</Badge>}
            {isCoModerator && <Badge className="bg-blue-500 text-white border-none flex gap-1 items-center px-2 py-0.5"><ShieldAlert size={10} /> Co-mod</Badge>}
          </div>
          <h1 className={`text-3xl font-display font-bold drop-shadow-md ${hasBanner ? 'text-white' : 'text-foreground'}`}>{challenge.title}</h1>
        </div>
      </div>

      <div className="px-6 mt-6 space-y-6">
        {!isParticipant && !isCreator && !isChallengeEnded && (
          <div className="border border-primary/20 bg-primary/5 rounded-3xl p-6 space-y-4">
            {hasStarted && challenge.status === "active" ? (
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
            ) : !user ? (
              <>
                <h3 className="font-display font-bold text-lg">Quer participar?</h3>
                <p className="text-sm text-muted-foreground">
                  Crie sua conta ou faça login para entrar neste desafio. Taxa de entrada: <strong>{formatBRL(entryFee)}</strong>
                </p>
                <Button
                  className="w-full h-14 rounded-2xl font-bold bg-primary text-primary-foreground shadow-xl shadow-primary/20"
                  onClick={() => {
                    sessionStorage.setItem("vytal-redirect", `/challenge/${id}`);
                    setLocation("/login");
                  }}
                  data-testid="button-login-to-join"
                >
                  <UserPlus className="mr-2" size={20} />
                  Criar Conta / Entrar
                </Button>
              </>
            ) : (
              <>
                <h3 className="font-display font-bold text-lg">Quer participar?</h3>
                <p className="text-sm text-muted-foreground">
                  Envie uma solicitação ao moderador. Após aprovação, a taxa de entrada de <strong>{formatBRL(entryFee)}</strong> será cobrada.
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
                {entryFee > 0 && (
                  <Button
                    variant="outline"
                    className="w-full h-12 rounded-2xl font-semibold border-dashed"
                    onClick={() => setDepositDrawerOpen(true)}
                    data-testid="button-deposit-from-challenge"
                  >
                    <ArrowDownLeft className="mr-2" size={16} />
                    Depositar na Carteira
                  </Button>
                )}
              </>
            )}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid h-12 rounded-xl bg-muted p-1`} style={{ gridTemplateColumns: `repeat(${tabCount}, 1fr)` }}>
            <TabsTrigger value="progresso" className="rounded-lg font-bold">Resumo</TabsTrigger>
            <TabsTrigger value="ranking" className="rounded-lg font-bold">Ranking</TabsTrigger>
            {isParticipant && <TabsTrigger value="chat" className="rounded-lg font-bold">Chat</TabsTrigger>}
            {canModerate && (
              <TabsTrigger value="mod" className={`rounded-lg font-bold flex gap-1 items-center ${isCreator ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'}`}>
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
                    {(challenge as any).checkedInToday && (cType === "checkin" || cType === "survival") ? (
                      <div className="w-full h-14 rounded-2xl font-bold bg-green-500/15 border-2 border-green-500/30 flex items-center justify-center gap-2 text-green-500 mt-2">
                        <CheckCircle2 size={20} /> Check-in de Hoje Feito!
                      </div>
                    ) : (challenge as any).usedRestDayToday ? (
                      <div className="w-full h-14 rounded-2xl font-bold bg-blue-500/15 border-2 border-blue-500/30 flex items-center justify-center gap-2 text-blue-500 mt-2">
                        <Coffee size={20} /> Dia de Descanso Registrado Hoje
                      </div>
                    ) : (
                    <Button className="w-full h-14 rounded-2xl font-bold bg-foreground text-background dark:bg-white dark:text-black mt-2 shadow-xl" onClick={() => setLocation(`/check-in/${id}`)} data-testid="button-checkin">
                      <Camera className="mr-2" size={20} /> {cType === "checkin" || cType === "survival" ? "Fazer Check-in Hoje" : "Registrar Treino"}
                    </Button>
                    )}
                    {((challenge as any).restDaysAllowed || 0) > 0 && !(challenge as any).checkedInToday && !(challenge as any).usedRestDayToday && (() => {
                      const myP = participants?.find((p: any) => p.userId === user?.id);
                      const used = (myP as any)?.restDaysUsed || 0;
                      const allowed = (challenge as any).restDaysAllowed || 0;
                      const remaining = allowed - used;
                      return remaining > 0 ? (
                        <Button
                          variant="outline"
                          className="w-full h-12 rounded-2xl font-bold border-blue-500/30 text-blue-500 hover:bg-blue-500/10 mt-1"
                          onClick={() => useRestDayMutation.mutate()}
                          disabled={useRestDayMutation.isPending}
                          data-testid="button-use-rest-day"
                        >
                          {useRestDayMutation.isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : <Coffee className="mr-2" size={16} />}
                          Usar Dia de Descanso ({remaining}/{allowed})
                        </Button>
                      ) : (
                        <p className="text-center text-xs text-muted-foreground mt-1">Todos os {allowed} dias de descanso já foram usados</p>
                      );
                    })()}
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
                {((challenge as any).restDays?.length > 0) && (
                  <div className="flex items-center gap-3"><Coffee size={16} className="text-blue-500" /> <span>Folga: {(challenge as any).restDays.map((d: string) => ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"][parseInt(d)]).join(", ")}</span></div>
                )}
                {(challenge as any).skipWeekends && !((challenge as any).restDays?.length > 0) && (
                  <div className="flex items-center gap-3"><Coffee size={16} className="text-blue-500" /> <span>Finais de semana liberados</span></div>
                )}
                {((challenge as any).restDaysAllowed || 0) > 0 && (
                  <div className="flex items-center gap-3"><Coffee size={16} className="text-blue-500" /> <span>{(challenge as any).restDaysAllowed} dia{(challenge as any).restDaysAllowed !== 1 ? "s" : ""} de descanso por participante</span></div>
                )}
                {cType === "corrida" && challenge.goalTarget && (
                  <div className="flex items-center gap-3"><Trophy size={16} className="text-yellow-500" /> <span>Meta: {challenge.goalTarget} {cVType === "distancia" ? "km" : cVType === "tempo" ? "min" : cVType === "repeticoes" ? "reps" : "pontos"}</span></div>
                )}
                {challenge.description && (
                  <div className="flex items-start gap-3"><Info size={16} className="text-primary shrink-0 mt-0.5" /> <span>{challenge.description}</span></div>
                )}
                {(challenge as any).tiebreaker && (
                  <div className="flex items-start gap-3 pt-1 border-t border-border/50">
                    <Scale size={16} className="text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold uppercase text-orange-400 block">Critério de Desempate</span>
                      <span className="text-xs">{(challenge as any).tiebreaker}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <Zap size={12} />
                  {{ checkin: "Check-in Diário", corrida: "Modo Corrida", ranking: "Ranking de Performance", survival: "Sobrevivência" }[cType] || cType}
                </p>
                <div className="text-xs text-muted-foreground space-y-2 leading-relaxed">
                  {cType === "checkin" && (<>
                    <p>Cada participante precisa fazer check-in <strong className="text-foreground">todos os dias</strong> — selfie + foto do ambiente para comprovação.</p>
                    <p>Tolerância <strong className="text-destructive">ZERO</strong>: faltou <strong className="text-destructive">1 dia = eliminado automaticamente</strong>.</p>
                    <p>No final, quem completou todos os dias <strong className="text-green-500">divide o prêmio igualmente</strong>.</p>
                  </>)}
                  {cType === "corrida" && (<>
                    <p>Cada check-out acumula seu progresso real: {cVType === "distancia" ? "quilômetros percorridos via GPS" : cVType === "tempo" ? "minutos cronometrados" : cVType === "repeticoes" ? "repetições informadas" : "pontos acumulados"}.</p>
                    <p>O <strong className="text-foreground">primeiro a bater a meta{challenge.goalTarget ? ` de ${challenge.goalTarget} ${cVType === "distancia" ? "km" : cVType === "tempo" ? "min" : "reps"}` : ""}</strong> vence e leva o prêmio.</p>
                    <p>Se ninguém bater, quem chegou <strong className="text-yellow-500">mais perto ganha</strong>.</p>
                  </>)}
                  {cType === "ranking" && (<>
                    <p>Cada check-out acumula dados reais: {cVType === "distancia" ? "km percorridos via GPS" : cVType === "tempo" ? "minutos cronometrados" : cVType === "repeticoes" ? "repetições informadas" : "pontos do moderador"}.</p>
                    <p>No final do prazo, os <strong className="text-yellow-500">TOP 3 dividem o prêmio</strong> (50% / 30% / 20%).</p>
                    <p>Ranking atualiza em tempo real. Desistentes perdem a entrada.</p>
                  </>)}
                  {cType === "survival" && (<>
                    <p>Todos começam ativos e precisam fazer check-in <strong className="text-foreground">regularmente</strong>.</p>
                    <p>Tolerância de <strong className="text-orange-500">{(challenge as any).maxMissedDays || 3} falha{((challenge as any).maxMissedDays || 3) !== 1 ? "s" : ""}</strong>: acumulou mais que isso = <strong className="text-destructive">eliminado</strong>.</p>
                    <p>O prêmio vai para os <strong className="text-green-500">sobreviventes</strong>. Se mais de um sobreviver, dividem igualmente.</p>
                  </>)}
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-[10px] text-muted-foreground">
                    <strong className="text-foreground">Validação:</strong>{" "}
                    {{ foto: "Selfie + foto do ambiente (check-in duplo) com GPS", tempo: "Tempo cronometrado do check-in ao check-out", distancia: "Distância rastreada em tempo real via GPS", repeticoes: "Repetições informadas no check-out", combinacao: "Critérios personalizados pelo moderador" }[cVType] || "Foto"}
                  </p>
                </div>
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
                        <p className="text-sm font-bold">{formatScore(p)}</p>
                        <p className="text-[8px] text-muted-foreground uppercase">{scoreUnit}</p>
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

            {isParticipant && checkInHistory.filter((c: any) => c.status === "completed" || c.status === "rest_day").length > 0 && (
              <div className="space-y-3">
                <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                  <Camera size={14} /> Histórico de Check-ins
                </h4>
                <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
                  {checkInHistory.filter((c: any) => c.status === "completed" || c.status === "rest_day").slice(0, 30).map((c: any) => {
                    const pUser = participants.find((p: any) => p.userId === c.userId)?.user;
                    const isMe = c.userId === user?.id;
                    const showCal = cVType === "tempo" || cVType === "distancia" || cVType === "combinacao";
                    const isRestDay = c.status === "rest_day";
                    return (
                      <div key={c.id} className={`flex items-center gap-3 p-3 ${isMe ? (isRestDay ? "bg-blue-500/5" : "bg-primary/5") : ""}`} data-testid={`checkin-history-${c.id}`}>
                        {isRestDay ? (
                          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                            <Coffee size={16} className="text-blue-500" />
                          </div>
                        ) : c.photoUrl ? (
                          <div
                            className="w-10 h-10 rounded-lg overflow-hidden border border-border shrink-0 cursor-pointer active:opacity-80"
                            onClick={() => setLightboxPhoto(c.photoUrl)}
                            data-testid={`checkin-photo-thumb-${c.id}`}
                          >
                            <img src={c.photoUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={16} className="text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate">
                            {isMe ? "Você" : (pUser?.name || "Participante")}
                            <span className="text-muted-foreground font-normal ml-1">
                              {new Date(c.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                              {" "}
                              {new Date(c.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            {isRestDay ? (
                              <span className="text-blue-500">Dia de descanso</span>
                            ) : (
                              <>
                                {c.durationMins && <span>{c.durationMins} min</span>}
                                {c.distanceKm && Number(c.distanceKm) > 0 && <span>• {Number(c.distanceKm).toFixed(2)} km</span>}
                                {showCal && c.caloriesBurned && <span>• {c.caloriesBurned} kcal</span>}
                              </>
                            )}
                          </div>
                        </div>
                        {isRestDay ? (
                          <Coffee size={16} className="text-blue-500 shrink-0" />
                        ) : (
                          <CheckCircle2 size={16} className="text-primary shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {isParticipant && !isChallengeEnded && (
              <div className="space-y-2">
                {isCreator && (
                  <Button
                    variant="outline"
                    className="w-full h-12 rounded-2xl text-orange-500 border-orange-500/20 hover:bg-orange-500/10 font-bold"
                    onClick={() => { setSelectedNewMod(null); setTransferDialogOpen(true); }}
                    data-testid="button-transfer-mod"
                  >
                    <ShieldAlert className="mr-2" size={18} /> Transferir Moderação e Sair
                  </Button>
                )}
                {!isCreator && (
                  <Button
                    variant="outline"
                    className="w-full h-12 rounded-2xl text-red-500 border-red-500/20 hover:bg-red-500/10 font-bold"
                    onClick={() => setQuitDialogOpen(true)}
                    data-testid="button-quit-challenge"
                  >
                    <LogOut className="mr-2" size={18} /> Desistir do Desafio
                  </Button>
                )}
              </div>
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
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-bold text-sm">{p.user?.name || "Usuário"}{p.userId === user?.id ? " (Você)" : ""}</p>
                      {p.userId === challenge.createdBy && <span className="text-[9px] bg-orange-500/15 text-orange-500 border border-orange-500/30 px-1.5 py-0.5 rounded-full font-bold">MOD</span>}
                      {p.isAdmin && p.userId !== challenge.createdBy && <span className="text-[9px] bg-blue-500/15 text-blue-500 border border-blue-500/30 px-1.5 py-0.5 rounded-full font-bold">CO-MOD</span>}
                    </div>
                    {p.user?.username && p.userId !== user?.id && <p className="text-[10px] text-muted-foreground">@{p.user.username}</p>}
                    {!p.isActive && <Badge variant="destructive" className="text-[8px] h-4 py-0 font-bold uppercase tracking-tighter">Desistiu</Badge>}
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-lg">{formatScore(p)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">{scoreUnit}</p>
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

          {canModerate && (
            <TabsContent value="mod" className="space-y-6 mt-4 animate-in fade-in slide-in-from-bottom-2">
              {pendingRequests.length === 0 && flaggedCheckIns.length === 0 && !isChallengeEnded && (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 size={48} className="mx-auto mb-3 opacity-30 text-primary" />
                  <p className="text-sm font-bold">Tudo em dia!</p>
                  <p className="text-xs mt-1">Nenhuma atividade precisando de atenção</p>
                </div>
              )}

              {isCreator && isChallengeEnded && challenge.status !== "completed" && (
                <div className="bg-primary/10 border border-primary/20 rounded-[2rem] p-8 text-center space-y-6">
                  <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary">
                    <Trophy size={40} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-display font-bold">Aprovação Final</h3>
                    <p className="text-sm text-muted-foreground">O desafio terminou. Selecione os vencedores para distribuir <strong>{formatBRL(prizePool)}</strong>.</p>
                  </div>
                  <Button
                    className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold shadow-xl shadow-primary/20"
                    onClick={() => { setSelectedWinners([]); setFinalizeDialogOpen(true); }}
                    data-testid="button-finalize"
                  >
                    <Trophy className="mr-2" size={20} /> Selecionar Vencedores
                  </Button>
                </div>
              )}
              {challenge.status === "completed" && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-[2rem] p-6 text-center space-y-2">
                  <CheckCircle2 className="mx-auto text-green-500" size={32} />
                  <p className="font-bold text-green-500">Desafio Finalizado</p>
                  <p className="text-xs text-muted-foreground">Os prêmios já foram distribuídos.</p>
                </div>
              )}

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

              {flaggedCheckIns.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-sm uppercase tracking-widest text-red-500 px-1 flex items-center gap-2">
                    <Flag size={14} /> Check-ins Suspeitos
                    <span className="ml-auto bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-bold">{flaggedCheckIns.length}</span>
                  </h4>
                  {flaggedCheckIns.map((item: any) => {
                    const c = item.checkIn;
                    const u = item.user;
                    return (
                      <div key={c.id} className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 border-2 border-red-500/30">
                            {u.avatar && <AvatarImage src={u.avatar} />}
                            <AvatarFallback>{(u.name || "?").charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm">{u.name}</p>
                            <p className="text-[10px] text-muted-foreground">@{u.username} · {new Date(c.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                          <AlertTriangle size={18} className="text-red-500 shrink-0" />
                        </div>
                        <div className="bg-red-500/10 rounded-xl p-3">
                          <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-start gap-2">
                            <MapPin size={14} className="shrink-0 mt-0.5" />
                            {c.flagReason}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-card rounded-lg p-2 text-center">
                            <p className="text-[9px] text-muted-foreground font-bold uppercase">Check-in</p>
                            <p className="text-[11px] font-medium truncate">{c.locationName || "Sem local"}</p>
                          </div>
                          <div className="bg-card rounded-lg p-2 text-center">
                            <p className="text-[9px] text-muted-foreground font-bold uppercase">Check-out</p>
                            <p className="text-[11px] font-medium truncate">{c.endLocationName || "Sem local"}</p>
                          </div>
                        </div>
                        {(c.photoUrl || c.endPhotoUrl) && (
                          <div className="flex gap-2">
                            {c.photoUrl && (
                              <div className="flex-1">
                                <p className="text-[9px] text-muted-foreground font-bold uppercase mb-1">Foto início</p>
                                <img
                                  src={c.photoUrl}
                                  alt="Check-in"
                                  className="w-full h-20 object-cover rounded-lg border border-border cursor-pointer active:opacity-80"
                                  onClick={() => setLightboxPhoto(c.photoUrl)}
                                  data-testid={`checkin-photo-start-${c.id}`}
                                />
                              </div>
                            )}
                            {c.endPhotoUrl && (
                              <div className="flex-1">
                                <p className="text-[9px] text-muted-foreground font-bold uppercase mb-1">Foto fim</p>
                                <img
                                  src={c.endPhotoUrl}
                                  alt="Check-out"
                                  className="w-full h-20 object-cover rounded-lg border border-border cursor-pointer active:opacity-80"
                                  onClick={() => setLightboxPhoto(c.endPhotoUrl)}
                                  data-testid={`checkin-photo-end-${c.id}`}
                                />
                              </div>
                            )}
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-[11px] rounded-xl text-green-500 border-green-500/30 hover:bg-green-500/10"
                            onClick={() => unflagMutation.mutate(c.id)}
                            disabled={unflagMutation.isPending}
                            data-testid={`btn-unflag-${c.id}`}
                          >
                            {unflagMutation.isPending ? <Loader2 className="animate-spin" size={12} /> : "✓ Liberar"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-[11px] rounded-xl text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/10"
                            onClick={() => invalidateMutation.mutate(c.id)}
                            disabled={invalidateMutation.isPending}
                            data-testid={`btn-invalidate-${c.id}`}
                          >
                            {invalidateMutation.isPending ? <Loader2 className="animate-spin" size={12} /> : "✕ Invalidar"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-[11px] rounded-xl text-red-500 border-red-500/30 hover:bg-red-500/10"
                            onClick={() => eliminateMutation.mutate(u.id)}
                            disabled={eliminateMutation.isPending}
                            data-testid={`btn-eliminate-${u.id}`}
                          >
                            {eliminateMutation.isPending ? <Loader2 className="animate-spin" size={12} /> : "⊘ Eliminar"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {participants.filter((p: any) => p.isActive !== false).length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                    <Users size={14} /> Participantes Ativos
                  </h4>
                  {participants.filter((p: any) => p.isActive !== false).sort((a: any, b: any) => (b.score || 0) - (a.score || 0)).map((p: any) => (
                    <div key={p.userId} className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3">
                      <Avatar className="w-9 h-9 border border-border shrink-0">
                        <AvatarImage src={p.user?.avatar} />
                        <AvatarFallback className="text-xs">{(p.user?.name || "?")[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-xs truncate">{p.user?.name || "Participante"}</p>
                          {p.isAdmin && p.userId !== challenge.createdBy && <span className="text-[8px] bg-blue-500/15 text-blue-500 border border-blue-500/30 px-1 py-0.5 rounded-full font-bold">CO-MOD</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">🏆 {p.score || 0} pts</span>
                          <span className="text-[10px] text-red-500">✕ {p.missedDays || 0} faltas</span>
                          {challenge.maxMissedDays > 0 && (
                            <span className="text-[10px] text-muted-foreground">/ {challenge.maxMissedDays} max</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-green-500 hover:border-green-500/50 transition-colors"
                          onClick={() => adjustMissedDaysMutation.mutate({ userId: p.userId, delta: -1 })}
                          disabled={adjustMissedDaysMutation.isPending || (p.missedDays || 0) === 0}
                          title="Remover falta"
                          data-testid={`btn-remove-missed-${p.userId}`}
                        >
                          <MinusCircle size={13} />
                        </button>
                        <button
                          className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-red-500 hover:border-red-500/50 transition-colors"
                          onClick={() => adjustMissedDaysMutation.mutate({ userId: p.userId, delta: 1 })}
                          disabled={adjustMissedDaysMutation.isPending}
                          title="Adicionar falta"
                          data-testid={`btn-add-missed-${p.userId}`}
                        >
                          <PlusCircle size={13} />
                        </button>
                        {isCreator && p.userId !== challenge.createdBy && (
                          p.isAdmin ? (
                            <button
                              className="w-7 h-7 rounded-lg border border-blue-500/30 flex items-center justify-center text-blue-500/60 hover:text-blue-500 hover:border-blue-500 transition-colors"
                              onClick={() => removeCoModMutation.mutate(p.userId)}
                              disabled={removeCoModMutation.isPending}
                              title="Remover co-moderador"
                              data-testid={`btn-remove-comod-${p.userId}`}
                            >
                              <ShieldAlert size={13} />
                            </button>
                          ) : (
                            <button
                              className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-blue-500 hover:border-blue-500/50 transition-colors"
                              onClick={() => addCoModMutation.mutate(p.userId)}
                              disabled={addCoModMutation.isPending}
                              title="Tornar co-moderador"
                              data-testid={`btn-add-comod-${p.userId}`}
                            >
                              <ShieldAlert size={13} />
                            </button>
                          )
                        )}
                        {p.userId !== challenge.createdBy && (
                          <button
                            className="w-7 h-7 rounded-lg border border-red-500/30 flex items-center justify-center text-red-500/60 hover:text-red-500 hover:border-red-500 transition-colors"
                            onClick={() => eliminateMutation.mutate(p.userId)}
                            disabled={eliminateMutation.isPending}
                            title="Eliminar participante"
                            data-testid={`btn-eliminate-participant-${p.userId}`}
                          >
                            <UserX size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isCreator && (<div className="bg-card border border-border rounded-2xl p-4 space-y-4">
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
                      <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                        <Clock size={12} /> Data e Hora de Início
                      </label>
                      <Input type="datetime-local" value={editStartDate} onChange={e => setEditStartDate(e.target.value)} className="rounded-xl" data-testid="input-edit-start-date" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Descrição</label>
                      <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} className="w-full bg-background border border-border rounded-xl p-3 focus:border-primary outline-none min-h-[80px] resize-none text-sm" data-testid="input-edit-description" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Regras</label>
                      <textarea value={editRules} onChange={e => setEditRules(e.target.value)} className="w-full bg-background border border-border rounded-xl p-3 focus:border-primary outline-none min-h-[80px] resize-none text-sm" data-testid="input-edit-rules" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                        <Users size={12} /> Máx. Participantes
                      </label>
                      <Input
                        type="number"
                        min={2}
                        max={500}
                        value={editMaxParticipants}
                        onChange={e => setEditMaxParticipants(Math.max(2, parseInt(e.target.value) || 2))}
                        className="rounded-xl"
                        data-testid="input-edit-max-participants"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                      <div className="flex items-center gap-2">
                        {editPrivate ? <Lock size={16} className="text-orange-500" /> : <Unlock size={16} className="text-primary" />}
                        <span className="text-sm font-bold">{editPrivate ? "Privado" : "Público"}</span>
                      </div>
                      <Switch checked={editPrivate} onCheckedChange={setEditPrivate} className="data-[state=checked]:bg-orange-500" data-testid="switch-edit-private" />
                    </div>
                    {(challenge.type === "checkin" || challenge.type === "survival") && (
                      <>
                        <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 space-y-2">
                          <div>
                            <p className="text-sm font-bold">Dias de Folga Semanal</p>
                            <p className="text-[10px] text-muted-foreground">Dias que não contam como falta</p>
                          </div>
                          <div className="flex gap-1.5">
                            {[
                              { key: "0", label: "D" },
                              { key: "1", label: "S" },
                              { key: "2", label: "T" },
                              { key: "3", label: "Q" },
                              { key: "4", label: "Q" },
                              { key: "5", label: "S" },
                              { key: "6", label: "S" },
                            ].map((day) => {
                              const isSelected = editRestDays.includes(day.key);
                              return (
                                <button
                                  key={day.key}
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) {
                                      setEditRestDays(editRestDays.filter(d => d !== day.key));
                                    } else {
                                      setEditRestDays([...editRestDays, day.key]);
                                    }
                                  }}
                                  className={`flex-1 h-9 rounded-lg border-2 font-bold text-xs transition-all ${
                                    isSelected
                                      ? "border-blue-500 bg-blue-500/20 text-blue-500"
                                      : "border-border bg-background hover:bg-muted text-foreground"
                                  }`}
                                  data-testid={`button-edit-rest-day-${day.key}`}
                                >
                                  {day.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                            <Clock size={12} /> Dias de Descanso por Participante
                          </label>
                          <Input
                            type="number"
                            min={0}
                            max={30}
                            value={editRestDaysAllowed}
                            onChange={e => setEditRestDaysAllowed(Math.max(0, parseInt(e.target.value) || 0))}
                            className="rounded-xl"
                            data-testid="input-edit-rest-days"
                          />
                          <p className="text-[10px] text-muted-foreground">Dias de folga que cada participante pode usar sem penalidade</p>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {challenge.isPrivate ? <Lock size={14} /> : <Unlock size={14} />}
                      <span>{challenge.isPrivate ? "Desafio Privado" : "Desafio Público"}</span>
                    </div>
                    {((challenge as any).restDays?.length > 0) && (
                      <div className="flex items-center gap-2 text-blue-500">
                        <Clock size={14} />
                        <span>Folga: {(challenge as any).restDays.map((d: string) => ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"][parseInt(d)]).join(", ")}</span>
                      </div>
                    )}
                    {(challenge as any).skipWeekends && !((challenge as any).restDays?.length > 0) && (
                      <div className="flex items-center gap-2 text-blue-500">
                        <Clock size={14} />
                        <span>Finais de semana liberados</span>
                      </div>
                    )}
                    {((challenge as any).restDaysAllowed || 0) > 0 && (
                      <div className="flex items-center gap-2 text-blue-500">
                        <Clock size={14} />
                        <span>{(challenge as any).restDaysAllowed} dia{(challenge as any).restDaysAllowed !== 1 ? "s" : ""} de descanso</span>
                      </div>
                    )}
                    {challenge.description && <p className="text-muted-foreground text-xs">{challenge.description}</p>}
                  </div>
                )}
              </div>)}
            </TabsContent>
          )}
        </Tabs>
      </div>

      <Dialog open={finalizeDialogOpen} onOpenChange={setFinalizeDialogOpen}>
        <DialogContent className="rounded-3xl max-w-[400px] w-[calc(100vw-32px)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="w-16 h-16 mx-auto bg-primary/15 rounded-full flex items-center justify-center mb-2">
              <Trophy className="text-primary" size={32} />
            </div>
            <DialogTitle className="text-center text-xl font-display">
              {challenge?.type === "ranking" && (challenge as any)?.splitPrize ? "Pódio — Top 3" : "Selecionar Vencedores"}
            </DialogTitle>
            <DialogDescription className="text-center text-xs">
              {challenge?.type === "ranking" && (challenge as any)?.splitPrize
                ? "Defina o 1°, 2° e 3° lugar. Cada posição recebe um percentual diferente."
                : "Marque quem ganhou. O prêmio será dividido igualmente entre os selecionados."
              }
            </DialogDescription>
          </DialogHeader>

          {(challenge as any)?.tiebreaker && (
            <div className="flex items-start gap-2 mx-2 p-3 bg-orange-400/10 border border-orange-400/30 rounded-2xl text-xs">
              <Scale size={14} className="text-orange-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-orange-400 block text-[10px] uppercase tracking-wide mb-0.5">Critério de Desempate</span>
                <span className="text-foreground">{(challenge as any).tiebreaker}</span>
              </div>
            </div>
          )}

          {(() => {
            const sorted = [...activeParticipants].sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
            const totalPool = activeParticipants.length * entryFee;
            const platformFee = totalPool * 0.10;
            const netPool = totalPool - platformFee;
            const isRanking = challenge?.type === "ranking" && (challenge as any)?.splitPrize;
            const splitPct = (challenge as any)?.splitPercentages || { 1: 50, 2: 30, 3: 20 };

            if (isRanking) {
              const medalColors = ["text-yellow-500", "text-slate-400", "text-amber-700"];
              const medalLabels = ["🥇 1° Lugar", "🥈 2° Lugar", "🥉 3° Lugar"];
              const assignedSet = new Set(selectedWinners.filter(Boolean));

              const setPosition = (pos: number, userId: string | null) => {
                setSelectedWinners(prev => {
                  const arr = [...prev];
                  while (arr.length < 3) arr.push("");
                  if (userId && arr.includes(userId)) {
                    const existing = arr.indexOf(userId);
                    arr[existing] = arr[pos - 1] || "";
                  }
                  arr[pos - 1] = userId || "";
                  return arr;
                });
              };

              // Build groups respecting ties for prize preview
              const pos1 = selectedWinners[0] || "";
              const pos2 = selectedWinners[1] || "";
              const pos3 = selectedWinners[2] || "";

              type PrizeGroup = { userIds: string[]; combinedPct: number; prizeEach: number; positions: string };
              const buildGroups = (): PrizeGroup[] => {
                const groups: PrizeGroup[] = [];
                if (tieWith2nd && tieWith3rd) {
                  const ids = [pos1, pos2, pos3].filter(Boolean);
                  const pct = (splitPct["1"] ?? 50) + (splitPct["2"] ?? 30) + (splitPct["3"] ?? 20);
                  groups.push({ userIds: ids, combinedPct: pct, prizeEach: ids.length ? (netPool * pct / 100) / ids.length : 0, positions: "1°-3° (empate)" });
                } else if (tieWith2nd) {
                  const ids12 = [pos1, pos2].filter(Boolean);
                  const pct12 = (splitPct["1"] ?? 50) + (splitPct["2"] ?? 30);
                  groups.push({ userIds: ids12, combinedPct: pct12, prizeEach: ids12.length ? (netPool * pct12 / 100) / ids12.length : 0, positions: "1°-2° (empate)" });
                  if (pos3) { const pct3 = splitPct["3"] ?? 20; groups.push({ userIds: [pos3], combinedPct: pct3, prizeEach: netPool * pct3 / 100, positions: "3°" }); }
                } else if (tieWith3rd) {
                  if (pos1) { const pct1 = splitPct["1"] ?? 50; groups.push({ userIds: [pos1], combinedPct: pct1, prizeEach: netPool * pct1 / 100, positions: "1°" }); }
                  const ids23 = [pos2, pos3].filter(Boolean);
                  const pct23 = (splitPct["2"] ?? 30) + (splitPct["3"] ?? 20);
                  groups.push({ userIds: ids23, combinedPct: pct23, prizeEach: ids23.length ? (netPool * pct23 / 100) / ids23.length : 0, positions: "2°-3° (empate)" });
                } else {
                  if (pos1) { const p = splitPct["1"] ?? 50; groups.push({ userIds: [pos1], combinedPct: p, prizeEach: netPool * p / 100, positions: "1°" }); }
                  if (pos2) { const p = splitPct["2"] ?? 30; groups.push({ userIds: [pos2], combinedPct: p, prizeEach: netPool * p / 100, positions: "2°" }); }
                  if (pos3) { const p = splitPct["3"] ?? 20; groups.push({ userIds: [pos3], combinedPct: p, prizeEach: netPool * p / 100, positions: "3°" }); }
                }
                return groups;
              };
              const prizeGroups = buildGroups();
              const prizeMap: Record<string, number> = {};
              prizeGroups.forEach(g => g.userIds.forEach(id => { prizeMap[id] = g.prizeEach; }));

              const buildWinnerGroups = (): string[][] => {
                if (tieWith2nd && tieWith3rd) return [[pos1, pos2, pos3].filter(Boolean)];
                if (tieWith2nd) return [[pos1, pos2].filter(Boolean), ...(pos3 ? [[pos3]] : [])];
                if (tieWith3rd) return [...(pos1 ? [[pos1]] : []), [pos2, pos3].filter(Boolean)];
                return [[pos1].filter(Boolean), [pos2].filter(Boolean), [pos3].filter(Boolean)].filter(g => g.length > 0);
              };

              const canSubmit = selectedWinners.filter(Boolean).length > 0 && !finalizeMutation.isPending;

              return (
                <div className="space-y-4">
                  <div className="space-y-2">
                    {[1, 2, 3].map((pos) => {
                      const currentUserId = selectedWinners[pos - 1] || "";
                      const isTiedWithPrev = (pos === 2 && tieWith2nd) || (pos === 3 && tieWith3rd);
                      const isTiedWithNext = (pos === 1 && tieWith2nd) || (pos === 2 && tieWith3rd);
                      const prize = prizeMap[currentUserId];
                      return (
                        <div key={pos}>
                          <div className={`bg-card border rounded-2xl p-3 ${isTiedWithPrev || isTiedWithNext ? "border-orange-400" : "border-border"}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`font-bold text-sm ${medalColors[pos - 1]}`}>{medalLabels[pos - 1]}</span>
                              {currentUserId && prize !== undefined && (
                                <span className={`ml-auto text-xs font-bold ${isTiedWithPrev || isTiedWithNext ? "text-orange-400" : "text-primary"}`}>
                                  {(isTiedWithPrev || isTiedWithNext) ? "empate → " : ""}{formatBRL(prize)}
                                </span>
                              )}
                              {(!currentUserId || prize === undefined) && (
                                <span className="ml-auto text-xs text-muted-foreground">{splitPct[String(pos)] ?? 0}%</span>
                              )}
                            </div>
                            <select
                              className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
                              value={currentUserId}
                              onChange={e => setPosition(pos, e.target.value || null)}
                              data-testid={`select-position-${pos}`}
                            >
                              <option value="">— Selecionar participante —</option>
                              {sorted.map((p: any) => (
                                <option key={p.userId} value={p.userId} disabled={assignedSet.has(p.userId) && p.userId !== currentUserId}>
                                  {p.user?.name || "Participante"} ({formatScore(p)} {scoreUnit})
                                </option>
                              ))}
                            </select>
                          </div>
                          {pos === 1 && (
                            <button
                              onClick={() => { setTieWith2nd(v => !v); if (!tieWith2nd) setTieWith3rd(false); }}
                              className={`w-full mt-1 py-1 text-xs rounded-xl border transition-all ${tieWith2nd ? "bg-orange-400/20 border-orange-400 text-orange-400 font-bold" : "border-dashed border-border text-muted-foreground hover:border-orange-400 hover:text-orange-400"}`}
                              data-testid="toggle-tie-1-2"
                            >
                              {tieWith2nd ? "↕ 1° e 2° empatados — desfazer" : "+ 1° e 2° empataram"}
                            </button>
                          )}
                          {pos === 2 && (
                            <button
                              onClick={() => setTieWith3rd(v => !v)}
                              className={`w-full mt-1 py-1 text-xs rounded-xl border transition-all ${tieWith3rd ? "bg-orange-400/20 border-orange-400 text-orange-400 font-bold" : "border-dashed border-border text-muted-foreground hover:border-orange-400 hover:text-orange-400"}`}
                              data-testid="toggle-tie-2-3"
                            >
                              {tieWith3rd ? "↕ 2° e 3° empatados — desfazer" : "+ 2° e 3° empataram"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {prizeGroups.length > 0 && (
                    <div className="bg-muted/50 rounded-2xl p-3 space-y-1 text-xs">
                      {prizeGroups.map((g, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="text-muted-foreground">{g.positions} ({g.combinedPct}%{g.userIds.length > 1 ? ` ÷ ${g.userIds.length}` : ""})</span>
                          <span className="font-bold text-primary">{formatBRL(g.prizeEach)} cada</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-muted/50 rounded-2xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Pool total</span><span className="font-bold">{formatBRL(totalPool)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Taxa plataforma (10%)</span><span className="font-bold text-red-500">− {formatBRL(platformFee)}</span></div>
                    <div className="flex justify-between border-t border-border pt-2"><span className="font-bold">Prêmio líquido</span><span className="font-bold text-primary">{formatBRL(netPool)}</span></div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 rounded-xl h-12" onClick={() => setFinalizeDialogOpen(false)}>Cancelar</Button>
                    <Button
                      className="flex-1 rounded-xl h-12 font-bold bg-primary"
                      disabled={!canSubmit}
                      onClick={() => finalizeMutation.mutate({ winnerGroups: buildWinnerGroups() })}
                      data-testid="button-confirm-finalize"
                    >
                      {finalizeMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <><CheckCircle2 className="mr-1" size={16} /> Distribuir Prêmios</>}
                    </Button>
                  </div>
                </div>
              );
            }

            const prizeEach = selectedWinners.length > 0 ? netPool / selectedWinners.length : 0;
            return (
              <div className="space-y-4">
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {sorted.map((p: any) => {
                    const selected = selectedWinners.includes(p.userId);
                    return (
                      <button
                        key={p.userId}
                        onClick={() => setSelectedWinners(prev => prev.includes(p.userId) ? prev.filter(id => id !== p.userId) : [...prev, p.userId])}
                        className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left ${selected ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"}`}
                        data-testid={`select-winner-${p.userId}`}
                      >
                        <Avatar className="w-10 h-10 border border-border shrink-0">
                          <AvatarImage src={p.user?.avatar} />
                          <AvatarFallback>{(p.user?.name || "?")[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm">{p.user?.name || "Participante"}</p>
                          <p className="text-xs text-muted-foreground">{formatScore(p)} {scoreUnit}</p>
                        </div>
                        {selected ? <CheckCircle2 size={20} className="text-primary shrink-0" /> : <div className="w-5 h-5 rounded-full border-2 border-border shrink-0" />}
                      </button>
                    );
                  })}
                  {sorted.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">Nenhum participante ativo</p>}
                </div>

                <div className="bg-muted/50 rounded-2xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Pool total</span><span className="font-bold">{formatBRL(totalPool)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Taxa plataforma (10%)</span><span className="font-bold text-red-500">− {formatBRL(platformFee)}</span></div>
                  <div className="flex justify-between border-t border-border pt-2"><span className="font-bold">Prêmio líquido</span><span className="font-bold text-primary">{formatBRL(netPool)}</span></div>
                  {selectedWinners.length > 0 && <div className="flex justify-between text-green-500 font-bold"><span>Cada vencedor recebe</span><span>{formatBRL(prizeEach)}</span></div>}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-xl h-12" onClick={() => setFinalizeDialogOpen(false)}>Cancelar</Button>
                  <Button
                    className="flex-1 rounded-xl h-12 font-bold bg-primary"
                    disabled={selectedWinners.length === 0 || finalizeMutation.isPending}
                    onClick={() => finalizeMutation.mutate({ winnerUserIds: selectedWinners })}
                    data-testid="button-confirm-finalize"
                  >
                    {finalizeMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <><CheckCircle2 className="mr-1" size={16} /> Distribuir Prêmios</>}
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent className="rounded-3xl max-w-[380px] w-[calc(100vw-32px)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="w-16 h-16 mx-auto bg-orange-500/15 rounded-full flex items-center justify-center mb-2">
              <ShieldAlert className="text-orange-500" size={32} />
            </div>
            <DialogTitle className="text-center text-xl">Transferir Moderação</DialogTitle>
            <DialogDescription className="text-center">
              Escolha quem será o novo moderador antes de sair
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {participants.filter((p: any) => p.userId !== user?.id && p.isActive !== false).map((p: any) => (
              <button
                key={p.userId}
                onClick={() => setSelectedNewMod(p.userId)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                  selectedNewMod === p.userId ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30'
                }`}
                data-testid={`select-mod-${p.userId}`}
              >
                <Avatar className="w-10 h-10 border border-border">
                  <AvatarImage src={p.user?.avatar} />
                  <AvatarFallback>{(p.user?.name || "?")[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold">{p.user?.name || "Participante"}</p>
                  <p className="text-xs text-muted-foreground">@{p.user?.username}</p>
                </div>
                {selectedNewMod === p.userId && <CheckCircle2 size={18} className="text-primary ml-auto" />}
              </button>
            ))}
            {participants.filter((p: any) => p.userId !== user?.id && p.isActive !== false).length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">Nenhum participante ativo para transferir</p>
            )}
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-3 text-xs text-orange-600 dark:text-orange-400">
            <p className="font-bold flex items-center gap-1 mb-1"><AlertCircle size={12} /> Após transferir:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>O novo moderador terá controle total do desafio</li>
              <li>Você será removido como participante</li>
              <li>Seu valor de entrada será perdido</li>
            </ul>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl font-bold"
              onClick={() => setTransferDialogOpen(false)}
              data-testid="button-cancel-transfer"
            >
              Cancelar
            </Button>
            <Button
              className="w-full h-12 rounded-xl font-bold bg-orange-500 hover:bg-orange-600 text-white"
              disabled={!selectedNewMod || transferCreatorMutation.isPending}
              onClick={async () => {
                if (!selectedNewMod) return;
                await transferCreatorMutation.mutateAsync(selectedNewMod);
                quitMutation.mutate();
              }}
              data-testid="button-confirm-transfer"
            >
              {transferCreatorMutation.isPending || quitMutation.isPending ? (
                <Loader2 className="animate-spin mr-2" size={18} />
              ) : (
                <ShieldAlert className="mr-2" size={18} />
              )}
              Transferir e Sair
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={quitDialogOpen} onOpenChange={setQuitDialogOpen}>
        <DialogContent className="rounded-3xl max-w-[380px] w-[calc(100vw-32px)] max-h-[90vh] overflow-y-auto">
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

      <Drawer open={shareDialogOpen} onOpenChange={(open) => { setShareDialogOpen(open); if (!open) setLinkCopied(false); }}>
        <DrawerContent className="px-4 pb-8">
          <DrawerHeader className="text-center pt-2 pb-2">
            <div className="w-14 h-14 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-3 border border-primary/20">
              <Share2 className="text-primary" size={24} />
            </div>
            <DrawerTitle className="text-xl font-display">Compartilhar Desafio</DrawerTitle>
            <DrawerDescription className="text-sm">
              Convide seus amigos para participar do desafio!
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex justify-around py-2">
            <button
              onClick={() => {
                const url = `${window.location.origin}/challenge/${id}`;
                const text = `Bora participar do desafio "${challenge.title}" no VYTAL? Entrada: ${formatBRL(entryFee)} ${url}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
              }}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-muted transition-colors min-w-0"
              data-testid="button-share-whatsapp"
            >
              <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </div>
              <span className="text-[11px] font-medium">WhatsApp</span>
            </button>

            <button
              onClick={() => {
                const url = `${window.location.origin}/challenge/${id}`;
                const text = `Bora participar do desafio "${challenge.title}" no VYTAL? Entrada: ${formatBRL(entryFee)} ${url}`;
                window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank");
              }}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-muted transition-colors min-w-0"
              data-testid="button-share-telegram"
            >
              <div className="w-12 h-12 rounded-full bg-[#0088cc] flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </div>
              <span className="text-[11px] font-medium">Telegram</span>
            </button>

            <button
              onClick={() => {
                const url = `${window.location.origin}/challenge/${id}`;
                const text = `Bora participar do desafio "${challenge.title}" no VYTAL? Entrada: ${formatBRL(entryFee)}`;
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
              }}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-muted transition-colors min-w-0"
              data-testid="button-share-twitter"
            >
              <div className="w-12 h-12 rounded-full bg-black dark:bg-white flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white dark:fill-black"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </div>
              <span className="text-[11px] font-medium">X / Twitter</span>
            </button>

            {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
              <button
                onClick={() => {
                  const url = `${window.location.origin}/challenge/${id}`;
                  navigator.share({
                    title: challenge.title,
                    text: `Bora participar do desafio "${challenge.title}" no VYTAL? Entrada: ${formatBRL(entryFee)}`,
                    url,
                  }).catch(() => {});
                }}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-muted transition-colors min-w-0"
                data-testid="button-share-native"
              >
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <ExternalLink size={22} className="text-foreground" />
                </div>
                <span className="text-[11px] font-medium">Mais...</span>
              </button>
            )}
          </div>

          <div className="border-t pt-3">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Link do desafio</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-muted rounded-xl px-3 py-2.5 text-xs text-muted-foreground truncate font-mono" data-testid="text-share-url">
                {`${window.location.origin}/challenge/${id}`}
              </div>
              <Button
                size="sm"
                className="rounded-xl h-auto px-3 shrink-0"
                variant={linkCopied ? "default" : "outline"}
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/challenge/${id}`);
                  setLinkCopied(true);
                  toast({ title: "Link copiado!" });
                  setTimeout(() => setLinkCopied(false), 3000);
                }}
                data-testid="button-copy-link"
              >
                {linkCopied ? <Check size={16} /> : <Copy size={16} />}
              </Button>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-3 text-center">
            <p className="text-xs text-muted-foreground">
              Quem abrir o link poderá ver os detalhes e pedir para participar.
            </p>
          </div>
        </DrawerContent>
      </Drawer>

      <DepositDrawer
        open={depositDrawerOpen}
        onOpenChange={setDepositDrawerOpen}
        defaultAmount={entryFee > 0 ? entryFee : undefined}
        title="Depositar na Carteira"
        description={entryFee > 0 ? `Taxa de entrada: ${formatBRL(entryFee)}. Saldo adicionado ao seu perfil.` : "Mínimo R$ 30,00. Saldo adicionado ao seu perfil."}
      />

      {/* Photo lightbox */}
      <Dialog open={!!lightboxPhoto} onOpenChange={(open) => { if (!open) setLightboxPhoto(null); }}>
        <DialogContent className="max-w-screen-sm p-2 bg-black border-none" data-testid="photo-lightbox">
          <DialogHeader className="sr-only">
            <DialogTitle>Foto do Check-in</DialogTitle>
            <DialogDescription>Visualização da foto</DialogDescription>
          </DialogHeader>
          {lightboxPhoto && (
            <img
              src={lightboxPhoto}
              alt="Foto do check-in"
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
