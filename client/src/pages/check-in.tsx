import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { ChevronLeft, Camera, RefreshCcw, MapPin, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckIn() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const [captured, setCaptured] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleCapture = () => {
    setCaptured(true);
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setLocation(`/challenge/${id}`);
    }, 1500);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-black">
      <header className="px-6 py-6 flex items-center justify-between absolute top-0 left-0 right-0 z-50">
        <button onClick={() => setLocation(`/challenge/${id}`)} className="p-2 -ml-2 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10">
          <ChevronLeft size={24} />
        </button>
        <div className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-1.5 text-xs font-semibold">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          GPS Active
        </div>
      </header>

      <div className="flex-1 relative bg-zinc-900 flex items-center justify-center overflow-hidden">
        {/* Mock Camera View */}
        {!captured ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted-foreground font-mono uppercase tracking-widest text-sm text-center">
              Front Camera Active<br/>
              <span className="text-[10px] opacity-50">Show yourself at the gym</span>
            </p>
            {/* Grid overlay for camera feel */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iMzMuMzMlIiBoZWlnaHQ9IjMzLjMzJSI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] pointer-events-none" />
          </div>
        ) : (
          <div className="absolute inset-0">
            <img src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80" alt="Captured" className="w-full h-full object-cover opacity-80" />
            
            {/* BeReal style back camera inset */}
            <div className="absolute top-24 left-6 w-32 h-44 rounded-2xl overflow-hidden border-2 border-white shadow-2xl">
               <img src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80" alt="Gym" className="w-full h-full object-cover" />
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          </div>
        )}

        {/* Timestamp Overlay */}
        <div className="absolute bottom-32 left-6 text-white text-shadow-sm">
          <p className="text-3xl font-display font-bold tracking-tighter">08:42 AM</p>
          <div className="flex items-center gap-1 text-sm opacity-80">
            <MapPin size={12} /> Smart Fit Centro
          </div>
        </div>
      </div>

      <div className="h-32 bg-black px-6 flex items-center justify-center gap-6 pb-safe relative z-20">
        {!captured ? (
          <>
            <button className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
              <RefreshCcw size={20} />
            </button>
            <button 
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1"
              onClick={handleCapture}
            >
              <div className="w-full h-full bg-white rounded-full active:scale-95 transition-transform" />
            </button>
            <div className="w-12 h-12" /> {/* Spacer */}
          </>
        ) : (
          <>
            <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => setCaptured(false)}>
              Retake
            </Button>
            <Button 
              className="flex-1 h-14 rounded-2xl bg-primary text-black font-bold text-lg shadow-[0_0_20px_rgba(34,197,94,0.3)]"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                "Verifying..."
              ) : (
                <>
                  <CheckCircle className="mr-2" size={20} />
                  Submit Check-in
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}