import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { ChevronLeft, Camera, MapPin, Timer, Flame, Ruler, RotateCcw, CheckCircle, AlertTriangle, Navigation, Loader2, LogOut, SwitchCamera, Heart, Bluetooth, BluetoothOff, WifiOff, CloudUpload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useHeartRate } from "@/hooks/use-heart-rate";
import {
  blobToBase64,
  savePendingStart, getPendingStart, clearPendingStart,
  savePendingCheckout, getPendingCheckout, clearPendingCheckout,
  hasPendingOfflineData,
  type PendingStart, type PendingCheckout,
} from "@/lib/offline-queue";

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateCalories(durationMins: number, distanceKm: number, sport: string, weightKg = 70): number {
  const s = sport.toLowerCase();
  const hours = durationMins / 60;
  if (hours <= 0) return 0;

  if (distanceKm > 0.05 && (s === "corrida" || s.includes("corr") || s.includes("run"))) {
    const speedKmh = distanceKm / hours;
    let met = 6;
    if (speedKmh < 6) met = 3.8;
    else if (speedKmh < 8) met = 6;
    else if (speedKmh < 10) met = 8.3;
    else if (speedKmh < 12) met = 9.8;
    else if (speedKmh < 14) met = 11;
    else met = 12.8;
    return Math.round(met * weightKg * hours);
  }

  if (distanceKm > 0.05 && (s === "ciclismo" || s.includes("ciclism") || s.includes("bike") || s.includes("pedal"))) {
    const speedKmh = distanceKm / hours;
    let met = 4;
    if (speedKmh < 16) met = 4;
    else if (speedKmh < 20) met = 6.8;
    else if (speedKmh < 25) met = 8;
    else if (speedKmh < 30) met = 10;
    else met = 12;
    return Math.round(met * weightKg * hours);
  }

  if (distanceKm > 0.05 && (s.includes("caminh") || s.includes("walk"))) {
    const speedKmh = distanceKm / hours;
    let met = 3.5;
    if (speedKmh < 4) met = 2.8;
    else if (speedKmh < 5.5) met = 3.5;
    else if (speedKmh < 7) met = 4.3;
    else met = 5;
    return Math.round(met * weightKg * hours);
  }

  const metMap: Record<string, number> = {
    corrida: 8.3,
    academia: 5,
    crossfit: 8,
    ciclismo: 6.8,
    natacao: 7.8,
    funcional: 6.5,
    yoga: 2.5,
    hiit: 9,
    personalizado: 5,
  };
  let met = metMap[s] || 5;
  if (!metMap[s]) {
    if (s.includes("corr") || s.includes("run")) met = 8.3;
    else if (s.includes("caminh") || s.includes("walk")) met = 3.5;
    else if (s.includes("ciclism") || s.includes("bike") || s.includes("pedal")) met = 6.8;
    else if (s.includes("nat") || s.includes("swim")) met = 7.8;
    else if (s.includes("muscula") || s.includes("academia") || s.includes("gym")) met = 5;
    else if (s.includes("crossfit")) met = 8;
    else if (s.includes("funcional")) met = 6.5;
    else if (s.includes("yoga") || s.includes("pilates")) met = 2.5;
    else if (s.includes("hiit")) met = 9;
    else if (s.includes("futebol") || s.includes("soccer") || s.includes("basquet")) met = 8;
    else if (s.includes("luta") || s.includes("box") || s.includes("mma") || s.includes("jiu")) met = 9;
  }
  return Math.round(met * weightKg * hours);
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

// Convert a Blob to a compressed base64 data URL stored directly in the DB.
// This avoids the filesystem (which is ephemeral and lost on restart/redeploy).
async function blobToDataUrl(blob: Blob, maxDim = 800, quality = 0.65): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("No canvas context"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(b => {
        if (!b) return reject(new Error("Blob conversion failed"));
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(b);
      }, "image/jpeg", quality);
    };
    img.onerror = reject;
    img.src = url;
  });
}

// Alias used throughout the file
const uploadPhoto = (blob: Blob) => blobToDataUrl(blob);

