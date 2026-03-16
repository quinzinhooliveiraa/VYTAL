import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Search, Users, UserCheck, Sparkles, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Friends() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: following = [] } = useQuery<any[]>({
    queryKey: ["/api/users", user?.username, "following"],
    queryFn: async () => {
      const res = await fetch(`/api/users/${user?.username}/following`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user?.username,
  });

  const { data: followers = [] } = useQuery<any[]>({
    queryKey: ["/api/users", user?.username, "followers"],
    queryFn: async () => {
      const res = await fetch(`/api/users/${user?.username}/followers`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user?.username,
  });

  const { data: suggested = [] } = useQuery<any[]>({
    queryKey: ["/api/users", user?.username, "suggested"],
    queryFn: async () => {
      const res = await fetch(`/api/users/${user?.username}/suggested`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user?.username,
  });

  const handleFollow = async (username: string, name: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await apiRequest("POST", `/api/users/${username}/follow`);
      toast({ title: "Seguindo!", description: `Você agora segue ${name}` });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.username, "following"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.username, "suggested"] });
    } catch {
      toast({ title: "Erro", description: "Não foi possível seguir.", variant: "destructive" });
    }
  };

  const filteredFollowing = following.filter((f: any) =>
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.username?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredFollowers = followers.filter((f: any) =>
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.username?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSuggested = suggested.filter((f: any) =>
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.username?.toLowerCase().includes(search.toLowerCase())
  );

  const renderPerson = (person: any, showFollowButton?: boolean) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      key={person.id || person.username}
    >
      <div onClick={() => setLocation(`/user/${person.username}`)} className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl cursor-pointer active:scale-[0.98] hover:border-primary/50 transition-all" data-testid={`card-person-${person.username}`}>
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12">
            {person.avatar && <AvatarImage src={person.avatar} />}
            <AvatarFallback>{(person.name || person.username || "?").charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold text-sm">{person.name || person.username}</p>
            <p className="text-[10px] text-muted-foreground">@{person.username}</p>
            {person.bio && <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5 italic">"{person.bio}"</p>}
          </div>
        </div>
        {showFollowButton ? (
          <Button size="sm" className="rounded-xl font-bold bg-primary text-primary-foreground" onClick={(e) => handleFollow(person.username, person.name || person.username, e)} data-testid={`button-follow-${person.username}`}>
            <UserPlus size={16} className="mr-1" /> Seguir
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); }}>
            <ChevronLeft className="rotate-180" size={20} />
          </Button>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="pb-32">
      <header className="px-6 py-6 sticky top-0 bg-background/80 backdrop-blur-xl z-50 border-b border-border">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" className="rounded-full -ml-2" onClick={() => window.history.back()} data-testid="button-back">
            <ChevronLeft size={24} />
          </Button>
          <h1 className="text-xl font-display font-bold">Comunidade</h1>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Buscar..." 
            className="h-12 pl-10 rounded-xl bg-card border-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-friends"
          />
        </div>
      </header>

      <div className="p-6">
        <Tabs defaultValue="following" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12 rounded-xl bg-muted p-1 mb-6">
            <TabsTrigger value="following" className="rounded-lg font-bold text-xs flex gap-1" data-testid="tab-following">
              <Users size={14} /> Seguindo
            </TabsTrigger>
            <TabsTrigger value="followers" className="rounded-lg font-bold text-xs flex gap-1" data-testid="tab-followers">
              <UserCheck size={14} /> Seguidores
            </TabsTrigger>
            <TabsTrigger value="suggested" className="rounded-lg font-bold text-xs flex gap-1" data-testid="tab-suggested">
              <Sparkles size={14} /> Sugestões
            </TabsTrigger>
          </TabsList>

          <TabsContent value="following" className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredFollowing.map((person: any) => renderPerson(person))}
            </AnimatePresence>
            {filteredFollowing.length === 0 && (
              <div className="text-center py-20 opacity-50">
                <Users size={48} className="mx-auto mb-2" />
                <p className="text-sm">Você ainda não segue ninguém.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="followers" className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredFollowers.map((person: any) => renderPerson(person))}
            </AnimatePresence>
            {filteredFollowers.length === 0 && (
              <div className="text-center py-20 opacity-50">
                <UserCheck size={48} className="mx-auto mb-2" />
                <p className="text-sm">Nenhum seguidor ainda.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="suggested" className="space-y-4">
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-3 mb-2">
              <p className="text-xs text-primary font-medium flex items-center gap-2">
                <Sparkles size={14} />
                Pessoas que você talvez conheça
              </p>
            </div>
            <AnimatePresence mode="popLayout">
              {filteredSuggested.map((person: any) => renderPerson(person, true))}
            </AnimatePresence>
            {filteredSuggested.length === 0 && (
              <div className="text-center py-20 opacity-50">
                <Sparkles size={48} className="mx-auto mb-2" />
                <p className="text-sm">Nenhuma sugestão por enquanto.</p>
                <p className="text-xs mt-1">Conforme mais pessoas entrarem, sugestões aparecerão aqui.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
