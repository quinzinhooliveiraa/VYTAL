import { Settings, CheckCircle2, Camera, Trophy, Flame, Medal, Award, PlusCircle, Zap, Activity, History, ArrowUpRight, XCircle, Map, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Profile() {
  const [activeTab, setActiveTab] = useState("ativos");
  const [isEditing, setIsEditing] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const { user } = useAuth();
  
  const [profileName, setProfileName] = useState(user?.name || "Seu Nome");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || "https://ui-avatars.com/api/?name=S+N&background=0D8BFF&color=fff");

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

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", "/api/users/me", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatarUrl(base64String);
        updateProfileMutation.mutate({ avatar: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({ name: profileName, bio });
    setIsEditing(false);
  };

  const showEarnings = user?.publicEarnings !== false;

  const stats = [
    { label: "Seguidores", value: String(followersData?.length || 0) },
    { label: "Seguindo", value: String(followingData?.length || 0) },
    { label: "Fotos", value: "0" },
  ];

  return (
    <div className="pb-32 animate-in fade-in duration-500 bg-background min-h-screen">
      <header className="px-6 pt-6 pb-4 flex items-center justify-between sticky top-0 bg-background/90 backdrop-blur-xl z-50 border-b border-border/50">
        <h1 className="text-xl font-bold flex items-center gap-2">{profileName.toLowerCase().replace(' ', '_')} <Badge variant="secondary" className="text-[9px] bg-primary/10 text-primary border-none">PRO</Badge></h1>
        <div className="flex gap-2">
          {user?.isAdmin && (
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted" data-testid="button-admin">
                <Shield size={22} />
              </Button>
            </Link>
          )}
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
          <div className="relative" onClick={() => document.getElementById('avatar-upload')?.click()}>
            <input type="file" id="avatar-upload" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
            <div className="w-22 h-22 rounded-full border-2 border-background p-0.5 bg-gradient-to-tr from-yellow-400 via-primary to-accent relative group cursor-pointer">
              <Avatar className="w-20 h-20 border-2 border-background">
                <AvatarImage src={avatarUrl} className="object-cover" />
                <AvatarFallback>{profileName.substring(0,2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={20} className="text-white" />
              </div>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-3 gap-2 text-center">
            {stats.map((stat, i) => (
              <div 
                key={i} 
                className="flex flex-col cursor-pointer hover:opacity-70 transition-opacity" 
                onClick={() => {
                  if (stat.label === "Seguidores") setShowFollowers(true);
                  if (stat.label === "Seguindo") setShowFollowing(true);
                }}
              >
                <span className="font-bold text-lg">{stat.value}</span>
                <span className="text-[10px] text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-2 space-y-1">
          <h2 className="font-bold">{profileName}</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {bio}
          </p>
          <div className="flex pt-2">
            <Button variant="outline" className="w-full font-bold h-9 text-xs" onClick={() => setIsEditing(true)}>Editar Perfil</Button>
          </div>
        </div>

        {/* Earnings Highlight - Competitive element */}
        {showEarnings && (
          <div className="px-2">
            <div className="bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/30 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-primary/5">
              <div>
                <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                  <Trophy size={12} /> Ganhos Totais
                </p>
                <p className="text-3xl font-display font-black text-primary drop-shadow-sm">R$ 1.250,00</p>
              </div>
              <Link href="/wallet">
                <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/20 font-bold h-10 text-xs rounded-xl bg-background/50 backdrop-blur-sm">Carteira</Button>
              </Link>
            </div>
          </div>
        )}

        {/* Physical Stats Highlight */}
        <div className="px-2 grid grid-cols-3 gap-2">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 flex flex-col items-center justify-center text-center">
            <Map size={18} className="text-blue-500 mb-1" />
            <p className="text-sm font-bold">120 km</p>
            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">Percorridos</p>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-3 flex flex-col items-center justify-center text-center">
            <Flame size={18} className="text-orange-500 mb-1" />
            <p className="text-sm font-bold">12.5k</p>
            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">Calorias</p>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-3 flex flex-col items-center justify-center text-center">
            <Clock size={18} className="text-primary mb-1" />
            <p className="text-sm font-bold">45h</p>
            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">Tempo Ativo</p>
          </div>
        </div>

        {/* Check-in Metrics Highlight */}
        <div className="px-2">
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="font-bold text-sm">Taxa de Sucesso</p>
                <p className="text-[10px] text-muted-foreground">Últimos 30 dias de check-ins</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-display font-black text-primary">94%</p>
            </div>
          </div>
        </div>

        {/* Highlights / Badges */}
        <div className="flex gap-4 px-2 overflow-x-auto no-scrollbar pb-2 pt-2">
          {[
            { name: "Invicto", icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30" },
            { name: "Maratona", icon: Medal, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30" },
            { name: "Top 1%", icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
            { name: "Ouro", icon: Award, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30" },
            { name: "Elite", icon: Zap, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/30" },
            { name: "Sênior", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
          ].map((badge, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
              <div className={`w-16 h-16 rounded-full border-[3px] p-0.5 flex items-center justify-center shadow-sm ${badge.bg} ${badge.border}`}>
                <badge.icon className={badge.color} size={24} />
              </div>
              <span className="text-[10px] text-foreground font-semibold">{badge.name}</span>
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

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 p-6 flex flex-col justify-end animate-in fade-in">
          <div className="bg-card border border-border rounded-t-3xl p-6 pb-safe space-y-6 w-full max-w-md mx-auto translate-y-0 animate-in slide-in-from-bottom-full">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Editar Perfil</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
                <Settings size={20} />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Nome</label>
                <input 
                  value={profileName} 
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl h-12 px-4 focus:border-primary outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Bio</label>
                <textarea 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-4 focus:border-primary outline-none min-h-[100px] resize-none"
                />
              </div>
              <Button className="w-full h-14 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20" onClick={handleSaveProfile}>
                Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Followers Modal */}
      {showFollowers && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex flex-col justify-end animate-in fade-in" onClick={() => setShowFollowers(false)}>
          <div className="bg-card border border-border rounded-t-3xl p-6 pb-safe h-[70vh] overflow-y-auto w-full max-w-md mx-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Seguidores (1.2k)</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowFollowers(false)}><XCircle size={24} /></Button>
            </div>
            
            {/* Find Friends / Suggestions (Inside Followers Modal as requested) */}
            <div className="mb-6">
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Sugestões de Amigos</h4>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="min-w-[120px] p-3 rounded-xl border border-border bg-muted/30 flex flex-col items-center gap-2">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={`https://i.pravatar.cc/150?img=${i+20}`} />
                      <AvatarFallback>A</AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <p className="text-xs font-bold truncate w-full">atleta_{i}</p>
                      <p className="text-[9px] text-muted-foreground">Comum com alex</p>
                    </div>
                    <Button size="sm" className="h-7 w-full text-[10px] font-bold">Seguir</Button>
                  </div>
                ))}
              </div>
            </div>

            <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Todos Seguidores</h4>
            <div className="space-y-4">
              {Array.from({length: 10}).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={`https://i.pravatar.cc/150?img=${i+10}`} />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-sm">usuário_{i+1}</p>
                      <p className="text-xs text-muted-foreground">Treinando há {i+1} meses</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 text-xs font-bold rounded-lg border-border">Remover</Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowing && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex flex-col justify-end animate-in fade-in" onClick={() => setShowFollowing(false)}>
          <div className="bg-card border border-border rounded-t-3xl p-6 pb-safe h-[70vh] overflow-y-auto w-full max-w-md mx-auto" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Seguindo (245)</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowFollowing(false)}><XCircle size={24} /></Button>
            </div>
            <div className="space-y-4">
              {Array.from({length: 10}).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={`https://i.pravatar.cc/150?img=${i+30}`} />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-sm">amigo_{i+1}</p>
                      <p className="text-xs text-muted-foreground">Em 2 desafios com você</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 text-xs font-bold rounded-lg border-border">Seguindo</Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}