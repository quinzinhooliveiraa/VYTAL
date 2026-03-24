const PENDING_START_KEY = "vytal_offline_checkin_start";
const PENDING_CHECKOUT_KEY = "vytal_offline_checkout";

export interface PendingStart {
  localId: string;
  challengeId: string;
  frontB64: string;
  backB64: string;
  latitude: string | null;
  longitude: string | null;
  locationName: string;
  isIndoor: boolean;
  savedAt: string;
}

export interface PendingCheckout {
  serverCheckInId: string;
  challengeId: string;
  endFrontB64: string;
  endBackB64: string;
  indoorProofB64?: string;
  endLatitude: string | null;
  endLongitude: string | null;
  distanceKm: string | null;
  caloriesBurned: number | null;
  avgPace: string | null;
  reps: number | null;
  avgBpm: number | null;
  maxBpm: number | null;
  elapsedSeconds: number;
  savedAt: string;
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function base64ToBlob(b64: string): Promise<Blob> {
  const res = await fetch(b64);
  return res.blob();
}

export function savePendingStart(data: PendingStart): void {
  try {
    localStorage.setItem(PENDING_START_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Erro ao salvar check-in offline:", e);
  }
}

export function getPendingStart(): PendingStart | null {
  try {
    const s = localStorage.getItem(PENDING_START_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function clearPendingStart(): void {
  localStorage.removeItem(PENDING_START_KEY);
}

export function savePendingCheckout(data: PendingCheckout): void {
  try {
    localStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Erro ao salvar checkout offline:", e);
  }
}

export function getPendingCheckout(): PendingCheckout | null {
  try {
    const s = localStorage.getItem(PENDING_CHECKOUT_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function clearPendingCheckout(): void {
  localStorage.removeItem(PENDING_CHECKOUT_KEY);
}

export function hasPendingOfflineData(): boolean {
  return !!getPendingStart() || !!getPendingCheckout();
}
