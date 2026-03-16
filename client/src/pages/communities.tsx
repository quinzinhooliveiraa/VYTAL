import { useState } from "react";
import { useLocation, Link } from "wouter";
import { ChevronLeft, Search, Users, Plus, ShieldCheck, Trophy, Flame, Lock, Crown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function Communities() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: allCommunities = [], isLoading } = useQuery({
    queryKey: ["/api/communities"],
    queryFn: async () => {
      const res = await fetch("/api/communities", { credentials: "include" });
      return res.ok ? res.json() : [];
    },
  });

  const { data: myCommunities = [] } = useQuery({
    queryKey: ["/api/communities/mine"],
    queryFn: async () => {
      const res = await fetch("/api/communities/mine", { credentials: "include" });
      return res.ok ? res.json() : [];
    },
  });

  const joinMutation = useMutation({
    mutationFn: async (communityId: string) => {
      const res = await apiRequest("POST", `/api/communities/${communityId}/join`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/communities/mine"] });
      toast({ title: "Entrou na comunidade!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async (communityId: string) => {
      const res = await apiRequest("DELETE", `/api/communities/${communityId}/leave`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/communities/mine"] });
      toast({ title: "Saiu da comunidade" });
    },
  });

  const myCommIds = new Set(myCommunities.map((c: any) => c.id));

  const visibleCommunities = allCommunities.filter((c: any) => {
    if (myCommIds.has(c.id)) return true;
    if (c.createdBy === user?.id) return true;
    return c.memberCount >= 50;
  });

  const filtered = visibleCommunities.filter((c: any) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.sport?.toLowerCase().includes(search.toLowerCase())
  );

  const mine = filtered.filter((c: any) => myCommIds.has(c.id));
  const explore = filtered.filter((c: any) => !myCommIds.has(c.id));

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <header className="px-6 pt-6 pb-4 sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-full -ml-2" onClick={() => window.history.back()} data-testid="button-back">
              <ChevronLeft size={24} />
            </Button>
            <h1 className="text-2xl font-display font-bold">Comunidades</h1>
          </div>
          <Button size="icon" className="rounded-full bg-primary/10 text-primary hover:bg-primary/20" onClick={() => setLocation('/create-community')} data-testid="button-create-community">
            <Plus size={20} />
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Buscar por esporte, nome..."
            className="pl-10 h-12 bg-muted/50 border-none rounded-2xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-communities"
          />
        </div>
      </header>

      <div className="p-6 space-y-6">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-[2rem] p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <Crown size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-primary mb-1">Crie sua comunidade</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-1">
                Reúna membros, crie desafios exclusivos e ganhe uma comissão de <strong className="text-primary">5%</strong> sobre o pote de cada desafio da comunidade.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-[9px] bg-yellow-500/10 text-yellow-600 border-none">
                  <TrendingUp size={10} className="mr-1" /> MONETIZE
                </Badge>
                <span className="text-[9px] text-muted-foreground">Mínimo 50 membros para aparecer publicamente</span>
              </div>
            </div>
          </div>
          <Button className="w-full h-10 rounded-xl font-bold text-xs" onClick={() => setLocation('/create-community')} data-testid="button-create-community-cta">
            Criar Comunidade
          </Button>
        </div>

        {mine.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-display font-bold text-lg flex items-center gap-2">
              <Users className="text-primary" size={20}/> Minhas Comunidades
            </h2>
            <div className="grid gap-4">
              {mine.map((comm: any) => (
                <CommunityCard key={comm.id} community={comm} isMember={true} onLeave={() => leaveMutation.mutate(comm.id)} />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="font-display font-bold text-lg flex items-center gap-2">
            <Flame className="text-orange-500" size={20}/> {mine.length > 0 ? "Explorar" : "Comunidades"}
          </h2>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm">Carregando...</p>
            </div>
          ) : explore.length === 0 && mine.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-bold">Nenhuma comunidade disponível</p>
              <p className="text-xs mt-1">Seja o primeiro a criar uma!</p>
            </div>
          ) : explore.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Nenhuma outra comunidade disponível</p>
              <p className="text-[10px] mt-1">Comunidades precisam de 50+ membros para aparecer aqui</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {explore.map((comm: any) => (
                <CommunityCard key={comm.id} community={comm} isMember={false} onJoin={() => joinMutation.mutate(comm.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CommunityCard({ community, isMember, onJoin, onLeave }: {
  community: any;
  isMember: boolean;
  onJoin?: () => void;
  onLeave?: () => void;
}) {
  const comm = community;
  const hasImage = comm.image && comm.image.length > 10;

  return (
    <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm group cursor-pointer hover:border-primary/50 transition-colors" data-testid={`card-community-${comm.id}`}>
      {hasImage ? (
        <div className="h-32 relative">
          <img src={comm.image} alt={comm.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <Badge className="absolute top-3 left-3 bg-primary/80 backdrop-blur-md border-none text-[10px]">{comm.sport}</Badge>
          {comm.isPrivate && (
            <Badge className="absolute top-3 right-3 bg-yellow-500/80 backdrop-blur-md border-none text-[10px]">
              <Lock size={10} className="mr-1" /> Privada
            </Badge>
          )}
          <div className="absolute bottom-3 left-4 right-4">
            <h3 className="text-lg font-bold text-white leading-tight">{comm.name}</h3>
          </div>
        </div>
      ) : (
        <div className="h-28 relative bg-gradient-to-br from-primary/20 to-primary/5 flex items-end">
          <Badge className="absolute top-3 left-3 bg-primary/80 backdrop-blur-md border-none text-[10px]">{comm.sport}</Badge>
          {comm.isPrivate && (
            <Badge className="absolute top-3 right-3 bg-yellow-500/80 backdrop-blur-md border-none text-[10px]">
              <Lock size={10} className="mr-1" /> Privada
            </Badge>
          )}
          <div className="p-4">
            <h3 className="text-lg font-bold leading-tight">{comm.name}</h3>
          </div>
        </div>
      )}
      <div className="p-4 flex justify-between items-center bg-card">
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users size={14} />
            <span className="text-xs font-bold">{(comm.memberCount || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 text-orange-500">
            <Trophy size={14} />
            <span className="text-xs font-bold">{comm.activeChallenges || 0} desafios</span>
          </div>
          {comm.ownerFeePercent && Number(comm.ownerFeePercent) > 0 && (
            <div className="flex items-center gap-1.5 text-primary">
              <TrendingUp size={14} />
              <span className="text-xs font-bold">{Number(comm.ownerFeePercent)}% fee</span>
            </div>
          )}
        </div>
        {isMember ? (
          <Button variant="secondary" size="sm" className="rounded-xl h-8 text-xs font-bold" onClick={(e) => { e.stopPropagation(); onLeave?.(); }} data-testid={`button-leave-${comm.id}`}>
            Membro
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="rounded-xl h-8 text-xs font-bold border-primary text-primary hover:bg-primary/5" onClick={(e) => { e.stopPropagation(); onJoin?.(); }} data-testid={`button-join-${comm.id}`}>
            Participar
          </Button>
        )}
      </div>
    </div>
  );
}
