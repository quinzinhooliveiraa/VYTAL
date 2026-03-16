import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Users, Trophy, Clock, SlidersHorizontal, Flame, Sparkles, TrendingUp, Calendar, Loader2, UserPlus, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const MODALIDADES = ["Todos", "Corrida", "Academia", "Crossfit", "Ciclismo", "Natação", "Funcional", "Yoga", "HIIT", "Personalizado"];

const sportImages: Record<string, string> = {
  corrida: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80",
  academia: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
  crossfit: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
  ciclismo: "https://images.unsplash.com/photo-1541625602330-2277a4c4bb98?w=800&q=80",
  natacao: "https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=800&q=80",
  funcional: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80",
  yoga: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
  hiit: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
};

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Explorar() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [selectedModality, setSelectedModality] = useState("Todos");
  const [sortBy, setSortBy] = useState("trending");
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: allChallenges = [], isLoading } = useQuery({
    queryKey: ["/api/challenges/explore"],
    queryFn: async () => {
      const res = await fetch("/api/challenges/explore", { credentials: "include" });
      return res.ok ? res.json() : [];
    },
  });

  const { data: myChallenges = [] } = useQuery({
    queryKey: ["/api/challenges/mine"],
    queryFn: async () => {
      const res = await fetch("/api/challenges/mine", { credentials: "include" });
      return res.ok ? res.json() : [];
    },
    enabled: !!user,
  });

  const followMutation = useMutation({
    mutationFn: async (username: string) => {
      const res = await apiRequest("POST", `/api/follows/${username}`);
      return res.json();
    },
    onSuccess: (_, username) => {
      queryClient.invalidateQueries({ queryKey: ["/api/follows/status", username] });
      toast({ title: "Seguindo!", description: "Você receberá notificações dos próximos desafios." });
    },
  });

  const myIds = new Set(myChallenges.map((c: any) => c.id));

  const pendingChallenges = allChallenges.filter((c: any) =>
    c.status === "pending" && !myIds.has(c.id)
  );

  const activeChallenges = allChallenges.filter((c: any) =>
    c.status === "active" && !myIds.has(c.id)
  );

  const availableChallenges = [...pendingChallenges, ...activeChallenges];

  const filteredChallenges = availableChallenges.filter((c: any) => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.sport?.toLowerCase().includes(search.toLowerCase());
    const matchesModality = selectedModality === "Todos" ||
      c.sport?.toLowerCase() === selectedModality.toLowerCase();
    return matchesSearch && matchesModality;
  });

  const sortedChallenges = [...filteredChallenges].sort((a: any, b: any) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    if (sortBy === "new") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === "challenging") return Number(b.entryFee) - Number(a.entryFee);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const renderChallengeCard = (challenge: any, i: number) => {
    const img = sportImages[challenge.sport?.toLowerCase()] || sportImages.academia;
    const isPending = challenge.status === "pending";
    const daysLeft = challenge.startDate
      ? Math.max(0, Math.ceil((new Date(challenge.startDate).getTime() + (challenge.duration || 30) * 86400000 - Date.now()) / 86400000))
      : 0;
    const startsIn = challenge.startDate
      ? Math.max(0, Math.ceil((new Date(challenge.startDate).getTime() - Date.now()) / 86400000))
      : 0;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ delay: i * 0.05 }}
        key={challenge.id}
      >
        <Link href={`/challenge/${challenge.id}`}>
          <div className={`glass-card rounded-[2rem] overflow-hidden cursor-pointer group hover:border-primary/30 transition-all active:scale-[0.98] ${isPending ? 'border-yellow-500/30' : ''}`} data-testid={`card-challenge-${challenge.id}`}>
            {isPending && (
              <div className="px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20 flex items-center justify-between">
                <span className="text-[11px] font-bold text-yellow-600 dark:text-yellow-400 flex items-center gap-1.5">
                  <Sparkles size={12} /> Vagas Abertas — {startsIn > 0 ? `Começa em ${startsIn}d` : "Início em breve"}
                </span>
                <Badge className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-[9px] border-none">Pendente</Badge>
              </div>
            )}
            <div className="flex p-3 gap-4">
              <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 relative">
                <img src={img} alt={challenge.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-display font-bold text-base leading-tight group-hover:text-primary transition-colors">{challenge.title}</h3>
                    <p className="font-bold text-primary text-sm shrink-0 ml-2">{formatBRL(Number(challenge.entryFee))}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="bg-muted/50 text-[10px] h-5 py-0 border-none font-semibold capitalize">{challenge.sport}</Badge>
                    {challenge.startDate && (
                      <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1">
                        <Calendar size={10} /> {new Date(challenge.startDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                  <span className="flex items-center gap-1"><Users size={12} className="text-primary" />{challenge.maxParticipants || "∞"}</span>
                  <span className="flex items-center gap-1 font-bold text-foreground"><Trophy size={12} className="text-yellow-500" />{formatBRL(Number(challenge.entryFee) * (challenge.maxParticipants || 10))}</span>
                  <span className="flex items-center gap-1"><Clock size={12} />{isPending ? `${challenge.duration}d` : `${daysLeft}d`}</span>
                </div>
              </div>
            </div>

            {isPending && challenge.creator && (
              <div className="px-4 pb-3 flex items-center justify-between">
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLocation(`/user/${challenge.creator.username}`); }}
                >
                  <Avatar className="w-6 h-6 border border-border">
                    {challenge.creator.avatar && <AvatarImage src={challenge.creator.avatar} />}
                    <AvatarFallback className="text-[9px]">{(challenge.creator.name || "?").charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-[11px] text-muted-foreground">por <strong className="text-foreground">{challenge.creator.name}</strong></span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2.5 rounded-lg text-[10px] font-bold text-primary hover:bg-primary/10 gap-1"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    followMutation.mutate(challenge.creator.username);
                  }}
                  data-testid={`button-follow-creator-${challenge.id}`}
                >
                  <Bell size={11} /> Seguir
                </Button>
              </div>
            )}
          </div>
        </Link>
      </motion.div>
    );
  };

  return (
    <div className="p-6 pb-32 space-y-8">
      <header className="pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">Explorar</h1>
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-xl border-border bg-card" data-testid="button-filters">
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
                      { id: "trending", label: "Mais Recentes", icon: Flame },
                      { id: "challenging", label: "Mais Caros", icon: Trophy },
                      { id: "new", label: "Novos", icon: Sparkles },
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
            data-testid="input-search"
          />
        </div>
      </header>

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
              data-testid={`filter-modality-${cat.toLowerCase()}`}
            >
              {cat}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="hidden" />
      </ScrollArea>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      )}

      {!isLoading && sortedChallenges.length === 0 && (
        <div className="text-center py-12 space-y-3">
          <Trophy className="mx-auto text-muted-foreground" size={48} />
          <p className="text-lg font-bold">Nenhum desafio disponível</p>
          <p className="text-sm text-muted-foreground">
            {search || selectedModality !== "Todos"
              ? "Tente mudar os filtros de busca"
              : "Crie o primeiro desafio!"}
          </p>
        </div>
      )}

      {!isLoading && sortedChallenges.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-bold">
              {selectedModality !== "Todos" ? `Desafios de ${selectedModality}` : "Desafios Disponíveis"}
            </h2>
            <span className="text-xs text-muted-foreground font-medium">{sortedChallenges.length} resultados</span>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {sortedChallenges.map((challenge: any, i: number) => renderChallengeCard(challenge, i))}
            </AnimatePresence>
          </div>
        </section>
      )}
    </div>
  );
}
