import { useState } from "react";
import { useLocation, useParams, Link } from "wouter";
import { ChevronLeft, UserPlus, MessageCircle, Trophy, ShieldCheck, CheckCircle2, Users, ArrowUpRight, Flame, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function PublicProfile() {
  const [, setLocation] = useLocation();
  const { username } = useParams();
  const [isFriend, setIsFriend] = useState(false);
  const [friendStatus, setFriendStatus] = useState("none"); // none, requested, friends
  const isPrivate = localStorage.getItem(`fitstake-private-${username}`) === "true" || username === "ana_clara";

  // Mock user data
  // Retrieve friends and their bios from the friends page mock data
  const getMockBio = (uname: string) => {
    const bios: Record<string, string> = {
      "anaclara": "Focada no 100km mensal! 🏃‍♀️",
      "lucasm": "Crossfit todo dia.",
      "biasantos": "Iniciante na musculação.",
      "felipegoes": "Maratonista amador.",
      "carollima": "Yoga & Mindfulness.",
      "marcos_silva": "Apaixonado por corrida e desafios de alta intensidade. 🏃‍♂️💨",
      "maria": "Sempre em busca da melhor versão! 🏋️‍♀️",
      "alex": "Criador de desafios e focado na consistência.",
      "joão": "Bora pra cima! Mais um dia concluído. 🔥",
      "ana": "Corredora de fim de semana."
    };
    return bios[uname] || "Em busca da consistência diária.";
  };

  const getMockName = (uname: string) => {
    const names: Record<string, string> = {
      "anaclara": "Ana Clara",
      "lucasm": "Lucas Melo",
      "biasantos": "Bia Santos",
      "felipegoes": "Felipe Góes",
      "carollima": "Carol Lima",
      "marcos_silva": "Marcos Silva",
      "maria": "Maria S.",
      "alex": "Alex C.",
      "joão": "João P.",
      "ana": "Ana L."
    };
    return names[uname] || uname;
  };

  const currentUsername = username || "marcos_silva";

  const user = {
    username: currentUsername,
    name: getMockName(currentUsername),
    bio: getMockBio(currentUsername),
    avatar: `https://i.pravatar.cc/150?u=${currentUsername}`,
    stats: {
      completed: 24,
      won: 18,
      earned: "R$ 2.450",
      moderations: 156,
      reputation: 4.9,
    },
    showEarnings: true,
  };

  const friends = [
    { name: "Ana Clara", username: "anaclara", avatar: "https://i.pravatar.cc/150?u=1" },
    { name: "Lucas Melo", username: "lucasm", avatar: "https://i.pravatar.cc/150?u=2" },
    { name: "Bia Santos", username: "biasantos", avatar: "https://i.pravatar.cc/150?u=3" },
  ];

  const suggested = [
    { name: "Felipe Góes", username: "felipegoes", avatar: "https://i.pravatar.cc/150?u=4" },
    { name: "Carol Lima", username: "carollima", avatar: "https://i.pravatar.cc/150?u=5" },
  ];

  return (
    <div className="pb-32">
      {/* Profile Header */}
      <div className="relative h-48 bg-gradient-to-br from-primary/20 to-background">
        <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
          <Button variant="ghost" size="icon" className="rounded-full bg-background/20 backdrop-blur-md" onClick={() => window.history.back()}>
            <ChevronLeft size={24} />
          </Button>
        </header>
        
        <div className="absolute -bottom-16 left-6 flex items-end gap-4">
          <Avatar className="w-32 h-32 border-4 border-background shadow-xl rounded-[2.5rem]">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="px-6 pt-20 space-y-6">
        {/* Name and Bio */}
        <div className="space-y-1">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-display font-bold">{user.name}</h1>
              <p className="text-primary font-medium text-sm">@{user.username}</p>
            </div>
            {friendStatus === "friends" ? (
              <Button 
                variant="outline"
                className="rounded-xl h-10 px-6 font-bold"
                onClick={() => setFriendStatus("none")}
              >
                Remover
              </Button>
            ) : friendStatus === "requested" ? (
              <Button 
                variant="secondary"
                className="rounded-xl h-10 px-6 font-bold bg-muted"
                onClick={() => setFriendStatus("none")}
              >
                Solicitado
              </Button>
            ) : (
              <Button 
                className="rounded-xl h-10 px-6 font-bold"
                onClick={() => setFriendStatus(isPrivate ? "requested" : "friends")}
              >
                <UserPlus size={18} className="mr-2" /> Seguir
              </Button>
            )}
          </div>
          <p className="text-muted-foreground text-sm pt-2 leading-relaxed">
            {isPrivate && friendStatus !== "friends" ? "Este perfil é privado." : user.bio}
          </p>
        </div>

        {/* Stats Grid */}
        {(!isPrivate || friendStatus === "friends") ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 bg-card border-border rounded-2xl flex flex-col items-center text-center shadow-sm">
                <Trophy className="text-yellow-500 mb-1" size={20} />
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Desafios Vencidos</p>
                <p className="text-xl font-display font-bold">{user.stats.won}</p>
              </Card>
              <Card className="p-4 bg-card border-border rounded-2xl flex flex-col items-center text-center shadow-sm">
                <Flame className="text-orange-500 mb-1" size={20} />
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Reputação</p>
                <p className="text-xl font-display font-bold">{user.stats.reputation}/5</p>
              </Card>
              {user.showEarnings && (
                <Card className="p-4 bg-card border-border rounded-2xl flex flex-col items-center text-center shadow-sm col-span-2">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Ganho na Plataforma</p>
                  <p className="text-2xl font-display font-bold text-primary">{user.stats.earned}</p>
                </Card>
              )}
            </div>

            {/* Secondary Stats */}
            <div className="flex justify-around py-2 border-y border-border">
              <div className="text-center">
                <p className="text-lg font-bold">{user.stats.completed}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-medium">Completos</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{user.stats.moderations}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-medium">Moderações</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{friends.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-medium">Amigos</p>
              </div>
            </div>

            {/* Friends */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-display font-bold flex items-center gap-2">
                  <Users size={18} className="text-primary" /> Amigos em Comum
                </h3>
                <Link href="/friends">
                  <Button variant="link" size="sm" className="text-xs text-primary p-0">Ver todos</Button>
                </Link>
              </div>
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-4">
                  {friends.map((friend) => (
                    <Link key={friend.username} href={`/user/${friend.username}`}>
                      <div className="flex flex-col items-center gap-2 cursor-pointer">
                        <Avatar className="w-14 h-14 border-2 border-primary/10">
                          <AvatarImage src={friend.avatar} />
                          <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-[10px] font-medium text-center">{friend.name.split(' ')[0]}</span>
                      </div>
                    </Link>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="hidden" />
              </ScrollArea>
            </div>
          </>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <ShieldCheck size={40} className="text-muted-foreground" />
            </div>
            <div>
              <p className="font-display font-bold text-xl">Esta conta é privada</p>
              <p className="text-sm text-muted-foreground">Siga esta conta para ver suas fotos, vídeos e desafios.</p>
            </div>
          </div>
        )}

        {/* Suggestions */}
        <div className="space-y-4 pt-4">
          <h3 className="font-display font-bold">Sugestões para você</h3>
          <div className="space-y-3">
            {suggested.map((sug) => (
              <Link key={sug.username} href={`/user/${sug.username}`}>
                <div className="flex items-center justify-between p-3 bg-card rounded-2xl border border-border cursor-pointer hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={sug.avatar} />
                      <AvatarFallback>{sug.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-bold">{sug.name}</p>
                      <p className="text-[10px] text-muted-foreground">@{sug.username}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-lg h-8 text-xs font-bold border-primary text-primary hover:bg-primary/5" onClick={(e) => { e.preventDefault(); /* Prevent link navigation just to show button state change if wanted, or let it navigate */ }}>Seguir</Button>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}