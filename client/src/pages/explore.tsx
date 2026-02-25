import { useState } from "react";
import { Link } from "wouter";
import { Search, Users, Trophy, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

const PUBLIC_CHALLENGES = [
  {
    id: 2,
    title: "100km em 30 Dias",
    participants: 342,
    prizePool: "R$ 17.100",
    daysLeft: 30,
    entryFee: 50,
    image: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80",
    tags: ["Corrida", "Público"],
  },
  {
    id: 3,
    title: "Shape de Verão - Academia",
    participants: 128,
    prizePool: "R$ 12.800",
    daysLeft: 45,
    entryFee: 100,
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
    tags: ["Academia", "Pesado"],
  },
  {
    id: 4,
    title: "Caminhada Diária 5k",
    participants: 89,
    prizePool: "R$ 1.780",
    daysLeft: 15,
    entryFee: 20,
    image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80",
    tags: ["Leve", "Iniciante"],
  }
];

export default function Explore() {
  const [search, setSearch] = useState("");

  return (
    <div className="p-6 pb-32 space-y-6">
      <header className="pt-4">
        <h1 className="text-2xl font-display font-bold mb-4">Explorar Desafios</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <Input 
            placeholder="Buscar modalidades ou nomes..." 
            className="pl-10 h-12 rounded-xl bg-card border-none shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {["Todos", "Corrida", "Academia", "CrossFit", "Ciclismo"].map((cat, i) => (
          <button 
            key={cat} 
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${i === 0 ? 'bg-foreground text-background dark:bg-white dark:text-black' : 'bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {PUBLIC_CHALLENGES.map((challenge, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={challenge.id}
          >
            <Link href={`/challenge/${challenge.id}`}>
              <div className="glass-card rounded-3xl overflow-hidden cursor-pointer group">
                <div className="h-32 relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                  <img src={challenge.image} alt={challenge.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-3 left-3 z-20 flex gap-2">
                    {challenge.tags.map(tag => (
                      <span key={tag} className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-[10px] font-semibold uppercase tracking-wider text-white border border-white/10">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-5 relative z-20 bg-card -mt-4 rounded-t-3xl">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-display font-bold text-lg leading-tight w-2/3">{challenge.title}</h3>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Entrada</p>
                      <p className="font-bold text-primary">R$ {challenge.entryFee}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users size={16} className="text-primary" />
                      <span>{challenge.participants}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Trophy size={16} className="text-yellow-500" />
                      <span className="font-semibold text-foreground">{challenge.prizePool}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock size={16} />
                      <span>{challenge.daysLeft}d</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}