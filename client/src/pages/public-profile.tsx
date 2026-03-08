import { useState, useEffect } from "react";
import { useLocation, useParams, Link } from "wouter";
import { ChevronLeft, UserPlus, MessageCircle, Trophy, ShieldCheck, CheckCircle2, Users, ArrowUpRight, Flame, MapPin, Swords, Medal, UserCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function PublicProfile() {
  const [, setLocation] = useLocation();
  const { username } = useParams();

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
      if (!res.ok) return { following: false };
      return res.json();
    },
    enabled: !!username,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/follows/${username}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/follows/status", username] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/follows/${username}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/follows/status", username] });
    },
  });

  const isFollowing = followStatus?.following || false;
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

  return (
    <div className="pb-32">
      <div className="relative h-48 bg-gradient-to-br from-primary/20 to-background">
        <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
          <Button variant="ghost" size="icon" className="rounded-full bg-background/20 backdrop-blur-md" onClick={() => window.history.back()}>
            <ChevronLeft size={24} />
          </Button>
        </header>
        
        <div className="absolute -bottom-16 left-6 flex items-end gap-4">
          <Avatar className="w-32 h-32 border-4 border-background shadow-xl rounded-[2.5rem]">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="px-6 pt-20 space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-display font-bold" data-testid="text-profile-name">{displayName}</h1>
              <p className="text-primary font-medium text-sm">@{user.username}</p>
            </div>
            {isFollowing ? (
              <Button 
                variant="outline"
                className="rounded-xl h-10 px-6 font-bold"
                onClick={() => unfollowMutation.mutate()}
                disabled={unfollowMutation.isPending}
                data-testid="button-unfollow"
              >
                <UserCheck size={18} className="mr-2" /> Seguindo
              </Button>
            ) : (
              <Button 
                className="rounded-xl h-10 px-6 font-bold shadow-lg shadow-primary/20"
                onClick={() => followMutation.mutate()}
                disabled={followMutation.isPending}
                data-testid="button-follow"
              >
                <UserPlus size={18} className="mr-2" /> Seguir
              </Button>
            )}
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {isPrivate && !isFollowing ? "Este perfil é privado." : (user.bio || "Sem bio ainda.")}
          </p>

          {(!isPrivate || isFollowing) && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1 rounded-xl font-bold h-12 border-primary/20 text-primary hover:bg-primary/5"
                onClick={() => setLocation(`/create?challengeWith=${user.username}`)}
                data-testid="button-challenge"
              >
                <Swords size={18} className="mr-2" /> Desafiar
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 rounded-xl font-bold h-12"
                onClick={() => setLocation(`/messages/${user.username}`)}
                data-testid="button-message"
              >
                <MessageCircle size={18} className="mr-2" /> Mensagem
              </Button>
            </div>
          )}
        </div>

        {(!isPrivate || isFollowing) ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 bg-card border-border rounded-2xl flex flex-col items-center text-center shadow-sm">
                <Trophy className="text-yellow-500 mb-1" size={20} />
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Membro desde</p>
                <p className="text-sm font-display font-bold">{new Date(user.createdAt).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}</p>
              </Card>
              <Card className="p-4 bg-card border-border rounded-2xl flex flex-col items-center text-center shadow-sm">
                <Flame className="text-orange-500 mb-1" size={20} />
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Status</p>
                <p className="text-sm font-display font-bold">{user.online ? "Online" : "Offline"}</p>
              </Card>
            </div>

            {user.goals && user.goals.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-display font-bold flex items-center gap-2">
                  <Medal size={18} className="text-primary" /> Objetivos
                </h3>
                <div className="flex flex-wrap gap-2">
                  {user.goals.map((goal: string, i: number) => (
                    <Badge key={i} variant="secondary" className="rounded-xl bg-primary/10 text-primary border-none text-xs px-3 py-1">
                      {goal}
                    </Badge>
                  ))}
                </div>
              </div>
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
      </div>
    </div>
  );
}
