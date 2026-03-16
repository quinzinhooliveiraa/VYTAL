import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { ChevronLeft, UserPlus, MessageCircle, Trophy, ShieldCheck, CheckCircle2, Users, Flame, Medal, UserCheck, Loader2, Swords, DollarSign, Target, Calendar, X, Hourglass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion } from "framer-motion";

export default function PublicProfile() {
  const [, setLocation] = useLocation();
  const { username } = useParams();
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [username]);

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/users", username],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!username,
  });

  const { data: followStatus } = useQuery({
    queryKey: ["/api/follows/status", username],
    queryFn: async () => {
      const res = await fetch(`/api/follows/status/${username}`, { credentials: "include" });
      if (!res.ok) return { following: false, requested: false };
      return res.json();
    },
    enabled: !!username,
  });

  const { data: suggestedUsers = [] } = useQuery({
    queryKey: ["/api/users", username, "suggested"],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}/suggested`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!username,
  });

  const { data: userFollowers = [] } = useQuery({
    queryKey: ["/api/users", username, "followers-list"],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}/followers`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!username && followersOpen,
  });

  const { data: userFollowing = [] } = useQuery({
    queryKey: ["/api/users", username, "following-list"],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}/following`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!username && followingOpen,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/follows/${username}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/follows/status", username] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", username] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/follows/${username}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/follows/status", username] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", username] });
    },
  });

  const isFollowing = followStatus?.following || false;
  const isRequested = followStatus?.requested || false;
  const isPrivate = user?.isPrivate || false;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <p className="text-xl font-bold mb-2">Usuário não encontrado</p>
        <p className="text-sm text-muted-foreground mb-6">@{username} não existe ou foi removido.</p>
        <Button onClick={() => window.history.back()}>Voltar</Button>
      </div>
    );
  }

  const displayName = user.name || username;
  const avatarUrl = user.avatar || `https://i.pravatar.cc/150?u=${username}`;
  const hasBanner = user.banner && user.banner.length > 10;
  const stats = user.stats || { challengesCompleted: 0, challengesWon: 0, totalEarned: 0, checkInCount: 0 };

  return (
    <div className="pb-32">
      <div className="relative h-44">
        {hasBanner ? (
          <>
            <img src={user.banner} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
        )}
        <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
          <Button variant="ghost" size="icon" className={`rounded-full backdrop-blur-md ${hasBanner ? 'bg-black/40 text-white border border-white/10' : 'bg-background/60 border border-border'}`} onClick={() => window.history.back()} data-testid="button-back">
            <ChevronLeft size={24} />
          </Button>
        </header>

        <div className="absolute -bottom-16 left-6 flex items-end gap-4">
          <Avatar className="w-28 h-28 border-4 border-background shadow-xl rounded-[2rem]">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="text-3xl">{displayName.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="px-6 pt-20 space-y-5">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-display font-bold" data-testid="text-profile-name">{displayName}</h1>
            <p className="text-primary font-medium text-sm">@{user.username}</p>
          </div>
          {isFollowing ? (
            <Button
              variant="outline"
              className="rounded-xl h-10 px-5 font-bold text-sm"
              onClick={() => unfollowMutation.mutate()}
              disabled={unfollowMutation.isPending}
              data-testid="button-unfollow"
            >
              <UserCheck size={16} className="mr-1.5" /> Seguindo
            </Button>
          ) : isRequested ? (
            <Button
              variant="outline"
              className="rounded-xl h-10 px-5 font-bold text-sm text-yellow-600 border-yellow-500/30"
              onClick={() => unfollowMutation.mutate()}
              disabled={unfollowMutation.isPending}
              data-testid="button-requested"
            >
              <Hourglass size={16} className="mr-1.5" /> Solicitado
            </Button>
          ) : (
            <Button
              className="rounded-xl h-10 px-5 font-bold text-sm shadow-lg shadow-primary/20"
              onClick={() => followMutation.mutate()}
              disabled={followMutation.isPending}
              data-testid="button-follow"
            >
              <UserPlus size={16} className="mr-1.5" /> Seguir
            </Button>
          )}
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center cursor-pointer" onClick={() => setFollowersOpen(true)} data-testid="stat-followers">
            <p className="font-display font-bold text-lg">{user.followerCount || 0}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Seguidores</p>
          </div>
          <div className="text-center cursor-pointer" onClick={() => setFollowingOpen(true)} data-testid="stat-following">
            <p className="font-display font-bold text-lg">{user.followingCount || 0}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Seguindo</p>
          </div>
          <div className="text-center" data-testid="stat-challenges">
            <p className="font-display font-bold text-lg">{stats.challengesCompleted}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Desafios</p>
          </div>
        </div>

        <p className="text-muted-foreground text-sm leading-relaxed">
          {isPrivate && !isFollowing ? "Este perfil é privado." : (user.bio || "Sem bio ainda.")}
        </p>

        {(!isPrivate || isFollowing) && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl font-bold h-11 border-primary/20 text-primary hover:bg-primary/5"
              onClick={() => setLocation(`/create?challengeWith=${user.username}`)}
              data-testid="button-challenge"
            >
              <Swords size={16} className="mr-1.5" /> Desafiar
            </Button>
            <Button
              variant="outline"
              className="flex-1 rounded-xl font-bold h-11"
              onClick={() => setLocation(`/messages/${user.username}`)}
              data-testid="button-message"
            >
              <MessageCircle size={16} className="mr-1.5" /> Mensagem
            </Button>
          </div>
        )}

        {(!isPrivate || isFollowing) ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="p-4 bg-card border-border rounded-2xl flex flex-col items-center text-center shadow-sm">
                  <Trophy className="text-yellow-500 mb-2" size={22} />
                  <p className="font-display font-bold text-xl">{stats.challengesWon}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Vitórias</p>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Card className="p-4 bg-card border-border rounded-2xl flex flex-col items-center text-center shadow-sm">
                  <Target className="text-orange-500 mb-2" size={22} />
                  <p className="font-display font-bold text-xl">{stats.challengesCompleted}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Desafios Feitos</p>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="p-4 bg-card border-border rounded-2xl flex flex-col items-center text-center shadow-sm">
                  <CheckCircle2 className="text-primary mb-2" size={22} />
                  <p className="font-display font-bold text-xl">{stats.checkInCount}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Check-ins</p>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <Card className="p-4 bg-card border-border rounded-2xl flex flex-col items-center text-center shadow-sm">
                  <Calendar className="text-blue-500 mb-2" size={22} />
                  <p className="font-display font-bold text-sm">{new Date(user.createdAt).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Membro desde</p>
                </Card>
              </motion.div>
            </div>

            {user.publicEarnings && stats.totalEarned > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 rounded-2xl flex items-center gap-4 shadow-sm">
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                    <DollarSign className="text-primary" size={24} />
                  </div>
                  <div>
                    <p className="font-display font-bold text-lg text-primary">R$ {Number(stats.totalEarned).toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Ganho em Desafios</p>
                  </div>
                </Card>
              </motion.div>
            )}

            {user.goals && user.goals.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="space-y-3">
                <h3 className="font-display font-bold flex items-center gap-2">
                  <Medal size={18} className="text-primary" /> Medalhas & Objetivos
                </h3>
                <div className="flex flex-wrap gap-2">
                  {user.goals.map((goal: string, i: number) => (
                    <Badge key={i} variant="secondary" className="rounded-xl bg-primary/10 text-primary border-none text-xs px-3 py-1.5">
                      {goal}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            )}

            {(stats.challengesWon > 0 || stats.challengesCompleted >= 5 || stats.checkInCount >= 10) && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-3">
                <h3 className="font-display font-bold flex items-center gap-2">
                  <Flame size={18} className="text-orange-500" /> Conquistas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {stats.challengesWon > 0 && (
                    <div className="flex items-center gap-2 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-xl px-3 py-2 text-xs font-bold">
                      <Trophy size={14} /> {stats.challengesWon}x Campeão
                    </div>
                  )}
                  {stats.challengesCompleted >= 5 && (
                    <div className="flex items-center gap-2 bg-blue-500/10 text-blue-500 rounded-xl px-3 py-2 text-xs font-bold">
                      <Target size={14} /> Veterano
                    </div>
                  )}
                  {stats.checkInCount >= 10 && (
                    <div className="flex items-center gap-2 bg-primary/10 text-primary rounded-xl px-3 py-2 text-xs font-bold">
                      <CheckCircle2 size={14} /> Dedicado
                    </div>
                  )}
                  {stats.challengesCompleted >= 10 && (
                    <div className="flex items-center gap-2 bg-purple-500/10 text-purple-500 rounded-xl px-3 py-2 text-xs font-bold">
                      <Medal size={14} /> Lenda
                    </div>
                  )}
                  {stats.checkInCount >= 50 && (
                    <div className="flex items-center gap-2 bg-orange-500/10 text-orange-500 rounded-xl px-3 py-2 text-xs font-bold">
                      <Flame size={14} /> Imparável
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <ShieldCheck size={40} className="text-muted-foreground" />
            </div>
            <div>
              <p className="font-display font-bold text-xl">Esta conta é privada</p>
              <p className="text-sm text-muted-foreground">Siga esta conta para ver seus desafios e informações.</p>
            </div>
          </div>
        )}

        {suggestedUsers.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="space-y-3">
            <h3 className="font-display font-bold flex items-center gap-2">
              <Users size={18} className="text-blue-500" /> Sugestões para Você
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {suggestedUsers.map((s: any) => (
                <div
                  key={s.id}
                  className="flex-shrink-0 w-32 bg-card border border-border rounded-2xl p-4 flex flex-col items-center text-center gap-2 cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setLocation(`/user/${s.username}`)}
                  data-testid={`suggested-${s.username}`}
                >
                  <Avatar className="w-14 h-14 border-2 border-border">
                    <AvatarImage src={s.avatar || `https://i.pravatar.cc/150?u=${s.username}`} />
                    <AvatarFallback>{(s.name || "?").charAt(0)}</AvatarFallback>
                  </Avatar>
                  <p className="font-bold text-xs truncate w-full">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate w-full">@{s.username}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <Dialog open={followersOpen} onOpenChange={setFollowersOpen}>
        <DialogContent className="max-w-sm rounded-2xl max-h-[70vh]">
          <DialogHeader>
            <DialogTitle>Seguidores ({user.followerCount || 0})</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh]">
            <div className="space-y-3">
              {userFollowers.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">Nenhum seguidor ainda</p>
              )}
              {userFollowers.map((f: any) => (
                <div key={f.id} className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 rounded-xl p-2 transition-colors" onClick={() => { setFollowersOpen(false); setLocation(`/user/${f.username}`); }}>
                  <Avatar className="w-10 h-10 border border-border">
                    <AvatarImage src={f.avatar || `https://i.pravatar.cc/150?u=${f.username}`} />
                    <AvatarFallback>{(f.name || "?").charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{f.name}</p>
                    <p className="text-[10px] text-muted-foreground">@{f.username}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={followingOpen} onOpenChange={setFollowingOpen}>
        <DialogContent className="max-w-sm rounded-2xl max-h-[70vh]">
          <DialogHeader>
            <DialogTitle>Seguindo ({user.followingCount || 0})</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh]">
            <div className="space-y-3">
              {userFollowing.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">Não segue ninguém ainda</p>
              )}
              {userFollowing.map((f: any) => (
                <div key={f.id} className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 rounded-xl p-2 transition-colors" onClick={() => { setFollowingOpen(false); setLocation(`/user/${f.username}`); }}>
                  <Avatar className="w-10 h-10 border border-border">
                    <AvatarImage src={f.avatar || `https://i.pravatar.cc/150?u=${f.username}`} />
                    <AvatarFallback>{(f.name || "?").charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{f.name}</p>
                    <p className="text-[10px] text-muted-foreground">@{f.username}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
