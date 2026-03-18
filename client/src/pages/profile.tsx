import { Settings, CheckCircle2, Camera, Trophy, Flame, Medal, Award, Zap, Activity, History, XCircle, Shield, UserPlus, Check, X, Search, Loader2, Share2, ImageIcon, Crown, Star, Users, TrendingUp, Heart, Gem } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useLocation } from "wouter";
import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ImageCropper } from "@/components/image-cropper";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const [activeTab, setActiveTab] = useState("ativos");
  const [selectedMedal, setSelectedMedal] = useState<{ name: string; desc: string; color: string; bg: string; border: string; icon: any; earned: boolean } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [avatarLightbox, setAvatarLightbox] = useState(false);
  const [avatarSheet, setAvatarSheet] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [profileName, setProfileName] = useState(user?.name || "Seu Nome");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || "");
  const [bannerUrl, setBannerUrl] = useState((user as any)?.banner || "");

  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: followersData } = useQuery({
    queryKey: ["/api/follows/followers"],
    queryFn: async () => {
      const res = await fetch("/api/follows/followers", { credentials: "include" });
      return res.ok ? res.json() : [];
    },
  });

  const { data: followingData } = useQuery({
    queryKey: ["/api/follows/following"],
    queryFn: async () => {
      const res = await fetch("/api/follows/following", { credentials: "include" });
      return res.ok ? res.json() : [];
    },
  });

  const { data: walletTransactions = [] } = useQuery({
    queryKey: ["/api/wallet/transactions"],
    queryFn: async () => {
      const res = await fetch("/api/wallet/transactions", { credentials: "include" });
      return res.ok ? res.json() : [];
    },
  });

  const { data: followRequests = [] } = useQuery({
    queryKey: ["/api/follows/requests"],
    queryFn: async () => {
      const res = await fetch("/api/follows/requests", { credentials: "include" });
      return res.ok ? res.json() : [];
    },
  });

  const { data: searchResults = [], isFetching: isSearching } = useQuery({
    queryKey: ["/api/users/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, { credentials: "include" });
      return res.ok ? res.json() : [];
    },
    enabled: searchQuery.length >= 2,
  });

  const followMutation = useMutation({
    mutationFn: async (username: string) => {
      const res = await apiRequest("POST", `/api/follows/${username}`);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/follows/following"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/search"] });
      toast({ title: data.status === "pending" ? "Solicitação enviada" : "Seguindo!" });
    },
  });

  const approveFollowMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/follows/requests/${id}/approve`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/follows/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/follows/followers"] });
    },
  });

  const rejectFollowMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/follows/requests/${id}/reject`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/follows/requests"] });
    },
  });

  const { data: myChallenges = [] } = useQuery({
    queryKey: ["/api/challenges/mine"],
    queryFn: async () => {
      const res = await fetch("/api/challenges/mine", { credentials: "include" });
      return res.ok ? res.json() : [];
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", "/api/users/me", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const avatarMutation = useMutation({
    mutationFn: async (avatar: string) => {
      const res = await apiRequest("POST", "/api/users/avatar", { avatar });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const handleAvatarClick = () => {
    if (avatarUrl) {
      setAvatarSheet(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setCropperOpen(true);
    }
    if (e.target) e.target.value = "";
  };

  const handleCropDone = (croppedDataUrl: string) => {
    setAvatarUrl(croppedDataUrl);
    avatarMutation.mutate(croppedDataUrl);
    setCropperOpen(false);
    setSelectedFile(null);
    setAvatarSheet(false);
  };

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (e.target) e.target.value = "";
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setBannerUrl(dataUrl);
      updateProfileMutation.mutate({ banner: dataUrl });
      toast({ title: "Banner atualizado!" });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({ name: profileName, bio });
    setIsEditing(false);
  };

  const showEarnings = user?.publicEarnings !== false;

  const totalEarned = walletTransactions
    ?.filter((t: any) => t.type === "prize" || t.type === "challenge_win")
    ?.reduce((sum: number, t: any) => sum + Math.abs(Number(t.amount)), 0) || 0;

  const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const activeChallenges = myChallenges.filter((c: any) =>
    c.myParticipation?.isActive !== false &&
    c.status !== "completed" && c.status !== "finalized"
  );
  const completedChallenges = myChallenges.filter((c: any) =>
    c.status === "completed" || c.status === "finalized" || c.myParticipation?.isActive === false
  );

  const stats = [
    { label: "Seguidores", value: String(followersData?.length || 0) },
    { label: "Seguindo", value: String(followingData?.length || 0) },
    { label: "Desafios", value: String(myChallenges.length || 0) },
  ];

  const hasBanner = bannerUrl && bannerUrl.length > 10;

  return (
    <div className="pb-32 animate-in fade-in duration-500 bg-background min-h-screen">

      {/* Banner */}
      <div className="relative h-36">
        {hasBanner ? (
          <img src={bannerUrl} alt="banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/10 to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

        {/* Header sobre o banner */}
        <header className="absolute top-0 left-0 right-0 px-4 pt-4 pb-2 flex items-center justify-between z-10">
          <h1 className="text-base font-bold text-white drop-shadow flex items-center gap-2">
            {profileName.toLowerCase().replace(' ', '_')}
            <Badge variant="secondary" className="text-[9px] bg-primary/20 text-primary border-none">PRO</Badge>
          </h1>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 bg-black/30 text-white backdrop-blur-sm" onClick={() => {
              const url = window.location.origin;
              const text = "Entra no VYTAL comigo! Desafios esportivos com dinheiro real. 💪";
              if (navigator.share) { navigator.share({ title: "Convite VYTAL", text, url }).catch(() => {}); }
              else { navigator.clipboard.writeText(`${text}\n${url}`); }
            }} data-testid="button-profile-invite">
              <Share2 size={18} />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 bg-black/30 text-white backdrop-blur-sm" onClick={() => { setShowSearch(true); setSearchQuery(""); }} data-testid="button-search-users">
              <UserPlus size={18} />
            </Button>
            {user?.isAdmin && (
              <Link href="/admin">
                <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 bg-black/30 text-white backdrop-blur-sm" data-testid="button-admin">
                  <Shield size={18} />
                </Button>
              </Link>
            )}
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 bg-black/30 text-white backdrop-blur-sm" data-testid="button-settings">
                <Settings size={18} />
              </Button>
            </Link>
          </div>
        </header>

        {/* Botão editar banner */}
        <label
          htmlFor="banner-upload"
          className="absolute bottom-2 right-3 flex items-center gap-1.5 bg-black/50 text-white text-[11px] font-bold px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/20 z-10 cursor-pointer"
          data-testid="button-edit-banner"
        >
          <ImageIcon size={12} /> Editar capa
        </label>
        <input id="banner-upload" type="file" className="hidden" accept="image/*" onChange={handleBannerSelect} />
      </div>

      <div className="px-4 space-y-5 -mt-10 relative z-10">

        {/* Avatar + stats */}
        <div className="flex items-end gap-5 px-1">
          <div className="relative shrink-0" onClick={handleAvatarClick}>
            <input ref={fileInputRef} type="file" id="avatar-upload" className="hidden" accept="image/*" onChange={handleFileSelect} />
            <div className="w-[84px] h-[84px] rounded-full border-[3px] border-background bg-gradient-to-tr from-yellow-400 via-primary to-accent relative group cursor-pointer shadow-xl">
              <Avatar className="w-full h-full border-2 border-background">
                {avatarUrl && <AvatarImage src={avatarUrl} className="object-cover" />}
                <AvatarFallback className="text-lg font-bold">{profileName.substring(0,2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={18} className="text-white" />
              </div>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-3 gap-1 text-center pb-1">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="flex flex-col cursor-pointer hover:opacity-70 transition-opacity"
                onClick={() => {
                  if (stat.label === "Seguidores") setShowFollowers(true);
                  if (stat.label === "Seguindo") setShowFollowing(true);
                }}
              >
                <span className="font-bold text-lg leading-tight">{stat.value}</span>
                <span className="text-[10px] text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Nome + bio + editar */}
        <div className="px-1 space-y-1">
          <h2 className="font-bold">{profileName}</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{bio || "Sem bio ainda."}</p>
          <div className="flex pt-2">
            <Button variant="outline" className="w-full font-bold h-9 text-xs" onClick={() => setIsEditing(true)} data-testid="button-edit-profile">Editar Perfil</Button>
          </div>
        </div>

        {/* Ganhos */}
        <div className="px-1">
          <div className="bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/30 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-primary/5">
            <div>
              <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                <Trophy size={12} /> Ganhos Totais
              </p>
              <p className="text-3xl font-display font-black text-primary drop-shadow-sm" data-testid="text-total-earnings">{formatBRL(totalEarned)}</p>
            </div>
            <Link href="/wallet">
              <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/20 font-bold h-10 text-xs rounded-xl bg-background/50 backdrop-blur-sm" data-testid="button-wallet">Carteira</Button>
            </Link>
          </div>
        </div>

        {/* Medalhas */}
        {(() => {
          const deposits = walletTransactions.filter((t: any) => t.type === "deposit");
          const allMedals = [
            { name: "Estreante", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30", check: () => myChallenges.length >= 1, desc: "Entrou no primeiro desafio" },
            { name: "Invicto", icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30", check: () => {
              const active = activeChallenges.filter((c: any) => c.myParticipation?.isActive !== false);
              return active.length > 0;
            }, desc: "Participando de desafios sem desistir" },
            { name: "Investidor", icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/30", check: () => deposits.length >= 1, desc: "Fez o primeiro depósito" },
            { name: "Primeiro Prêmio", icon: Star, color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30", check: () => totalEarned > 0, desc: "Ganhou o primeiro prêmio" },
            { name: "Dedicado", icon: Heart, color: "text-pink-500", bg: "bg-pink-500/10", border: "border-pink-500/30", check: () => activeChallenges.length >= 3, desc: "3+ desafios ativos ao mesmo tempo" },
            { name: "Maratona", icon: Medal, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30", check: () => completedChallenges.length >= 5, desc: "Completou 5+ desafios" },
            { name: "Influente", icon: Users, color: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/30", check: () => (followersData?.length || 0) >= 10, desc: "10+ seguidores" },
            { name: "Top 1%", icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/30", check: () => totalEarned >= 500, desc: "Ganhou R$ 500+ em prêmios" },
            { name: "Veterano", icon: Zap, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/30", check: () => myChallenges.length >= 10, desc: "Participou de 10+ desafios" },
            { name: "Ouro", icon: Award, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30", check: () => totalEarned >= 1000, desc: "Ganhou R$ 1.000+ em prêmios" },
            { name: "Multitarefa", icon: Activity, color: "text-teal-500", bg: "bg-teal-500/10", border: "border-teal-500/30", check: () => completedChallenges.length >= 20, desc: "Completou 20+ desafios" },
            { name: "Estrela", icon: Star, color: "text-fuchsia-500", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/30", check: () => (followersData?.length || 0) >= 50, desc: "50+ seguidores" },
            { name: "Diamante", icon: Gem, color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/30", check: () => totalEarned >= 2000, desc: "Ganhou R$ 2.000+ em prêmios" },
            { name: "Lenda", icon: Crown, color: "text-yellow-600", bg: "bg-yellow-600/10", border: "border-yellow-600/30", check: () => myChallenges.length >= 25, desc: "Participou de 25+ desafios" },
            { name: "GOAT", icon: Shield, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30", check: () => myChallenges.length >= 50, desc: "Participou de 50+ desafios" },
          ];
          const earned = allMedals.filter(m => m.check());
          const locked = allMedals.filter(m => !m.check());
          if (earned.length === 0 && locked.length === 0) return null;
          return (
            <div className="space-y-2">
              <div className="flex gap-4 px-1 overflow-x-auto no-scrollbar pb-2 pt-1">
                {earned.map((badge, i) => (
                  <button
                    key={`e-${i}`}
                    className="flex flex-col items-center gap-1.5 shrink-0 transition-transform active:scale-90"
                    onClick={() => setSelectedMedal(selectedMedal?.name === badge.name ? null : { ...badge, earned: true })}
                    data-testid={`medal-earned-${badge.name.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    <div className={`w-14 h-14 rounded-full border-[3px] flex items-center justify-center shadow-sm ${selectedMedal?.name === badge.name ? 'ring-2 ring-offset-2 ring-primary' : ''} ${badge.bg} ${badge.border}`}>
                      <badge.icon className={badge.color} size={22} />
                    </div>
                    <span className="text-[10px] text-foreground font-semibold">{badge.name}</span>
                  </button>
                ))}
                {locked.map((badge, i) => (
                  <button
                    key={`l-${i}`}
                    className="flex flex-col items-center gap-1.5 shrink-0 opacity-30 grayscale transition-transform active:scale-90"
                    onClick={() => setSelectedMedal(selectedMedal?.name === badge.name ? null : { ...badge, earned: false })}
                    data-testid={`medal-locked-${badge.name.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    <div className="w-14 h-14 rounded-full border-[3px] flex items-center justify-center shadow-sm bg-muted border-border">
                      <badge.icon className="text-muted-foreground" size={22} />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-semibold">{badge.name}</span>
                  </button>
                ))}
              </div>
              {selectedMedal && (
                <div className={`mx-1 rounded-2xl border px-4 py-3 flex items-center gap-3 transition-all ${selectedMedal.earned ? `${selectedMedal.bg} ${selectedMedal.border}` : 'bg-muted border-border'}`}>
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedMedal.earned ? `${selectedMedal.bg} ${selectedMedal.border}` : 'bg-background border-border grayscale opacity-50'}`}>
                    <selectedMedal.icon className={selectedMedal.earned ? selectedMedal.color : 'text-muted-foreground'} size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${selectedMedal.earned ? 'text-foreground' : 'text-muted-foreground'}`}>{selectedMedal.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedMedal.desc}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${selectedMedal.earned ? 'bg-emerald-500/20 text-emerald-500' : 'bg-muted-foreground/10 text-muted-foreground'}`}>
                    {selectedMedal.earned ? 'Conquistada' : 'Bloqueada'}
                  </span>
                </div>
              )}
            </div>
          );
        })()}

        {/* Tabs */}
        <div className="flex border-t border-border/50 pt-1">
          <button
            onClick={() => setActiveTab("ativos")}
            className={`flex-1 py-3 flex justify-center items-center gap-2 border-b-2 transition-all ${activeTab === 'ativos' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}
            data-testid="tab-ativos"
          >
            <Zap size={18} />
            <span className="text-xs font-bold">Ativos</span>
          </button>
          <button
            onClick={() => setActiveTab("concluidos")}
            className={`flex-1 py-3 flex justify-center items-center gap-2 border-b-2 transition-all ${activeTab === 'concluidos' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}
            data-testid="tab-concluidos"
          >
            <History size={18} />
            <span className="text-xs font-bold">Concluídos</span>
          </button>
        </div>

        {activeTab === "ativos" && (
          <div className="space-y-4 px-1">
            {activeChallenges.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Zap size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-bold">Nenhum desafio ativo</p>
                <p className="text-xs mt-1">Explore e participe de desafios!</p>
              </div>
            ) : (
              activeChallenges.map((challenge: any) => {
                const count = challenge.activeParticipantCount || challenge.participantCount || 0;
                const max = challenge.maxParticipants || 50;
                const waiting = count < 2;
                return (
                  <Link key={challenge.id} href={`/challenge/${challenge.id}`}>
                    <div className="p-4 rounded-2xl border border-border/50 bg-card flex flex-col gap-3 cursor-pointer hover:border-primary/30 transition-colors" data-testid={`card-challenge-${challenge.id}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-sm">{challenge.title}</h4>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">{count}/{max} participantes</p>
                        </div>
                        <Badge variant="default" className={`text-[9px] border-none ${waiting ? 'bg-yellow-500/20 text-yellow-600' : 'bg-primary/10 text-primary'}`}>
                          {waiting ? "AGUARDANDO" : "ATIVO"}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Activity size={14} className="text-accent" />
                          <span>{challenge.duration} dias</span>
                        </div>
                        <div className="font-bold text-primary">Entrada: {formatBRL(Number(challenge.entryFee))}</div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        )}

        {activeTab === "concluidos" && (
          <div className="space-y-4 px-1">
            {completedChallenges.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <History size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-bold">Nenhum desafio concluído</p>
                <p className="text-xs mt-1">Complete desafios para ver seu histórico</p>
              </div>
            ) : (
              completedChallenges.map((challenge: any) => (
                <Link key={challenge.id} href={`/challenge/${challenge.id}`}>
                  <div className="p-4 rounded-2xl border border-border/50 bg-muted/20 flex flex-col gap-3 opacity-80 cursor-pointer hover:opacity-100 transition-opacity" data-testid={`card-completed-${challenge.id}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm">{challenge.title}</h4>
                        <p className="text-[10px] text-muted-foreground mt-1">{challenge.participantCount || 0} participantes</p>
                      </div>
                      <Badge variant="secondary" className="text-[9px]">CONCLUÍDO</Badge>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      {/* Lightbox avatar */}
      {avatarLightbox && avatarUrl && (
        <div
          className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center"
          onClick={() => setAvatarLightbox(false)}
        >
          <button className="absolute top-5 right-5 text-white/80 hover:text-white" data-testid="button-close-lightbox">
            <XCircle size={32} />
          </button>
          <img
            src={avatarUrl}
            alt="Foto de perfil"
            className="max-w-[90vw] max-h-[90vh] rounded-3xl object-contain shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* Sheet: ver/alterar avatar */}
      {avatarSheet && (
        <div className="fixed inset-0 bg-black/60 z-[80] flex items-end" onClick={() => setAvatarSheet(false)}>
          <div className="w-full bg-card border-t border-border rounded-t-3xl p-6 pb-10 space-y-3 animate-in slide-in-from-bottom-4" onClick={e => e.stopPropagation()}>
            {avatarUrl && (
              <div className="flex justify-center mb-4">
                <img src={avatarUrl} alt="Foto atual" className="w-24 h-24 rounded-full object-cover border-4 border-primary shadow-xl" />
              </div>
            )}
            <button
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors font-bold"
              onClick={() => { setAvatarSheet(false); setAvatarLightbox(true); }}
              data-testid="button-view-photo"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Search size={20} />
              </div>
              Ver foto em tamanho real
            </button>
            <label
              htmlFor="avatar-upload"
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors font-bold cursor-pointer"
              data-testid="button-change-photo"
              onClick={() => setAvatarSheet(false)}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Camera size={20} />
              </div>
              Alterar foto de perfil
            </label>
            <button
              className="w-full p-4 rounded-2xl text-muted-foreground font-bold hover:bg-muted/50 transition-colors"
              onClick={() => setAvatarSheet(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Editar perfil */}
      {isEditing && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-[60] p-6 flex flex-col justify-end animate-in fade-in" onClick={() => setIsEditing(false)}>
          <div className="bg-card border border-border rounded-t-3xl p-6 pb-28 space-y-6 w-full max-w-md mx-auto animate-in slide-in-from-bottom-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Editar Perfil</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
                <X size={20} />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Nome</label>
                <input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl h-12 px-4 focus:border-primary outline-none"
                  data-testid="input-profile-name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-4 focus:border-primary outline-none min-h-[100px] resize-none"
                  data-testid="input-bio"
                />
              </div>
              <Button className="w-full h-14 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20" onClick={handleSaveProfile} data-testid="button-save-profile">
                Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Seguidores */}
      {showFollowers && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-[70] flex flex-col justify-end animate-in fade-in" onClick={() => setShowFollowers(false)}>
          <div className="bg-card border border-border rounded-t-3xl p-6 pb-safe h-[70vh] overflow-y-auto w-full max-w-md mx-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Seguidores ({followersData?.length || 0})</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowFollowers(false)}><XCircle size={24} /></Button>
            </div>

            {followRequests.length > 0 && (
              <div className="mb-6 space-y-3">
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <UserPlus size={14} /> Solicitações ({followRequests.length})
                </h4>
                {followRequests.map((req: any) => (
                  <div key={req.id} className="flex items-center justify-between bg-muted/50 rounded-xl p-3">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setShowFollowers(false); setLocation(`/user/${req.requester?.username}`); }}>
                      <Avatar className="w-10 h-10 border border-border">
                        <AvatarImage src={req.requester?.avatar} />
                        <AvatarFallback>{(req.requester?.name || "?").charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-sm">{req.requester?.name}</p>
                        <p className="text-[10px] text-muted-foreground">@{req.requester?.username}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" className="w-8 h-8 rounded-full bg-primary text-white" onClick={() => approveFollowMutation.mutate(req.id)} data-testid={`approve-follow-${req.id}`}>
                        <Check size={14} />
                      </Button>
                      <Button size="icon" variant="outline" className="w-8 h-8 rounded-full" onClick={() => rejectFollowMutation.mutate(req.id)} data-testid={`reject-follow-${req.id}`}>
                        <X size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="border-b border-border" />
              </div>
            )}

            {(!followersData || followersData.length === 0) ? (
              <p className="text-center text-muted-foreground text-sm py-10">Nenhum seguidor ainda</p>
            ) : (
              <div className="space-y-4">
                {followersData.map((f: any, i: number) => {
                  const u = f.follower || f;
                  return (
                    <div key={i} className="flex items-center gap-3 cursor-pointer hover:opacity-70" onClick={() => { setShowFollowers(false); setLocation(`/user/${u.username}`); }}>
                      <Avatar className="w-10 h-10 border border-border">
                        <AvatarImage src={u.avatar} />
                        <AvatarFallback>{(u.name || "?").charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-sm">{u.name}</p>
                        <p className="text-[10px] text-muted-foreground">@{u.username}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Seguindo */}
      {showFollowing && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-[70] flex flex-col justify-end animate-in fade-in" onClick={() => setShowFollowing(false)}>
          <div className="bg-card border border-border rounded-t-3xl p-6 pb-safe h-[70vh] overflow-y-auto w-full max-w-md mx-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Seguindo ({followingData?.length || 0})</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowFollowing(false)}><XCircle size={24} /></Button>
            </div>
            {(!followingData || followingData.length === 0) ? (
              <p className="text-center text-muted-foreground text-sm py-10">Não está seguindo ninguém ainda</p>
            ) : (
              <div className="space-y-4">
                {followingData.map((f: any, i: number) => {
                  const u = f.following || f;
                  return (
                    <div key={i} className="flex items-center gap-3 cursor-pointer hover:opacity-70" onClick={() => { setShowFollowing(false); setLocation(`/user/${u.username}`); }}>
                      <Avatar className="w-10 h-10 border border-border">
                        <AvatarImage src={u.avatar} />
                        <AvatarFallback>{(u.name || "?").charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-sm">{u.name}</p>
                        <p className="text-[10px] text-muted-foreground">@{u.username}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Busca de usuários */}
      {showSearch && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-[70] flex flex-col p-6 animate-in fade-in">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setShowSearch(false)} className="text-muted-foreground">
              <X size={24} />
            </button>
            <h3 className="text-lg font-bold">Encontrar Pessoas</h3>
          </div>
          <div className="relative mb-4">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome ou usuário..."
              className="w-full bg-muted border border-border rounded-xl h-12 pl-11 pr-4 focus:border-primary outline-none"
              autoFocus
              data-testid="input-search-users"
            />
          </div>
          {isSearching && <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" size={24} /></div>}
          <div className="space-y-3 overflow-y-auto flex-1">
            {searchResults.map((u: any) => (
              <div key={u.id} className="flex items-center justify-between bg-card border border-border rounded-2xl p-3">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setShowSearch(false); setLocation(`/user/${u.username}`); }}>
                  <Avatar className="w-10 h-10 border border-border">
                    <AvatarImage src={u.avatar} />
                    <AvatarFallback>{(u.name || "?").charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-sm">{u.name}</p>
                    <p className="text-[10px] text-muted-foreground">@{u.username}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="rounded-xl h-8 text-xs" onClick={() => followMutation.mutate(u.username)} disabled={followMutation.isPending} data-testid={`button-follow-${u.username}`}>
                  Seguir
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <ImageCropper
        open={cropperOpen}
        imageFile={selectedFile}
        onCrop={handleCropDone}
        onClose={() => { setCropperOpen(false); setSelectedFile(null); setAvatarSheet(false); }}
      />
    </div>
  );
}
