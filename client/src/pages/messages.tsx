import { useState, useRef, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { ChevronLeft, Send, Phone, Video, Info, MoreVertical, Mic, Reply, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

export default function Messages() {
  const [, setLocation] = useLocation();
  const { username } = useParams();
  
  const [message, setMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<{id: number, text: string, sender: string} | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState([
    { id: 1, text: "E aí, bora fechar aquele desafio de 30 dias?", sender: "them", time: "10:30", replyTo: null },
    { id: 2, text: "Opa! Bora sim. Vou criar e te mando o link.", sender: "me", time: "10:35", replyTo: null },
    { id: 3, text: "Fechado. R$ 50 a entrada?", sender: "them", time: "10:36", replyTo: null },
    { id: 4, text: "Isso aí. Sem choro se perder hein! 😂", sender: "me", time: "10:40", replyTo: { id: 3, text: "Fechado. R$ 50 a entrada?", sender: "them" } },
  ]);

  const targetUser = {
    username: username || "usuario",
    name: username ? username.charAt(0).toUpperCase() + username.slice(1).replace('_', ' ') : "Usuário",
    avatar: `https://i.pravatar.cc/150?u=${username || '1'}`,
    online: true
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;
    
    setMessages([...messages, {
      id: Date.now(),
      text: message,
      sender: "me",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      replyTo: replyingTo
    }]);
    
    setMessage("");
    setReplyingTo(null);
    
    // Simulate reply
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: "Massa! Vou entrar lá agora.",
        sender: "them",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        replyTo: null
      }]);
    }, 2000);
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-background relative">
      {/* Header */}
      <header className="px-4 py-3 flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full -ml-2" onClick={() => window.history.back()}>
            <ChevronLeft size={24} />
          </Button>
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setLocation(`/user/${targetUser.username}`)}>
            <div className="relative">
              <Avatar className="w-10 h-10 border border-border">
                <AvatarImage src={targetUser.avatar} />
                <AvatarFallback>{targetUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
              {targetUser.online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
              )}
            </div>
            <div>
              <h2 className="font-bold text-sm leading-tight">{targetUser.name}</h2>
              <p className="text-[10px] text-muted-foreground">{targetUser.online ? "Online agora" : "Offline"}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Button variant="ghost" size="icon" className="rounded-full w-8 h-8"><Phone size={18} /></Button>
          <Button variant="ghost" size="icon" className="rounded-full w-8 h-8"><Video size={18} /></Button>
          <Button variant="ghost" size="icon" className="rounded-full w-8 h-8"><MoreVertical size={18} /></Button>
        </div>
      </header>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 bg-muted/20" ref={scrollRef}>
        <div className="space-y-6 pb-4">
          <div className="text-center">
            <span className="text-[10px] font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full uppercase tracking-widest">
              Hoje
            </span>
          </div>

          {messages.map((msg, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id} 
              className={`flex flex-col group ${msg.sender === "me" ? "items-end" : "items-start"}`}
            >
              <div className={`flex items-center gap-2 ${msg.sender === "me" ? "flex-row-reverse" : "flex-row"}`}>
                <div className="flex flex-col items-end">
                  <div 
                    className={`max-w-[280px] sm:max-w-[320px] shadow-sm flex flex-col ${
                      msg.sender === "me" 
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm" 
                        : "bg-card border border-border text-foreground rounded-2xl rounded-tl-sm"
                    }`}
                  >
                    {msg.replyTo && (
                      <div className={`mx-2 mt-2 p-2 rounded-lg text-xs border-l-2 ${msg.sender === "me" ? "bg-primary-foreground/10 border-primary-foreground/50" : "bg-muted border-primary"}`}>
                        <p className="font-bold text-[10px] mb-0.5 opacity-80">{msg.replyTo.sender === "me" ? "Você" : targetUser.name}</p>
                        <p className="line-clamp-1 opacity-90">{msg.replyTo.text}</p>
                      </div>
                    )}
                    <div className="px-4 py-2.5 text-sm">
                      {msg.text}
                    </div>
                  </div>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => setReplyingTo({ id: msg.id, text: msg.text, sender: msg.sender })}
                >
                  <Reply size={16} className="text-muted-foreground" />
                </Button>
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 px-1">
                {msg.time}
              </span>
            </motion.div>
          ))}
        </div>
      </ScrollArea>

      {/* Input Area */}
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
                  Respondendo a {replyingTo.sender === "me" ? "Você" : targetUser.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">{replyingTo.text}</p>
              </div>
              <Button variant="ghost" size="icon" className="w-6 h-6 rounded-full shrink-0" onClick={() => setReplyingTo(null)}>
                <X size={14} />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex gap-2 items-end">
          <div className="flex-1 bg-muted rounded-3xl border border-border overflow-hidden">
            <Input 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Digite uma mensagem..."
              className="border-none bg-transparent h-12 px-4 shadow-none focus-visible:ring-0"
            />
          </div>
          {message.trim() ? (
            <Button 
              size="icon" 
              className="w-12 h-12 rounded-full shrink-0 bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              onClick={handleSend}
            >
              <Send size={20} className="translate-x-0.5" />
            </Button>
          ) : (
            <Button 
              size="icon" 
              variant="secondary"
              className="w-12 h-12 rounded-full shrink-0"
              onClick={() => alert("Gravar áudio")}
            >
              <Mic size={20} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}