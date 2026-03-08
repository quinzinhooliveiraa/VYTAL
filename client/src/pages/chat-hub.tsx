import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Search, Users, MessageCircle, Trophy, ChevronRight, Hash, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ChatHub() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("direct");

  const directMessages = [
    { id: 1, user: "Alex C.", username: "alex", avatar: "https://i.pravatar.cc/150?u=alex", lastMsg: "Massa! Vou entrar lá agora.", time: "10:42", unread: 0, online: true },
    { id: 2, user: "Maria S.", username: "maria", avatar: "https://i.pravatar.cc/150?u=maria", lastMsg: "Pagou o treino hoje?", time: "09:15", unread: 2, online: true },
    { id: 3, user: "João P.", username: "joao", avatar: "https://i.pravatar.cc/150?u=joao", lastMsg: "Cara, minha panturrilha tá destruída", time: "Ontem", unread: 0, online: false },
    { id: 4, user: "Ana Clara", username: "anaclara", avatar: "https://i.pravatar.cc/150?u=1", lastMsg: "Bora correr no parque sábado?", time: "Terça", unread: 0, online: false },
  ];

  const challengeChats = [
    { id: 1, name: "Projeto Verão 2024", type: "Desafio", image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=150&q=80", lastMsg: "Maria S: Bora time! Mais 5km hoje 🏃‍♀️", time: "11:30", unread: 5, participants: 4 },
    { id: 2, name: "100km no Mês", type: "Desafio", image: "https://images.unsplash.com/photo-1552674605-15c2145b8ce4?w=150&q=80", lastMsg: "Você: Fechando a semana com 25km", time: "Ontem", unread: 0, participants: 12 },
  ];

  const communities = [
    { id: 1, name: "Crossfitters Brasil", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=150&q=80", lastMsg: "Lucas: Alguém vai no WOD das 19h?", time: "14:20", unread: 12, members: 1240 },
    { id: 2, name: "Clube da Corrida 5k/10k", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=150&q=80", lastMsg: "Admin: Resultados do fds atualizados!", time: "08:00", unread: 1, members: 850 },
  ];

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      {/* Header */}
      <header className="px-6 pt-6 pb-4 sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border">
        <h1 className="text-3xl font-display font-bold mb-4">Conversas</h1>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Buscar mensagens, grupos..." 
            className="pl-10 h-12 bg-muted/50 border-none rounded-2xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <div className="px-6 mt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 h-12 rounded-xl bg-muted p-1 mb-6">
            <TabsTrigger value="direct" className="rounded-lg font-bold">Privado</TabsTrigger>
            <TabsTrigger value="challenges" className="rounded-lg font-bold">Desafios</TabsTrigger>
            <TabsTrigger value="communities" className="rounded-lg font-bold">Tribos</TabsTrigger>
          </TabsList>

          <TabsContent value="direct" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            {directMessages.map(chat => (
              <Link key={chat.id} href={`/messages/${chat.username}`}>
                <div className="flex items-center gap-4 p-3 bg-card border border-border rounded-2xl hover:border-primary/50 cursor-pointer transition-colors">
                  <div className="relative">
                    <Avatar className="w-14 h-14 border border-border">
                      <AvatarImage src={chat.avatar} />
                      <AvatarFallback>{chat.user.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {chat.online && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full"></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-bold text-sm truncate">{chat.user}</h3>
                      <span className={`text-[10px] ${chat.unread > 0 ? 'text-primary font-bold' : 'text-muted-foreground'}`}>{chat.time}</span>
                    </div>
                    <p className={`text-xs truncate ${chat.unread > 0 ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>
                      {chat.lastMsg}
                    </p>
                  </div>
                  {chat.unread > 0 && (
                    <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                      {chat.unread}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </TabsContent>

          <TabsContent value="challenges" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            {challengeChats.map(chat => (
              <Link key={chat.id} href={`/challenge/${chat.id}`}>
                <div className="flex items-center gap-4 p-3 bg-card border border-border rounded-2xl hover:border-primary/50 cursor-pointer transition-colors">
                  <Avatar className="w-14 h-14 border border-border rounded-xl">
                    <AvatarImage src={chat.image} className="object-cover" />
                    <AvatarFallback><Trophy size={20} /></AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-bold text-sm truncate">{chat.name}</h3>
                      <span className={`text-[10px] ${chat.unread > 0 ? 'text-primary font-bold' : 'text-muted-foreground'}`}>{chat.time}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[8px] h-4 py-0 px-1.5"><Trophy size={8} className="mr-1"/>{chat.type}</Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center"><Users size={10} className="mr-1"/>{chat.participants}</span>
                    </div>
                    <p className={`text-xs truncate ${chat.unread > 0 ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>
                      {chat.lastMsg}
                    </p>
                  </div>
                  {chat.unread > 0 && (
                    <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                      {chat.unread}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </TabsContent>

          <TabsContent value="communities" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            {/* Find new communities card */}
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-primary/20 transition-colors" onClick={() => setLocation('/communities')}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                  <Search size={20} />
                </div>
                <div>
                  <p className="font-bold text-sm text-primary">Explorar Comunidades</p>
                  <p className="text-[10px] text-primary/80">Encontre tribos do seu esporte</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-primary" />
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground px-1">Suas Comunidades</h4>
              {communities.map(chat => (
                <div key={chat.id} className="flex items-center gap-4 p-3 bg-card border border-border rounded-2xl hover:border-primary/50 cursor-pointer transition-colors" onClick={() => setLocation(`/challenge/1?tab=chat`)}>
                  <Avatar className="w-14 h-14 border border-border rounded-2xl">
                    <AvatarImage src={chat.image} className="object-cover" />
                    <AvatarFallback><Hash size={20} /></AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-bold text-sm truncate flex items-center gap-1">
                        <ShieldCheck size={14} className="text-blue-500" />
                        {chat.name}
                      </h3>
                      <span className={`text-[10px] ${chat.unread > 0 ? 'text-primary font-bold' : 'text-muted-foreground'}`}>{chat.time}</span>
                    </div>
                    <p className={`text-xs truncate ${chat.unread > 0 ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>
                      {chat.lastMsg}
                    </p>
                  </div>
                  {chat.unread > 0 && (
                    <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                      {chat.unread}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}