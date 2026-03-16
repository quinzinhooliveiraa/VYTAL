import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ChevronLeft, Camera, MapPin, Timer, Flame, Ruler, Play, Square, RotateCcw, CheckCircle, AlertTriangle, Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type Phase = "ready" | "start-photo" | "tracking" | "end-photo" | "review" | "submitting" | "done";

interface GpsPoint {
  lat: number;
  lng: number;
  timestamp: number;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateCalories(durationMins: number, distanceKm: number, sport: string): number {
  const weightKg = 70;
  let metValue = 5;
  const s = sport.toLowerCase();
  if (s.includes("corr") || s.includes("run")) metValue = 9.8;
  else if (s.includes("caminh") || s.includes("walk")) metValue = 3.8;
  else if (s.includes("ciclism") || s.includes("bike") || s.includes("pedal")) metValue = 7.5;
  else if (s.includes("nat") || s.includes("swim")) metValue = 8;
  else if (s.includes("muscula") || s.includes("academia") || s.includes("gym") || s.includes("crossfit")) metValue = 6;
  else if (s.includes("yoga") || s.includes("pilates")) metValue = 3;
  else if (s.includes("futebol") || s.includes("soccer") || s.includes("basquet") || s.includes("basket")) metValue = 8;
  else if (s.includes("luta") || s.includes("box") || s.includes("mma") || s.includes("jiu")) metValue = 9;
  const hours = durationMins / 60;
  return Math.round(metValue * weightKg * hours);
}

function formatPace(durationMins: number, distanceKm: number): string {
  if (distanceKm < 0.01) return "--";
  const pace = durationMins / distanceKm;
  const mins = Math.floor(pace);
  const secs = Math.round((pace - mins) * 60);
  return `${mins}'${secs.toString().padStart(2, "0")}"`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

async function uploadPhoto(blob: Blob): Promise<string> {
  const res = await fetch("/api/upload/checkin-photo", {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: blob,
    credentials: "include",
  });
  if (!res.ok) throw new Error("Upload falhou");
  const data = await res.json();
  return data.url;
}

export default function CheckIn() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: challenge } = useQuery({
    queryKey: ["/api/challenges", id],
    queryFn: () => apiRequest("GET", `/api/challenges/${id}`).then(r => r.json()),
  });

