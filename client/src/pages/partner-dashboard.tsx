import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, BarChart3, Megaphone, Tag, TrendingUp, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";

export default function PartnerDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [tab, setTab] = useState("overview");

  const hasAccess = user?.isAdmin || user?.role === "partner" || user?.role === "organizer_partner";

  if (!hasAccess) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 p-6">
        <Shield size={48} className="text-muted-foreground" />
        <p className="text-lg font-bold">Acesso restrito</p>
        <p className="text-sm text-muted-foreground text-center">Apenas administradores podem acessar esta página.</p>
        <Button onClick={() => setLocation("/dashboard")} data-testid="button-back-dashboard">Voltar</Button>
      </div>
    );
  }

  const partners = [
    { name: "Growth Suplementos", segment: "Suplementos", impressions: 24500, coupons: 312, initials: "GH", tier: "Premium" },
    { name: "Nike Running", segment: "Esportivo", impressions: 18200, coupons: 156, initials: "NK", tier: "Premium" },
    { name: "Nutri Fit", segment: "Nutrição", impressions: 8400, coupons: 89, initials: "NF", tier: "Básico" },
  ];

  const campaigns = [
    { title: "Desafio Growth 30 Dias", partner: "Growth Suplementos", type: "Patrocínio", reach: "3.2k", status: "active", budget: 500 },
    { title: "Maratona São Paulo", partner: "Nike Running", type: "Banner + Cupom", reach: "8.1k", status: "active", budget: 1200 },
    { title: "WOD Challenge", partner: "Nutri Fit", type: "Cupom", reach: "1.8k", status: "ended", budget: 300 },
    { title: "Summer Body", partner: "Growth Suplementos", type: "Patrocínio", reach: "5.4k", status: "scheduled", budget: 800 },
  ];

  const coupons = [
    { code: "GROWTH20", discount: "20% OFF", used: 156, limit: 300, product: "Whey Protein", partner: "Growth Suplementos" },
    { code: "NIKE10", discount: "10% OFF", used: 98, limit: 500, product: "Tênis Running", partner: "Nike Running" },
    { code: "NUTRI15", discount: "15% OFF", used: 58, limit: 100, product: "Plano Nutricional", partner: "Nutri Fit" },
  ];

  const weekData = [35, 52, 48, 65, 72, 58, 84];
  const dayLabels = ["S", "T", "Q", "Q", "S", "S", "D"];
  const totalImpressions = partners.reduce((s, p) => s + p.impressions, 0);
  const totalCoupons = partners.reduce((s, p) => s + p.coupons, 0);

  const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const formatK = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v);

  const statusLabel = (s: string) => s === "active" ? "Ativo" : s === "ended" ? "Finalizado" : "Agendado";
  const statusColor = (s: string) => s === "active" ? "bg-primary text-white" : s === "ended" ? "bg-muted text-muted-foreground" : "bg-yellow-500 text-white";

  return (
    <div className="max-w-md mx-auto pb-24">
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setLocation("/settings")} className="p-2 -ml-2 rounded-full hover:bg-muted" data-testid="button-back">
            <ChevronLeft size={22} />
          </button>
          <div>
            <h1 className="text-xl font-display font-bold">Painel de Parceiros</h1>
            <p className="text-xs text-muted-foreground">Gerencie parcerias e campanhas</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-card border rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold text-blue-500">{formatK(totalImpressions)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Impressões</p>
          </div>
          <div className="bg-card border rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold">{partners.length}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Parceiros</p>
          </div>
          <div className="bg-card border rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold text-primary">{totalCoupons}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Cupons Usados</p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-3 h-10 rounded-xl mb-4">
            <TabsTrigger value="overview" className="rounded-lg text-xs font-bold">Métricas</TabsTrigger>
            <TabsTrigger value="campaigns" className="rounded-lg text-xs font-bold">Campanhas</TabsTrigger>
            <TabsTrigger value="coupons" className="rounded-lg text-xs font-bold">Cupons</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-0">
            <div className="bg-card border rounded-2xl p-4">
              <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                <BarChart3 size={16} className="text-blue-500" /> Performance Semanal
              </h3>
              <div className="flex items-end gap-1 h-28 mb-3">
                {weekData.map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-blue-500/80 rounded-t-md transition-all" style={{ height: `${v}%` }} />
                    <span className="text-[9px] text-muted-foreground">{dayLabels[i]}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground">CTR</p>
                  <p className="text-lg font-bold">4.2%</p>
                  <p className="text-[10px] text-primary">+0.8% vs semana anterior</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground">Conversão</p>
                  <p className="text-lg font-bold">12.7%</p>
                  <p className="text-[10px] text-primary">+2.3% vs semana anterior</p>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-2xl p-4">
              <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-purple-500" /> Alcance por Categoria
              </h3>
              <div className="space-y-3">
                {[
                  { cat: "CrossFit", pct: 42, color: "bg-blue-500" },
                  { cat: "Corrida", pct: 28, color: "bg-purple-500" },
                  { cat: "Musculação", pct: 18, color: "bg-primary" },
                  { cat: "Outros", pct: 12, color: "bg-muted-foreground" },
                ].map((c, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{c.cat}</span>
                      <span className="font-medium">{c.pct}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${c.color} rounded-full`} style={{ width: `${c.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border rounded-2xl p-4">
              <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                <Megaphone size={16} className="text-cyan-500" /> Parceiros Ativos
              </h3>
              <div className="space-y-3">
                {partners.map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-xs">
                        {p.initials}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">{p.segment} • {formatK(p.impressions)} impressões</p>
                      </div>
                    </div>
                    <Badge className={`text-[9px] ${p.tier === "Premium" ? "bg-blue-500/20 text-blue-500 border-blue-500/30" : "bg-muted text-muted-foreground"}`}>
                      {p.tier}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-3 mt-0">
            {campaigns.map((c, i) => (
              <div key={i} className="bg-card border rounded-2xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold">{c.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{c.partner} • {c.type} • Alcance: {c.reach}</p>
                  </div>
                  <Badge className={`${statusColor(c.status)} border-none text-[10px]`}>{statusLabel(c.status)}</Badge>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t">
                  <span className="text-[10px] text-muted-foreground">Investimento</span>
                  <span className="text-sm font-bold text-blue-500">{formatBRL(c.budget)}</span>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="coupons" className="space-y-3 mt-0">
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-500 font-medium">Cupons ativos</p>
                  <p className="text-2xl font-bold mt-1">{coupons.length}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total resgatados</p>
                  <p className="text-lg font-bold text-primary">{totalCoupons}</p>
                </div>
              </div>
            </div>

            {coupons.map((c, i) => (
              <div key={i} className="bg-card border rounded-2xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-bold font-mono bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-lg">{c.code}</code>
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">{c.discount}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{c.partner} • {c.product}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-muted-foreground">Resgates</span>
                    <span>{c.used}/{c.limit}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(c.used / c.limit) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
