import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Trophy, ArrowUpRight, Flame, Camera, ShieldAlert, PlusCircle, Compass, Wallet } from "lucide-react";
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
  }
];

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const totalInvested = "R$ 150,00";
  const totalEarned = "R$ 420,00";
  const availableBalance = "R$ 132,50";

  const moderationAlerts = [
    { id: 1, challenge: "Projeto Verão 2024", pending: 3 }
  ];

  return (
    <div className="p-6 pb-32 space-y-8">
      {/* Header */}
      <header className="flex justify-between items-center pt-4">
        <div>
          <p className="text-muted-foreground text-sm font-medium">Bem-vindo,</p>
          <h1 className="text-2xl font-display font-bold">Alex Costa</h1>
        </div>
        <Link href="/profile">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 bg-muted flex items-center justify-center font-bold text-lg cursor-pointer">
            AC
          </div>
        </Link>
      </header>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">Saldo Disponível</p>
              <h2 className="text-3xl font-display font-bold text-primary">{availableBalance}</h2>
            </div>
            <Link href="/wallet">
              <Button size="icon" variant="ghost" className="rounded-full bg-primary/10 text-primary">
                <Wallet size={20} />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div>
              <p className="text-muted-foreground text-[10px] font-bold uppercase mb-1">Total Investido</p>
              <p className="text-lg font-display font-bold">{totalInvested}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] font-bold uppercase mb-1">Total Ganho</p>
              <p className="text-lg font-display font-bold text-green-500 flex items-center gap-1">
                {totalEarned} <ArrowUpRight size={14} />
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Moderation Alerts */}
      {moderationAlerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-orange-500 flex items-center gap-2 px-1">
            <ShieldAlert size={16} /> Alertas de Moderação
          </h2>
          {moderationAlerts.map(alert => (
            <Link key={alert.id} href={`/challenge/${alert.id}`}>
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-orange-500/15 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{alert.challenge}</p>
                    <p className="text-xs text-orange-600/80 dark:text-orange-400/80">{alert.pending} check-ins pendentes</p>
                  </div>
                </div>
                <ArrowUpRight size={20} className="text-orange-500" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Active Challenges */}
      <div className="space-y-4">
        <h2 className="text-xl font-display font-bold flex items-center gap-2 px-1">
          <Flame className="text-primary" size={20} /> Meus Desafios
        </h2>

        {ACTIVE_CHALLENGES.length > 0 ? (
          <div className="space-y-4">
            {ACTIVE_CHALLENGES.map((challenge) => (
              <motion.div 
                key={challenge.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-[2rem] p-6 shadow-sm relative overflow-hidden group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display font-bold text-lg leading-tight">{challenge.title}</h3>
                      {challenge.isModerator && (
                        <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-none text-[10px] font-bold">MODERADOR</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground italic">Cumpra sua meta semanal para não ser eliminado.</p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-muted-foreground uppercase tracking-wider">Progresso Semanal</span>
                    <span><span className="text-primary">{challenge.progress}</span> / {challenge.goal}</span>
                  </div>
                  <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(34,197,94,0.4)]" 
                      style={{ width: `${(challenge.progress / challenge.goal) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  {challenge.needsCheckin && (
                    <Button 
                      className="flex-1 rounded-xl bg-primary text-primary-foreground font-bold h-12 shadow-lg shadow-primary/20"
                      onClick={() => setLocation(`/check-in/${challenge.id}`)}
                    >
                      <Camera className="mr-2" size={18} />
                      Check-in
                    </Button>
                  )}
                  <Link href={`/challenge/${challenge.id}`} className="flex-1">
                    <Button 
                      variant="outline" 
                      className="w-full rounded-xl h-12 font-bold border-border"
                    >
                      Detalhes
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-6 bg-muted/30 rounded-[2.5rem] border border-dashed border-border text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center text-muted-foreground">
              <Trophy size={32} />
            </div>
            <div className="space-y-2">
              <p className="font-display font-bold text-lg">Nenhum desafio ativo</p>
              <p className="text-sm text-muted-foreground">Que tal começar um novo hábito hoje?</p>
            </div>
            <div className="flex flex-col w-full gap-3">
              <Button 
                className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold"
                onClick={() => setLocation('/create')}
              >
                <PlusCircle className="mr-2" size={20} /> Criar Desafio
              </Button>
              <Button 
                variant="outline"
                className="w-full h-14 rounded-2xl font-bold border-border bg-background"
                onClick={() => setLocation('/explore')}
              >
                <Compass className="mr-2" size={20} /> Explorar Públicos
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}