  const [phase, setPhase] = useState<Phase>("ready");
  const [startPhoto, setStartPhoto] = useState<Blob | null>(null);
  const [startPhotoUrl, setStartPhotoUrl] = useState<string>("");
  const [endPhoto, setEndPhoto] = useState<Blob | null>(null);
  const [endPhotoUrl, setEndPhotoUrl] = useState<string>("");
  const [startCoords, setStartCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [endCoords, setEndCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsTrack, setGpsTrack] = useState<GpsPoint[]>([]);
  const [distanceKm, setDistanceKm] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [locationName, setLocationName] = useState("Obtendo localização...");
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user");
  const [gpsError, setGpsError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const sport = challenge?.sport || "";
  const isGymType = /academia|gym|muscula|crossfit|yoga|pilates|luta|box|mma|jiu/i.test(sport);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationName(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        setGpsAccuracy(pos.coords.accuracy);
        setGpsError(null);
      },
      (err) => {
        setGpsError("Ative a localização para fazer check-in");
        setLocationName("Localização indisponível");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const startCamera = useCallback(async (facing: "user" | "environment") => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      setCameraStream(stream);
      setCameraFacing(facing);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      toast({ title: "Erro", description: "Não foi possível acessar a câmera. Verifique as permissões.", variant: "destructive" });
    }
  }, [cameraStream, toast]);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
  }, [cameraStream]);

  const capturePhoto = useCallback((): Blob | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    if (cameraFacing === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    let blob: Blob | null = null;
    canvas.toBlob(b => { blob = b; }, "image/jpeg", 0.85);
    return null;
  }, [cameraFacing]);

  const capturePhotoAsync = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!videoRef.current || !canvasRef.current) return reject("No camera");
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject("No context");
      if (cameraFacing === "user") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0);
      canvas.toBlob(
        (b) => { if (b) resolve(b); else reject("Capture failed"); },
        "image/jpeg",
        0.85
      );
    });
  }, [cameraFacing]);

  const startGpsTracking = useCallback(() => {
    if (watchIdRef.current !== null) return;
    const wid = navigator.geolocation.watchPosition(
      (pos) => {
        const point: GpsPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: Date.now(),
        };
        setGpsAccuracy(pos.coords.accuracy);
        setGpsTrack(prev => {
          const newTrack = [...prev, point];
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            const segmentDist = haversineDistance(last.lat, last.lng, point.lat, point.lng);
            if (segmentDist > 0.005 && pos.coords.accuracy < 50) {
              setDistanceKm(d => d + segmentDist);
            }
          }
          return newTrack;
        });
      },
      (err) => {
        console.warn("GPS tracking error:", err.message);
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
    watchIdRef.current = wid;
  }, []);

  const stopGpsTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (phase === "tracking" && startTime) {
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, startTime]);

  useEffect(() => {
    return () => {
      stopCamera();
      stopGpsTracking();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStartPhase = async () => {
    setPhase("start-photo");
    await startCamera("user");
  };

  const handleTakeStartPhoto = async () => {
    try {
      const blob = await capturePhotoAsync();
      setStartPhoto(blob);
      setStartPhotoUrl(URL.createObjectURL(blob));

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setStartCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationName(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        },
        () => {},
        { enableHighAccuracy: true }
      );

      stopCamera();
      setPhase("tracking");
      setStartTime(Date.now());
      if (!isGymType) {
        startGpsTracking();
      }
    } catch (err) {
      toast({ title: "Erro ao capturar foto", variant: "destructive" });
    }
  };

  const handleFinishActivity = async () => {
    stopGpsTracking();
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("end-photo");
    await startCamera("user");
  };

  const handleTakeEndPhoto = async () => {
    try {
      const blob = await capturePhotoAsync();
      setEndPhoto(blob);
      setEndPhotoUrl(URL.createObjectURL(blob));

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setEndCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {},
        { enableHighAccuracy: true }
      );

      stopCamera();
      setPhase("review");
    } catch (err) {
      toast({ title: "Erro ao capturar foto", variant: "destructive" });
    }
  };

  const handleSubmit = async () => {
    if (!startPhoto || !endPhoto) {
      toast({ title: "Fotos obrigatórias", variant: "destructive" });
      return;
    }
    setPhase("submitting");
    try {
      const [startUrl, endUrl] = await Promise.all([
        uploadPhoto(startPhoto),
        uploadPhoto(endPhoto),
      ]);

      const durationMins = Math.max(1, Math.round(elapsedSeconds / 60));
      const calories = estimateCalories(durationMins, distanceKm, sport);
      const pace = !isGymType && distanceKm > 0.01 ? formatPace(durationMins, distanceKm) : null;

      await apiRequest("POST", "/api/check-ins", {
        challengeId: id,
        photoUrl: startUrl,
        endPhotoUrl: endUrl,
        latitude: startCoords?.lat?.toString() || null,
        longitude: startCoords?.lng?.toString() || null,
        endLatitude: endCoords?.lat?.toString() || null,
        endLongitude: endCoords?.lng?.toString() || null,
        distanceKm: distanceKm.toFixed(3),
        durationMins,
        caloriesBurned: calories,
        avgPace: pace,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/check-ins", id] });
      setPhase("done");
      toast({ title: "Check-in registrado!", description: "Sua atividade foi salva com sucesso." });
      setTimeout(() => setLocation(`/challenge/${id}`), 2000);
    } catch (err: any) {
      toast({ title: "Erro ao enviar check-in", description: err.message, variant: "destructive" });
      setPhase("review");
    }
  };

  const handleReset = () => {
    stopCamera();
    stopGpsTracking();
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("ready");
    setStartPhoto(null);
    setStartPhotoUrl("");
    setEndPhoto(null);
    setEndPhotoUrl("");
    setStartCoords(null);
    setEndCoords(null);
    setGpsTrack([]);
    setDistanceKm(0);
    setElapsedSeconds(0);
    setStartTime(null);
  };

  const durationMins = Math.max(1, Math.round(elapsedSeconds / 60));
  const calories = estimateCalories(durationMins, distanceKm, sport);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-black text-white">
      <canvas ref={canvasRef} className="hidden" />

      <header className="absolute top-0 left-0 right-0 z-50 px-4 py-4 flex items-center justify-between safe-area-top">
        <button
          onClick={() => {
            stopCamera();
            stopGpsTracking();
            setLocation(`/challenge/${id}`);
          }}
          className="p-2.5 rounded-full bg-black/50 backdrop-blur-xl border border-white/10"
          data-testid="button-back"
        >
          <ChevronLeft size={22} />
        </button>

        <div className="flex items-center gap-2">
          {phase === "tracking" && (
            <div className="px-3 py-1.5 rounded-full bg-red-500/90 backdrop-blur-xl flex items-center gap-1.5 text-xs font-bold animate-pulse">
              <div className="w-2 h-2 rounded-full bg-white" />
              GRAVANDO
            </div>
          )}
          {gpsAccuracy !== null && (
            <div className={`px-3 py-1.5 rounded-full backdrop-blur-xl border border-white/10 flex items-center gap-1.5 text-[10px] font-semibold ${gpsAccuracy < 20 ? "bg-green-500/20 text-green-400" : gpsAccuracy < 50 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
              <Navigation size={10} />
              GPS {Math.round(gpsAccuracy)}m
            </div>
          )}
        </div>
      </header>

      {(phase === "start-photo" || phase === "end-photo") && (
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${cameraFacing === "user" ? "scale-x-[-1]" : ""}`}
            style={{ minHeight: "100dvh" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70 pointer-events-none" />

          <div className="absolute top-24 left-0 right-0 text-center px-6 pointer-events-none">
            <h2 className="text-xl font-bold mb-1 drop-shadow-lg">
              {phase === "start-photo" ? "Selfie de Início" : "Selfie de Fim"}
            </h2>
            <p className="text-xs text-white/70">
              {phase === "start-photo"
                ? "Tire uma selfie para registrar o início da atividade"
                : "Tire uma selfie para confirmar que completou"}
            </p>
          </div>

          {phase === "end-photo" && startPhotoUrl && (
            <div className="absolute top-28 right-4 p-1 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md">
              <p className="text-[8px] text-green-400 font-bold uppercase px-1 mb-0.5">Início</p>
              <div className="w-14 h-20 rounded-lg overflow-hidden">
                <img src={startPhotoUrl} alt="Start" className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 pb-10 flex flex-col items-center gap-4">
            <div className="flex items-center gap-6">
              <button
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20"
                onClick={() => {
                  const newFacing = cameraFacing === "user" ? "environment" : "user";
                  startCamera(newFacing);
                }}
                data-testid="button-flip-camera"
              >
                <RotateCcw size={18} />
              </button>

              <button
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 active:scale-90 transition-transform"
                onClick={phase === "start-photo" ? handleTakeStartPhoto : handleTakeEndPhoto}
                data-testid="button-capture"
              >
                <div className="w-full h-full bg-white rounded-full" />
              </button>

              <div className="w-12 h-12" />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-white/60">
              <MapPin size={12} />
              <span>{locationName}</span>
            </div>
          </div>
        </div>
      )}

      {phase === "ready" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center">
            <Camera size={40} className="text-primary" />
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Check-in de Atividade</h1>
            <p className="text-sm text-white/60 max-w-xs mx-auto">
              {challenge?.title || "Desafio"}
            </p>
            <div className="flex items-center justify-center gap-3 text-xs text-white/40 mt-2">
              <span className="flex items-center gap-1"><Camera size={12} /> Câmera</span>
              <span className="flex items-center gap-1"><MapPin size={12} /> GPS</span>
              <span className="flex items-center gap-1"><Timer size={12} /> Cronômetro</span>
              {!isGymType && <span className="flex items-center gap-1"><Ruler size={12} /> Distância</span>}
              <span className="flex items-center gap-1"><Flame size={12} /> Calorias</span>
            </div>
          </div>

          {gpsError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 max-w-xs">
              <AlertTriangle size={16} className="text-red-400 shrink-0" />
              <p className="text-xs text-red-300">{gpsError}</p>
            </div>
          )}

          <div className="w-full max-w-xs space-y-3">
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider text-center">Como funciona</p>
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary text-xs font-bold">1</div>
                <div>
                  <p className="text-sm font-medium">Selfie de início</p>
                  <p className="text-[11px] text-white/50">Tira uma foto ao começar a atividade</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary text-xs font-bold">2</div>
                <div>
                  <p className="text-sm font-medium">{isGymType ? "Treina normalmente" : "Atividade com GPS"}</p>
                  <p className="text-[11px] text-white/50">{isGymType ? "O cronômetro e calorias contam automaticamente" : "GPS rastreia km, pace e calorias em tempo real"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary text-xs font-bold">3</div>
                <div>
                  <p className="text-sm font-medium">Selfie de fim</p>
                  <p className="text-[11px] text-white/50">Confirma que completou a atividade</p>
                </div>
              </div>
            </div>
          </div>

          <Button
            className="w-full max-w-xs h-14 rounded-2xl font-bold text-lg bg-primary text-primary-foreground shadow-[0_0_30px_rgba(34,197,94,0.3)]"
            onClick={handleStartPhase}
            disabled={!!gpsError}
            data-testid="button-start-checkin"
          >
            <Play className="mr-2" size={20} /> Iniciar Check-in
          </Button>
        </div>
      )}

      {phase === "tracking" && (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
            {startPhotoUrl && (
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                <img src={startPhotoUrl} alt="Start" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="text-center">
              <p className="text-6xl font-mono font-bold tracking-tight" data-testid="text-timer">
                {formatDuration(elapsedSeconds)}
              </p>
              <p className="text-xs text-white/50 mt-1 uppercase tracking-wider">Tempo de atividade</p>
            </div>

            <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
              {!isGymType && (
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                  <Ruler size={18} className="text-blue-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold" data-testid="text-distance">{distanceKm.toFixed(2)}</p>
                  <p className="text-[10px] text-white/50 uppercase">km</p>
                </div>
              )}
              <div className={`bg-white/5 rounded-2xl p-4 border border-white/10 text-center ${isGymType ? "col-span-2" : ""}`}>
                <Flame size={18} className="text-orange-400 mx-auto mb-2" />
                <p className="text-2xl font-bold" data-testid="text-calories">{calories}</p>
                <p className="text-[10px] text-white/50 uppercase">kcal</p>
              </div>
              {!isGymType && (
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                  <Navigation size={18} className="text-green-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold" data-testid="text-pace">{distanceKm > 0.01 ? formatPace(durationMins, distanceKm) : "--"}</p>
                  <p className="text-[10px] text-white/50 uppercase">min/km</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-white/40">
              <MapPin size={12} />
              <span>{locationName}</span>
            </div>
          </div>

          <div className="px-6 pb-10 pt-4">
            <Button
              className="w-full h-14 rounded-2xl font-bold text-lg bg-red-500 hover:bg-red-600 text-white"
              onClick={handleFinishActivity}
              data-testid="button-finish-activity"
            >
              <Square className="mr-2" size={18} /> Finalizar Atividade
            </Button>
          </div>
        </div>
      )}

      {phase === "review" && (
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="flex-1 px-6 pt-20 pb-6 space-y-6">
            <div className="text-center mb-2">
              <h2 className="text-xl font-bold">Resumo da Atividade</h2>
              <p className="text-sm text-white/50">{challenge?.title}</p>
            </div>

            <div className="flex justify-center gap-4">
              {startPhotoUrl && (
                <div className="text-center">
                  <div className="w-28 h-36 rounded-xl overflow-hidden border-2 border-green-500/50 mb-1">
                    <img src={startPhotoUrl} alt="Início" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-[10px] text-green-400 font-bold uppercase">Início</p>
                </div>
              )}
              {endPhotoUrl && (
                <div className="text-center">
                  <div className="w-28 h-36 rounded-xl overflow-hidden border-2 border-blue-500/50 mb-1">
                    <img src={endPhotoUrl} alt="Fim" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-[10px] text-blue-400 font-bold uppercase">Fim</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center gap-3">
                <Timer size={20} className="text-primary shrink-0" />
                <div>
                  <p className="text-lg font-bold">{formatDuration(elapsedSeconds)}</p>
                  <p className="text-[10px] text-white/50 uppercase">Duração</p>
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center gap-3">
                <Flame size={20} className="text-orange-400 shrink-0" />
                <div>
                  <p className="text-lg font-bold">{calories} kcal</p>
                  <p className="text-[10px] text-white/50 uppercase">Calorias</p>
                </div>
              </div>
              {!isGymType && (
                <>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center gap-3">
                    <Ruler size={20} className="text-blue-400 shrink-0" />
                    <div>
                      <p className="text-lg font-bold">{distanceKm.toFixed(2)} km</p>
                      <p className="text-[10px] text-white/50 uppercase">Distância</p>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center gap-3">
                    <Navigation size={20} className="text-green-400 shrink-0" />
                    <div>
                      <p className="text-lg font-bold">{distanceKm > 0.01 ? formatPace(durationMins, distanceKm) : "--"}</p>
                      <p className="text-[10px] text-white/50 uppercase">Pace médio</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {startCoords && (
              <div className="flex items-center gap-2 text-xs text-white/40 justify-center">
                <MapPin size={12} />
                <span>Local: {startCoords.lat.toFixed(4)}, {startCoords.lng.toFixed(4)}</span>
              </div>
            )}
          </div>

          <div className="px-6 pb-10 pt-2 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-14 bg-transparent border-white/20 text-white hover:bg-white/10 rounded-2xl"
              onClick={handleReset}
              data-testid="button-redo"
            >
              <RotateCcw className="mr-1" size={16} /> Refazer
            </Button>
            <Button
              className="flex-[2] h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-[0_0_20px_rgba(34,197,94,0.3)]"
              onClick={handleSubmit}
              data-testid="button-submit-checkin"
            >
              <CheckCircle className="mr-2" size={18} /> Confirmar
            </Button>
          </div>
        </div>
      )}

      {phase === "submitting" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 size={48} className="text-primary animate-spin" />
          <p className="text-lg font-medium">Enviando check-in...</p>
          <p className="text-xs text-white/50">Fazendo upload das fotos e dados</p>
        </div>
      )}

      {phase === "done" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
            <CheckCircle size={40} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Check-in Registrado!</h2>
          <p className="text-sm text-white/50">Redirecionando...</p>
        </div>
      )}
    </div>
  );
}