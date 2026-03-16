import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function usePwaInstall() {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const checkStandalone = () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.matchMedia("(display-mode: minimal-ui)").matches ||
      (navigator as any).standalone === true ||
      document.referrer.includes("android-app://") ||
      (window.innerHeight === screen.height && window.innerWidth === screen.width);

    const standalone = checkStandalone();
    setIsInstalled(standalone);

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    if (standalone) {
      fetch("/api/users/pwa-installed", { method: "POST", credentials: "include" }).catch(() => {});
    }

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const onDisplayChange = () => {
      if (checkStandalone()) {
        setIsInstalled(true);
        setCanInstall(false);
        fetch("/api/users/pwa-installed", { method: "POST", credentials: "include" }).catch(() => {});
      }
    };
    mediaQuery.addEventListener("change", onDisplayChange);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setCanInstall(false);
      deferredPrompt = null;
      fetch("/api/users/pwa-installed", { method: "POST", credentials: "include" }).catch(() => {});
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      mediaQuery.removeEventListener("change", onDisplayChange);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    setCanInstall(false);
    return outcome === "accepted";
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return { canInstall, isInstalled, install, isIOS };
}
