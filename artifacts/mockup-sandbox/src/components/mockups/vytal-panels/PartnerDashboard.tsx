import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function PartnerDashboard() {
  const [tab, setTab] = useState("overview");

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      <div className="max-w-md mx-auto">
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg">
                GH
              </div>
              <div>
                <h1 className="text-lg font-bold">Growth Suplementos</h1>
                <p className="text-xs text-gray-400">Parceiro desde Jan/2026</p>
              </div>
            </div>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">
              Parceiro Premium
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 px-5 mb-5">
          <Card className="bg-[#141414] border-[#222] rounded-2xl">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-blue-400">24.5k</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Impressões</p>
            </CardContent>
          </Card>
          <Card className="bg-[#141414] border-[#222] rounded-2xl">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-white">8</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Desafios Patrocinados</p>
            </CardContent>
          </Card>
          <Card className="bg-[#141414] border-[#222] rounded-2xl">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-emerald-400">312</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Cupons Resgatados</p>
            </CardContent>
          </Card>
        </div>

        <div className="px-5">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid grid-cols-3 bg-[#141414] rounded-xl h-10 mb-4">
              <TabsTrigger value="overview" className="rounded-lg text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white">Métricas</TabsTrigger>
              <TabsTrigger value="campaigns" className="rounded-lg text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white">Campanhas</TabsTrigger>
              <TabsTrigger value="coupons" className="rounded-lg text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white">Cupons</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-0">
              <Card className="bg-[#141414] border-[#222] rounded-2xl">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <span>📈</span> Performance Semanal
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="flex items-end gap-1 h-28 mb-3">
                    {[35, 52, 48, 65, 72, 58, 84].map((v, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full bg-blue-500/80 rounded-t-md transition-all"
                          style={{ height: `${v}%` }}
                        />
                        <span className="text-[9px] text-gray-500">
                          {["S", "T", "Q", "Q", "S", "S", "D"][i]}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#1a1a1a] rounded-xl p-3">
                      <p className="text-[10px] text-gray-500">CTR</p>
                      <p className="text-lg font-bold">4.2%</p>
                      <p className="text-[10px] text-emerald-400">+0.8% vs semana anterior</p>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-xl p-3">
                      <p className="text-[10px] text-gray-500">Conversão</p>
                      <p className="text-lg font-bold">12.7%</p>
                      <p className="text-[10px] text-emerald-400">+2.3% vs semana anterior</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#141414] border-[#222] rounded-2xl">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <span>🎯</span> Alcance por Categoria
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  {[
                    { cat: "CrossFit", pct: 42, color: "bg-blue-500" },
                    { cat: "Corrida", pct: 28, color: "bg-purple-500" },
                    { cat: "Musculação", pct: 18, color: "bg-emerald-500" },
                    { cat: "Outros", pct: 12, color: "bg-gray-500" },
                  ].map((c, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">{c.cat}</span>
                        <span className="font-medium">{c.pct}%</span>
                      </div>
                      <div className="h-2 bg-[#222] rounded-full overflow-hidden">
                        <div className={`h-full ${c.color} rounded-full`} style={{ width: `${c.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="campaigns" className="space-y-3 mt-0">
              {[
                { title: "Desafio Growth 30 Dias", type: "Patrocínio", reach: "3.2k", status: "Ativo", statusColor: "bg-emerald-500", budget: "R$ 500" },
                { title: "Maratona São Paulo", type: "Banner + Cupom", reach: "8.1k", status: "Ativo", statusColor: "bg-emerald-500", budget: "R$ 1.200" },
                { title: "WOD Challenge", type: "Cupom", reach: "1.8k", status: "Finalizado", statusColor: "bg-gray-500", budget: "R$ 300" },
                { title: "Summer Body", type: "Patrocínio", reach: "5.4k", status: "Agendado", statusColor: "bg-yellow-500", budget: "R$ 800" },
              ].map((c, i) => (
                <Card key={i} className="bg-[#141414] border-[#222] rounded-2xl">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-bold">{c.title}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{c.type} • Alcance: {c.reach}</p>
                      </div>
                      <Badge className={`${c.statusColor} text-white border-none text-[10px]`}>{c.status}</Badge>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#222]">
                      <span className="text-[10px] text-gray-500">Investimento</span>
                      <span className="text-sm font-bold text-blue-400">{c.budget}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 font-bold mt-2">
                + Nova Campanha
              </Button>
            </TabsContent>

            <TabsContent value="coupons" className="space-y-3 mt-0">
              <Card className="bg-blue-500/10 border-blue-500/20 rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-blue-400 font-medium">Cupons ativos</p>
                      <p className="text-2xl font-bold mt-1">3 cupons</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Total resgatados</p>
                      <p className="text-lg font-bold text-emerald-400">312</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {[
                { code: "GROWTH20", discount: "20% OFF", used: 156, limit: 300, product: "Whey Protein" },
                { code: "CREATINA15", discount: "15% OFF", used: 98, limit: 200, product: "Creatina" },
                { code: "FRETE0", discount: "Frete Grátis", used: 58, limit: 100, product: "Qualquer produto" },
              ].map((c, i) => (
                <Card key={i} className="bg-[#141414] border-[#222] rounded-2xl">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-bold font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-lg">{c.code}</code>
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">{c.discount}</Badge>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">{c.product}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-gray-500">Resgates</span>
                        <span className="text-gray-400">{c.used}/{c.limit}</span>
                      </div>
                      <div className="h-1.5 bg-[#222] rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(c.used / c.limit) * 100}%` }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button variant="outline" className="w-full h-12 rounded-2xl border-[#333] bg-transparent text-white font-bold mt-2">
                + Criar Novo Cupom
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        <div className="h-20" />
      </div>
    </div>
  );
}
