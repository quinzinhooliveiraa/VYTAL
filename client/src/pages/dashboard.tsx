import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Trophy, ArrowUpRight, Flame, Camera, ShieldAlert, PlusCircle, Compass, Wallet, TrendingUp, Zap, Activity, Users, Clock, HelpCircle } from "lucide-react";
import { NotificationBell } from "@/components/notification-center";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { QuickStartGuide, useQuickStartGuide } from "@/components/quick-start-guide";

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: walletData } = useQuery({
    queryKey: ["/api/wallet/balance"],
    queryFn: async () => {
      const res = await fetch("/api/wallet/balance", { credentials: "include" });
      if (!res.ok) return { balance: 0 };
      return res.json();
    },
  });

  const { data: myChallenges = [] } = useQuery({
    queryKey: ["/api/challenges/mine"],
    queryFn: async () => {
      const res = await fetch("/api/challenges/mine", { credentials: "include" });
      return res.ok ? res.json() : [];
    },
    refetchInterval: 15000,
  });

  const userName = user?.name || "Seu Nome";
  const initials = userName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
  const avatarUrl = user?.avatar || localStorage.getItem("fitstake-user-avatar");

  const bal = Number(walletData?.balance || 0);
  const locked = Number(walletData?.lockedBalance || 0);
  const avail = Number(walletData?.availableBalance || 0);
  const totalInvested = fmtBRL(locked);
  const totalEarned = fmtBRL(bal);
  const availableBalance = fmtBRL(avail);

  const activeChallenges = myChallenges.filter((c: any) =>
    c.myParticipation?.isActive !== false &&
    c.status !== "completed" && c.status !== "finalized"
  );

  const moderationChallenges = activeChallenges.filter((c: any) => c.createdBy === user?.id);

  const { hasSeen: quickStartSeen, reset: resetQuickStart } = useQuickStartGuide();
  const [showQuickStart, setShowQuickStart] = useState(false);

  return (
    <div className="px-5 pb-28 pt-6 space-y-6 animate-in fade-in duration-500">
      <QuickStartGuide forceShow={showQuickStart} onClose={() => setShowQuickStart(false)} />
      <header className="flex justify-between items-center">
        <div className="space-y-0.5">
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em]">Bem-vindo de volta</p>
          <h1 className="text-2xl font-display font-bold">{userName}</h1>
        </div>
        <div className="flex gap-2 items-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { resetQuickStart(); setShowQuickStart(true); }}
            className="w-11 h-11 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground cursor-pointer"
            data-testid="button-quick-start"
          >
            <HelpCircle size={20} />
          </motion.button>
          <NotificationBell />
          <Link href="/wallet">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-11 h-11 rounded-xl border border-border bg-card flex items-center justify-center text-foreground cursor-pointer"
            >
              <Wallet size={20} />
            </motion.div>
          </Link>
          <Link href="/profile">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-11 h-11 rounded-xl overflow-hidden border-2 border-primary/20 bg-card flex items-center justify-center font-bold text-sm cursor-pointer"
            >
              {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : initials}
            </motion.div>
          </Link>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900 dark:bg-zinc-900 text-white rounded-2xl p-6 relative overflow-hidden border border-white/5"
      >
        <div className="absolute top-0 right-0 p-6 opacity-[0.06] pointer-events-none">
          <TrendingUp size={100} />
        </div>

        <div className="relative z-10 mb-5">
          <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Saldo Disponível</p>
          <h2 className="text-4xl font-display font-bold text-primary tracking-tight" data-testid="text-dashboard-available">{availableBalance}</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 relative z-10">
          <div>
            <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mb-0.5">Em Desafios</p>
            <p className="text-lg font-display font-bold" data-testid="text-dashboard-locked">{totalInvested}</p>
          </div>
          <div>
            <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mb-0.5">Saldo Total</p>
            <p className="text-lg font-display font-bold text-primary" data-testid="text-dashboard-total">{totalEarned}</p>
          </div>
        </div>
      </motion.div>

      {moderationChallenges.length > 0 && (
        <div className="space-y-2.5">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent flex items-center gap-2 px-0.5">
            <ShieldAlert size={13} /> Seus Desafios (Moderador)
          </h2>
          <div className="space-y-2">
            {moderationChallenges.map((c: any) => (
              <Link key={c.id} href={`/challenge/${c.id}`}>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="bg-accent/5 border border-accent/20 rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-accent/15 flex items-center justify-center text-accent">
                      <ShieldAlert size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-sm leading-tight">{c.title}</p>
                      <p className="text-[11px] text-accent/70 font-medium">{c.activeParticipantCount || c.participantCount || 0} participantes ativos</p>
                    </div>
                  </div>
                  <ArrowUpRight size={18} className="text-accent/60" />
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-display font-bold flex items-center gap-2">
            <Zap className="text-primary" size={18} fill="currentColor" /> Desafios Ativos
          </h2>
          {activeChallenges.length > 0 && (
            <Badge className="bg-primary/10 text-primary border-none font-bold text-[10px]">{activeChallenges.length}</Badge>
          )}
        </div>

        {activeChallenges.length > 0 ? (
          <div className="space-y-3">
            {activeChallenges.map((challenge: any) => {
              const count = challenge.activeParticipantCount || challenge.participantCount || 0;
              const max = challenge.maxParticipants || 50;
              const notStarted = challenge.startDate ? new Date(challenge.startDate) > new Date() : false;
              const waiting = count < 2 || notStarted;
              const isCreator = challenge.createdBy === user?.id;
              const entryFee = Number(challenge.entryFee || 0);
              const prizePool = count * entryFee;

              return (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display font-bold text-lg leading-tight group-hover:text-primary transition-colors truncate">{challenge.title}</h3>
                        {isCreator && (
                          <Badge className="bg-accent/10 text-accent border-accent/20 text-[9px] font-black">MOD</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground font-medium">
                        <span className="flex items-center gap-1"><Users size={11} /> {count}/{max}</span>
                        <span className="flex items-center gap-1"><Clock size={11} /> {challenge.duration} dias</span>
                        {(notStarted || count < 2) && (
                          <Badge className="bg-yellow-500/15 text-yellow-600 border-none text-[9px] h-4 px-1.5">AGUARDANDO</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 mb-4">
                    <div className="bg-primary/5 border border-primary/10 rounded-xl py-2.5 px-3 text-center">
                      <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mb-0.5">Pote</p>
                      <p className="text-base font-display font-bold text-primary">{fmtBRL(prizePool)}</p>
                    </div>
                    <div className="bg-muted/50 border border-border rounded-xl py-2.5 px-3 text-center">
                      <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mb-0.5">Sua Entrada</p>
                      <p className="text-base font-display font-bold">{fmtBRL(entryFee)}</p>
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    {!waiting && (
                      <Button
                        className="flex-1 rounded-xl bg-primary text-primary-foreground font-bold h-12 shadow-lg shadow-primary/20 btn-primary-glow border-none"
                        onClick={() => setLocation(`/check-in/${challenge.id}`)}
                        data-testid={`button-checkin-${challenge.id}`}
                      >
                        <Camera className="mr-2" size={18} />
                        CHECK-IN
                      </Button>
                    )}
                    <Link href={`/challenge/${challenge.id}`} className="flex-1">
                      <Button
                        variant="outline"
                        className="w-full rounded-xl h-12 font-bold border-border bg-card hover:bg-muted transition-all"
                        data-testid={`button-details-${challenge.id}`}
                      >
                        DETALHES
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-14 px-6 bg-muted/20 rounded-2xl border-2 border-dashed border-border text-center space-y-6 animate-in zoom-in duration-500">
            <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center text-primary">
              <Trophy size={32} />
            </div>
            <div className="space-y-2">
              <p className="font-display font-bold text-xl">Nenhum desafio ativo</p>
              <p className="text-sm text-muted-foreground px-2 leading-relaxed">Você ainda não entrou em nenhum desafio. Comece agora!</p>
            </div>
            <div className="flex flex-col w-full gap-3">
              <Button
                className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-bold text-base btn-primary-glow border-none"
                onClick={() => setLocation('/create')}
                data-testid="button-create-challenge"
              >
                <PlusCircle className="mr-2" size={20} /> Criar Desafio
              </Button>
              <Button
                variant="outline"
                className="w-full h-14 rounded-xl font-bold border-border bg-card text-base"
                onClick={() => setLocation('/explore')}
                data-testid="button-explore"
              >
                <Compass className="mr-2" size={20} /> Explorar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
