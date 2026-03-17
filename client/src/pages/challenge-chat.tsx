import { useState, useRef, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { ArrowLeft, Send, Loader2, MessageCircle, Trophy, Users, Info, Mic, X, Play, Pause } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

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
    if (playing) audioRef.current.pause();
    else audioRef.current.play();
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

export default function ChallengeChat() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSendingAudio, setIsSendingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { text: string; audioUrl?: string }) => {
      const res = await apiRequest("POST", `/api/challenges/${id}/messages`, data);
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
    sendMessageMutation.mutate({ text });
  };

  const getSupportedMimeType = () => {
    const types = [
      "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus",
      "audio/ogg", "audio/mp4", "audio/aac", "audio/mpeg",
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
      toast({ title: "Erro", description: "Não foi possível acessar o microfone.", variant: "destructive" });
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
      sendMessageMutation.mutate({ text: "🎤 Mensagem de voz", audioUrl: url });
    } catch {
      toast({ title: "Erro", description: "Falha ao enviar áudio", variant: "destructive" });
    } finally {
      setIsSendingAudio(false);
    }
  };

  const fmtRecTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

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
      <header className="px-4 py-3 bg-card border-b border-border flex items-center gap-3 shrink-0 z-10">
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

      <div className="flex-1 overflow-y-auto overscroll-contain" ref={scrollRef}>
        <div className="p-4 space-y-3 min-h-full flex flex-col justify-end">
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
            const hasAudio = !!msg.audioUrl;
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
                      {hasAudio ? (
                        <AudioPlayer src={msg.audioUrl} isMe={isMe} />
                      ) : (
                        msg.text
                      )}
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
      </div>

      {isParticipant && (
        <div className="px-4 py-3 bg-card border-t border-border shrink-0">
            {isRecording ? (
              <div className="flex items-center gap-3">
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
              </div>
            ) : (
              <div className="flex gap-2 items-center">
                <div className="flex-1 bg-muted rounded-3xl border border-border overflow-hidden">
                  <Input
                    placeholder="Mensagem..."
                    className="border-none bg-transparent h-12 px-4 shadow-none focus-visible:ring-0"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                    data-testid="input-challenge-chat-message"
                  />
                </div>
                {message.trim() ? (
                  <Button
                    size="icon"
                    className="w-12 h-12 rounded-full shrink-0 bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    onClick={handleSend}
                    disabled={sendMessageMutation.isPending}
                    data-testid="button-send-challenge-message"
                  >
                    {sendMessageMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Send size={20} className="translate-x-0.5" />}
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    variant="secondary"
                    className={`w-12 h-12 rounded-full shrink-0 ${isSendingAudio ? "opacity-50" : ""}`}
                    onClick={startRecording}
                    disabled={isSendingAudio}
                    data-testid="button-audio-challenge"
                  >
                    <Mic size={20} />
                  </Button>
                )}
              </div>
            )}
        </div>
      )}
    </div>
  );
}
