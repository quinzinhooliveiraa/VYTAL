import React, { useState, useEffect } from "react";
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
  const [cameraActive, setCameraActive] = useState(false);
  
  // Mock modality and validation type
  const [modality, setModality] = useState("academia"); 
  const [validationType, setValidationType] = useState("tempo");

  const [userLocation, setUserLocation] = useState<string>("Buscando localização...");
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation(`Lat: ${position.coords.latitude.toFixed(2)}, Lng: ${position.coords.longitude.toFixed(2)}`);
        },
        () => {
          setUserLocation("Localização não autorizada");
        }
      );
    } else {
      setUserLocation("GPS não suportado");
    }
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: checkinStep === 1 ? "user" : "environment" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      alert("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  // Auto-start camera when not captured
  useEffect(() => {
    if (!captured) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [captured, checkinStep]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const url = canvas.toDataURL('image/jpeg');
        
        if (validationType === 'tempo' && checkinStep === 1) {
          setStartPhoto(url);
          setCheckinStep(2);
          setCaptured(false);
        } else {
          setPhotoUrl(url);
          setCaptured(true);
        }
      }
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
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 w-full h-full">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover opacity-80"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none" />
            
            <div className="absolute top-1/4 px-6 text-center w-full pointer-events-none">
              <h2 className="text-2xl font-display font-bold mb-2 text-white drop-shadow-lg">
                {validationType === 'tempo' ? (checkinStep === 1 ? 'Tire uma Selfie' : 'Mostre o Local') : `Check-in: ${modality}`}
              </h2>
              <p className="text-white font-mono uppercase tracking-widest text-[10px] bg-black/50 inline-block px-3 py-1 rounded-full">
                {validationType === 'tempo' ? (checkinStep === 1 ? 'Câmera Frontal' : 'Câmera Traseira') : 
                 validationType === 'distancia' ? 'Foto do painel com km percorridos' :
                 'Validação via Foto'}
              </p>
            </div>

            {validationType === 'tempo' && checkinStep === 2 && startPhoto && (
              <div className="absolute top-24 left-6 p-1 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md">
                <p className="text-[8px] text-primary font-bold mb-1 uppercase px-1">Selfie Início</p>
                <div className="w-20 h-28 rounded-lg overflow-hidden border border-white/20">
                  <img src={startPhoto} alt="Start" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="absolute inset-0">
            <img 
              src={photoUrl} 
              alt="Captured" 
              className="w-full h-full object-cover opacity-90" 
            />
            
            {(validationType === 'tempo' && startPhoto) && (
              <div className="absolute top-24 left-6 w-28 h-40 rounded-xl overflow-hidden border-2 border-white shadow-2xl">
                 <img src={startPhoto} alt="Selfie" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
            
            <div className="absolute bottom-6 left-6 text-shadow-sm">
              <p className="text-3xl font-display font-bold tracking-tighter">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <div className="flex items-center gap-1 text-sm opacity-80 font-medium">
                <MapPin size={12} /> {userLocation}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={`bg-black px-6 pb-safe relative z-20 transition-all ${captured ? 'pt-6 pb-8' : 'h-32 flex items-center justify-center'}`}>
        {!captured ? (
          <div className="flex items-center justify-center gap-8 w-full">
            <button 
              className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              onClick={() => {
                if (validationType === 'tempo') {
                  setCheckinStep(prev => prev === 1 ? 2 : 1);
                }
              }}
            >
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