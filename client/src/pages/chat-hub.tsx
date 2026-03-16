import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Search, Users, MessageCircle, Trophy, ChevronRight, Hash, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";

export default function ChatHub() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("direct");

  const { data: conversations = [] } = useQuery({
    queryKey: ["/api/messages/conversations"],
    queryFn: async () => {
      const res = await fetch("/api/messages/conversations", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 5000,
  });

  const { data: communities = [] } = useQuery({
    queryKey: ["/api/communities/mine"],
    queryFn: async () => {
      const res = await fetch("/api/communities/mine", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (days === 1) return "Ontem";
    if (days < 7) return d.toLocaleDateString("pt-BR", { weekday: "long" });
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const normalizedConversations = conversations.map((c: any) => ({
    ...c,
    otherUser: c.otherUser || c.user,
  }));

  const filteredConversations = normalizedConversations.filter((c: any) =>
    search === "" || c.otherUser?.name?.toLowerCase().includes(search.toLowerCase()) || c.otherUser?.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <header className="px-6 pt-6 pb-4 sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border">
        <h1 className="text-3xl font-display font-bold mb-4">Conversas</h1>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Buscar mensagens, grupos..." 
            className="pl-10 h-12 bg-muted/50 border-none rounded-2xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-chats"
          />
        </div>
      </header>

      <div className="px-6 mt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 h-12 rounded-xl bg-muted p-1 mb-6">
            <TabsTrigger value="direct" className="rounded-lg font-bold">Privado</TabsTrigger>
            <TabsTrigger value="challenges" className="rounded-lg font-bold">Desafios</TabsTrigger>
            <TabsTrigger value="communities" className="rounded-lg font-bold">Comunidades</TabsTrigger>
          </TabsList>

          <TabsContent value="direct" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            {filteredConversations.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <MessageCircle size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhuma conversa ainda</p>
                <p className="text-xs mt-1">Envie uma mensagem para alguém para começar!</p>
              </div>
            )}
            {filteredConversations.map((chat: any) => (
              <Link key={chat.otherUser?.id} href={`/messages/${chat.otherUser?.username}`}>
                <div className="flex items-center gap-4 p-3 bg-card border border-border rounded-2xl hover:border-primary/50 cursor-pointer transition-colors">
                  <div className="relative">
                    <Avatar className="w-14 h-14 border border-border">
                      <AvatarImage src={chat.otherUser?.avatar || `https://i.pravatar.cc/150?u=${chat.otherUser?.username}`} />
                      <AvatarFallback>{(chat.otherUser?.name || "?").charAt(0)}</AvatarFallback>
                    </Avatar>
                    {chat.otherUser?.online && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full"></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-bold text-sm truncate">{chat.otherUser?.name || chat.otherUser?.username}</h3>
                      <span className="text-[10px] text-muted-foreground">{formatTime(chat.lastMessage?.createdAt)}</span>
                    </div>
                    <p className="text-xs truncate text-muted-foreground">
                      {chat.lastMessage?.text || "Sem mensagens"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </TabsContent>

          <TabsContent value="challenges" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="text-center py-12 text-muted-foreground">
              <Trophy size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Chats de desafios aparecem aqui</p>
              <p className="text-xs mt-1">Participe de um desafio para ver seu chat.</p>
            </div>
          </TabsContent>

          <TabsContent value="communities" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-primary/20 transition-colors" onClick={() => setLocation('/communities')}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                  <Search size={20} />
                </div>
                <div>
                  <p className="font-bold text-sm text-primary">Explorar Comunidades</p>
                  <p className="text-[10px] text-primary/80">Encontre grupos do seu esporte</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-primary" />
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground px-1">Suas Comunidades</h4>
              {communities.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Hash size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma comunidade ainda</p>
                </div>
              )}
              {communities.map((c: any) => (
                <div key={c.id} className="flex items-center gap-4 p-3 bg-card border border-border rounded-2xl hover:border-primary/50 cursor-pointer transition-colors" onClick={() => setLocation(`/communities`)}>
                  <Avatar className="w-14 h-14 border border-border rounded-2xl">
                    <AvatarImage src={c.image} className="object-cover" />
                    <AvatarFallback><Hash size={20} /></AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate flex items-center gap-1">
                      {c.name}
                    </h3>
                    <p className="text-xs truncate text-muted-foreground">
                      {c.description || "Comunidade"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
