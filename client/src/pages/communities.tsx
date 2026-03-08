import { useState } from "react";
import { useLocation, Link } from "wouter";
import { ChevronLeft, Search, Users, Plus, ShieldCheck, Trophy, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function Communities() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");

  const communities = [
    { id: 1, name: "Crossfitters Brasil", members: 1240, active: 15, tag: "Crossfit", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80" },
    { id: 2, name: "Clube da Corrida 5k/10k", members: 850, active: 8, tag: "Corrida", image: "https://images.unsplash.com/photo-1552674605-15c2145b8ce4?w=800&q=80" },
    { id: 3, name: "Yoga Matinal", members: 420, active: 4, tag: "Yoga", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80" },
    { id: 4, name: "Shape de Verão O Ano Todo", members: 3100, active: 42, tag: "Musculação", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80" } // Reused image for demo
  ];

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      {/* Header */}
      <header className="px-6 pt-6 pb-4 sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-full -ml-2" onClick={() => window.history.back()}>
              <ChevronLeft size={24} />
            </Button>
            <h1 className="text-2xl font-display font-bold">Comunidades</h1>
          </div>
          <Button size="icon" className="rounded-full bg-primary/10 text-primary hover:bg-primary/20" onClick={() => setLocation('/create-community')}>
            <Plus size={20} />
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Buscar por esporte, nome..." 
            className="pl-10 h-12 bg-muted/50 border-none rounded-2xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <div className="p-6 space-y-6">
        <div className="bg-primary/10 border border-primary/20 rounded-[2rem] p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="font-bold text-primary mb-1">Crie sua própria tribo</h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">Reúna amigos, crie desafios exclusivos e gerencie o pote das competições de forma privada.</p>
            <Button className="h-10 rounded-xl font-bold text-xs" onClick={() => setLocation('/create-community')}>
              Criar Comunidade
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-display font-bold text-lg flex items-center gap-2">
            <Flame className="text-orange-500" size={20}/> Em Alta
          </h2>
          
          <div className="grid gap-4">
            {communities.map(comm => (
              <div key={comm.id} className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm group cursor-pointer hover:border-primary/50 transition-colors">
                <div className="h-32 relative">
                  <img src={comm.image} alt={comm.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <Badge className="absolute top-3 left-3 bg-primary/80 backdrop-blur-md border-none">{comm.tag}</Badge>
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="text-lg font-bold text-white leading-tight">{comm.name}</h3>
                  </div>
                </div>
                <div className="p-4 flex justify-between items-center bg-card">
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users size={14} />
                      <span className="text-xs font-bold">{comm.members.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-orange-500">
                      <Trophy size={14} />
                      <span className="text-xs font-bold">{comm.active} desafios</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl h-8 text-xs font-bold border-primary text-primary hover:bg-primary/5" onClick={(e) => { e.stopPropagation(); setLocation('/chat-hub'); }}>
                    Participar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}