import { useState, useRef, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { ArrowLeft, Send, Loader2, MessageCircle, Trophy, Users, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

export default function ChallengeChat() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: challenge, isLoading: challengeLoading } = useQuery({
    queryKey: [`/api/challenges/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/challenges/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Desafio não encontrado");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: chatMessages = [], refetch: refetchMessages } = useQuery({
    queryKey: [`/api/challenges/${id}/messages`],
    queryFn: async () => {
      const res = await fetch(`/api/challenges/${id}/messages`, { credentials: "include" });
      return res.ok ? res.json() : [];
    },
    enabled: !!id && !!challenge?.isParticipant,
    refetchInterval: 5000,
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
      setMessage("");
      refetchMessages();
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const handleSend = () => {
    const text = message.trim();
    if (!text) return;
    sendMessageMutation.mutate(text);
  };

  if (challengeLoading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-background gap-3">
        <Trophy className="w-12 h-12 text-muted-foreground opacity-30" />
        <p className="text-sm text-muted-foreground">Desafio não encontrado</p>
        <Button variant="outline" onClick={() => setLocation("/chat-hub")} data-testid="button-back-chat-hub">
          Voltar
        </Button>
      </div>
    );
  }

  const isParticipant = challenge.isParticipant;

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  let prevDate = "";

  return (
    <div className="h-[100dvh] flex flex-col bg-background" data-testid="challenge-chat-page">
      <header className="px-4 py-3 bg-card border-b border-border flex items-center gap-3 shrink-0">
        <button
          onClick={() => setLocation("/chat-hub")}
          className="p-1.5 -ml-1 rounded-lg hover:bg-muted transition-colors"
          data-testid="button-back-from-chat"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <Trophy size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-sm truncate" data-testid="text-challenge-title">{challenge.title}</h1>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Users size={10} />
            {challenge.activeParticipantCount || challenge.participantCount || 0} participantes
          </p>
        </div>
        <Link href={`/challenge/${id}`}>
          <button className="p-2 rounded-lg hover:bg-muted transition-colors" data-testid="button-view-challenge">
            <Info size={18} className="text-muted-foreground" />
          </button>
        </Link>
      </header>

      <ScrollArea className="flex-1 px-4">
        <div className="py-4 space-y-3">
          {!isParticipant && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
              <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                Você precisa participar do desafio para ver e enviar mensagens.
              </p>
              <Link href={`/challenge/${id}`}>
                <Button variant="outline" size="sm" className="mt-3" data-testid="button-join-challenge">
                  Ver desafio
                </Button>
              </Link>
            </div>
          )}

          {isParticipant && chatMessages.length === 0 && (
            <div className="text-center py-16 space-y-2">
              <MessageCircle className="mx-auto text-muted-foreground opacity-30" size={40} />
              <p className="text-sm text-muted-foreground font-medium">Nenhuma mensagem ainda</p>
              <p className="text-xs text-muted-foreground/70">Seja o primeiro a mandar uma mensagem!</p>
            </div>
          )}

          {isParticipant && chatMessages.map((msg: any) => {
            const isMe = msg.userId === user?.id;
            const msgDate = msg.createdAt ? new Date(msg.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" }) : "";
            const showDateSep = msgDate !== prevDate;
            if (msgDate) prevDate = msgDate;

            return (
              <div key={msg.id}>
                {showDateSep && msgDate && (
                  <div className="flex justify-center my-4">
                    <span className="text-[10px] text-muted-foreground/60 bg-muted/50 px-3 py-1 rounded-full">{msgDate}</span>
                  </div>
                )}
                <div className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}>
                  {!isMe && (
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarImage src={msg.user?.avatar} />
                      <AvatarFallback className="text-xs">{(msg.user?.name || "?").charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`flex flex-col max-w-[75%] ${isMe ? "items-end" : ""}`}>
                    {!isMe && (
                      <span className="text-[10px] font-bold text-muted-foreground mb-0.5 ml-1">{msg.user?.name}</span>
                    )}
                    <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted rounded-tl-sm"
                    }`}>
                      {msg.text}
                    </div>
                    <span className={`text-[9px] text-muted-foreground/50 mt-0.5 ${isMe ? "mr-1" : "ml-1"}`}>
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>
      </ScrollArea>

      {isParticipant && (
        <div className="px-4 py-3 bg-card border-t border-border shrink-0">
          <div className="flex gap-2">
            <Input
              placeholder="Mensagem..."
              className="rounded-full bg-muted/50 border-none"
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
              data-testid="input-challenge-chat-message"
            />
            <Button
              size="icon"
              className="rounded-full shrink-0"
              onClick={handleSend}
              disabled={sendMessageMutation.isPending || !message.trim()}
              data-testid="button-send-challenge-message"
            >
              {sendMessageMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
