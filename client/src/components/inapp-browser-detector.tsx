import { useState, useEffect } from "react";
import { X, ExternalLink, Copy, Check } from "lucide-react";

function detectInAppBrowser(): string | null {
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || "";
  if (/Instagram/i.test(ua)) return "Instagram";
  if (/musical_ly|BytedanceWebview|TikTok/i.test(ua)) return "TikTok";
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return "Facebook";
  if (/Twitter|TwitterAndroid/i.test(ua)) return "Twitter";
  if (/LinkedInApp/i.test(ua)) return "LinkedIn";
  if (/Snapchat/i.test(ua)) return "Snapchat";
  return null;
}

export function InAppBrowserDetector() {
  const [appName, setAppName] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const detected = detectInAppBrowser();
    const wasDismissed = sessionStorage.getItem("vytal-inapp-dismissed");
    if (detected && !wasDismissed) {
      setAppName(detected);
    }
  }, []);

  if (!appName || dismissed) return null;

  const currentUrl = window.location.origin;
  const isAndroid = /android/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const handleDismiss = () => {
    sessionStorage.setItem("vytal-inapp-dismissed", "true");
    setDismissed(true);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = currentUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenExternal = () => {
    if (isAndroid) {
      window.open(`intent://${currentUrl.replace(/^https?:\/\//, "")}#Intent;scheme=https;end`, "_blank");
    } else {
      window.open(currentUrl, "_system");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" data-testid="inapp-browser-overlay">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 space-y-4 animate-in slide-in-from-bottom-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
              <ExternalLink className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-base">Abrir no navegador</h3>
              <p className="text-xs text-muted-foreground">Navegador do {appName} detectado</p>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground p-1" data-testid="button-dismiss-inapp">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          Você está no navegador interno do <strong>{appName}</strong>. Para instalar o app e ter a melhor experiência, abra no {isIOS ? "Safari" : "Chrome"}.
        </p>

        <div className="space-y-3">
          {isIOS ? (
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <p className="text-sm font-medium text-foreground">Como abrir no Safari:</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">1</span>
                Toque no ícone <strong>⋯</strong> (menu) {appName === "Instagram" ? "no canto inferior direito" : "no canto superior"}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">2</span>
                Selecione <strong>"Abrir no Safari"</strong> ou <strong>"Abrir no navegador"</strong>
              </div>
            </div>
          ) : (
            <button
              onClick={handleOpenExternal}
              className="w-full bg-primary text-primary-foreground rounded-xl py-3 px-4 font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
              data-testid="button-open-browser"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir no Chrome
            </button>
          )}

          <button
            onClick={handleCopy}
            className="w-full bg-muted text-foreground rounded-xl py-3 px-4 font-medium text-sm flex items-center justify-center gap-2 hover:bg-muted/80 transition-colors"
            data-testid="button-copy-url"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-500" />
                Link copiado!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copiar link
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Cole o link no {isIOS ? "Safari" : "Chrome"} para instalar o app
        </p>
      </div>
    </div>
  );
}
