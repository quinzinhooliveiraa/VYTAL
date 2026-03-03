import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Info, Dumbbell, Route, Target, Link as LinkIcon, CheckCircle2, Waves, Zap, Timer, Repeat, Ruler, Camera, Users, Flame, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function CreateChallenge() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [modalidade, setModalidade] = useState("academia");
  const [validationType, setValidationType] = useState("foto");
  const [entryValue, setEntryValue] = useState("50");
  const [customDuration, setCustomDuration] = useState("");
  const [durationPreset, setDurationPreset] = useState("30");
  const [linkCopied, setLinkCopied] = useState(false);
  const [freq, setFreq] = useState("5");
  const [minParticipants, setMinParticipants] = useState("2");
  const [moderators, setModerators] = useState(["Você (Criador)"]);
  const [splitPrize, setSplitPrize] = useState(false);
  const [splitPercentages, setSplitPercentages] = useState({ 1: 50, 2: 30, 3: 20 });

  const duration = durationPreset === "custom" ? customDuration || "0" : durationPreset;
  const numParticipants = Number(minParticipants);
  const entry = Number(entryValue);
  const isEntryInvalid = entry < 10;
  const rawTotal = entry * numParticipants;
  const prizePool = rawTotal * 0.9;
  
  const isLargeChallenge = numParticipants >= 1000;
  const needsModerators = isLargeChallenge && moderators.length < 2;

  const copyLink = () => {
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const modalidades = [
    { id: "corrida", icon: Route, label: "Corrida" },
    { id: "academia", icon: Dumbbell, label: "Academia" },
    { id: "crossfit", icon: Flame, label: "Crossfit" },
    { id: "ciclismo", icon: Zap, label: "Ciclismo" },
    { id: "natacao", icon: Waves, label: "Natação" },
    { id: "funcional", icon: Target, label: "Funcional" },
    { id: "yoga", icon: Target, label: "Yoga" },
    { id: "hiit", icon: Zap, label: "HIIT" },
    { id: "personalizado", icon: Target, label: "Livre" }
  ];

  const validationTypes = [
    { id: "foto", icon: Camera, label: "Foto" },
    { id: "tempo", icon: Timer, label: "Tempo (Início/Fim)" },
    { id: "distancia", icon: Ruler, label: "Distância" },
    { id: "repeticoes", icon: Repeat, label: "Repetições" },
    { id: "combinacao", icon: Zap, label: "Combinação" }
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="px-6 py-6 flex items-center gap-4 sticky top-0 bg-background/80 backdrop-blur-xl z-50 border-b border-border">
        <button onClick={() => step > 1 ? setStep(step - 1) : setLocation("/dashboard")} className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-display font-bold text-xl">Criar Desafio</h1>
        <div className="ml-auto text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
          Passo {step}/5
        </div>
      </header>

      <div className="flex-1 p-6 space-y-8">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Modalidade</h2>
              <p className="text-muted-foreground">Escolha o tipo de atividade do desafio.</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {modalidades.map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => setModalidade(mod.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${modalidade === mod.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:bg-accent'}`}
                >
                  <mod.icon size={20} className="mb-2" />
                  <span className="text-[10px] font-semibold">{mod.label}</span>
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Nome do Desafio</Label>
              <Input placeholder="Ex: Maratona de Inverno" className="h-14 rounded-xl px-4" />
            </div>
            <Button className="w-full h-14 rounded-2xl text-lg font-semibold mt-4" onClick={() => setStep(2)}>Próximo</Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Validação</h2>
              <p className="text-muted-foreground">Como os participantes provarão o treino?</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {validationTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setValidationType(type.id)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${validationType === type.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:bg-accent'}`}
                >
                  <type.icon size={20} />
                  <span className="text-xs font-semibold">{type.label}</span>
                </button>
              ))}
            </div>
            {validationType === 'tempo' && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs text-primary flex gap-2">
                <Info size={16} className="shrink-0" />
                <p>Validação BeReal: Foto obrigatória no início e no término do exercício.</p>
              </div>
            )}
            <Button className="w-full h-14 rounded-2xl text-lg font-semibold mt-4" onClick={() => setStep(3)}>Próximo</Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Configurações</h2>
              <p className="text-muted-foreground">Duração, frequência e participantes.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Duração (Dias)</Label>
                <RadioGroup value={durationPreset} onValueChange={setDurationPreset} className="grid grid-cols-3 gap-3">
                  {["7", "30", "custom"].map(v => (
                    <div key={v}>
                      <RadioGroupItem value={v} id={`v-${v}`} className="peer sr-only" />
                      <Label htmlFor={`v-${v}`} className="flex flex-col items-center justify-center rounded-xl border-2 border-border bg-card p-4 hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all">
                        <span className="text-xl font-display font-bold">{v === 'custom' ? '...' : v}</span>
                        <span className="text-[10px] uppercase">{v === 'custom' ? 'Outro' : 'Dias'}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {durationPreset === "custom" && <Input type="number" placeholder="Ex: 15" value={customDuration} onChange={(e) => setCustomDuration(e.target.value)} className="h-12 rounded-xl mt-2" />}
              </div>
              <div className="space-y-2">
                <Label>Check-ins por Semana</Label>
                <Select value={freq} onValueChange={setFreq}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7].map(n => <SelectItem key={n} value={String(n)}>{n} vezes</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mínimo de Participantes</Label>
                <Input type="number" min="2" value={minParticipants} onChange={(e) => setMinParticipants(e.target.value)} className="h-12 rounded-xl" />
              </div>
            </div>
            <Button className="w-full h-14 rounded-2xl text-lg font-semibold mt-4" onClick={() => setStep(4)}>Próximo</Button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Finanças & Moderação</h2>
              <p className="text-muted-foreground">Defina o prêmio e quem ajuda a cuidar.</p>
            </div>
            <div className={`glass-card rounded-3xl p-6 text-center space-y-4 transition-all ${isEntryInvalid ? 'border-red-500 bg-red-500/5' : 'border-primary/20 bg-card'}`}>
              <Label className={`uppercase text-[10px] tracking-widest ${isEntryInvalid ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                {isEntryInvalid ? 'Valor mínimo: R$ 10' : 'Entrada Mínima R$ 10'}
              </Label>
              <div className="flex items-center justify-center gap-2">
                <span className={`text-2xl font-display ${isEntryInvalid ? 'text-red-500' : 'text-muted-foreground'}`}>R$</span>
                <input 
                  type="number" 
                  min="10" 
                  value={entryValue} 
                  onChange={(e) => setEntryValue(e.target.value)} 
                  className={`bg-transparent text-5xl font-display font-bold w-32 text-center outline-none ${isEntryInvalid ? 'text-red-500' : ''}`} 
                />
              </div>
              <div className="pt-4 border-t border-border flex flex-col gap-3">
                <div className="flex items-center justify-between p-2 rounded-xl bg-muted/50">
                  <div className="text-left">
                    <p className="text-xs font-bold">Dividir prêmio entre Top 3</p>
                    <p className="text-[10px] text-muted-foreground">Ideal para desafios grandes</p>
                  </div>
                  <Switch checked={splitPrize} onCheckedChange={setSplitPrize} />
                </div>

                {splitPrize && (
                  <div className="space-y-3 p-3 bg-muted/30 rounded-2xl animate-in zoom-in-95 duration-200">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-left">Distribuição (%)</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map((pos) => (
                        <div key={pos} className="space-y-1">
                          <Label className="text-[9px] font-bold">TOP {pos}</Label>
                          <div className="relative">
                            <Input 
                              type="number" 
                              value={splitPercentages[pos as keyof typeof splitPercentages]} 
                              onChange={(e) => {
                                const val = Math.min(100, Math.max(0, Number(e.target.value)));
                                setSplitPercentages(prev => ({ ...prev, [pos]: val }));
                              }}
                              className="h-9 px-2 text-xs font-bold rounded-lg text-center pr-4"
                            />
                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground">%</span>
                          </div>
                          <p className="text-[9px] font-bold text-primary">R$ {((prizePool * splitPercentages[pos as keyof typeof splitPercentages]) / 100).toFixed(0)}</p>
                        </div>
                      ))}
                    </div>
                    {Object.values(splitPercentages).reduce((a, b) => a + b, 0) !== 100 && (
                      <p className="text-[9px] text-red-500 font-bold">A soma deve ser 100% (Atual: {Object.values(splitPercentages).reduce((a, b) => a + b, 0)}%)</p>
                    )}
                  </div>
                )}
                
                <div className="flex justify-between items-center text-sm pt-2">
                  <span className="text-muted-foreground">Pote Simulado ({minParticipants} pessoas)</span>
                  <span className="font-bold text-primary text-lg">R$ {prizePool.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">*Já descontados 10% da taxa da plataforma</p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Moderadores</Label>
                {isLargeChallenge && <Badge variant="destructive" className="animate-pulse">Obrigatório para 1000+ pessoas</Badge>}
              </div>
              <div className="flex gap-2 mb-2 flex-wrap">
                {moderators.map(m => <Badge key={m} variant="secondary" className="rounded-full py-1 px-3 bg-primary/10 text-primary border-primary/20">{m}</Badge>)}
              </div>
              <div className="flex gap-2">
                <Input placeholder="@usuario" className="h-12 rounded-xl" id="mod-input" />
                <Button variant="outline" className="h-12 rounded-xl" onClick={() => {
                  const input = document.getElementById('mod-input') as HTMLInputElement;
                  if (input.value) {
                    setModerators([...moderators, input.value]);
                    input.value = "";
                  }
                }}>Add</Button>
              </div>
            </div>
            <Button 
              className="w-full h-14 rounded-2xl text-lg font-semibold mt-4" 
              onClick={() => setStep(5)} 
              disabled={needsModerators || isEntryInvalid || (splitPrize && Object.values(splitPercentages).reduce((a, b) => a + b, 0) !== 100)}
            >
              {isEntryInvalid ? "Valor mínimo R$ 10" : needsModerators ? "Adicione mais moderadores" : "Revisar"}
            </Button>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Resumo Final</h2>
              <p className="text-muted-foreground">Confira antes de publicar.</p>
            </div>
            <div className="border border-border rounded-3xl p-6 space-y-4 bg-card shadow-sm">
              <div className="flex justify-between py-2 border-b border-border"><span className="text-muted-foreground">Modalidade</span><span className="font-medium capitalize">{modalidade}</span></div>
              <div className="flex justify-between py-2 border-b border-border"><span className="text-muted-foreground">Validação</span><span className="font-medium capitalize">{validationType}</span></div>
              <div className="flex justify-between py-2 border-b border-border"><span className="text-muted-foreground">Premiação</span><span className="font-medium">{splitPrize ? "Top 3" : "Divisão Igual"}</span></div>
              <div className="flex justify-between py-2 border-b border-border"><span className="text-muted-foreground">Entrada</span><span className="font-medium text-primary">R$ {entryValue},00</span></div>
              <div className="flex justify-between py-2"><span className="text-muted-foreground">Moderadores</span><span className="font-medium">{moderators.length}</span></div>
            </div>
            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-600 flex gap-2">
              <ShieldAlert size={16} className="shrink-0" />
              <p>Desafios públicos exigem aprovação manual de cada participante pelo moderador.</p>
            </div>
            <Button className="w-full h-14 rounded-2xl text-lg font-semibold mt-4 shadow-lg shadow-primary/20" onClick={() => setLocation("/dashboard")}>Publicar & Criar</Button>
          </div>
        )}
      </div>
    </div>
  );
}