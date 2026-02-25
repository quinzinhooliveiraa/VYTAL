import { ShieldAlert, AlertTriangle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Admin() {
  const flaggedCheckins = [
    {
      id: 1,
      user: "João P.",
      challenge: "30 Days CrossFit",
      time: "2 hours ago",
      reason: "GPS location mismatch (5km away from gym)",
      image: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=400&q=80"
    },
    {
      id: 2,
      user: "Ana L.",
      challenge: "Morning Runners",
      time: "5 hours ago",
      reason: "Suspicious image (possible photo of a screen)",
      image: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&q=80"
    }
  ];

  return (
    <div className="p-6 pb-32 space-y-8 bg-zinc-950 min-h-[100dvh]">
      <header className="pt-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-500 flex items-center justify-center">
          <ShieldAlert size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-red-50">Moderation</h1>
          <p className="text-sm text-red-500/70">Admin Access Only</p>
        </div>
      </header>

      <div className="space-y-4">
        <h2 className="text-lg font-medium flex items-center gap-2">
          <AlertTriangle size={18} className="text-yellow-500" />
          Flagged Check-ins ({flaggedCheckins.length})
        </h2>

        <div className="space-y-6">
          {flaggedCheckins.map(item => (
            <div key={item.id} className="border border-red-500/20 bg-red-500/5 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-red-500/10">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold">{item.user}</p>
                    <p className="text-xs text-muted-foreground">{item.challenge} • {item.time}</p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/20 text-red-400 text-xs font-medium border border-red-500/20">
                  <AlertTriangle size={12} />
                  {item.reason}
                </div>
              </div>
              
              <div className="h-48 bg-black relative">
                <img src={item.image} alt="Flagged" className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-full h-full border-4 border-red-500/50 absolute" />
                </div>
              </div>

              <div className="p-3 grid grid-cols-2 gap-3 bg-black/40">
                <Button variant="outline" className="text-red-400 border-red-500/30 hover:bg-red-500/20 hover:text-red-300 h-10">
                  <X className="mr-2" size={16} />
                  Reject & Eliminate
                </Button>
                <Button className="bg-white/10 text-white hover:bg-white/20 h-10">
                  <Check className="mr-2" size={16} />
                  Approve (False Alarm)
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}