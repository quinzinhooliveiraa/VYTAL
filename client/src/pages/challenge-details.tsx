import { useLocation, useParams } from "wouter";
import { ChevronLeft, Share2, Camera, Trophy, Flame, Users, Clock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ChallengeDetails() {
  const [, setLocation] = useLocation();
  const { id } = useParams();

  // Mock checking if user is admin of this challenge
  const isAdmin = true;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background pb-24">
      {/* Hero Image */}
      <div className="h-64 relative">
        <img 
          src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80" 
          alt="Challenge Hero" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        <header className="absolute top-0 left-0 right-0 px-6 py-6 flex items-center justify-between z-10">
          <button onClick={() => setLocation("/dashboard")} className="p-2 -ml-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/40 transition-colors">
            <ChevronLeft size={24} className="text-white" />
          </button>
          <div className="flex gap-2">
            <button className="p-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/40 transition-colors">
              <Share2 size={20} className="text-white" />
            </button>
          </div>
        </header>

        <div className="absolute bottom-4 left-6 right-6">
          <div className="flex gap-2 mb-3">
            <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/20 text-xs font-semibold uppercase tracking-wider">
              Academia
            </span>
            <span className="px-2.5 py-1 rounded-full bg-white/10 text-white border border-white/10 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
              Faltam 12 Dias
            </span>
          </div>
          <h1 className="text-3xl font-display font-bold leading-tight text-white drop-shadow-md">Projeto Verão 2024</h1>
        </div>
      </div>

      <div className="px-6 space-y-8 mt-6">
        {/* Admin Warning if Admin */}
        {isAdmin && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldAlert className="text-orange-500" size={20} />
              <div>
                <p className="font-semibold text-sm text-orange-600 dark:text-orange-400">Área de Moderação</p>
                <p className="text-xs text-muted-foreground">Você é admin deste desafio.</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="border-orange-500/30 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10">
              Verificar Check-ins
            </Button>
          </div>
        )}

        {/* Key Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">Prêmio Total</p>
            <p className="text-2xl font-display font-bold text-primary">R$ 6.200</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">Entrada</p>
            <p className="text-2xl font-display font-bold">R$ 50</p>
          </div>
        </div>

        {/* Your Progress */}
        <div className="border border-primary/20 bg-primary/5 rounded-3xl p-5 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-primary">
            <Flame size={100} />
          </div>
          <h3 className="font-display font-bold text-lg">Seu Progresso</h3>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Semana 3 de 4</p>
            <p className="text-sm font-semibold"><span className="text-primary text-lg">3</span> / 5 check-ins</p>
          </div>
          
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((day) => (
              <div key={day} className="flex-1 flex flex-col gap-2 items-center">
                <div className={`w-full h-2 rounded-full ${day <= 3 ? 'bg-primary shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-muted-foreground/30'}`} />
                <span className="text-[10px] text-muted-foreground">Dia {day}</span>
              </div>
            ))}
          </div>

          <Button 
            className="w-full h-14 mt-4 rounded-xl font-bold bg-foreground text-background dark:bg-white dark:text-black hover:opacity-90"
            onClick={() => setLocation(`/check-in/${id}`)}
          >
            <Camera className="mr-2" size={20} />
            Fazer Check-in Agora
          </Button>
        </div>

        {/* Leaderboard */}
        <div className="space-y-4">
          <h3 className="font-display font-bold text-xl">Ranking</h3>
          
          <div className="bg-card border border-border rounded-3xl p-2 shadow-sm">
            {[
              { pos: 1, name: "Maria S.", score: 15, avatar: "https://i.pravatar.cc/150?u=maria" },
              { pos: 2, name: "Alex Costa (Você)", score: 13, avatar: "https://i.pravatar.cc/150?u=alex", isUser: true },
              { pos: 3, name: "João P.", score: 12, avatar: "https://i.pravatar.cc/150?u=joao" },
              { pos: 4, name: "Ana L.", score: 10, avatar: "https://i.pravatar.cc/150?u=ana", failed: true },
            ].map((user, i) => (
              <div key={i} className={`flex items-center gap-4 p-3 rounded-2xl ${user.isUser ? 'bg-primary/10 border border-primary/20' : ''} ${user.failed ? 'opacity-50' : ''}`}>
                <div className="w-6 text-center font-display font-bold text-muted-foreground">{user.pos}</div>
                <div className="w-10 h-10 rounded-full overflow-hidden relative">
                  <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                  {user.failed && (
                    <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center backdrop-blur-[1px]">
                      <div className="w-full h-0.5 bg-red-500 rotate-45 absolute" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-semibold ${user.isUser ? 'text-primary' : ''}`}>{user.name}</p>
                  {user.failed ? (
                    <p className="text-[10px] text-red-500 uppercase tracking-wider font-bold">Eliminado(a)</p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground uppercase">Ativo</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{user.score}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Check-ins</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}