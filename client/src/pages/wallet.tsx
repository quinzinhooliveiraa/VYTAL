import { ArrowDownLeft, ArrowUpRight, History, Info, Eye, EyeOff, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Wallet() {
  const [showEarnings, setShowEarnings] = useState(true);

  const transactions = [
    { id: 1, type: "deposit", amount: "+ R$ 100,00", date: "Hoje, 10:24", status: "Concluído" },
    { id: 2, type: "stake", amount: "- R$ 50,00", date: "Hoje, 10:30", status: "Projeto Verão", challenge: true },
    { id: 3, type: "win", amount: "+ R$ 82,50", date: "12 Out, 2023", status: "Prêmio: Corrida 5k", challenge: true },
  ];

  return (
    <div className="p-6 pb-32 space-y-8">
      <header className="pt-4">
        <h1 className="text-2xl font-display font-bold">Minha Carteira</h1>
      </header>

      {/* Balance Card */}
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
          <Button className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 border-none shadow-lg shadow-primary/20">
            <ArrowDownLeft className="mr-2" size={18} />
            Depositar
          </Button>
          <Button variant="outline" className="flex-1 h-12 rounded-xl bg-white/10 dark:bg-white/5 border-transparent text-background dark:text-white hover:bg-white/20 dark:hover:bg-white/10">
            <ArrowUpRight className="mr-2" size={18} />
            Sacar Pix
          </Button>
        </div>
      </div>

      {/* Pix Quick Deposit */}
      <div className="glass-card rounded-3xl p-5 border-dashed border-primary/30 bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-sm">Depósito Rápido via Pix</h3>
          <img src="https://logospng.org/download/pix/logo-pix-icone-512.png" alt="Pix" className="h-4 opacity-80 grayscale invert dark:invert-0" />
        </div>
        
        <div className="bg-muted rounded-xl p-4 flex items-center justify-between border border-border">
          <p className="font-mono text-[10px] text-muted-foreground truncate mr-4">00020126360014BR.GOV.BCB.PIX0114+5511999999999520400005303986540410.005802BR5913Alex Costa6009Sao Paulo62070503***6304FC6E</p>
          <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-primary hover:bg-primary/10">
            <Copy size={16} />
          </Button>
        </div>
      </div>

      <div className="px-4 py-3 rounded-xl bg-primary/5 border border-primary/20 text-[11px] text-primary flex items-center gap-2">
        <Info size={16} className="shrink-0" />
        <p>Lembre-se: A plataforma retém <strong>10%</strong> apenas sobre o prêmio final dos desafios. Depósitos e saques são isentos de taxas.</p>
      </div>

      {/* History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2"><History size={18} /> Histórico Completo</h3>
        </div>

        <div className="space-y-3">
          {transactions.map(tx => (
            <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  tx.type === 'deposit' || tx.type === 'win' ? 'bg-primary/20 text-primary' : 'bg-muted text-foreground'
                }`}>
                  {tx.type === 'deposit' || tx.type === 'win' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                </div>
                <div>
                  <p className="font-bold text-sm">{tx.challenge ? tx.status : tx.type === 'deposit' ? 'Depósito Pix' : 'Saque Pix'}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">{tx.date}</p>
                </div>
              </div>
              <p className={`font-display font-bold ${tx.type === 'deposit' || tx.type === 'win' ? 'text-primary' : 'text-foreground'}`}>
                {tx.amount}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}