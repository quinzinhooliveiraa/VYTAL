import { useState, useEffect } from "react";
import { Download, X, Share, PlusSquare } from "lucide-react";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export function PwaInstallBanner() {
  const { canInstall, isInstalled, install, isIOS } = usePwaInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    const dismissedAt = localStorage.getItem("vytal-pwa-banner-dismissed");
    if (dismissedAt) {
      const hoursSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60);
      if (hoursSince < 24) {
        setDismissed(true);
      } else {
        localStorage.removeItem("vytal-pwa-banner-dismissed");
      }
    }
  }, []);

  if (isInstalled || dismissed) return null;
  if (!canInstall && !isIOS) return null;

  const handleDismiss = () => {
    localStorage.setItem("vytal-pwa-banner-dismissed", Date.now().toString());
    setDismissed(true);
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    const accepted = await install();
    if (accepted) {
      setDismissed(true);
    }
  };

  return (
    <>
      <div
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md animate-in slide-in-from-bottom-2"
        data-testid="pwa-install-banner"
      >
        <div className="bg-card border border-border rounded-2xl p-3 shadow-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Instalar VYTAL</p>
            <p className="text-xs text-muted-foreground truncate">Acesso rápido na sua tela inicial</p>
          </div>
          <button
            onClick={handleInstall}
            className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
            data-testid="button-install-pwa"
          >
            Instalar
          </button>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground p-1 shrink-0"
            data-testid="button-dismiss-pwa-banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showIOSGuide && (
        <div className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" data-testid="ios-install-guide">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 space-y-4 animate-in slide-in-from-bottom-4">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-foreground text-base">Instalar no iPhone</h3>
              <button onClick={() => setShowIOSGuide(false)} className="text-muted-foreground hover:text-foreground p-1" data-testid="button-close-ios-guide">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0">1</span>
                <span>Toque no ícone <Share className="w-4 h-4 inline-block mx-1 text-primary" /> <strong>Compartilhar</strong> na barra do Safari</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0">2</span>
                <span>Role e toque em <PlusSquare className="w-4 h-4 inline-block mx-1 text-primary" /> <strong>Adicionar à Tela de Início</strong></span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0">3</span>
                <span>Toque em <strong>Adicionar</strong> no canto superior direito</span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full bg-muted text-foreground rounded-xl py-3 px-4 font-medium text-sm hover:bg-muted/80 transition-colors"
              data-testid="button-understood-ios"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
