import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ChevronLeft, Camera, MapPin, Timer, Flame, Ruler, RotateCcw, CheckCircle, AlertTriangle, Navigation, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateCalories(durationMins: number, distanceKm: number, sport: string): number {
  const weightKg = 70;
  let met = 5;
  const s = sport.toLowerCase();
  if (s.includes("corr") || s.includes("run")) met = 9.8;
  else if (s.includes("caminh") || s.includes("walk")) met = 3.8;
  else if (s.includes("ciclism") || s.includes("bike") || s.includes("pedal")) met = 7.5;
  else if (s.includes("nat") || s.includes("swim")) met = 8;
  else if (s.includes("muscula") || s.includes("academia") || s.includes("gym") || s.includes("crossfit")) met = 6;
  else if (s.includes("yoga") || s.includes("pilates")) met = 3;
  else if (s.includes("futebol") || s.includes("soccer") || s.includes("basquet")) met = 8;
  else if (s.includes("luta") || s.includes("box") || s.includes("mma") || s.includes("jiu")) met = 9;
  return Math.round(met * weightKg * (durationMins / 60));
}

function formatPace(durationMins: number, distanceKm: number): string {
  if (distanceKm < 0.01) return "--";
  const pace = durationMins / distanceKm;
  return `${Math.floor(pace)}'${Math.round((pace - Math.floor(pace)) * 60).toString().padStart(2, "0")}"`;
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
  return (await res.json()).url;
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

  const { data: activeCheckIns } = useQuery({
    queryKey: ["/api/check-ins/active"],
    queryFn: () => apiRequest("GET", "/api/check-ins/active").then(r => r.json()),
  });

  const activeCheckIn = activeCheckIns?.find((c: any) => c.challengeId === id);

  type Phase = "ready" | "camera-start" | "in-progress" | "camera-end" | "review" | "submitting" | "done";
  const [phase, setPhase] = useState<Phase>("ready");
  const [startPhotoBlob, setStartPhotoBlob] = useState<Blob | null>(null);
  const [startPhotoPreview, setStartPhotoPreview] = useState("");
  const [endPhotoBlob, setEndPhotoBlob] = useState<Blob | null>(null);
  const [endPhotoPreview, setEndPhotoPreview] = useState("");
  const [currentCheckInId, setCurrentCheckInId] = useState<string | null>(null);
  const [checkInStartTime, setCheckInStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [endCoords, setEndCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState("Obtendo localização...");
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user");
  const [indoorMode, setIndoorMode] = useState(false);
  const [manualDistanceKm, setManualDistanceKm] = useState("");
  const [distanceKm, setDistanceKm] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<number | null>(null);
  const locationReminderRef = useRef<number | null>(null);

  const sport = challenge?.sport || "";
  const isGymType = /academia|gym|muscula|crossfit|yoga|pilates|luta|box|mma|jiu/i.test(sport);

  useEffect(() => {
    if (activeCheckIn) {
      setCurrentCheckInId(activeCheckIn.id);
      setCheckInStartTime(new Date(activeCheckIn.createdAt));
      setIndoorMode(activeCheckIn.isIndoor || false);
      if (activeCheckIn.photoUrl) setStartPhotoPreview(activeCheckIn.photoUrl);
      setPhase("in-progress");
    }
  }, [activeCheckIn]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationName(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        setGpsAccuracy(pos.coords.accuracy);
        setGpsError(null);
      },
      () => {
        setGpsError("Ative a localização para fazer check-in");
        setLocationName("Localização indisponível");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    if ((phase === "in-progress") && checkInStartTime) {
      const update = () => setElapsedSeconds(Math.floor((Date.now() - checkInStartTime.getTime()) / 1000));
      update();
      timerRef.current = window.setInterval(update, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, checkInStartTime]);

  useEffect(() => {
    if (phase === "in-progress" && currentCheckInId && !indoorMode) {
      locationReminderRef.current = window.setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            fetch("/api/check-ins/location-update", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                checkInId: currentCheckInId,
                latitude: pos.coords.latitude.toString(),
                longitude: pos.coords.longitude.toString(),
              }),
              credentials: "include",
            }).catch(() => {});

            if (coords) {
              const d = haversineDistance(coords.lat, coords.lng, pos.coords.latitude, pos.coords.longitude);
              setDistanceKm(prev => {
                if (d > 0.005 && pos.coords.accuracy < 50) return prev + d;
                return prev;
              });
            }
            setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          () => {},
          { enableHighAccuracy: true }
        );
      }, 30000);
    }
    return () => { if (locationReminderRef.current) clearInterval(locationReminderRef.current); };
  }, [phase, currentCheckInId, indoorMode]);

  useEffect(() => {
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
      if (locationReminderRef.current) clearInterval(locationReminderRef.current);
    };
  }, []);

  const startCamera = useCallback(async (facing: "user" | "environment") => {
    if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      setCameraStream(stream);
      setCameraFacing(facing);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      toast({ title: "Erro", description: "Não foi possível acessar a câmera.", variant: "destructive" });
    }
  }, [cameraStream, toast]);

  const stopCamera = useCallback(() => {
    if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); setCameraStream(null); }
  }, [cameraStream]);

  const capturePhotoAsync = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!videoRef.current || !canvasRef.current) return reject("No camera");
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject("No context");
      if (cameraFacing === "user") { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
      ctx.drawImage(video, 0, 0);
      canvas.toBlob(b => b ? resolve(b) : reject("Failed"), "image/jpeg", 0.85);
    });
  }, [cameraFacing]);

  const handleOpenStartCamera = async () => {
    setPhase("camera-start");
    await startCamera("user");
  };

  const handleCaptureStart = async () => {
    try {
      const blob = await capturePhotoAsync();
      setStartPhotoBlob(blob);
      setStartPhotoPreview(URL.createObjectURL(blob));
      stopCamera();

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationName(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        },
        () => {},
        { enableHighAccuracy: true }
      );

      setPhase("submitting");
      const photoUrl = await uploadPhoto(blob);

      const res = await apiRequest("POST", "/api/check-ins/start", {
        challengeId: id,
        photoUrl,
        latitude: coords?.lat?.toString() || null,
        longitude: coords?.lng?.toString() || null,
        isIndoor: indoorMode,
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.checkIn) {
          setCurrentCheckInId(data.checkIn.id);
          setCheckInStartTime(new Date(data.checkIn.createdAt));
          setPhase("in-progress");
          toast({ title: "Check-in já ativo", description: "Continuando o check-in anterior." });
          return;
        }
        throw new Error(data.message);
      }

      setCurrentCheckInId(data.id);
      setCheckInStartTime(new Date(data.createdAt));
      queryClient.invalidateQueries({ queryKey: ["/api/check-ins/active"] });
      setPhase("in-progress");
      toast({ title: "Check-in iniciado!", description: "Pode fechar o app. O tempo continua contando." });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
      setPhase("ready");
    }
  };

  const handleOpenEndCamera = async () => {
    setPhase("camera-end");
    await startCamera("user");
  };

  const handleCaptureEnd = async () => {
    try {
      const blob = await capturePhotoAsync();
      setEndPhotoBlob(blob);
      setEndPhotoPreview(URL.createObjectURL(blob));
      stopCamera();

      navigator.geolocation.getCurrentPosition(
        (pos) => setEndCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true }
      );

      setPhase("review");
    } catch {
      toast({ title: "Erro ao capturar foto", variant: "destructive" });
    }
  };

  const handleSubmitCheckout = async () => {
    if (!currentCheckInId) return;
    if (!endPhotoBlob) { toast({ title: "Tire a foto de check-out", variant: "destructive" }); return; }

    setPhase("submitting");
    try {
      const endPhotoUrl = await uploadPhoto(endPhotoBlob);
      const dMins = Math.max(1, Math.round(elapsedSeconds / 60));
      const finalDist = indoorMode && manualDistanceKm ? parseFloat(manualDistanceKm) : distanceKm;
      const cal = estimateCalories(dMins, finalDist, sport);
      const pace = finalDist > 0.01 ? formatPace(dMins, finalDist) : null;

      await apiRequest("POST", `/api/check-ins/${currentCheckInId}/checkout`, {
        endPhotoUrl,
        endLatitude: endCoords?.lat?.toString() || null,
        endLongitude: endCoords?.lng?.toString() || null,
        distanceKm: finalDist > 0 ? finalDist.toFixed(3) : null,
        caloriesBurned: cal,
        avgPace: pace,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/check-ins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/check-ins/active"] });
      setPhase("done");
      toast({ title: "Check-out concluído!" });
      setTimeout(() => setLocation(`/challenge/${id}`), 2000);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
      setPhase("review");
    }
  };

  const durationMins = Math.max(1, Math.round(elapsedSeconds / 60));
  const effectiveDistance = indoorMode && manualDistanceKm ? parseFloat(manualDistanceKm) || 0 : distanceKm;
  const calories = estimateCalories(durationMins, effectiveDistance, sport);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-black text-white">
      <canvas ref={canvasRef} className="hidden" />

      <header className="absolute top-0 left-0 right-0 z-50 px-4 py-4 flex items-center justify-between safe-area-top">
        <button
          onClick={() => { stopCamera(); setLocation(`/challenge/${id}`); }}
          className="p-2.5 rounded-full bg-black/50 backdrop-blur-xl border border-white/10"
          data-testid="button-back"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="flex items-center gap-2">
          {phase === "in-progress" && (
            <div className="px-3 py-1.5 rounded-full bg-green-500/90 backdrop-blur-xl flex items-center gap-1.5 text-xs font-bold">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              ATIVO
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

      {(phase === "camera-start" || phase === "camera-end") && (
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            autoPlay playsInline muted
            className={`w-full h-full object-cover ${cameraFacing === "user" ? "scale-x-[-1]" : ""}`}
            style={{ minHeight: "100dvh" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70 pointer-events-none" />

          <div className="absolute top-24 left-0 right-0 text-center px-6 pointer-events-none">
            <h2 className="text-xl font-bold mb-1 drop-shadow-lg">
              {phase === "camera-start" ? "Selfie de Check-in" : "Selfie de Check-out"}
            </h2>
            <p className="text-xs text-white/70">
              {phase === "camera-start"
                ? "Tire uma selfie para registrar o início da atividade"
                : "Tire uma selfie para confirmar que finalizou"}
            </p>
          </div>

          <div className="absolute bottom-0 left-0 right-0 pb-10 flex flex-col items-center gap-4">
            <div className="flex items-center gap-6">
              <button
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20"
                onClick={() => startCamera(cameraFacing === "user" ? "environment" : "user")}
                data-testid="button-flip-camera"
              >
                <RotateCcw size={18} />
              </button>
              <button
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 active:scale-90 transition-transform"
                onClick={phase === "camera-start" ? handleCaptureStart : handleCaptureEnd}
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
            <h1 className="text-2xl font-bold">Check-in</h1>
            <p className="text-sm text-white/60 max-w-xs mx-auto">{challenge?.title || "Desafio"}</p>
            <div className="flex items-center justify-center gap-3 text-xs text-white/40 mt-2">
              <span className="flex items-center gap-1"><Camera size={12} /> Selfie</span>
              <span className="flex items-center gap-1"><Timer size={12} /> Tempo automático</span>
              <span className="flex items-center gap-1"><Flame size={12} /> Calorias</span>
            </div>
          </div>

          {gpsError && !indoorMode && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 max-w-xs">
              <AlertTriangle size={16} className="text-red-400 shrink-0" />
              <p className="text-xs text-red-300">{gpsError}</p>
            </div>
          )}

          {!isGymType && (
            <button
              onClick={() => setIndoorMode(!indoorMode)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border max-w-xs w-full transition-all ${indoorMode ? "bg-orange-500/15 border-orange-500/40" : "bg-white/5 border-white/10"}`}
              data-testid="button-indoor-mode"
            >
              <div className={`w-10 h-6 rounded-full relative transition-colors ${indoorMode ? "bg-orange-500" : "bg-white/20"}`}>
                <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${indoorMode ? "left-[18px]" : "left-0.5"}`} />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">{indoorMode ? "Modo Indoor ativado" : "Modo Indoor"}</p>
                <p className="text-[10px] text-white/50">Esteira, bike ergométrica, piscina coberta</p>
              </div>
            </button>
          )}

          <div className="w-full max-w-xs space-y-2">
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider text-center">Como funciona</p>
            <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary text-xs font-bold">1</div>
              <div>
                <p className="text-sm font-medium">Tire a selfie de check-in</p>
                <p className="text-[11px] text-white/50">O cronômetro começa automaticamente</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary text-xs font-bold">2</div>
              <div>
                <p className="text-sm font-medium">Faça seu exercício</p>
                <p className="text-[11px] text-white/50">Pode fechar o app — o tempo continua contando no servidor</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary text-xs font-bold">3</div>
              <div>
                <p className="text-sm font-medium">Volte e tire a selfie de check-out</p>
                <p className="text-[11px] text-white/50">O tempo é calculado automaticamente</p>
              </div>
            </div>
          </div>

          <Button
            className="w-full max-w-xs h-14 rounded-2xl font-bold text-lg bg-primary text-primary-foreground shadow-[0_0_30px_rgba(34,197,94,0.3)]"
            onClick={handleOpenStartCamera}
            disabled={!!gpsError && !indoorMode}
            data-testid="button-start-checkin"
          >
            <Camera className="mr-2" size={20} /> Tirar Selfie de Check-in
          </Button>
        </div>
      )}

      {phase === "in-progress" && (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
            {startPhotoPreview && (
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                <img src={startPhotoPreview} alt="Check-in" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="text-center">
              <p className="text-6xl font-mono font-bold tracking-tight" data-testid="text-timer">
                {formatDuration(elapsedSeconds)}
              </p>
              <p className="text-xs text-white/50 mt-1 uppercase tracking-wider">Tempo decorrido</p>
              <p className="text-[10px] text-white/30 mt-1">O tempo conta mesmo com o app fechado</p>
            </div>

            <div className={`grid gap-4 w-full max-w-sm ${!isGymType && !indoorMode ? "grid-cols-3" : "grid-cols-2"}`}>
              {!isGymType && !indoorMode && (
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                  <Ruler size={18} className="text-blue-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold" data-testid="text-distance">{distanceKm.toFixed(2)}</p>
                  <p className="text-[10px] text-white/50 uppercase">km</p>
                </div>
              )}
              {!isGymType && indoorMode && (
                <div className="bg-orange-500/10 rounded-2xl p-4 border border-orange-500/30 text-center">
                  <Ruler size={18} className="text-orange-400 mx-auto mb-2" />
                  <p className="text-xs text-orange-300 font-medium">Indoor</p>
                  <p className="text-[10px] text-white/50">Informar no final</p>
                </div>
              )}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                <Flame size={18} className="text-orange-400 mx-auto mb-2" />
                <p className="text-2xl font-bold" data-testid="text-calories">{calories}</p>
                <p className="text-[10px] text-white/50 uppercase">kcal</p>
              </div>
              {!isGymType && !indoorMode && (
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                  <Navigation size={18} className="text-green-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{distanceKm > 0.01 ? formatPace(durationMins, distanceKm) : "--"}</p>
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
              onClick={handleOpenEndCamera}
              data-testid="button-checkout"
            >
              <LogOut className="mr-2" size={18} /> Fazer Check-out (Selfie Final)
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
              {startPhotoPreview && (
                <div className="text-center">
                  <div className="w-28 h-36 rounded-xl overflow-hidden border-2 border-green-500/50 mb-1">
                    <img src={startPhotoPreview} alt="Início" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-[10px] text-green-400 font-bold uppercase">Check-in</p>
                </div>
              )}
              {endPhotoPreview && (
                <div className="text-center">
                  <div className="w-28 h-36 rounded-xl overflow-hidden border-2 border-blue-500/50 mb-1">
                    <img src={endPhotoPreview} alt="Fim" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-[10px] text-blue-400 font-bold uppercase">Check-out</p>
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
              {!isGymType && !indoorMode && (
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
                      <p className="text-[10px] text-white/50 uppercase">Pace</p>
                    </div>
                  </div>
                </>
              )}
              {!isGymType && indoorMode && (
                <div className="col-span-2 bg-orange-500/10 rounded-2xl p-4 border border-orange-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Ruler size={16} className="text-orange-400" />
                    <p className="text-xs text-orange-300 font-bold uppercase">Distância (Indoor)</p>
                  </div>
                  <p className="text-[10px] text-white/50 mb-2">Informe a distância do painel do equipamento</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={manualDistanceKm}
                      onChange={(e) => setManualDistanceKm(e.target.value)}
                      className="flex-1 h-12 bg-black/50 border border-orange-500/30 rounded-xl px-4 text-xl font-bold text-orange-400 placeholder:text-white/20 focus:outline-none focus:border-orange-500"
                      data-testid="input-manual-distance"
                    />
                    <span className="text-lg font-bold text-orange-400">km</span>
                  </div>
                  {manualDistanceKm && parseFloat(manualDistanceKm) > 0 && (
                    <p className="text-xs text-white/40 mt-2">
                      Pace: {formatPace(durationMins, parseFloat(manualDistanceKm))} min/km
                    </p>
                  )}
                </div>
              )}
            </div>

            {coords && (
              <div className="flex items-center gap-2 text-xs text-white/40 justify-center">
                <MapPin size={12} />
                <span>Local: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span>
              </div>
            )}
          </div>

          <div className="px-6 pb-10 pt-2 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-14 bg-transparent border-white/20 text-white hover:bg-white/10 rounded-2xl"
              onClick={() => { setEndPhotoBlob(null); setEndPhotoPreview(""); setPhase("in-progress"); }}
              data-testid="button-redo"
            >
              <RotateCcw className="mr-1" size={16} /> Refazer
            </Button>
            <Button
              className="flex-[2] h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-[0_0_20px_rgba(34,197,94,0.3)]"
              onClick={handleSubmitCheckout}
              data-testid="button-submit-checkout"
            >
              <CheckCircle className="mr-2" size={18} /> Confirmar
            </Button>
          </div>
        </div>
      )}

      {phase === "submitting" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 size={48} className="text-primary animate-spin" />
          <p className="text-lg font-medium">Processando...</p>
          <p className="text-xs text-white/50">Enviando fotos e dados</p>
        </div>
      )}

      {phase === "done" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
            <CheckCircle size={40} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Check-out Concluído!</h2>
          <p className="text-sm text-white/50">Redirecionando...</p>
        </div>
      )}
    </div>
  );
}
