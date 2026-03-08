import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Trophy, ArrowUpRight, Flame, Camera, ShieldAlert, PlusCircle, Compass, Wallet, TrendingUp, Zap, Map, Clock, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ACTIVE_CHALLENGES = [
  {
    id: 1,
    title: "Projeto Verão 2024",
    prizePool: "R$ 6.200",
    daysLeft: 12,
    progress: 3,
    goal: 5,
    needsCheckin: true,
    isModerator: true,
    streak: 5,
  }
];

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const userName = localStorage.getItem("fitstake-user-name") || "Alex Costa";
  const initials = userName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  const avatarUrl = localStorage.getItem("fitstake-user-avatar");

  const totalInvested = "R$ 150,00";
  const totalEarned = "R$ 420,00";
  const availableBalance = "R$ 132,50";

  const moderationAlerts = [
    { id: 1, challenge: "Projeto Verão 2024", pending: 3 }
  ];

  return (
    <div className="p-6 pb-32 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex justify-between items-center pt-4">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Bem-vindo de volta</p>
          <h1 className="text-3xl font-display font-bold">{userName}</h1>
        </div>
        <Link href="/profile">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-primary/20 bg-card flex items-center justify-center font-bold text-xl cursor-pointer shadow-lg shadow-black/10"
          >
            {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : initials}
          </motion.div>
        </Link>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Distância", value: "42.5 km", icon: Map, color: "text-blue-500" },
          { label: "Tempo", value: "12h 30m", icon: Clock, color: "text-orange-500" },
          { label: "Atividade", value: "85%", icon: Activity, color: "text-primary" },
        ].map((metric, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card border border-border/50 p-4 rounded-3xl space-y-2"
          >
            <div className={`p-2 rounded-xl bg-muted/50 w-fit ${metric.color}`}>
              <metric.icon size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{metric.label}</p>
              <p className="text-sm font-display font-bold">{metric.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Resumo Financeiro - Premium Branding */}
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
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Saldo Total</p>
              <h2 className="text-5xl font-display font-bold text-primary tracking-tighter drop-shadow-[0_0_15px_rgba(0,255,133,0.3)]">{availableBalance}</h2>
            </div>
            <Link href="/wallet">
              <Button size="icon" className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 border-none w-12 h-12">
                <Wallet size={20} />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/10 relative z-10">
            <div>
              <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mb-1">Investido</p>
              <p className="text-xl font-display font-bold">R$ 150</p>
            </div>
            <div>
              <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mb-1">Ganhos</p>
              <p className="text-xl font-display font-bold text-primary flex items-center gap-1">
                R$ 420 <ArrowUpRight size={18} />
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Moderation Alerts */}
      {moderationAlerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent flex items-center gap-2 px-1">
            <ShieldAlert size={14} /> Alertas de Moderação
          </h2>
          {moderationAlerts.map(alert => (
            <Link key={alert.id} href={`/challenge/${alert.id}`}>
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-accent/5 border border-accent/20 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{alert.challenge}</p>
                    <p className="text-xs text-accent/80 font-medium">{alert.pending} check-ins para revisar</p>
                  </div>
                </div>
                <ArrowUpRight size={20} className="text-accent" />
              </motion.div>
            </Link>
          ))}
        </div>
      )}

      {/* Active Challenges - Gamified Cards */}
      <div className="space-y-5">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
            <Zap className="text-primary" size={20} fill="currentColor" /> Desafios Ativos
          </h2>
          <Badge className="bg-primary/10 text-primary border-none font-bold text-[10px]">1 ATIVO</Badge>
        </div>

        {ACTIVE_CHALLENGES.length > 0 ? (
          <div className="space-y-4">
            {ACTIVE_CHALLENGES.map((challenge) => (
              <motion.div 
                key={challenge.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-xl leading-tight group-hover:text-primary transition-colors">{challenge.title}</h3>
                      <div className="flex items-center gap-1 text-accent font-bold text-xs">
                        <Flame size={14} fill="currentColor" /> {challenge.streak}d
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">Meta: 5 treinos semanais</p>
                  </div>
                  {challenge.isModerator && (
                    <Badge className="bg-accent/10 text-accent border-accent/20 text-[9px] font-black tracking-tighter">MODERADOR</Badge>
                  )}
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="text-primary">{challenge.progress} / {challenge.goal}</span>
                  </div>
                  <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(challenge.progress / challenge.goal) * 100}%` }}
                      className="h-full bg-primary shadow-[0_0_15px_rgba(0,255,133,0.5)] rounded-full relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-[progress-shimmer_2s_infinite]" />
                    </motion.div>
                  </div>
                </div>

                <div className="flex gap-3">
                  {challenge.needsCheckin && (
                    <Button 
                      className="flex-1 rounded-2xl bg-primary text-primary-foreground font-bold h-14 shadow-lg shadow-primary/20 btn-primary-glow border-none"
                      onClick={() => setLocation(`/check-in/${challenge.id}`)}
                    >
                      <Camera className="mr-2" size={20} />
                      CHECK-IN
                    </Button>
                  )}
                  <Link href={`/challenge/${challenge.id}`} className="flex-1">
                    <Button 
                      variant="outline" 
                      className="w-full rounded-2xl h-14 font-bold border-border bg-card hover:bg-muted transition-all"
                    >
                      DETALHES
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-6 bg-muted/20 rounded-[3rem] border-2 border-dashed border-border text-center space-y-8 animate-in zoom-in duration-500">
            <div className="w-20 h-20 rounded-[2rem] bg-card border border-border flex items-center justify-center text-primary shadow-xl rotate-3">
              <Trophy size={40} />
            </div>
            <div className="space-y-3">
              <p className="font-display font-bold text-2xl">Nenhum hábito ativo</p>
              <p className="text-sm text-muted-foreground px-4 leading-relaxed font-medium">Você ainda não entrou em nenhum desafio. Comece sua jornada agora!</p>
            </div>
            <div className="flex flex-col w-full gap-4">
              <Button 
                className="w-full h-16 rounded-[1.5rem] bg-primary text-primary-foreground font-bold text-lg btn-primary-glow border-none"
                onClick={() => setLocation('/create')}
              >
                <PlusCircle className="mr-2" size={24} /> Criar Desafio
              </Button>
              <Button 
                variant="outline"
                className="w-full h-16 rounded-[1.5rem] font-bold border-border bg-card text-lg"
                onClick={() => setLocation('/explore')}
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