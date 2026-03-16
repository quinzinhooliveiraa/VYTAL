import { useState, useRef, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { ChevronLeft, Send, Phone, Video, MoreVertical, Mic, Reply, X, Swords, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

export default function Messages() {
  const [, setLocation] = useLocation();
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  
  const [message, setMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<{id: string, text: string, sender: string} | null>(null);
  const [showActions, setShowActions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: targetUser } = useQuery({
    queryKey: ["/api/users", username],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!username,
  });

  const { data: messagesData = [], refetch: refetchMessages } = useQuery({
    queryKey: ["/api/messages", username],
    queryFn: async () => {
      const res = await fetch(`/api/messages/${username}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!username,
    refetchInterval: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: async (data: { receiverUsername: string; text: string; replyToId?: string }) => {
      const res = await apiRequest("POST", "/api/messages", data);
      return res.json();
    },
    onSuccess: () => {
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messagesData]);

  const handleSend = () => {
    if (!message.trim() || !username) return;
    
    sendMutation.mutate({
      receiverUsername: username,
      text: message,
      replyToId: replyingTo?.id || undefined,
    });
    
    setMessage("");
    setReplyingTo(null);
  };

  const displayName = targetUser?.name || username || "Usuário";
  const avatarUrl = targetUser?.avatar || `https://i.pravatar.cc/150?u=${username || '1'}`;
  const isOnline = targetUser?.online || false;

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-background relative">
      <header className="px-4 py-3 flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full -ml-2" onClick={() => window.history.back()}>
            <ChevronLeft size={24} />
          </Button>
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setLocation(`/user/${username}`)}>
            <div className="relative">
              <Avatar className="w-10 h-10 border border-border">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              {isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
              )}
            </div>
            <div>
              <h2 className="font-bold text-sm leading-tight">{displayName}</h2>
              <p className="text-[10px] text-muted-foreground">{isOnline ? "Online agora" : "Offline"}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Button variant="ghost" size="icon" className="rounded-full w-8 h-8"><Phone size={18} /></Button>
          <Button variant="ghost" size="icon" className="rounded-full w-8 h-8"><Video size={18} /></Button>
          <Button variant="ghost" size="icon" className="rounded-full w-8 h-8"><MoreVertical size={18} /></Button>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4 bg-muted/20" ref={scrollRef}>
        <div className="space-y-6 pb-4">
          <div className="text-center">
            <span className="text-[10px] font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full uppercase tracking-widest">
              Mensagens
            </span>
          </div>

          {messagesData.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">Nenhuma mensagem ainda. Diga olá!</p>
            </div>
          )}

          {messagesData.map((msg: any) => {
            const isMe = msg.senderId === currentUser?.id;
            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id} 
                className={`flex flex-col group ${isMe ? "items-end" : "items-start"}`}
              >
                <div className={`flex items-center gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                  <div className="flex flex-col items-end">
                    <div 
                      className={`max-w-[280px] sm:max-w-[320px] shadow-sm flex flex-col ${
                        isMe 
                          ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm" 
                          : "bg-card border border-border text-foreground rounded-2xl rounded-tl-sm"
                      }`}
                    >
                      <div className="px-4 py-2.5 text-sm">
                        {msg.text}
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={() => setReplyingTo({ id: msg.id, text: msg.text, sender: isMe ? "me" : "them" })}
                  >
                    <Reply size={16} className="text-muted-foreground" />
                  </Button>
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 px-1">
                  {msg.createdAt ? formatTime(msg.createdAt) : ""}
                </span>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="p-4 bg-background border-t border-border mt-auto">
        <AnimatePresence>
          {replyingTo && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 12 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="flex items-center justify-between bg-muted/50 p-3 rounded-xl border-l-4 border-primary overflow-hidden"
            >
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-xs font-bold text-primary mb-0.5">
                  Respondendo a {replyingTo.sender === "me" ? "Você" : displayName}
                </p>
                <p className="text-xs text-muted-foreground truncate">{replyingTo.text}</p>
              </div>
              <Button variant="ghost" size="icon" className="w-6 h-6 rounded-full shrink-0" onClick={() => setReplyingTo(null)}>
                <X size={14} />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 12 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl h-11 font-bold text-xs border-primary/30 text-primary hover:bg-primary/5"
                  onClick={() => { setShowActions(false); setLocation(`/create?challengeWith=${username}`); }}
                  data-testid="button-create-challenge-chat"
                >
                  <Swords size={16} className="mr-1.5" /> Criar Desafio
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex gap-2 items-end">
          <Button
            size="icon"
            variant="ghost"
            className="w-10 h-10 rounded-full shrink-0 text-muted-foreground"
            onClick={() => setShowActions(!showActions)}
            data-testid="button-actions"
          >
            <Plus size={22} className={`transition-transform ${showActions ? 'rotate-45' : ''}`} />
          </Button>
          <div className="flex-1 bg-muted rounded-3xl border border-border overflow-hidden">
            <Input 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Digite uma mensagem..."
              className="border-none bg-transparent h-12 px-4 shadow-none focus-visible:ring-0"
              data-testid="input-message"
            />
          </div>
          {message.trim() ? (
            <Button 
              size="icon" 
              className="w-12 h-12 rounded-full shrink-0 bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              onClick={handleSend}
              disabled={sendMutation.isPending}
              data-testid="button-send"
            >
              <Send size={20} className="translate-x-0.5" />
            </Button>
          ) : (
            <Button 
              size="icon" 
              variant="secondary"
              className="w-12 h-12 rounded-full shrink-0"
              onClick={() => alert("Gravar áudio (em breve)")}
              data-testid="button-audio"
            >
              <Mic size={20} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
