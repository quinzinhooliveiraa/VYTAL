import { ArrowDownLeft, ArrowUpRight, History, Settings, LogOut, Info, Moon, Sun, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { Switch } from "@/components/ui/switch";

export default function Profile() {
  const { theme, setTheme } = useTheme();

  const transactions = [
    { id: 1, type: "deposit", amount: "+ R$ 100,00", date: "Hoje, 10:24", status: "Concluído" },
    { id: 2, type: "stake", amount: "- R$ 50,00", date: "Hoje, 10:30", status: "Projeto Verão", challenge: true },
    { id: 3, type: "win", amount: "+ R$ 82,50", date: "12 Out, 2023", status: "Prêmio: Corrida 5k", challenge: true },
  ];

  return (
    <div className="p-6 pb-32 space-y-8">
      <header className="pt-4 flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Meu Perfil</h1>
        <Button variant="ghost" size="icon" className="rounded-full"><Settings size={20} /></Button>
      </header>

      <div className="flex items-center gap-4 bg-card border border-border p-4 rounded-3xl shadow-sm">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20 bg-muted flex items-center justify-center font-bold text-2xl text-foreground">AC</div>
        <div className="flex-1">
          <h2 className="font-bold text-lg">Alex Costa</h2>
          <div className="flex gap-2 items-center mt-1">
             <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Usuário Verificado</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
         <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <ShieldCheck className="text-primary mb-1" size={20} />
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Moderações</p>
            <p className="text-xl font-display font-bold">42</p>
         </div>
         <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="text-green-500 mb-1" size={20} />
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Precisão</p>
            <p className="text-xl font-display font-bold">98%</p>
         </div>
      </div>

      <div className="bg-foreground text-background dark:bg-zinc-900 dark:text-white rounded-3xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 blur-[50px] rounded-full" />
        <p className="text-background/70 dark:text-muted-foreground text-sm font-medium mb-2">Saldo em Conta</p>
        <h2 className="text-4xl font-display font-bold mb-6">R$ 132,50</h2>
        <div className="flex gap-3">
          <Button className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 border-none shadow-lg shadow-primary/20">Depositar</Button>
          <Button variant="outline" className="flex-1 h-12 rounded-xl bg-white/10 dark:bg-white/5 border-transparent text-background dark:text-white hover:bg-white/20 dark:hover:bg-white/10">Sacar Pix</Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium flex items-center gap-2"><History size={18} /> Histórico</h3>
        <div className="space-y-3">
          {transactions.map(tx => (
            <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'deposit' || tx.type === 'win' ? 'bg-primary/20 text-primary' : 'bg-muted text-foreground'}`}>
                  {tx.type === 'deposit' || tx.type === 'win' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                </div>
                <div>
                  <p className="font-medium text-sm">{tx.challenge ? tx.status : tx.type === 'deposit' ? 'Depósito Pix' : 'Saque Pix'}</p>
                  <p className="text-[10px] text-muted-foreground">{tx.date}</p>
                </div>
              </div>
              <p className={`font-display font-bold ${tx.type === 'deposit' || tx.type === 'win' ? 'text-primary' : 'text-foreground'}`}>{tx.amount}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-3">{theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}<span>Modo Escuro</span></div>
          <Switch checked={theme === 'dark'} onCheckedChange={(c) => setTheme(c ? 'dark' : 'light')} />
        </div>
        <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 h-14 rounded-2xl"><LogOut className="mr-2" size={20} /> Sair da Conta</Button>
      </div>
    </div>
  );
}