import { motion } from "framer-motion";
import { Link } from "wouter";
import { Trophy, Users, ArrowUpRight, Flame, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const MOCK_CHALLENGES = [
  {
    id: 1,
    title: "30 Days CrossFit",
    participants: 124,
    prizePool: "R$ 6.200",
    daysLeft: 12,
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",
    tags: ["CrossFit", "Hard"],
  },
  {
    id: 2,
    title: "Morning Runners",
    participants: 89,
    prizePool: "R$ 4.450",
    daysLeft: 5,
    image: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80",
    tags: ["Running", "Medium"],
  }
];

export default function Dashboard() {
  return (
    <div className="p-6 pb-32 space-y-8">
      {/* Header */}
      <header className="flex justify-between items-center pt-4">
        <div>
          <p className="text-muted-foreground text-sm font-medium">Welcome back,</p>
          <h1 className="text-2xl font-display font-bold">Alex Costa</h1>
        </div>
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/50">
          <img src="https://i.pravatar.cc/150?u=alex" alt="Profile" className="w-full h-full object-cover" />
        </div>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy size={48} />
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">Active Stakes</p>
          <p className="text-3xl font-display font-bold text-white">R$ 150</p>
          <div className="mt-4 flex items-center gap-1 text-primary text-sm font-medium">
            <Flame size={16} /> 2 Active
          </div>
        </div>
        <div className="glass-card rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy size={48} />
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">Total Won</p>
          <p className="text-3xl font-display font-bold text-white">R$ 420</p>
          <div className="mt-4 flex items-center gap-1 text-green-400 text-sm font-medium">
            <ArrowUpRight size={16} /> +R$ 80 this month
          </div>
        </div>
      </div>

      {/* CTA */}
      <Link href="/create">
        <div className="bg-primary/10 border border-primary/30 rounded-3xl p-6 flex items-center justify-between cursor-pointer hover:bg-primary/20 transition-colors group">
          <div>
            <h3 className="font-display font-bold text-lg text-primary">Create Challenge</h3>
            <p className="text-muted-foreground text-sm">Invite friends & set the stakes</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(34,197,94,0.4)]">
            <ArrowUpRight size={24} />
          </div>
        </div>
      </Link>

      {/* Trending Challenges */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <h2 className="text-xl font-display font-bold">Trending Challenges</h2>
          <Button variant="link" className="text-primary h-auto p-0">View All</Button>
        </div>

        <div className="space-y-4">
          {MOCK_CHALLENGES.map((challenge, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={challenge.id}
            >
              <Link href={`/challenge/${challenge.id}`}>
                <div className="glass-card rounded-3xl overflow-hidden cursor-pointer group">
                  <div className="h-32 relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent z-10" />
                    <img src={challenge.image} alt={challenge.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 left-3 z-20 flex gap-2">
                      {challenge.tags.map(tag => (
                        <span key={tag} className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-[10px] font-semibold uppercase tracking-wider text-white border border-white/10">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-5 relative z-20 -mt-6">
                    <h3 className="font-display font-bold text-xl mb-3">{challenge.title}</h3>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users size={16} className="text-primary" />
                        <span>{challenge.participants}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Trophy size={16} className="text-yellow-500" />
                        <span className="font-semibold text-white">{challenge.prizePool}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock size={16} />
                        <span>{challenge.daysLeft}d left</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}