import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export default function MagicLogin() {
  const [, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setError("Link inválido ou expirado.");
      return;
    }

    fetch(`/api/auth/magic-login?token=${token}`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Link inválido ou expirado.");
        }
        return res.json();
      })
      .then(() => {
        navigate("/dashboard");
      })
      .catch((err) => {
        setError(err.message || "Erro ao acessar o link.");
      });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        {error ? (
          <>
            <p className="text-sm font-semibold text-destructive">{error}</p>
            <p className="text-xs text-muted-foreground">Solicite um novo link ao administrador.</p>
          </>
        ) : (
          <>
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Entrando na sua conta...</p>
          </>
        )}
      </div>
    </div>
  );
}
