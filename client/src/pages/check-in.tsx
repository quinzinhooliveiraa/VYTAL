import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { ChevronLeft, RefreshCcw, MapPin, CheckCircle, Camera, Timer, Ruler, Repeat, Zap, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CheckIn() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const [captured, setCaptured] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkinStep, setCheckinStep] = useState(1); // 1 for start, 2 for end (time based)
  const [startPhoto, setStartPhoto] = useState<string | null>(null);
  
  // Mock modality and validation type
  const [modality, setModality] = useState("academia"); 
  const [validationType, setValidationType] = useState("tempo");

  const handleCapture = () => {
    if (validationType === 'tempo' && checkinStep === 1) {
      setStartPhoto("https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80");
      setCheckinStep(2);
      setCaptured(false);
    } else {
      setCaptured(true);
    }
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
          {validationType === 'tempo' ? `PASSO ${checkinStep}/2` : 'GPS Ativo'}
        </div>
      </header>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-zinc-900">
        {!captured ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6 text-center">
            {validationType === 'foto' ? <Camera size={48} className="text-white/20 mb-4" /> : <Zap size={48} className="text-white/20 mb-4" />}
            <h2 className="text-xl font-display font-bold mb-2">
              {validationType === 'tempo' ? (checkinStep === 1 ? 'Foto Início' : 'Foto Término') : `Check-in: ${modality}`}
            </h2>
            <p className="text-white/60 font-mono uppercase tracking-widest text-[10px]">
              {validationType === 'tempo' ? 'Apenas câmera ao vivo - Sem galeria' : 
               validationType === 'distancia' ? 'Foto do painel com km percorridos' :
               'Validação via Foto'}
            </p>
            {validationType === 'tempo' && checkinStep === 2 && startPhoto && (
              <div className="mt-4 p-2 bg-white/5 rounded-xl border border-white/10">
                <p className="text-[10px] text-primary font-bold mb-2 uppercase">Início capturado às 08:00 AM</p>
                <div className="w-24 h-32 rounded-lg overflow-hidden border border-white/20 opacity-50">
                  <img src={startPhoto} alt="Start" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="absolute inset-0">
            <img 
              src={modality === 'corrida' ? "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80" : "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80"} 
              alt="Captured" 
              className="w-full h-full object-cover opacity-90" 
            />
            
            <div className="absolute top-24 left-6 w-28 h-40 rounded-xl overflow-hidden border-2 border-white shadow-2xl">
               <img src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80" alt="Selfie" className="w-full h-full object-cover" />
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
            
            <div className="absolute bottom-6 left-6 text-shadow-sm">
              <p className="text-3xl font-display font-bold tracking-tighter">08:42 AM</p>
              <div className="flex items-center gap-1 text-sm opacity-80 font-medium">
                <MapPin size={12} /> {modality === 'corrida' ? 'Parque Ibirapuera' : 'Smart Fit Centro'}
              </div>
            </div>
          </div>
        )}
      </div>

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
            <div className="w-12 h-12" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               {validationType === 'distancia' && (
                  <div className="space-y-1 col-span-2">
                    <Label className="text-white/60 text-[10px] uppercase font-bold">Distância (km)</Label>
                    <div className="relative">
                      <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={16} />
                      <Input type="number" step="0.1" placeholder="Ex: 5.0" className="h-14 bg-white/10 border-white/20 pl-10 text-xl font-display font-bold" />
                    </div>
                  </div>
               )}
               {validationType === 'tempo' && checkinStep === 2 && (
                  <div className="space-y-1 col-span-2">
                    <Label className="text-white/60 text-[10px] uppercase font-bold">Duração (minutos)</Label>
                    <div className="relative">
                      <Timer className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={16} />
                      <Input type="number" placeholder="Ex: 45" className="h-14 bg-white/10 border-white/20 pl-10 text-xl font-display font-bold" />
                    </div>
                  </div>
               )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="h-14 flex-1 bg-transparent border-white/30 text-white hover:bg-white/10" onClick={() => {
                setCaptured(false);
                if (validationType === 'tempo') {
                  setCheckinStep(1);
                  setStartPhoto(null);
                }
              }}>Refazer</Button>
              <Button className="flex-[2] h-14 rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-[0_0_20px_rgba(34,197,94,0.3)] border-none" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Enviando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}