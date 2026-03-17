import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { ChevronLeft, Send, Phone, Video, MoreVertical, Mic, Reply, X, Swords, Plus, Square, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

function AudioPlayer({ src, isMe }: { src: string; isMe: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoaded = () => setDuration(audio.duration || 0);
    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnded = () => { setPlaying(false); setCurrentTime(0); };
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const fmt = (s: number) => {
    if (!s || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 min-w-[180px]">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        onClick={toggle}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
          isMe ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary"
        }`}
      >
        {playing ? <Pause size={16} /> : <Play size={16} className="translate-x-0.5" />}
      </button>
      <div className="flex-1 flex flex-col gap-1">
        <div className={`h-1 rounded-full overflow-hidden ${isMe ? "bg-primary-foreground/20" : "bg-muted"}`}>
          <div
            className={`h-full rounded-full transition-all ${isMe ? "bg-primary-foreground" : "bg-primary"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className={`text-[10px] ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          {playing ? fmt(currentTime) : fmt(duration)}
        </span>
      </div>
    </div>
  );
}

export default function Messages() {
  const [, setLocation] = useLocation();
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  
  const [message, setMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<{id: string, text: string, sender: string} | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSendingAudio, setIsSendingAudio] = useState(false);
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressRef = useRef<NodeJS.Timeout | null>(null);

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
    refetchInterval: 8000,
  });

  const sendMutation = useMutation({
    mutationFn: async (data: { receiverUsername: string; text: string; replyToId?: string; audioUrl?: string }) => {
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

  const handleReply = useCallback((msg: any) => {
    const isMe = msg.senderId === currentUser?.id;
    const hasAudio = !!msg.audioUrl;
    setReplyingTo({ id: msg.id, text: hasAudio ? "🎤 Áudio" : msg.text, sender: isMe ? "me" : "them" });
    setSelectedMsgId(null);
  }, [currentUser]);

  const swipeStartX = useRef<number | null>(null);
  const swipeCurrentX = useRef<number>(0);
  const swipeMsgId = useRef<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<Record<string, number>>({});

  const handleSwipeStart = useCallback((msgId: string, e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX;
    swipeMsgId.current = msgId;
  }, []);

  const handleSwipeMove = useCallback((msgId: string, e: React.TouchEvent) => {
    if (swipeStartX.current === null || swipeMsgId.current !== msgId) return;
    const diff = e.touches[0].clientX - swipeStartX.current;
    const offset = Math.max(0, Math.min(diff, 80));
    swipeCurrentX.current = offset;
    setSwipeOffset(prev => ({ ...prev, [msgId]: offset }));
  }, []);

  const handleSwipeEnd = useCallback((msg: any) => {
    if (swipeCurrentX.current > 50) {
      handleReply(msg);
    }
    setSwipeOffset(prev => ({ ...prev, [msg.id]: 0 }));
    swipeStartX.current = null;
    swipeMsgId.current = null;
    swipeCurrentX.current = 0;
  }, [handleReply]);

  const getSupportedMimeType = () => {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
      "audio/mp4",
      "audio/aac",
      "audio/mpeg",
    ];
    for (const t of types) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) return t;
    }
    return undefined;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      const actualMime = mediaRecorder.mimeType || mimeType || "audio/webm";
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: actualMime });
        if (blob.size < 1000) return;
        await sendAudio(blob, actualMime);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      toast({ title: "Erro", description: "Não foi possível acessar o microfone. Verifique as permissões.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = () => {
        mediaRecorderRef.current?.stream?.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingTime(0);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    chunksRef.current = [];
  };

  const sendAudio = async (blob: Blob, mimeType?: string) => {
    if (!username) return;
    setIsSendingAudio(true);
    try {
      const contentType = mimeType || blob.type || "application/octet-stream";
      const res = await fetch("/api/upload/audio", {
        method: "POST",
        body: blob,
        credentials: "include",
        headers: { "Content-Type": contentType },
      });
      if (!res.ok) throw new Error("Upload falhou");
      const { url } = await res.json();

      sendMutation.mutate({
        receiverUsername: username,
        text: "🎤 Mensagem de voz",
        audioUrl: url,
        replyToId: replyingTo?.id || undefined,
      });
      setReplyingTo(null);
    } catch {
      toast({ title: "Erro", description: "Falha ao enviar áudio", variant: "destructive" });
    } finally {
      setIsSendingAudio(false);
    }
  };

  const fmtRecTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const displayName = targetUser?.name || username || "Usuário";
  const avatarUrl = targetUser?.avatar || "";
  const isOnline = targetUser?.online || false;

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getReplyMessage = (replyToId: string | null) => {
    if (!replyToId) return null;
    return messagesData.find((m: any) => m.id === replyToId);
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <header className="px-4 py-3 flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-md shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full -ml-2" onClick={() => window.history.back()}>
            <ChevronLeft size={24} />
          </Button>
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setLocation(`/user/${username}`)}>
            <div className="relative">
              <Avatar className="w-10 h-10 border border-border">
                {avatarUrl && <AvatarImage src={avatarUrl} />}
                <AvatarFallback className="font-bold">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
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
          <Button variant="ghost" size="icon" className="rounded-full w-8 h-8" onClick={() => toast({ title: "Em breve", description: "Chamadas de voz estarão disponíveis em breve!" })} data-testid="button-call-voice"><Phone size={18} /></Button>
          <Button variant="ghost" size="icon" className="rounded-full w-8 h-8" onClick={() => toast({ title: "Em breve", description: "Chamadas de vídeo estarão disponíveis em breve!" })} data-testid="button-call-video"><Video size={18} /></Button>
          <Button variant="ghost" size="icon" className="rounded-full w-8 h-8"><MoreVertical size={18} /></Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain" ref={scrollRef}>
        <div className="p-4 space-y-4 min-h-full flex flex-col justify-end">
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

          {messagesData.map((msg: any, idx: number) => {
            const isMe = msg.senderId === currentUser?.id;
            const hasAudio = !!msg.audioUrl;
            const isSelected = selectedMsgId === msg.id;
            const replyMsg = getReplyMessage(msg.replyToId);
            const msgDate = msg.createdAt ? new Date(msg.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "";
            const prevMsg = idx > 0 ? messagesData[idx - 1] : null;
            const prevMsgDate = prevMsg?.createdAt ? new Date(prevMsg.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "";
            const showDateSep = msgDate && msgDate !== prevMsgDate;
            return (
              <div key={msg.id}>
                {showDateSep && (
                  <div className="flex justify-center my-4">
                    <span className="text-[10px] text-muted-foreground/60 bg-muted/50 px-3 py-1 rounded-full">{msgDate}</span>
                  </div>
                )}
              <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div
                  className="relative max-w-[280px] sm:max-w-[320px]"
                  onTouchStart={(e) => handleSwipeStart(msg.id, e)}
                  onTouchMove={(e) => handleSwipeMove(msg.id, e)}
                  onTouchEnd={() => handleSwipeEnd(msg)}
                >
                  {(swipeOffset[msg.id] || 0) > 10 && (
                    <div className="absolute left-0 -translate-x-full top-1/2 -translate-y-1/2 px-1 flex items-center">
                      <div className={`w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center transition-transform ${(swipeOffset[msg.id] || 0) > 50 ? "scale-110" : "scale-90"}`}>
                        <Reply size={14} className="text-primary" />
                      </div>
                    </div>
                  )}
                  <div
                    style={{ transform: `translateX(${swipeOffset[msg.id] || 0}px)`, transition: swipeStartX.current !== null ? "none" : "transform 0.2s ease-out" }}
                    className={`shadow-sm flex flex-col ${
                      isMe 
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm" 
                        : "bg-card border border-border text-foreground rounded-2xl rounded-tl-sm"
                    }`}
                  >
                    {replyMsg && (
                      <div className={`mx-2 mt-2 px-3 py-1.5 rounded-lg border-l-2 ${
                        isMe ? "bg-primary-foreground/10 border-primary-foreground/40" : "bg-muted/50 border-primary/40"
                      }`}>
                        <p className={`text-[10px] font-bold ${isMe ? "text-primary-foreground/70" : "text-primary"}`}>
                          {replyMsg.senderId === currentUser?.id ? "Você" : displayName}
                        </p>
                        <p className={`text-[10px] truncate ${isMe ? "text-primary-foreground/50" : "text-muted-foreground"}`}>
                          {replyMsg.audioUrl ? "🎤 Áudio" : replyMsg.text}
                        </p>
                      </div>
                    )}
                    <div className="px-4 py-2.5 text-sm">
                      {hasAudio ? (
                        <AudioPlayer src={msg.audioUrl} isMe={isMe} />
                      ) : (
                        msg.text
                      )}
                    </div>
                  </div>
                </div>

                <span className="text-[10px] text-muted-foreground mt-1 px-1">
                  {msg.createdAt ? formatTime(msg.createdAt) : ""}
                </span>
              </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 bg-background border-t border-border shrink-0">
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
          {showActions && !isRecording && (
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
        
        {isRecording ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3"
          >
            <Button
              size="icon"
              variant="ghost"
              className="w-10 h-10 rounded-full shrink-0 text-destructive"
              onClick={cancelRecording}
              data-testid="button-cancel-recording"
            >
              <X size={22} />
            </Button>
            <div className="flex-1 flex items-center gap-3 bg-destructive/5 border border-destructive/20 rounded-3xl px-4 h-12">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-bold text-destructive">{fmtRecTime(recordingTime)}</span>
              <span className="text-xs text-muted-foreground">Gravando...</span>
            </div>
            <Button 
              size="icon" 
              className="w-12 h-12 rounded-full shrink-0 bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              onClick={stopRecording}
              data-testid="button-stop-recording"
            >
              <Send size={20} className="translate-x-0.5" />
            </Button>
          </motion.div>
        ) : (
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
                className={`w-12 h-12 rounded-full shrink-0 ${isSendingAudio ? 'opacity-50' : ''}`}
                onClick={startRecording}
                disabled={isSendingAudio}
                data-testid="button-audio"
              >
                <Mic size={20} />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
