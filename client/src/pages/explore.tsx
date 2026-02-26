import { useState } from "react";
import { Link } from "wouter";
import { Search, Users, Trophy, Clock, Filter, SlidersHorizontal, Flame, Sparkles, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const PUBLIC_CHALLENGES = [
  {
    id: 2,
    title: "100km em 30 Dias",
    participants: 342,
    prizePool: "R$ 17.100",
    daysLeft: 30,
    entryFee: 50,
    image: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80",
    modality: "Corrida",
    isTrending: true,
    isNew: false,
  },
  {
    id: 3,
    title: "Shape de Verão - Intensivo",
    participants: 128,
    prizePool: "R$ 12.800",
    daysLeft: 45,
    entryFee: 100,
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
    modality: "Academia",
    isTrending: true,
    isNew: true,
  },
  {
    id: 4,
    title: "Caminhada Diária 5k",
    participants: 89,
    prizePool: "R$ 1.780",
    daysLeft: 15,
    entryFee: 20,
    image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80",
    modality: "Funcional",
    isTrending: false,
    isNew: true,
  },
  {
    id: 5,
    title: "Pedal de Fim de Semana",
    participants: 56,
    prizePool: "R$ 2.800",
    daysLeft: 20,
    entryFee: 50,
    image: "https://images.unsplash.com/photo-1541625602330-2277a4c4bb98?w=800&q=80",
    modality: "Ciclismo",
    isTrending: false,
    isNew: false,
  }
];

const MODALIDADES = ["Todos", "Corrida", "Academia", "Crossfit", "Ciclismo", "Natação", "Funcional", "Yoga", "HIIT", "Personalizado"];

export default function Explorar() {
  const [search, setSearch] = useState("");
  const [selectedModality, setSelectedModality] = useState("Todos");
  const [sortBy, setSortBy] = useState("trending");

  const filteredChallenges = PUBLIC_CHALLENGES.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchesModality = selectedModality === "Todos" || c.modality === selectedModality;
    return matchesSearch && matchesModality;
  });

  return (
    <div className="p-6 pb-32 space-y-6">
      <header className="pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">Explorar</h1>
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-xl border-border bg-card">
                <SlidersHorizontal size={20} />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-w-md mx-auto">
              <DrawerHeader>
                <DrawerTitle>Filtros Avançados</DrawerTitle>
                <DrawerDescription>Personalize sua busca por desafios</DrawerDescription>
              </DrawerHeader>
              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <p className="text-sm font-semibold">Ordenar por</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "trending", label: "Mais Trending", icon: Flame },
                      { id: "challenging", label: "Mais Desafiador", icon: Trophy },
                      { id: "new", label: "Mais Recentes", icon: Sparkles },
                      { id: "participants", label: "Participantes", icon: Users },
                    ].map(sort => (
                      <Button 
                        key={sort.id}
                        variant={sortBy === sort.id ? "default" : "outline"}
                        className="justify-start h-12 rounded-xl"
                        onClick={() => setSortBy(sort.id)}
                      >
                        <sort.icon size={16} className="mr-2" />
                        {sort.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-semibold">Valor de Entrada</p>
                  <div className="flex gap-2">
                    {["R$ 0-50", "R$ 50-100", "R$ 100+"].map(range => (
                      <Badge key={range} variant="outline" className="px-4 py-2 rounded-full cursor-pointer hover:bg-accent">
                        {range}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <DrawerFooter className="pb-8">
                <DrawerClose asChild>
                  <Button className="h-14 rounded-2xl font-bold">Aplicar Filtros</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
          <Input 
            placeholder="Buscar por nome ou modalidade..." 
            className="pl-10 h-14 rounded-2xl bg-card border-none shadow-sm focus-visible:ring-1 focus-visible:ring-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      {/* Modality Slider */}
      <ScrollArea className="w-full whitespace-nowrap -mx-6 px-6">
        <div className="flex gap-2 pb-4">
          {MODALIDADES.map((cat) => (
            <button 
              key={cat} 
              onClick={() => setSelectedModality(cat)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                selectedModality === cat 
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105' 
                : 'bg-card text-muted-foreground hover:bg-accent border border-transparent hover:border-border'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="hidden" />
      </ScrollArea>

      {/* Sections */}
      <div className="space-y-8">
        {/* Desafios em Alta (Trending) */}
        {selectedModality === "Todos" && !search && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={20} className="text-primary" />
              <h2 className="text-xl font-display font-bold">Desafios em Alta</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar">
              {PUBLIC_CHALLENGES.filter(c => c.isTrending).map((challenge) => (
                <Link key={challenge.id} href={`/challenge/${challenge.id}`}>
                  <motion.div 
                    whileTap={{ scale: 0.98 }}
                    className="relative w-72 h-44 rounded-[2rem] overflow-hidden shrink-0 group cursor-pointer"
                  >
                    <img src={challenge.image} alt={challenge.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-primary/90 text-primary-foreground border-none font-bold backdrop-blur-sm shadow-xl">
                        Trending 🔥
                      </Badge>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white font-display font-bold text-lg leading-tight mb-2">{challenge.title}</h3>
                      <div className="flex items-center gap-3 text-white/80 text-xs font-medium">
                        <span className="flex items-center gap-1"><Users size={12} /> {challenge.participants}</span>
                        <span className="flex items-center gap-1"><Trophy size={12} /> {challenge.prizePool}</span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* List of Challenges */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-bold">
              {selectedModality !== "Todos" ? `Desafios de ${selectedModality}` : "Todos os Desafios"}
            </h2>
            <span className="text-xs text-muted-foreground font-medium">{filteredChallenges.length} resultados</span>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredChallenges.map((challenge, i) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  key={challenge.id}
                >
                  <Link href={`/challenge/${challenge.id}`}>
                    <div className="glass-card rounded-[2rem] overflow-hidden cursor-pointer group hover:border-primary/30 transition-all active:scale-[0.98]">
                      <div className="flex p-3 gap-4">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 relative">
                          <img src={challenge.image} alt={challenge.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          {challenge.isNew && (
                            <div className="absolute top-1 left-1 bg-blue-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">Novo</div>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            <div className="flex justify-between items-start">
                              <h3 className="font-display font-bold text-base leading-tight group-hover:text-primary transition-colors">{challenge.title}</h3>
                              <p className="font-bold text-primary text-sm shrink-0 ml-2">R$ {challenge.entryFee}</p>
                            </div>
                            <Badge variant="secondary" className="mt-1 bg-muted/50 text-[10px] h-5 py-0 border-none font-semibold">{challenge.modality}</Badge>
                          </div>
                          
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                            <span className="flex items-center gap-1"><Users size={12} className="text-primary" />{challenge.participants}</span>
                            <span className="flex items-center gap-1 font-bold text-foreground"><Trophy size={12} className="text-yellow-500" />{challenge.prizePool}</span>
                            <span className="flex items-center gap-1"><Clock size={12} />{challenge.daysLeft}d</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredChallenges.length === 0 && (
              <div className="text-center py-20 space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                  <Search size={32} />
                </div>
                <div>
                  <p className="font-display font-bold text-lg">Nenhum desafio encontrado</p>
                  <p className="text-muted-foreground text-sm">Tente mudar os filtros ou a busca.</p>
                </div>
                <Button variant="outline" className="rounded-xl" onClick={() => { setSearch(""); setSelectedModality("Todos"); }}>
                  Limpar Filtros
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}