export default function CheckIn() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userWeightKg = (user as any)?.weightKg || 70;

  const { data: challenge } = useQuery({
    queryKey: ["/api/challenges", id],
    queryFn: () => apiRequest("GET", `/api/challenges/${id}`).then(r => r.json()),
  });

  const { data: activeCheckIns } = useQuery({
    queryKey: ["/api/check-ins/active"],
    queryFn: () => apiRequest("GET", "/api/check-ins/active").then(r => r.json()),
  });

  const activeCheckIn = activeCheckIns?.find((c: any) => c.challengeId === id);

  type Phase = "ready" | "camera-front" | "camera-back" | "in-progress" | "camera-end-front" | "camera-end-back" | "camera-indoor-proof" | "review" | "submitting" | "done";
  const [phase, setPhase] = useState<Phase>("ready");
  const [captureStep, setCaptureStep] = useState<"front" | "back">("front");

  const [startFrontBlob, setStartFrontBlob] = useState<Blob | null>(null);
  const [startFrontPreview, setStartFrontPreview] = useState("");
  const [startBackBlob, setStartBackBlob] = useState<Blob | null>(null);
  const [startBackPreview, setStartBackPreview] = useState("");

  const [endFrontBlob, setEndFrontBlob] = useState<Blob | null>(null);
  const [endFrontPreview, setEndFrontPreview] = useState("");
  const [endBackBlob, setEndBackBlob] = useState<Blob | null>(null);
  const [endBackPreview, setEndBackPreview] = useState("");
  const [indoorProofBlob, setIndoorProofBlob] = useState<Blob | null>(null);
  const [indoorProofPreview, setIndoorProofPreview] = useState("");
  const [repsCount, setRepsCount] = useState("");

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
  const hr = useHeartRate();
  const [manualDistanceKm, setManualDistanceKm] = useState("");
  const [distanceKm, setDistanceKm] = useState(0);
  const [captureCountdown, setCaptureCountdown] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  // Initialize from localStorage so pending state survives navigation away/back
  const [offlinePending, setOfflinePending] = useState(() => hasPendingOfflineData());
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<number | null>(null);
  const locationReminderRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastServerUpdateRef = useRef<number>(0);

  const sport = challenge?.sport || "";
  const vType = challenge?.validationType || "foto";
  const cType = challenge?.type || "checkin";
  const isGymType = /academia|gym|muscula|crossfit|yoga|pilates|luta|box|mma|jiu|funcional|hiit/i.test(sport);
  const tracksDistance = vType === "distancia" || vType === "combinacao";
  const tracksTime = vType === "tempo" || vType === "combinacao";
  const showDistanceUI = tracksDistance && !isGymType;
  const showCalories = vType === "tempo" || vType === "distancia" || vType === "combinacao";
  const isDailyType = cType === "checkin" || cType === "survival";
  const doneToday = isDailyType && (challenge as any)?.checkedInToday === true;

  useEffect(() => {
    if (activeCheckIn) {
      setCurrentCheckInId(activeCheckIn.id);
      setCheckInStartTime(new Date(activeCheckIn.createdAt));
      setIndoorMode(activeCheckIn.isIndoor || false);
      if (activeCheckIn.photoUrl) setStartFrontPreview(activeCheckIn.photoUrl);
      if (activeCheckIn.backPhotoUrl) setStartBackPreview(activeCheckIn.backPhotoUrl);
      setPhase("in-progress");
    }
  }, [activeCheckIn]);

  // Track online/offline
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Auto-sync when connection restored
  useEffect(() => {
    if (!isOnline || syncing) return;
    const pendingStart = getPendingStart();
    const pendingCheckout = getPendingCheckout();
    if (!pendingStart && !pendingCheckout) return;

    const sync = async () => {
      setSyncing(true);
      setSyncError(null);
      try {
        let serverCheckInId: string | null = null;

        if (pendingStart && pendingStart.challengeId === id) {
          // The offline queue already stores photos as base64 data URLs — use them directly.
          // No need to convert to blob and re-upload; they go straight into the DB.
          const photoUrl = pendingStart.frontB64;
          const backPhotoUrl = pendingStart.backB64;
          const res = await apiRequest("POST", "/api/check-ins/start", {
            challengeId: pendingStart.challengeId,
            photoUrl,
            backPhotoUrl,
            latitude: pendingStart.latitude,
            longitude: pendingStart.longitude,
            isIndoor: pendingStart.isIndoor,
          });
          const data = await res.json();
          if (res.ok) {
            serverCheckInId = data.id;
            clearPendingStart();
          } else if (data.checkIn) {
            // Already exists on server — recover the real ID
            serverCheckInId = data.checkIn.id;
            clearPendingStart();
          } else if (data.message?.includes("já fez check-in hoje") || data.message?.includes("já tem um check-in")) {
            // Server already registered this — discard the pending start
            clearPendingStart();
            // Try to get the real active check-in ID for the checkout step
            const activeRes = await fetch("/api/check-ins/active", { credentials: "include" });
            const activeList = await activeRes.json();
            const activeForChallenge = (activeList as any[]).find((c: any) => c.challengeId === id);
            if (activeForChallenge) serverCheckInId = activeForChallenge.id;
          } else {
            throw new Error(data.message || "Erro ao sincronizar check-in");
          }
        }

        const co = pendingCheckout && pendingCheckout.challengeId === id ? pendingCheckout : null;
        if (co) {
          // Resolve the real check-in ID: use the one from this sync, or look up active on server
          // (the stored serverCheckInId may be an offline placeholder like "offline_xxx")
          let realId = serverCheckInId || co.serverCheckInId;
          if (!realId || realId.startsWith("offline_")) {
            const activeRes = await fetch("/api/check-ins/active", { credentials: "include" });
            const activeList = await activeRes.json();
            const activeForChallenge = (activeList as any[]).find((c: any) => c.challengeId === co.challengeId);
            if (activeForChallenge) {
              realId = activeForChallenge.id;
            } else {
              // Check-in never reached the server and we have no active one — abandon orphaned checkout
              clearPendingCheckout();
              clearPendingStart();
              setOfflinePending(false);
              toast({ title: "Dados offline descartados", description: "O check-in anterior não chegou ao servidor. Você pode fazer um novo check-in." });
              queryClient.invalidateQueries({ queryKey: ["/api/check-ins/active"] });
              return;
            }
          }

          // Offline queue stores photos as base64 data URLs — use them directly.
          const endPhotoUrl = co.endFrontB64;
          const endBackPhotoUrl = co.endBackB64;
          const indoorProofPhotoUrl = co.indoorProofB64 || null;
          const checkoutRes = await apiRequest("POST", `/api/check-ins/${realId}/checkout`, {
            endPhotoUrl,
            endBackPhotoUrl,
            indoorProofPhotoUrl: indoorProofPhotoUrl || null,
            endLatitude: co.endLatitude,
            endLongitude: co.endLongitude,
            distanceKm: co.distanceKm,
            caloriesBurned: co.caloriesBurned,
            avgPace: co.avgPace,
            reps: co.reps,
            avgBpm: co.avgBpm,
            maxBpm: co.maxBpm,
          });
          if (!checkoutRes.ok) {
            const errData = await checkoutRes.json();
            // Already checked out — consider it done and clean up
            if (errData.message?.includes("já finalizado")) {
              clearPendingCheckout();
              clearPendingStart();
              setOfflinePending(false);
              toast({ title: "Check-out já registrado!", description: "Seu check-in já foi finalizado anteriormente." });
              queryClient.invalidateQueries({ queryKey: ["/api/check-ins"] });
              queryClient.invalidateQueries({ queryKey: ["/api/check-ins/active"] });
              return;
            }
            throw new Error(errData.message || "Erro no check-out");
          }
          clearPendingCheckout();
          setOfflinePending(false);
          queryClient.invalidateQueries({ queryKey: ["/api/check-ins"] });
          queryClient.invalidateQueries({ queryKey: ["/api/check-ins/active"] });
          toast({ title: "Dados sincronizados!", description: "Seu check-in foi enviado com sucesso." });
        } else if (serverCheckInId) {
          queryClient.invalidateQueries({ queryKey: ["/api/check-ins/active"] });
          toast({ title: "Check-in sincronizado!", description: "Faça o check-out quando terminar." });
        }
      } catch (err: any) {
        setSyncError(err.message || "Erro desconhecido");
        toast({ title: "Erro ao sincronizar", description: err.message, variant: "destructive" });
      } finally {
        setSyncing(false);
      }
    };

    sync();
  }, [isOnline, id]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsAccuracy(pos.coords.accuracy);
        setGpsError(null);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=18&addressdetails=1`, {
            headers: { "User-Agent": "VYTAL-App/1.0" },
          });
          if (res.ok) {
            const data = await res.json();
            const addr = data.address;
            if (addr) {
              const parts = [addr.road, addr.suburb, addr.city || addr.town || addr.village].filter(Boolean);
              setLocationName(parts.join(", ") || data.display_name || `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
            } else {
              setLocationName(data.display_name || `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
            }
          } else {
            setLocationName(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
          }
        } catch {
          setLocationName(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        }
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
    if (phase === "in-progress" && currentCheckInId && showDistanceUI && !indoorMode) {
      if (!("geolocation" in navigator)) return;

      const handlePosition = (pos: GeolocationPosition) => {
        const { latitude, longitude, accuracy } = pos.coords;

        // Throttle server updates to max 1 per 15 seconds
        const now = Date.now();
        if (now - lastServerUpdateRef.current > 15000) {
          lastServerUpdateRef.current = now;
          fetch("/api/check-ins/location-update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ checkInId: currentCheckInId, latitude: latitude.toString(), longitude: longitude.toString() }),
            credentials: "include",
          }).catch(() => {});
        }

        setCoords(prev => {
          if (!prev) {
            return { lat: latitude, lng: longitude };
          }
          const d = haversineDistance(prev.lat, prev.lng, latitude, longitude);
          // Only count movement > 5m with accuracy < 30m (stricter than before)
          if (d > 0.005 && accuracy < 30) {
            setDistanceKm(km => km + d);
            setGpsAccuracy(accuracy);
          }
          return { lat: latitude, lng: longitude };
        });
      };

      watchIdRef.current = navigator.geolocation.watchPosition(
        handlePosition,
        () => {},
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
      );
    }
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (locationReminderRef.current) clearInterval(locationReminderRef.current);
    };
  }, [phase, currentCheckInId, showDistanceUI, indoorMode]);

  useEffect(() => {
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
      if (locationReminderRef.current) clearInterval(locationReminderRef.current);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  const startCamera = useCallback(async (facing: "user" | "environment") => {
    if (cameraStream && cameraFacing === facing) {
      if (videoRef.current && videoRef.current.srcObject !== cameraStream) {
        videoRef.current.srcObject = cameraStream;
      }
      return;
    }
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
  }, [cameraStream, cameraFacing, toast]);

  const stopCamera = useCallback(() => {
    if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); setCameraStream(null); }
  }, [cameraStream]);

  const capturePhotoAsync = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!videoRef.current || !canvasRef.current) return reject("No camera");
      const video = videoRef.current;
      const canvas = canvasRef.current;
      // Cap resolution at 1080px to keep stored photos small (they go into the DB as base64)
      const MAX_DIM = 1080;
      const scale = Math.min(1, MAX_DIM / Math.max(video.videoWidth || 1, video.videoHeight || 1));
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject("No context");
      if (cameraFacing === "user") { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(b => b ? resolve(b) : reject("Failed"), "image/jpeg", 0.72);
    });
  }, [cameraFacing]);

  const handleStartCapture = async () => {
    setPhase("camera-front");
    setCaptureStep("front");
    await startCamera("user");
  };

  const handleCaptureFront = async (isEnd: boolean) => {
    try {
      const blob = await capturePhotoAsync();
      if (isEnd) {
        setEndFrontBlob(blob);
        setEndFrontPreview(URL.createObjectURL(blob));
      } else {
        setStartFrontBlob(blob);
        setStartFrontPreview(URL.createObjectURL(blob));
      }

      startCamera("environment");

      setCaptureCountdown(3);
      let count = 3;
      const interval = setInterval(() => {
        count--;
        setCaptureCountdown(count);
        if (count <= 0) {
          clearInterval(interval);
          setCaptureCountdown(null);
          if (isEnd) {
            setPhase("camera-end-back");
          } else {
            setPhase("camera-back");
          }
        }
      }, 1000);
    } catch {
      toast({ title: "Erro ao capturar foto", variant: "destructive" });
    }
  };

  const handleCaptureBack = async (isEnd: boolean) => {
    try {
      const blob = await capturePhotoAsync();
      if (isEnd) {
        setEndBackBlob(blob);
        setEndBackPreview(URL.createObjectURL(blob));
      } else {
        setStartBackBlob(blob);
        setStartBackPreview(URL.createObjectURL(blob));
      }
      stopCamera();

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (isEnd) {
            setEndCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          } else {
            setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            try {
              const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=18&addressdetails=1`, {
                headers: { "User-Agent": "VYTAL-App/1.0" },
              });
              if (geoRes.ok) {
                const data = await geoRes.json();
                const addr = data.address;
                if (addr) {
                  const parts = [addr.road, addr.suburb, addr.city || addr.town || addr.village].filter(Boolean);
                  setLocationName(parts.join(", ") || data.display_name || `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
                } else {
                  setLocationName(data.display_name || `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
                }
              } else {
                setLocationName(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
              }
            } catch {
              setLocationName(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
            }
          }
        },
        () => {},
        { enableHighAccuracy: true }
      );

      if (isEnd) {
        if (indoorMode && showDistanceUI) {
          setPhase("camera-indoor-proof");
          startCamera("environment");
        } else {
          setPhase("review");
        }
      } else {
        await handleSubmitCheckIn(blob);
      }
    } catch {
      toast({ title: "Erro ao capturar foto", variant: "destructive" });
    }
  };

  const handleCaptureIndoorProof = async () => {
    try {
      const blob = await capturePhotoAsync();
      setIndoorProofBlob(blob);
      setIndoorProofPreview(URL.createObjectURL(blob));
      stopCamera();
      setPhase("review");
    } catch {
      toast({ title: "Erro ao capturar foto", variant: "destructive" });
    }
  };

  const handleSubmitCheckIn = async (backBlob: Blob) => {
    setPhase("submitting");

    // Offline: save locally and enter in-progress with local timer
    if (!navigator.onLine) {
      try {
        const [frontB64, backB64] = await Promise.all([
          blobToBase64(startFrontBlob!),
          blobToBase64(backBlob),
        ]);
        const offlineId = `offline_${Date.now()}`;
        savePendingStart({
          localId: offlineId,
          challengeId: id!,
          frontB64,
          backB64,
          latitude: coords?.lat?.toString() || null,
          longitude: coords?.lng?.toString() || null,
          locationName,
          isIndoor: indoorMode,
          savedAt: new Date().toISOString(),
        });
        setCurrentCheckInId(offlineId);
        setCheckInStartTime(new Date());
        setPhase("in-progress");
        toast({
          title: "Sem conexão — salvo localmente",
          description: "O check-in será enviado automaticamente quando você reconectar.",
        });
      } catch (err: any) {
        toast({ title: "Erro", description: err.message, variant: "destructive" });
        setPhase("ready");
      }
      return;
    }

    try {
      const [photoUrl, backPhotoUrl] = await Promise.all([
        uploadPhoto(startFrontBlob!),
        uploadPhoto(backBlob),
      ]);

      const res = await apiRequest("POST", "/api/check-ins/start", {
        challengeId: id,
        photoUrl,
        backPhotoUrl,
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

  const handleStartEndCapture = async () => {
    setPhase("camera-end-front");
    setCaptureStep("front");
    await startCamera("user");
  };

  const handleSubmitCheckout = async () => {
    if (!currentCheckInId || !endFrontBlob || !endBackBlob) {
      toast({ title: "Complete as fotos de check-out", variant: "destructive" });
      return;
    }
    if (indoorMode && showDistanceUI && !indoorProofBlob) {
      toast({ title: "Tire a foto do painel do equipamento", variant: "destructive" });
      return;
    }

    const dMins = Math.max(1, Math.round(elapsedSeconds / 60));
    const finalDist = indoorMode && manualDistanceKm ? parseFloat(manualDistanceKm) : distanceKm;
    const cal = estimateCalories(dMins, finalDist, sport, userWeightKg);
    const pace = finalDist > 0.01 ? formatPace(dMins, finalDist) : null;

    // Offline: save checkout data locally
    if (!navigator.onLine) {
      try {
        const [endFrontB64, endBackB64] = await Promise.all([
          blobToBase64(endFrontBlob),
          blobToBase64(endBackBlob),
        ]);
        let indoorProofB64: string | undefined;
        if (indoorProofBlob) indoorProofB64 = await blobToBase64(indoorProofBlob);
        savePendingCheckout({
          serverCheckInId: currentCheckInId,
          challengeId: id!,
          endFrontB64,
          endBackB64,
          indoorProofB64,
          endLatitude: endCoords?.lat?.toString() || null,
          endLongitude: endCoords?.lng?.toString() || null,
          distanceKm: finalDist > 0 ? finalDist.toFixed(3) : null,
          caloriesBurned: showCalories ? cal : null,
          avgPace: pace,
          reps: repsCount ? parseInt(repsCount) : null,
          avgBpm: hr.getAvgBpm() ?? null,
          maxBpm: hr.maxBpm ?? null,
          elapsedSeconds,
          savedAt: new Date().toISOString(),
        });
        setOfflinePending(true);
        setPhase("done");
        toast({
          title: "Sem conexão — salvo localmente",
          description: "O check-out será enviado quando você reconectar.",
        });
      } catch (err: any) {
        toast({ title: "Erro", description: err.message, variant: "destructive" });
        setPhase("review");
      }
      return;
    }

    setPhase("submitting");
    try {
      const uploads: Promise<string>[] = [
        uploadPhoto(endFrontBlob),
        uploadPhoto(endBackBlob),
      ];
      if (indoorProofBlob) uploads.push(uploadPhoto(indoorProofBlob));
      const uploadResults = await Promise.all(uploads);
      const endPhotoUrl = uploadResults[0];
      const endBackPhotoUrl = uploadResults[1];
      const indoorProofPhotoUrl = uploadResults[2] || null;

      await apiRequest("POST", `/api/check-ins/${currentCheckInId}/checkout`, {
        endPhotoUrl,
        endBackPhotoUrl,
        indoorProofPhotoUrl,
        endLatitude: endCoords?.lat?.toString() || null,
        endLongitude: endCoords?.lng?.toString() || null,
        distanceKm: finalDist > 0 ? finalDist.toFixed(3) : null,
        caloriesBurned: showCalories ? cal : null,
        avgPace: pace,
        reps: repsCount ? parseInt(repsCount) : null,
        avgBpm: hr.getAvgBpm() ?? null,
        maxBpm: hr.maxBpm ?? null,
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
  const calories = estimateCalories(durationMins, effectiveDistance, sport, userWeightKg);

  const isCameraPhase = phase === "camera-front" || phase === "camera-back" || phase === "camera-end-front" || phase === "camera-end-back" || phase === "camera-indoor-proof";
  const isCheckIn = phase === "camera-front" || phase === "camera-back";
  const isFrontCamera = phase === "camera-front" || phase === "camera-end-front";

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
          {!isOnline && (
            <div className="px-3 py-1.5 rounded-full bg-orange-500/90 backdrop-blur-xl flex items-center gap-1.5 text-xs font-bold">
              <WifiOff size={12} />
              OFFLINE
            </div>
          )}
          {syncing && (
            <div className="px-3 py-1.5 rounded-full bg-blue-500/90 backdrop-blur-xl flex items-center gap-1.5 text-xs font-bold">
              <Loader2 size={12} className="animate-spin" />
              SINCRONIZANDO
            </div>
          )}
          {phase === "in-progress" && isOnline && !syncing && (
            <div className="px-3 py-1.5 rounded-full bg-green-500/90 backdrop-blur-xl flex items-center gap-1.5 text-xs font-bold">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              ATIVO
            </div>
          )}
          {gpsAccuracy !== null && !isCameraPhase && (
            <div className={`px-3 py-1.5 rounded-full backdrop-blur-xl border border-white/10 flex items-center gap-1.5 text-[10px] font-semibold ${gpsAccuracy < 20 ? "bg-green-500/20 text-green-400" : gpsAccuracy < 50 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
              <Navigation size={10} />
              GPS {Math.round(gpsAccuracy)}m
            </div>
          )}
        </div>
      </header>

      {isCameraPhase && (
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            autoPlay playsInline muted
            className={`w-full h-full object-cover ${cameraFacing === "user" ? "scale-x-[-1]" : ""}`}
            style={{ minHeight: "100dvh" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70 pointer-events-none" />

          {captureCountdown !== null && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full border-4 border-primary flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <span className="text-5xl font-bold text-primary">{captureCountdown}</span>
                </div>
                <p className="text-lg font-bold">Virando para câmera traseira...</p>
                <p className="text-xs text-white/50 mt-1">Mostre o ambiente ao redor</p>
              </div>
            </div>
          )}

          {(isFrontCamera ? (isCheckIn ? startFrontPreview : endFrontPreview) : null) && (
            <div className="absolute top-20 right-4 z-40">
              <div className="w-20 h-28 rounded-xl overflow-hidden border-2 border-primary shadow-lg">
                <img
                  src={isFrontCamera ? "" : (isCheckIn ? startFrontPreview : endFrontPreview)}
                  alt="Selfie"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-[9px] text-center text-green-400 font-bold mt-1">SELFIE</p>
            </div>
          )}

          {!isFrontCamera && (isCheckIn ? startFrontPreview : endFrontPreview) && (
            <div className="absolute top-20 right-4 z-40">
              <div className="w-20 h-28 rounded-xl overflow-hidden border-2 border-primary shadow-lg">
                <img
                  src={isCheckIn ? startFrontPreview : endFrontPreview}
                  alt="Selfie"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-[9px] text-center text-green-400 font-bold mt-1">SELFIE</p>
            </div>
          )}

          <div className="absolute top-24 left-0 right-0 text-center px-6 pointer-events-none">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 mb-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider">
                {phase === "camera-indoor-proof"
                  ? "Check-out • Painel do Equipamento"
                  : `${isCheckIn ? "Check-in" : "Check-out"} • ${isFrontCamera ? "Selfie" : "Ambiente"}`}
              </span>
            </div>
            <h2 className="text-xl font-bold mb-1 drop-shadow-lg">
              {phase === "camera-indoor-proof"
                ? "Foto do painel"
                : isFrontCamera ? "Tire sua selfie" : "Mostre o ambiente"}
            </h2>
            <p className="text-xs text-white/70">
              {phase === "camera-indoor-proof"
                ? "Fotografe o painel do equipamento mostrando a distância percorrida"
                : isFrontCamera
                  ? "Mostre seu rosto para confirmar presença"
                  : "Aponte a câmera para o local onde está"}
            </p>
          </div>

          <div className="absolute bottom-0 left-0 right-0 pb-10 flex flex-col items-center gap-4">
            {phase !== "camera-indoor-proof" && (
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${isFrontCamera ? "bg-primary" : "bg-white/30"}`} />
                <div className={`w-3 h-3 rounded-full ${!isFrontCamera ? "bg-primary" : "bg-white/30"}`} />
              </div>
            )}
            {phase === "camera-indoor-proof" && (
              <div className="flex items-center gap-2 mb-2">
                <div className="px-3 py-1 rounded-full bg-orange-500/30 border border-orange-500/50">
                  <span className="text-xs font-bold text-orange-400">3/3 — Comprovação Indoor</span>
                </div>
              </div>
            )}
            <button
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 active:scale-90 transition-transform"
              onClick={() => {
                if (phase === "camera-indoor-proof") {
                  handleCaptureIndoorProof();
                } else if (isFrontCamera) {
                  handleCaptureFront(!isCheckIn);
                } else {
                  handleCaptureBack(!isCheckIn);
                }
              }}
              data-testid="button-capture"
            >
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                <Camera size={24} className="text-black" />
              </div>
            </button>
            <div className="flex items-center gap-1.5 text-xs text-white/60">
              <SwitchCamera size={12} />
              <span>
                {phase === "camera-indoor-proof"
                  ? "3/3 — Painel do equipamento"
                  : isFrontCamera ? "1/2 — Selfie" : "2/2 — Ambiente"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Syncing spinner overlay when phase=ready but sync is running */}
      {phase === "ready" && offlinePending && syncing && (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
            <Loader2 size={40} className="text-blue-400 animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Enviando dados...</h2>
            <p className="text-sm text-white/50">Estamos sincronizando seu check-in com o servidor.</p>
          </div>
        </div>
      )}

      {/* Banner when there are pending offline data (surviving navigation) */}
      {phase === "ready" && offlinePending && !syncing && (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
            <CloudUpload size={40} className="text-orange-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Dados pendentes</h2>
            <p className="text-sm text-white/50 max-w-xs mx-auto">
              {isOnline
                ? "Conectado — tentando enviar seu check-in salvo offline..."
                : "Sem conexão. Seus dados estão guardados e serão enviados assim que você reconectar."}
            </p>
          </div>
          {isOnline && syncError && (
            <div className="w-full max-w-xs space-y-3">
              <div className="px-4 py-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 text-left">
                <p className="font-bold mb-1">Erro ao sincronizar:</p>
                <p>{syncError}</p>
              </div>
              <button
                className="w-full px-6 py-3 rounded-2xl bg-red-500/20 border border-red-500/30 text-sm font-bold text-red-300"
                onClick={() => {
                  clearPendingStart();
                  clearPendingCheckout();
                  setOfflinePending(false);
                  setSyncError(null);
                  toast({ title: "Dados offline apagados", description: "Você pode fazer um novo check-in agora." });
                }}
              >
                Descartar dados e fazer novo check-in
              </button>
            </div>
          )}
          {!isOnline && (
            <button
              className="px-6 py-3 rounded-2xl bg-white/10 border border-white/20 text-sm font-bold"
              onClick={() => setLocation(`/challenge/${id}`)}
            >
              Voltar ao Desafio
            </button>
          )}
        </div>
      )}

      {phase === "ready" && !offlinePending && doneToday && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 text-center">
          <div className="w-24 h-24 rounded-3xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
            <CheckCircle size={48} className="text-green-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-green-400">Check-in Feito Hoje!</h1>
            <p className="text-sm text-white/60 max-w-xs mx-auto">{challenge?.title || "Desafio"}</p>
            <p className="text-xs text-white/40 mt-2">Você já registrou presença hoje. Volte amanhã para o próximo check-in.</p>
          </div>
          <button
            className="px-6 py-3 rounded-2xl bg-white/10 border border-white/20 text-sm font-bold"
            onClick={() => setLocation(`/challenge/${id}`)}
          >
            Voltar ao Desafio
          </button>
        </div>
      )}

      {phase === "ready" && !offlinePending && !doneToday && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center relative">
            <Camera size={40} className="text-primary" />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center border-2 border-black">
              <SwitchCamera size={14} />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Check-in Duplo</h1>
            <p className="text-sm text-white/60 max-w-xs mx-auto">{challenge?.title || "Desafio"}</p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 mt-2">
              <SwitchCamera size={12} className="text-blue-400" />
              <span className="text-[11px] text-blue-300 font-medium">Selfie + Foto do ambiente</span>
            </div>
          </div>

          {gpsError && showDistanceUI && !indoorMode && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 max-w-xs">
              <AlertTriangle size={16} className="text-red-400 shrink-0" />
              <p className="text-xs text-red-300">{gpsError}</p>
            </div>
          )}

          {showDistanceUI && (
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
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider text-center">Como funciona — {challenge?.sport || "Exercício"}</p>
            <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary text-xs font-bold">1</div>
              <div>
                <p className="text-sm font-medium">Selfie + foto do ambiente</p>
                <p className="text-[11px] text-white/50">Selfie + Foto do ambiente para validação</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary text-xs font-bold">2</div>
              <div>
                <p className="text-sm font-medium">
                  {showDistanceUI ? "Faça seu exercício — GPS rastreia distância" : "Faça seu exercício — tempo registrado"}
                </p>
                <p className="text-[11px] text-white/50">
                  {showDistanceUI
                    ? indoorMode ? "Indoor: informe a distância do equipamento no final" : "Distância e pace calculados pelo GPS"
                    : "Pode fechar o app — o tempo conta no servidor"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary text-xs font-bold">3</div>
              <div>
                <p className="text-sm font-medium">Volte e faça o check-out com fotos</p>
                <p className="text-[11px] text-white/50">
                  {showDistanceUI && indoorMode
                    ? "Selfie + ambiente + foto do painel do equipamento"
                    : "Selfie + ambiente novamente para confirmar"}
                </p>
              </div>
            </div>
          </div>

          <Button
            className="w-full max-w-xs h-14 rounded-2xl font-bold text-lg bg-primary text-primary-foreground shadow-[0_0_30px_rgba(34,197,94,0.3)]"
            onClick={handleStartCapture}
            disabled={!!gpsError && showDistanceUI && !indoorMode}
            data-testid="button-start-checkin"
          >
            <Camera className="mr-2" size={20} /> Iniciar Check-in
          </Button>
        </div>
      )}

      {phase === "in-progress" && (
        <div className="flex-1 flex flex-col">
          {(!isOnline || offlinePending) && (
            <div className="mx-4 mt-16 px-4 py-3 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center gap-3">
              <WifiOff size={16} className="text-orange-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-orange-300">Sem conexão</p>
                <p className="text-[10px] text-orange-400/70">Seus dados estão salvos. Serão enviados ao reconectar.</p>
              </div>
            </div>
          )}
          <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
            <div className="flex items-center gap-3">
              {startFrontPreview && (
                <div className="relative">
                  <div className="w-16 h-20 rounded-xl overflow-hidden border-2 border-primary shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                    <img src={startFrontPreview} alt="Selfie" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-[8px] text-center text-green-400 font-bold mt-0.5">SELFIE</p>
                </div>
              )}
              {startBackPreview && (
                <div className="relative">
                  <div className="w-16 h-20 rounded-xl overflow-hidden border-2 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                    <img src={startBackPreview} alt="Ambiente" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-[8px] text-center text-blue-400 font-bold mt-0.5">AMBIENTE</p>
                </div>
              )}
            </div>

            <div className="text-center">
              <p className="text-6xl font-mono font-bold tracking-tight" data-testid="text-timer">
                {formatDuration(elapsedSeconds)}
              </p>
              <p className="text-xs text-white/50 mt-1 uppercase tracking-wider">Tempo decorrido</p>
              <p className="text-[10px] text-white/30 mt-1">O tempo conta mesmo com o app fechado</p>
            </div>

            <div className={`grid gap-4 w-full max-w-sm ${showDistanceUI && !indoorMode && showCalories ? "grid-cols-3" : (showDistanceUI || showCalories ? "grid-cols-2" : "grid-cols-1")}`}>
              {showDistanceUI && !indoorMode && (
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                  <Ruler size={18} className="text-blue-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold" data-testid="text-distance">{distanceKm.toFixed(2)}</p>
                  <p className="text-[10px] text-white/50 uppercase">km</p>
                </div>
              )}
              {showDistanceUI && indoorMode && (
                <div className="bg-orange-500/10 rounded-2xl p-4 border border-orange-500/30 text-center">
                  <Ruler size={18} className="text-orange-400 mx-auto mb-2" />
                  <p className="text-xs text-orange-300 font-medium">Indoor</p>
                  <p className="text-[10px] text-white/50">Informar no final</p>
                </div>
              )}
              {showCalories && (
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                  <Flame size={18} className="text-orange-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold" data-testid="text-calories">{calories}</p>
                  <p className="text-[10px] text-white/50 uppercase">kcal</p>
                </div>
              )}
              {showDistanceUI && !indoorMode && (
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                  <Navigation size={18} className="text-green-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{distanceKm > 0.01 ? formatPace(durationMins, distanceKm) : "--"}</p>
                  <p className="text-[10px] text-white/50 uppercase">min/km</p>
                </div>
              )}
            </div>

            {hr.status === "connected" && hr.currentBpm && (
              <div className="w-full max-w-sm bg-red-500/10 border border-red-500/40 rounded-2xl p-4 flex items-center gap-4">
                <div className="relative flex items-center justify-center w-12 h-12 shrink-0">
                  <Heart size={28} className="text-red-400 animate-pulse fill-red-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white" data-testid="text-bpm-current">{hr.currentBpm}</span>
                    <span className="text-sm text-white/50">bpm</span>
                  </div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wide">{hr.deviceName}</p>
                </div>
                {hr.maxBpm && (
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-300">{hr.maxBpm}</p>
                    <p className="text-[9px] text-white/40 uppercase">Máx</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 text-xs text-white/40">
              <div className="flex items-center gap-1.5">
                <MapPin size={12} />
                <span>{locationName}</span>
              </div>
              {hr.status !== "unsupported" && hr.status !== "connected" && (
                <button
                  onClick={hr.connect}
                  disabled={hr.status === "connecting"}
                  className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-300 transition-all disabled:opacity-50"
                  data-testid="button-connect-hr"
                >
                  {hr.status === "connecting" ? <Loader2 size={11} className="animate-spin" /> : <Bluetooth size={11} />}
                  <span>{hr.status === "connecting" ? "Conectando..." : hr.status === "disconnected" ? "Reconectar FC" : "Monitor de FC"}</span>
                </button>
              )}
              {hr.status === "connected" && (
                <button
                  onClick={hr.disconnect}
                  className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 text-xs hover:bg-red-500/20 transition-all"
                  data-testid="button-disconnect-hr"
                >
                  <BluetoothOff size={11} /> Desconectar
                </button>
              )}
            </div>
          </div>

          <div className="px-6 pb-10 pt-4">
            <Button
              className="w-full h-14 rounded-2xl font-bold text-lg bg-red-500 hover:bg-red-600 text-white"
              onClick={handleStartEndCapture}
              data-testid="button-checkout"
            >
              <LogOut className="mr-2" size={18} /> Fazer Check-out
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

            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-green-400 font-bold uppercase tracking-wider text-center mb-2">Check-in</p>
                <div className="flex justify-center gap-3">
                  {startFrontPreview && (
                    <div className="text-center">
                      <div className="w-24 h-32 rounded-xl overflow-hidden border-2 border-green-500/50">
                        <img src={startFrontPreview} alt="Selfie início" className="w-full h-full object-cover" />
                      </div>
                      <p className="text-[9px] text-white/40 mt-1">Selfie</p>
                    </div>
                  )}
                  {startBackPreview && (
                    <div className="text-center">
                      <div className="w-24 h-32 rounded-xl overflow-hidden border-2 border-green-500/30">
                        <img src={startBackPreview} alt="Ambiente início" className="w-full h-full object-cover" />
                      </div>
                      <p className="text-[9px] text-white/40 mt-1">Ambiente</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider text-center mb-2">Check-out</p>
                <div className="flex justify-center gap-3">
                  {endFrontPreview && (
                    <div className="text-center">
                      <div className="w-24 h-32 rounded-xl overflow-hidden border-2 border-blue-500/50">
                        <img src={endFrontPreview} alt="Selfie fim" className="w-full h-full object-cover" />
                      </div>
                      <p className="text-[9px] text-white/40 mt-1">Selfie</p>
                    </div>
                  )}
                  {endBackPreview && (
                    <div className="text-center">
                      <div className="w-24 h-32 rounded-xl overflow-hidden border-2 border-blue-500/30">
                        <img src={endBackPreview} alt="Ambiente fim" className="w-full h-full object-cover" />
                      </div>
                      <p className="text-[9px] text-white/40 mt-1">Ambiente</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={`grid ${showCalories ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center gap-3">
                <Timer size={20} className="text-primary shrink-0" />
                <div>
                  <p className="text-lg font-bold">{formatDuration(elapsedSeconds)}</p>
                  <p className="text-[10px] text-white/50 uppercase">Duração</p>
                </div>
              </div>
              {showCalories && (
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center gap-3">
                  <Flame size={20} className="text-orange-400 shrink-0" />
                  <div>
                    <p className="text-lg font-bold">{calories} kcal</p>
                    <p className="text-[10px] text-white/50 uppercase">Calorias</p>
                  </div>
                </div>
              )}
              {showDistanceUI && !indoorMode && (
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
              {hr.getAvgBpm() && (
                <div className="col-span-2 bg-red-500/10 rounded-2xl p-4 border border-red-500/30 flex items-center gap-4">
                  <Heart size={20} className="text-red-400 fill-red-400 shrink-0" />
                  <div className="flex-1">
                    <p className="text-lg font-bold" data-testid="text-bpm-avg">{hr.getAvgBpm()} bpm</p>
                    <p className="text-[10px] text-white/50 uppercase">Freq. Cardíaca Média</p>
                  </div>
                  {hr.maxBpm && (
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-300">{hr.maxBpm} bpm</p>
                      <p className="text-[9px] text-white/40 uppercase">Máxima</p>
                    </div>
                  )}
                </div>
              )}
              {showDistanceUI && indoorMode && (
                <div className="col-span-2 space-y-3">
                  {indoorProofPreview && (
                    <div className="bg-orange-500/10 rounded-2xl p-4 border border-orange-500/30">
                      <div className="flex items-center gap-2 mb-3">
                        <Camera size={16} className="text-orange-400" />
                        <p className="text-xs text-orange-300 font-bold uppercase">Foto do Painel</p>
                      </div>
                      <div className="relative rounded-xl overflow-hidden border border-orange-500/30">
                        <img
                          src={indoorProofPreview}
                          alt="Painel do equipamento"
                          className="w-full h-40 object-cover"
                          data-testid="img-indoor-proof"
                        />
                        <button
                          className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5"
                          onClick={() => {
                            setIndoorProofBlob(null);
                            setIndoorProofPreview("");
                            setPhase("camera-indoor-proof");
                            startCamera("environment");
                          }}
                          data-testid="button-retake-indoor-proof"
                        >
                          <Camera size={14} className="text-white" />
                        </button>
                      </div>
                      <p className="text-[10px] text-white/40 mt-2 text-center">Comprovação de distância no equipamento</p>
                    </div>
                  )}
                  <div className="bg-orange-500/10 rounded-2xl p-4 border border-orange-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Ruler size={16} className="text-orange-400" />
                      <p className="text-xs text-orange-300 font-bold uppercase">Distância (Indoor)</p>
                    </div>
                    <p className="text-[10px] text-white/50 mb-2">Informe a distância exibida no painel do equipamento</p>
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
                </div>
              )}
              {vType === "repeticoes" && (
                <div className="col-span-2 bg-purple-500/10 rounded-2xl p-4 border border-purple-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame size={16} className="text-purple-400" />
                    <p className="text-xs text-purple-300 font-bold uppercase">Repetições</p>
                  </div>
                  <p className="text-[10px] text-white/50 mb-2">Quantas repetições você fez neste treino?</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="0"
                      value={repsCount}
                      onChange={(e) => setRepsCount(e.target.value)}
                      className="flex-1 h-12 bg-black/50 border border-purple-500/30 rounded-xl px-4 text-xl font-bold text-purple-400 placeholder:text-white/20 focus:outline-none focus:border-purple-500"
                      data-testid="input-reps"
                    />
                    <span className="text-lg font-bold text-purple-400">reps</span>
                  </div>
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
              onClick={() => {
                setEndFrontBlob(null); setEndFrontPreview("");
                setEndBackBlob(null); setEndBackPreview("");
                setIndoorProofBlob(null); setIndoorProofPreview("");
                setPhase("in-progress");
              }}
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

      {phase === "done" && !offlinePending && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
            <CheckCircle size={40} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Check-out Concluído!</h2>
          <p className="text-sm text-white/50">Redirecionando...</p>
        </div>
      )}

      {phase === "done" && offlinePending && (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
            {syncing ? (
              <Loader2 size={40} className="text-orange-400 animate-spin" />
            ) : (
              <CloudUpload size={40} className="text-orange-400" />
            )}
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">
              {syncing ? "Enviando dados..." : "Salvo — aguardando conexão"}
            </h2>
            <p className="text-sm text-white/50 max-w-xs mx-auto">
              {syncing
                ? "Estamos enviando suas fotos e dados para o servidor."
                : "Suas fotos e dados estão seguros no dispositivo. Assim que você reconectar, tudo será enviado automaticamente."}
            </p>
          </div>
          {!syncing && (
            <div className="w-full max-w-xs space-y-3">
              {syncError && (
                <div className="px-4 py-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 text-left">
                  <p className="font-bold mb-1">Erro ao sincronizar:</p>
                  <p>{syncError}</p>
                </div>
              )}
              <button
                className="w-full px-6 py-3 rounded-2xl bg-white/10 border border-white/20 text-sm font-bold"
                onClick={() => setLocation(`/challenge/${id}`)}
              >
                Voltar ao Desafio
              </button>
              {syncError && (
                <button
                  className="w-full px-6 py-3 rounded-2xl bg-red-500/20 border border-red-500/30 text-sm font-bold text-red-300"
                  onClick={() => {
                    clearPendingStart();
                    clearPendingCheckout();
                    setOfflinePending(false);
                    setSyncError(null);
                    toast({ title: "Dados offline apagados", description: "Você pode fazer um novo check-in agora." });
                    setLocation(`/challenge/${id}`);
                  }}
                >
                  Descartar dados e recomeçar
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
