import { useState } from "react";
import { useLocation, Link } from "wouter";
import { ChevronLeft, Search, UserPlus, Users, Sparkles, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";

export default function Friends() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");

  const friends = [
    { name: "Ana Clara", username: "anaclara", bio: "Focada no 100km mensal! 🏃‍♀️", avatar: "" },
    { name: "Lucas Melo", username: "lucasm", bio: "Crossfit todo dia.", avatar: "" },
    { name: "Bia Santos", username: "biasantos", bio: "Iniciante na musculação.", avatar: "" },
    { name: "Rodrigo Oliver", username: "rod_oliver", bio: "Ciclismo é vida.", avatar: "" },
  ];

  const suggested = [
    { name: "Felipe Góes", username: "felipegoes", bio: "Maratonista amador.", avatar: "" },
    { name: "Carol Lima", username: "carollima", bio: "Yoga & Mindfulness.", avatar: "" },
    { name: "Gabriel Souza", username: "gabsouza", bio: "Treino em casa.", avatar: "" },
  ];

  const filteredFriends = friends.filter(f => f.name.toLowerCase().includes(search.toLowerCase()) || f.username.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="pb-32">
      <header className="px-6 py-6 sticky top-0 bg-background/80 backdrop-blur-xl z-50 border-b border-border">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" className="rounded-full -ml-2" onClick={() => window.history.back()}>
            <ChevronLeft size={24} />
          </Button>
          <h1 className="text-xl font-display font-bold">Comunidade</h1>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Buscar amigos..." 
            className="h-12 pl-10 rounded-xl bg-card border-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <div className="p-6">
        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12 rounded-xl bg-muted p-1 mb-6">
            <TabsTrigger value="friends" className="rounded-lg font-bold text-xs flex gap-1">
              <Users size={14} /> Seguindo
            </TabsTrigger>
            <TabsTrigger value="followers" className="rounded-lg font-bold text-xs flex gap-1">
              <UserCheck size={14} /> Seguidores
            </TabsTrigger>
            <TabsTrigger value="explore" className="rounded-lg font-bold text-xs flex gap-1">
              <Sparkles size={14} /> Sugestões
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredFriends.map((friend) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={friend.username}
                >
                  <div onClick={() => setLocation(`/user/${friend.username}`)} className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl cursor-pointer active:scale-[0.98] hover:border-primary/50 transition-all">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        {friend.avatar && <AvatarImage src={friend.avatar} />}
                        <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-sm">{friend.name}</p>
                        <p className="text-[10px] text-muted-foreground">@{friend.username}</p>
                        <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5 italic">"{friend.bio}"</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); }}>
                      <ChevronLeft className="rotate-180" size={20} />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredFriends.length === 0 && (
              <div className="text-center py-20 opacity-50">
                <Users size={48} className="mx-auto mb-2" />
                <p>Nenhum amigo encontrado.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="followers" className="space-y-4">
            {suggested.slice(0, 2).map((sug) => (
              <div key={sug.username} onClick={() => setLocation(`/user/${sug.username}`)} className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl cursor-pointer hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    {sug.avatar && <AvatarImage src={sug.avatar} />}
                    <AvatarFallback>{sug.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-sm">{sug.name}</p>
                    <p className="text-[10px] text-muted-foreground">@{sug.username}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5 italic">"{sug.bio}"</p>
                  </div>
                </div>
                <Button size="sm" className="rounded-xl font-bold bg-primary text-primary-foreground" onClick={(e) => { e.preventDefault(); e.stopPropagation(); alert("Seguindo " + sug.name); }}>
                  <UserPlus size={16} className="mr-1" /> Seguir de volta
                </Button>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="explore" className="space-y-4">
            {suggested.map((sug) => (
              <div key={sug.username} onClick={() => setLocation(`/user/${sug.username}`)} className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl cursor-pointer hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    {sug.avatar && <AvatarImage src={sug.avatar} />}
                    <AvatarFallback>{sug.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-sm">{sug.name}</p>
                    <p className="text-[10px] text-muted-foreground">@{sug.username}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5 italic">"{sug.bio}"</p>
                  </div>
                </div>
                <Button size="sm" className="rounded-xl font-bold bg-primary text-primary-foreground" onClick={(e) => { e.preventDefault(); e.stopPropagation(); alert("Seguindo " + sug.name); }}>
                  <UserPlus size={16} className="mr-1" /> Seguir
                </Button>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}