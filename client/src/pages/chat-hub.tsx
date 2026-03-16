import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Search, MessageCircle, Inbox, ArrowLeft, Trophy, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

export default function ChatHub() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [showRequests, setShowRequests] = useState(false);

  const { data: conversations = [] } = useQuery({
    queryKey: ["/api/messages/conversations"],
    queryFn: async () => {
      const res = await fetch("/api/messages/conversations", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 5000,
  });

  const { data: myChallenges = [] } = useQuery({
    queryKey: ["/api/challenges/mine"],
    queryFn: async () => {
      const res = await fetch("/api/challenges/mine", { credentials: "include" });
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

  const followerConversations = normalizedConversations.filter((c: any) => c.isFollower);
  const requestConversations = normalizedConversations.filter((c: any) => !c.isFollower);

  const requestCount = requestConversations.length;

  const filteredFollower = followerConversations.filter((c: any) =>
    search === "" || c.otherUser?.name?.toLowerCase().includes(search.toLowerCase()) || c.otherUser?.username?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredRequests = requestConversations.filter((c: any) =>
    search === "" || c.otherUser?.name?.toLowerCase().includes(search.toLowerCase()) || c.otherUser?.username?.toLowerCase().includes(search.toLowerCase())
  );

  const activeChallenges = myChallenges.filter((c: any) => c.isActive || c.status === "active");

  const filteredChallenges = activeChallenges.filter((c: any) =>
    search === "" || c.title?.toLowerCase().includes(search.toLowerCase())
  );

  const renderConversation = (chat: any, isRequest?: boolean) => (
    <Link key={chat.otherUser?.id} href={`/messages/${chat.otherUser?.username}`}>
      <div className={`flex items-center gap-4 p-3 rounded-2xl hover:border-primary/50 cursor-pointer transition-colors ${isRequest ? 'bg-muted/50 border border-dashed border-border' : 'bg-card border border-border'}`}>
        <div className="relative">
          <Avatar className="w-14 h-14 border border-border">
            {chat.otherUser?.avatar && <AvatarImage src={chat.otherUser.avatar} />}
            <AvatarFallback className="text-lg font-bold">{(chat.otherUser?.name || chat.otherUser?.username || "?").charAt(0).toUpperCase()}</AvatarFallback>
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
        {chat.unreadCount > 0 && (
          <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
            {chat.unreadCount}
          </div>
        )}
      </div>
    </Link>
  );

  if (showRequests) {
    return (
      <div className="min-h-[100dvh] bg-background pb-24">
        <header className="px-6 pt-6 pb-4 sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowRequests(false)} className="p-1 -ml-1 rounded-full hover:bg-muted" data-testid="button-back-requests">
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-xl font-display font-bold">Pedidos de Mensagem</h1>
            {requestCount > 0 && (
              <Badge className="bg-primary/20 text-primary text-[10px] font-bold border-none">{requestCount}</Badge>
            )}
          </div>
        </header>

        <div className="px-6 mt-4 space-y-3">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-3">
            <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium flex items-center gap-2">
              <Inbox size={14} />
              Mensagens de pessoas que você não segue. Ao responder, a conversa vai para suas mensagens.
            </p>
          </div>
          {filteredRequests.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Inbox size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum pedido de mensagem</p>
            </div>
          )}
          {filteredRequests.map((c: any) => renderConversation(c, true))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <header className="px-6 pt-6 pb-4 sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-display font-bold">Mensagens</h1>
          <button
            onClick={() => setShowRequests(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors relative"
            data-testid="button-open-requests"
          >
            <Inbox size={16} className="text-primary" />
            <span className="text-xs font-bold text-primary">Pedidos</span>
            {requestCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {requestCount}
              </span>
            )}
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Buscar conversas..." 
            className="pl-10 h-12 bg-muted/50 border-none rounded-2xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-chats"
          />
        </div>
      </header>

      <div className="px-6 mt-4 space-y-6">
        {filteredChallenges.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
              <Trophy size={12} /> Chats de Desafios
            </h4>
            <div className="space-y-2">
              {filteredChallenges.map((challenge: any) => (
                <div
                  key={challenge.id}
                  className="flex items-center gap-4 p-3 bg-card border border-border rounded-2xl hover:border-primary/50 cursor-pointer transition-colors"
                  onClick={() => setLocation(`/challenges/${challenge.id}`)}
                  data-testid={`challenge-chat-${challenge.id}`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Trophy size={22} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate">{challenge.title}</h3>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <Users size={10} />
                      {challenge.sport} · {challenge.status === "active" ? "Ativo" : challenge.status}
                    </p>
                  </div>
                  <Badge className="bg-primary/10 text-primary text-[9px] font-bold border-none shrink-0">
                    Grupo
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          {filteredChallenges.length > 0 && (
            <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
              <MessageCircle size={12} /> Conversas Diretas
            </h4>
          )}
          <div className="space-y-3">
            {filteredFollower.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <MessageCircle size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">Nenhuma conversa ainda</p>
                <p className="text-xs mt-1">Envie uma mensagem para alguém que você segue!</p>
              </div>
            )}
            {filteredFollower.map((c: any) => renderConversation(c))}
          </div>
        </div>
      </div>
    </div>
  );
}
