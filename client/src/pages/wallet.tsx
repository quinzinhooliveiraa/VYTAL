import { ArrowDownLeft, ArrowUpRight, Copy, History } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Wallet() {
  const transactions = [
    { id: 1, type: "deposit", amount: "+ R$ 100,00", date: "Today, 10:24 AM", status: "Completed" },
    { id: 2, type: "stake", amount: "- R$ 50,00", date: "Today, 10:30 AM", status: "30 Days CrossFit", challenge: true },
    { id: 3, type: "win", amount: "+ R$ 82,50", date: "Oct 12, 2023", status: "Prize: Morning Runners", challenge: true },
  ];

  return (
    <div className="p-6 pb-32 space-y-8">
      <header className="pt-4">
        <h1 className="text-2xl font-display font-bold">Wallet</h1>
      </header>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 blur-[50px] rounded-full" />
        
        <p className="text-muted-foreground text-sm font-medium mb-2">Available Balance</p>
        <h2 className="text-4xl font-display font-bold text-white mb-6">R$ 132,50</h2>

        <div className="flex gap-3">
          <Button className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90">
            <ArrowDownLeft className="mr-2" size={18} />
            Deposit via Pix
          </Button>
          <Button variant="outline" className="flex-1 h-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 text-white">
            <ArrowUpRight className="mr-2" size={18} />
            Withdraw
          </Button>
        </div>
      </div>

      {/* Pix Deposit Simulation */}
      <div className="glass-card rounded-3xl p-5 border-dashed border-primary/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold">Quick Deposit</h3>
          <img src="https://logospng.org/download/pix/logo-pix-icone-512.png" alt="Pix" className="h-5 opacity-80 grayscale invert" />
        </div>
        
        <div className="bg-black/50 rounded-xl p-4 flex items-center justify-between border border-white/5">
          <p className="font-mono text-xs text-muted-foreground truncate mr-4">00020126360014BR.GOV.BCB.PIX0114+5511999999999520400005303986540410.005802BR5913Alex Costa6009Sao Paulo62070503***6304FC6E</p>
          <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-primary">
            <Copy size={16} />
          </Button>
        </div>
      </div>

      {/* Fee Explanation */}
      <div className="px-4 py-3 rounded-xl bg-muted/50 border border-white/5 text-xs text-muted-foreground text-center">
        <p>FitStake retains a <strong>10% fee</strong> on challenge prize pools for platform maintenance and moderation. Deposits and withdrawals are free.</p>
      </div>

      {/* History */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <History size={18} />
          <h3 className="font-medium">Recent Transactions</h3>
        </div>

        <div className="space-y-3">
          {transactions.map(tx => (
            <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  tx.type === 'deposit' || tx.type === 'win' ? 'bg-primary/20 text-primary' : 'bg-white/10 text-white'
                }`}>
                  {tx.type === 'deposit' || tx.type === 'win' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                </div>
                <div>
                  <p className="font-medium text-sm">{tx.challenge ? tx.status : tx.type === 'deposit' ? 'Pix Deposit' : 'Withdrawal'}</p>
                  <p className="text-xs text-muted-foreground">{tx.date}</p>
                </div>
              </div>
              <p className={`font-display font-bold ${tx.type === 'deposit' || tx.type === 'win' ? 'text-primary' : 'text-white'}`}>
                {tx.amount}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}