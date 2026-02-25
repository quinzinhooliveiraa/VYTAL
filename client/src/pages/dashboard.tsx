import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Trophy, ArrowUpRight, Flame, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

const ACTIVE_CHALLENGES = [
  {
    id: 1,
    title: "Projeto Verão 2024",
    prizePool: "R$ 6.200",
    daysLeft: 12,
    progress: 3,
    goal: 5,
    needsCheckin: true,
  }
];

export default function Dashboard() {
  const [, setLocation] = useLocation();

  return (
    <div className="p-6 pb-32 space-y-8">
      {/* Header */}
      <header className="flex justify-between items-center pt-4">
        <div>
          <p className="text-muted-foreground text-sm font-medium">Olá,</p>
          <h1 className="text-2xl font-display font-bold">Alex Costa</h1>
        </div>
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 bg-muted flex items-center justify-center font-bold text-lg">
          AC
        </div>
      </header>

      {/* Financial Resumo */}
      <div className="bg-foreground text-background dark:bg-card dark:text-card-foreground rounded-3xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Trophy size={80} />
        </div>
        <p className="text-background/70 dark:text-muted-foreground text-sm font-medium mb-1">Ganhos Acumulados</p>
        <p className="text-4xl font-display font-bold mb-4">R$ 420<span className="text-lg opacity-50">,00</span></p>
        
        <div className="flex gap-4">
          <div className="bg-background/10 dark:bg-white/5 rounded-xl p-3 flex-1 backdrop-blur-md">
            <p className="text-xs opacity-80 mb-1">Em Jogo</p>
            <p className="font-semibold">R$ 150,00</p>
          </div>
          <div className="bg-primary/20 text-primary dark:bg-primary/10 rounded-xl p-3 flex-1 backdrop-blur-md border border-primary/20">
            <p className="text-xs mb-1 font-medium">Último Mês</p>
            <p className="font-bold flex items-center gap-1">
              <ArrowUpRight size={14} /> R$ 80,00
            </p>
          </div>
        </div>
      </div>

      {/* Active Challenges */}
      <div className="space-y-4">
        <h2 className="text-xl font-display font-bold flex items-center gap-2">
          <Flame className="text-primary" /> Meus Desafios Ativos
        </h2>

        {ACTIVE_CHALLENGES.length > 0 ? (
          <div className="space-y-4">
            {ACTIVE_CHALLENGES.map((challenge) => (
              <motion.div 
                key={challenge.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-3xl p-5 border border-primary/20 relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-display font-bold text-lg leading-tight">{challenge.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">Faltam {challenge.daysLeft} dias</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Prêmio Atual</p>
                    <p className="font-bold text-primary">{challenge.prizePool}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progresso na Semana</span>
                    <span className="font-semibold"><span className="text-primary">{challenge.progress}</span> / {challenge.goal}</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-1000 ease-out" 
                      style={{ width: `${(challenge.progress / challenge.goal) * 100}%` }}
                    />
                  </div>
                </div>

                {challenge.needsCheckin && (
                  <Button 
                    className="w-full rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20"
                    onClick={() => setLocation(`/check-in/${challenge.id}`)}
                  >
                    <Camera className="mr-2" size={18} />
                    Fazer Check-in de Hoje
                  </Button>
                )}
                
                <Button 
                  variant="link" 
                  className="w-full mt-2 text-muted-foreground"
                  onClick={() => setLocation(`/challenge/${challenge.id}`)}
                >
                  Ver Detalhes
                </Button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-muted/50 rounded-3xl border border-dashed">
            <p className="text-muted-foreground mb-4">Você não está em nenhum desafio.</p>
            <Button onClick={() => setLocation('/explore')}>Explorar Desafios</Button>
          </div>
        )}
      </div>
    </div>
  );
}