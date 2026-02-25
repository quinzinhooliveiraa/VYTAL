import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { ChevronLeft, RefreshCcw, MapPin, CheckCircle, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CheckIn() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const [captured, setCaptured] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Simulate fetching challenge data to know modality
  const [modality, setModality] = useState("academia"); // can be "corrida", "academia", etc.

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
    <div className="min-h-[100dvh] flex flex-col bg-black text-white">
      <header className="px-6 py-6 flex items-center justify-between absolute top-0 left-0 right-0 z-50">
        <button onClick={() => setLocation(`/challenge/${id}`)} className="p-2 -ml-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
          <ChevronLeft size={24} />
        </button>
        <div className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-1.5 text-xs font-semibold">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          GPS Ativo
        </div>
      </header>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-zinc-900">
        {!captured ? (
          <>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <Camera size={48} className="text-white/20 mb-4" />
              <p className="text-white/60 font-mono uppercase tracking-widest text-sm text-center">
                {modality === 'corrida' ? 'Tire foto do App/Painel' : 'Câmera Frontal Ativa'}
                <br/>
                <span className="text-[10px] opacity-70">
                  {modality === 'corrida' ? 'Mostre a distância percorrida' : 'Mostre você na academia'}
                </span>
              </p>
            </div>
            {/* Grid overlay for camera feel */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iMzMuMzMlIiBoZWlnaHQ9IjMzLjMzJSI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] pointer-events-none opacity-50" />
          </>
        ) : (
          <div className="absolute inset-0">
            <img 
              src={modality === 'corrida' ? "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80" : "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80"} 
              alt="Captured" 
              className="w-full h-full object-cover opacity-90" 
            />
            
            {/* BeReal style secondary camera inset (only for academia/custom) */}
            {modality !== 'corrida' && (
              <div className="absolute top-24 left-6 w-28 h-40 rounded-xl overflow-hidden border-2 border-white shadow-2xl">
                 <img src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80" alt="Selfie" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
            
            {/* Timestamp Overlay */}
            <div className="absolute bottom-6 left-6 text-shadow-sm">
              <p className="text-3xl font-display font-bold tracking-tighter">08:42 AM</p>
              <div className="flex items-center gap-1 text-sm opacity-80">
                <MapPin size={12} /> {modality === 'corrida' ? 'Parque Ibirapuera' : 'Smart Fit Centro'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Check-in Actions Panel */}
      <div className={`bg-black px-6 pb-safe relative z-20 transition-all ${captured ? 'pt-6 pb-8' : 'h-32 flex items-center justify-center'}`}>
        {!captured ? (
          <div className="flex items-center justify-center gap-8 w-full">
            <button className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <RefreshCcw size={20} />
            </button>
            <button 
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 relative group"
              onClick={handleCapture}
            >
              <div className="w-full h-full bg-white rounded-full group-active:scale-90 transition-transform" />
            </button>
            <div className="w-12 h-12" /> {/* Spacer to center the button */}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Dynamic fields based on modality */}
            {modality === 'corrida' && (
              <div className="space-y-2 animate-in slide-in-from-bottom-4">
                <Label className="text-white/80">Distância Percorrida (km)</Label>
                <Input type="number" placeholder="Ex: 5.2" className="h-14 bg-white/10 border-white/20 text-white text-lg" />
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="h-14 bg-transparent border-white/30 text-white hover:bg-white/10" onClick={() => setCaptured(false)}>
                Refazer Foto
              </Button>
              <Button 
                className="flex-1 h-14 rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  "Enviando..."
                ) : (
                  <>
                    <CheckCircle className="mr-2" size={20} />
                    Confirmar
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}