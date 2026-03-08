import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { ChevronLeft, RefreshCcw, MapPin, CheckCircle, Camera, Timer, Ruler, Repeat, Zap, History, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CheckIn() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const [captured, setCaptured] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkinStep, setCheckinStep] = useState(1); // 1: Selfie Início, 2: Local Início, 3: Selfie Fim, 4: Local Fim
  const [startPhoto, setStartPhoto] = useState<string | null>(null);
  const [startPhotoBack, setStartPhotoBack] = useState<string | null>(null);
  const [endPhotoFront, setEndPhotoFront] = useState<string | null>(null);
  const [endPhotoBack, setEndPhotoBack] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [durationMins, setDurationMins] = useState<number>(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user");
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(localStorage.getItem("fitstake-camera-granted") === "true");
  
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

  const startCamera = async (facing: "user" | "environment" = cameraFacing) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: facing } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      if (!cameraPermissionGranted) {
        setCameraPermissionGranted(true);
        localStorage.setItem("fitstake-camera-granted", "true");
      }
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

  const handleFileUploadFallback = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (validationType === 'tempo') {
        if (checkinStep === 1) {
           setStartPhoto(url);
           setCameraFacing("environment");
           setCheckinStep(2);
        } else if (checkinStep === 2) {
           setStartPhotoBack(url);
           setStartTime(Date.now());
           setCheckinStep(3);
           setCaptured(false);
           setCameraFacing("user");
        } else if (checkinStep === 3) {
           setEndPhotoFront(url);
           setCameraFacing("environment");
           setCheckinStep(4);
        } else if (checkinStep === 4) {
           setEndPhotoBack(url);
           setPhotoUrl(url);
           if (startTime) {
             const diff = Math.floor((Date.now() - startTime) / 60000);
             setDurationMins(diff < 1 ? 45 : diff);
           }
           setCaptured(true);
        }
      } else {
        setPhotoUrl(url);
        setCaptured(true);
      }
    }
  };

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
        
        if (validationType === 'tempo') {
          if (checkinStep === 1) {
             setStartPhoto(url);
             setCameraFacing("environment");
             startCamera("environment");
             setCheckinStep(2);
          } else if (checkinStep === 2) {
             setStartPhotoBack(url);
             setStartTime(Date.now());
             setCheckinStep(3);
             setCaptured(false);
             setCameraFacing("user");
             stopCamera(); // Pause the camera until user is ready for end check-in
          } else if (checkinStep === 3) {
             setEndPhotoFront(url);
             setCameraFacing("environment");
             startCamera("environment");
             setCheckinStep(4);
          } else if (checkinStep === 4) {
             setEndPhotoBack(url);
             setPhotoUrl(url);
             if (startTime) {
               const diff = Math.floor((Date.now() - startTime) / 60000);
               setDurationMins(diff < 1 ? 45 : diff);
             }
             setCaptured(true);
          }
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
              className={`w-full h-full object-cover opacity-80 ${!cameraActive ? 'hidden' : ''}`}
            />
            {!cameraActive && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-800 text-white/50">
                <Camera size={48} className="mb-4 opacity-50" />
                <p className="text-sm font-medium">Toque para abrir a câmera</p>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none" />
            
            <div className="absolute top-1/4 px-6 text-center w-full pointer-events-none">
              <h2 className="text-2xl font-display font-bold mb-2 text-white drop-shadow-lg">
                {validationType === 'tempo' 
                  ? (checkinStep === 1 ? (!startPhoto ? 'Tire uma Selfie (Início)' : 'Tirando...') 
                      : checkinStep === 2 ? (!startPhotoBack ? 'Mostre o Local (Início)' : 'Tirando...')
                      : checkinStep === 3 ? (!endPhotoFront ? 'Tire uma Selfie (Fim)' : 'Tirando...')
                      : (!endPhotoBack ? 'Mostre o Local (Fim)' : 'Tirando...')) 
                  : `Check-in: ${modality}`}
              </h2>
              <p className="text-white font-mono uppercase tracking-widest text-[10px] bg-black/50 inline-block px-3 py-1 rounded-full">
                {validationType === 'tempo' 
                  ? (checkinStep === 1 ? 'Câmera Frontal' 
                      : checkinStep === 2 ? 'Câmera Traseira'
                      : checkinStep === 3 ? 'Câmera Frontal'
                      : 'Câmera Traseira') 
                 : validationType === 'distancia' ? 'Foto do painel com km percorridos' :
                 'Validação via Foto'}
              </p>
            </div>

            {validationType === 'tempo' && checkinStep > 1 && startPhoto && (
              <div className="absolute top-24 left-6 p-1 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md">
                <p className="text-[8px] text-primary font-bold mb-1 uppercase px-1">Selfie (Início)</p>
                <div className="w-20 h-28 rounded-lg overflow-hidden border border-white/20">
                  <img src={startPhoto} alt="Start Selfie" className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            {validationType === 'tempo' && checkinStep > 2 && startPhotoBack && (
              <div className="absolute top-24 right-6 p-1 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md">
                <p className="text-[8px] text-primary font-bold mb-1 uppercase px-1">Local (Início)</p>
                <div className="w-20 h-28 rounded-lg overflow-hidden border border-white/20">
                  <img src={startPhotoBack} alt="Start Location" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
            
            {validationType === 'tempo' && checkinStep > 3 && endPhotoFront && (
              <div className="absolute bottom-32 left-6 p-1 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md">
                <p className="text-[8px] text-primary font-bold mb-1 uppercase px-1">Selfie (Fim)</p>
                <div className="w-20 h-28 rounded-lg overflow-hidden border border-white/20">
                  <img src={endPhotoFront} alt="End Selfie" className="w-full h-full object-cover" />
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
            
            {(validationType === 'tempo' && endPhotoFront) && (
              <div className="absolute top-24 left-6 w-28 h-40 rounded-xl overflow-hidden border-2 border-white shadow-2xl">
                 <img src={endPhotoFront} alt="Selfie Fim" className="w-full h-full object-cover" />
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
                  const newFacing = cameraFacing === "user" ? "environment" : "user";
                  setCameraFacing(newFacing);
                  startCamera(newFacing);
                }
              }}
            >
              <RefreshCcw size={20} />
            </button>
            
            {validationType === 'tempo' && checkinStep === 3 ? (
               <div className="w-20 h-20" /> // Placeholder to keep spacing
            ) : cameraActive ? (
              <button 
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 relative group"
                onClick={handleCapture}
              >
                <div className="w-full h-full bg-white rounded-full group-active:scale-90 transition-transform" />
              </button>
            ) : (
              <div className="relative">
                 <input 
                   type="file" 
                   accept="image/*" 
                   capture={checkinStep === 1 ? "user" : "environment"} 
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                   onChange={handleFileUploadFallback} 
                 />
                 <button className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 relative group">
                  <div className="w-full h-full bg-white rounded-full group-active:scale-90 transition-transform" />
                </button>
              </div>
            )}
            
            <div className="w-12 h-12" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               {validationType === 'distancia' && (
                  <div className="space-y-4 col-span-2">
                    <div className="w-full h-32 bg-zinc-800 rounded-xl overflow-hidden relative border border-white/10">
                      <div className="absolute inset-0 opacity-50 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&q=80')] bg-cover bg-center" />
                      <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur rounded-lg p-2 flex justify-between items-center border border-white/10">
                         <div className="text-xs font-bold text-white flex items-center gap-1"><MapPin size={12} className="text-primary"/> Rota Rastreada</div>
                         <div className="text-primary font-bold text-lg">5.2 km</div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-white/60 text-[10px] uppercase font-bold">Distância Final (km)</Label>
                      <div className="relative">
                        <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={16} />
                        <Input type="number" step="0.1" value="5.2" readOnly className="h-14 bg-white/10 border-white/20 pl-10 text-xl font-display font-bold text-primary" />
                      </div>
                    </div>
                  </div>
               )}
               {validationType === 'tempo' && checkinStep === 2 && (
                  <div className="space-y-3 col-span-2">
                    <div className="space-y-1">
                      <Label className="text-white/60 text-[10px] uppercase font-bold">Duração (calculada automaticamente)</Label>
                      <div className="relative">
                        <Timer className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={16} />
                        <Input type="number" value={durationMins} readOnly className="h-14 bg-white/10 border-white/20 pl-10 text-xl font-display font-bold text-primary" />
                      </div>
                    </div>
                    
                    {durationMins < 10 && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2">
                        <ShieldAlert size={16} className="text-red-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-red-200 leading-relaxed">
                          <strong>Aviso de Moderação:</strong> Tempo de atividade suspeito. Este check-in será enviado para revisão da comunidade e poderá ser invalidado.
                        </p>
                      </div>
                    )}
                  </div>
               )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="h-14 flex-1 bg-transparent border-white/30 text-white hover:bg-white/10" onClick={() => {
                setCaptured(false);
                if (validationType === 'tempo') {
                  setCheckinStep(1);
                  setStartPhoto(null);
                  setStartPhotoBack(null);
                  setEndPhotoFront(null);
                  setEndPhotoBack(null);
                  setCameraFacing("user");
                  startCamera("user");
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