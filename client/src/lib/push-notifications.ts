export async function subscribeToPush(): Promise<boolean> {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;

    const res = await fetch("/api/push/vapid-key", { credentials: "include" });
    const { publicKey } = await res.json();
    if (!publicKey) return false;

    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      await saveSubscription(existing);
      return true;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    await saveSubscription(subscription);
    return true;
  } catch (e) {
    console.error("Push subscription failed:", e);
    return false;
  }
}

async function saveSubscription(subscription: PushSubscription): Promise<void> {
  const raw = subscription.toJSON();
  await fetch("/api/push/subscribe", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: raw.endpoint,
      keys: {
        p256dh: raw.keys?.p256dh,
        auth: raw.keys?.auth,
      },
    }),
  });
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function sendTestPush(): Promise<boolean> {
  try {
    const res = await fetch("/api/push/test", { method: "POST", credentials: "include" });
    return res.ok;
  } catch {
    return false;
  }
}
