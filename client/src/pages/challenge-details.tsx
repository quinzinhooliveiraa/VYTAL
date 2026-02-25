import { useLocation, useParams } from "wouter";
import { ChevronLeft, Share2, Camera, Trophy, CheckCircle2, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ChallengeDetails() {
  const [, setLocation] = useLocation();
  const { id } = useParams();

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
          <button className="p-2 -mr-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/40 transition-colors">
            <Share2 size={20} className="text-white" />
          </button>
        </header>

        <div className="absolute bottom-4 left-6 right-6">
          <div className="flex gap-2 mb-3">
            <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/20 text-xs font-semibold uppercase tracking-wider">
              CrossFit
            </span>
            <span className="px-2.5 py-1 rounded-full bg-white/10 text-white border border-white/10 text-xs font-semibold uppercase tracking-wider">
              12 Days Left
            </span>
          </div>
          <h1 className="text-3xl font-display font-bold leading-tight text-white">30 Days CrossFit</h1>
        </div>
      </div>

      <div className="px-6 space-y-8 mt-6">
        {/* Key Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center text-center border-primary/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">Prize Pool</p>
            <p className="text-2xl font-display font-bold text-primary">R$ 6.200</p>
          </div>
          <div className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">Entry</p>
            <p className="text-2xl font-display font-bold text-white">R$ 50</p>
          </div>
        </div>

        {/* Your Progress */}
        <div className="border border-white/10 rounded-3xl p-5 space-y-4 relative overflow-hidden bg-white/[0.02]">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-primary">
            <Flame size={100} />
          </div>
          <h3 className="font-display font-bold text-lg">Your Progress</h3>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Week 3 of 4</p>
            <p className="text-sm font-semibold"><span className="text-primary text-lg">2</span> / 5 check-ins</p>
          </div>
          
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((day) => (
              <div key={day} className="flex-1 flex flex-col gap-2 items-center">
                <div className={`w-full h-2 rounded-full ${day <= 2 ? 'bg-primary shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-white/10'}`} />
                <span className="text-[10px] text-muted-foreground">Day {day}</span>
              </div>
            ))}
          </div>

          <Button 
            className="w-full h-12 mt-2 rounded-xl font-semibold bg-white text-black hover:bg-white/90"
            onClick={() => setLocation(`/check-in/${id}`)}
            data-testid="button-check-in-now"
          >
            <Camera className="mr-2" size={18} />
            Check-in Now
          </Button>
        </div>

        {/* Leaderboard */}
        <div className="space-y-4">
          <h3 className="font-display font-bold text-xl">Leaderboard</h3>
          
          <div className="glass-card rounded-3xl p-2">
            {[
              { pos: 1, name: "Maria S.", score: 15, avatar: "https://i.pravatar.cc/150?u=maria" },
              { pos: 2, name: "Alex Costa (You)", score: 12, avatar: "https://i.pravatar.cc/150?u=alex", isUser: true },
              { pos: 3, name: "João P.", score: 12, avatar: "https://i.pravatar.cc/150?u=joao" },
              { pos: 4, name: "Ana L.", score: 10, avatar: "https://i.pravatar.cc/150?u=ana", failed: true },
            ].map((user, i) => (
              <div key={i} className={`flex items-center gap-4 p-3 rounded-2xl ${user.isUser ? 'bg-primary/10 border border-primary/20' : ''} ${user.failed ? 'opacity-50' : ''}`}>
                <div className="w-6 text-center font-display font-bold text-muted-foreground">{user.pos}</div>
                <div className="w-10 h-10 rounded-full overflow-hidden relative">
                  <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                  {user.failed && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="w-full h-0.5 bg-red-500 rotate-45 absolute" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-semibold ${user.isUser ? 'text-primary' : 'text-white'}`}>{user.name}</p>
                  {user.failed && <p className="text-[10px] text-red-400 uppercase tracking-wider">Eliminated</p>}
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