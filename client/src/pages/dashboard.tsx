import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Trophy, ArrowUpRight, Flame, Camera, ShieldAlert, PlusCircle, Compass, Wallet, TrendingUp, Zap, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

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

  return (
    <div className="p-6 pb-32 space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center pt-4">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Bem-vindo de volta</p>
          <h1 className="text-3xl font-display font-bold">{userName}</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/wallet">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-14 h-14 rounded-2xl border border-border bg-card flex items-center justify-center text-foreground cursor-pointer shadow-sm"
            >
              <Wallet size={24} />
            </motion.div>
          </Link>
          <Link href="/profile">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-primary/20 bg-card flex items-center justify-center font-bold text-xl cursor-pointer shadow-lg shadow-black/10"
            >
              {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : initials}
            </motion.div>
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 dark:bg-zinc-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden border border-white/5"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <TrendingUp size={120} />
          </div>

          <div className="flex justify-between items-start mb-8 relative z-10">
            <div>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Saldo Disponível</p>
              <h2 className="text-5xl font-display font-bold text-primary tracking-tighter drop-shadow-[0_0_15px_rgba(0,255,133,0.3)]" data-testid="text-dashboard-available">{availableBalance}</h2>
            </div>
            <div className="w-12 h-12"></div>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/10 relative z-10">
            <div>
              <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mb-1">Em Desafios</p>
              <p className="text-xl font-display font-bold" data-testid="text-dashboard-locked">{totalInvested}</p>
            </div>
            <div>
              <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mb-1">Saldo Total</p>
              <p className="text-xl font-display font-bold text-primary flex items-center gap-1" data-testid="text-dashboard-total">
                {totalEarned}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {moderationChallenges.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent flex items-center gap-2 px-1">
            <ShieldAlert size={14} /> Seus Desafios (Moderador)
          </h2>
          {moderationChallenges.map((c: any) => (
            <Link key={c.id} href={`/challenge/${c.id}`}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-accent/5 border border-accent/20 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{c.title}</p>
                    <p className="text-xs text-accent/80 font-medium">{c.activeParticipantCount || c.participantCount || 0} participantes ativos</p>
                  </div>
                </div>
                <ArrowUpRight size={20} className="text-accent" />
              </motion.div>
            </Link>
          ))}
        </div>
      )}

      <div className="space-y-5">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
            <Zap className="text-primary" size={20} fill="currentColor" /> Desafios Ativos
          </h2>
          {activeChallenges.length > 0 && (
            <Badge className="bg-primary/10 text-primary border-none font-bold text-[10px]">{activeChallenges.length} ATIVO{activeChallenges.length > 1 ? "S" : ""}</Badge>
          )}
        </div>

        {activeChallenges.length > 0 ? (
          <div className="space-y-4">
            {activeChallenges.map((challenge: any) => {
              const count = challenge.activeParticipantCount || challenge.participantCount || 0;
              const max = challenge.maxParticipants || 50;
              const waiting = count < 2;
              const isCreator = challenge.createdBy === user?.id;
              const entryFee = Number(challenge.entryFee || 0);
              const prizePool = count * entryFee;

              return (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display font-bold text-xl leading-tight group-hover:text-primary transition-colors truncate">{challenge.title}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                        <Activity size={12} /> {count}/{max} participantes • {challenge.duration} dias
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                      {isCreator && (
                        <Badge className="bg-accent/10 text-accent border-accent/20 text-[9px] font-black tracking-tighter">MOD</Badge>
                      )}
                      {waiting && (
                        <Badge className="bg-yellow-500/20 text-yellow-600 border-none text-[9px]">AGUARDANDO</Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-3 text-center">
                      <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mb-0.5">Pote</p>
                      <p className="text-lg font-display font-bold text-primary">{fmtBRL(prizePool)}</p>
                    </div>
                    <div className="bg-muted/50 border border-border rounded-2xl p-3 text-center">
                      <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mb-0.5">Sua Entrada</p>
                      <p className="text-lg font-display font-bold">{fmtBRL(entryFee)}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {!waiting && (
                      <Button
                        className="flex-1 rounded-2xl bg-primary text-primary-foreground font-bold h-14 shadow-lg shadow-primary/20 btn-primary-glow border-none"
                        onClick={() => setLocation(`/check-in/${challenge.id}`)}
                        data-testid={`button-checkin-${challenge.id}`}
                      >
                        <Camera className="mr-2" size={20} />
                        CHECK-IN
                      </Button>
                    )}
                    <Link href={`/challenge/${challenge.id}`} className="flex-1">
                      <Button
                        variant="outline"
                        className="w-full rounded-2xl h-14 font-bold border-border bg-card hover:bg-muted transition-all"
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
          <div className="flex flex-col items-center justify-center py-16 px-6 bg-muted/20 rounded-[3rem] border-2 border-dashed border-border text-center space-y-8 animate-in zoom-in duration-500">
            <div className="w-20 h-20 rounded-[2rem] bg-card border border-border flex items-center justify-center text-primary shadow-xl rotate-3">
              <Trophy size={40} />
            </div>
            <div className="space-y-3">
              <p className="font-display font-bold text-2xl">Nenhum desafio ativo</p>
              <p className="text-sm text-muted-foreground px-4 leading-relaxed font-medium">Você ainda não entrou em nenhum desafio. Comece sua jornada agora!</p>
            </div>
            <div className="flex flex-col w-full gap-4">
              <Button
                className="w-full h-16 rounded-[1.5rem] bg-primary text-primary-foreground font-bold text-lg btn-primary-glow border-none"
                onClick={() => setLocation('/create')}
                data-testid="button-create-challenge"
              >
                <PlusCircle className="mr-2" size={24} /> Criar Desafio
              </Button>
              <Button
                variant="outline"
                className="w-full h-16 rounded-[1.5rem] font-bold border-border bg-card text-lg"
                onClick={() => setLocation('/explore')}
                data-testid="button-explore"
              >
                <Compass className="mr-2" size={24} /> Explorar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
