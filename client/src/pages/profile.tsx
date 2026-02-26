import { ArrowDownLeft, ArrowUpRight, History, Settings, LogOut, Info, Moon, Sun, ShieldCheck, CheckCircle2, User, Camera, Wallet, Eye, EyeOff, Smartphone, Palette, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";

export default function Profile() {
  const { theme, setTheme } = useTheme();
  const [showEarnings, setShowEarnings] = useState(true);
  const [activeTab, setActiveTab] = useState("wallet");

  const transactions = [
    { id: 1, type: "deposit", amount: "+ R$ 100,00", date: "Hoje, 10:24", status: "Concluído" },
    { id: 2, type: "stake", amount: "- R$ 50,00", date: "Hoje, 10:30", status: "Projeto Verão", challenge: true },
    { id: 3, type: "win", amount: "+ R$ 82,50", date: "12 Out, 2023", status: "Prêmio: Corrida 5k", challenge: true },
  ];

  return (
    <div className="pb-32">
      <header className="px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <h1 className="text-2xl font-display font-bold">Configurações</h1>
        <div className="flex gap-2">
          <Link href="/user/alex_costa">
             <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold border-primary text-primary hover:bg-primary/5">Ver Perfil Público</Button>
          </Link>
        </div>
      </header>

      <div className="px-6 space-y-8">
        {/* User Quick Edit */}
        <div className="flex items-center gap-4 bg-card border border-border p-5 rounded-[2rem] shadow-sm group">
          <div className="relative">
            <Avatar className="w-20 h-20 border-2 border-primary/20">
              <AvatarImage src="https://i.pravatar.cc/150?u=alex_costa" />
              <AvatarFallback>AC</AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full shadow-lg">
              <Camera size={14} />
            </button>
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg leading-none">Alex Costa</h2>
            </div>
            <p className="text-sm text-muted-foreground">@alex_costa</p>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] font-bold">PREMIUM</Badge>
          </div>
        </div>

        {/* Tabs for Organization */}
        <Tabs defaultValue="wallet" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 h-12 rounded-xl bg-muted p-1 mb-6">
            <TabsTrigger value="wallet" className="rounded-lg font-bold flex gap-2">
              <Wallet size={16} /> Carteira
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg font-bold flex gap-2">
              <Settings size={16} /> Ajustes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wallet" className="space-y-6">
             {/* Wallet / Balance Card */}
            <div className="bg-foreground text-background dark:bg-zinc-900 dark:text-white rounded-[2rem] p-6 relative overflow-hidden shadow-xl">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 blur-[50px] rounded-full" />
              <div className="flex justify-between items-start mb-2">
                <p className="text-background/70 dark:text-muted-foreground text-sm font-medium">Saldo Disponível</p>
                <button onClick={() => setShowEarnings(!showEarnings)} className="text-background/50 dark:text-white/30">
                  {showEarnings ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
              <h2 className="text-4xl font-display font-bold mb-6">
                {showEarnings ? "R$ 132,50" : "••••••"}
              </h2>
              <div className="flex gap-3">
                <Button className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 border-none shadow-lg shadow-primary/20">Depositar</Button>
                <Button variant="outline" className="flex-1 h-12 rounded-xl bg-white/10 dark:bg-white/5 border-transparent text-background dark:text-white hover:bg-white/20 dark:hover:bg-white/10">Sacar Pix</Button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs text-primary flex items-center gap-2">
              <Info size={16} className="shrink-0" />
              <p>A taxa de <strong>10%</strong> é aplicada apenas sobre o prêmio total dos desafios ganhos.</p>
            </div>

            {/* History */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-2"><History size={16} /> Extrato Recente</h3>
              <div className="space-y-3">
                {transactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'deposit' || tx.type === 'win' ? 'bg-primary/20 text-primary' : 'bg-muted text-foreground'}`}>
                        {tx.type === 'deposit' || tx.type === 'win' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{tx.challenge ? tx.status : tx.type === 'deposit' ? 'Depósito Pix' : 'Saque Pix'}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">{tx.date}</p>
                      </div>
                    </div>
                    <p className={`font-display font-bold ${tx.type === 'deposit' || tx.type === 'win' ? 'text-primary' : 'text-foreground'}`}>{tx.amount}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-8">
            {/* Account Settings */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground px-2">Perfil Privado</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="px-2 text-xs">Nome de Exibição</Label>
                  <Input defaultValue="Alex Costa" className="h-12 rounded-xl bg-card border-border" />
                </div>
                <div className="space-y-2">
                  <Label className="px-2 text-xs">Username</Label>
                  <Input defaultValue="@alex_costa" className="h-12 rounded-xl bg-card border-border" />
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground px-2">Preferências</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-3"><Palette size={18} className="text-primary" /><span>Tema Visual</span></div>
                  <div className="flex bg-muted p-1 rounded-lg gap-1">
                    <button onClick={() => setTheme("light")} className={`p-1.5 rounded-md ${theme === 'light' ? 'bg-background shadow-sm' : 'opacity-50'}`}><Sun size={14} /></button>
                    <button onClick={() => setTheme("dark")} className={`p-1.5 rounded-md ${theme === 'dark' ? 'bg-background shadow-sm' : 'opacity-50'}`}><Moon size={14} /></button>
                    <button onClick={() => setTheme("system")} className={`p-1.5 rounded-md ${theme === 'system' ? 'bg-background shadow-sm' : 'opacity-50'}`}><Smartphone size={14} /></button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-3"><CreditCard size={18} className="text-primary" /><span>Configuração Pix</span></div>
                  <Button variant="link" size="sm" className="text-primary text-xs h-auto p-0">Alterar Chave</Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-3"><Eye size={18} className="text-primary" /><span>Visibilidade de Ganhos</span></div>
                  <Switch checked={showEarnings} onCheckedChange={setShowEarnings} />
                </div>
              </div>
            </div>

            <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 h-14 rounded-2xl font-bold">
              <LogOut className="mr-2" size={20} /> Sair da Conta
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}