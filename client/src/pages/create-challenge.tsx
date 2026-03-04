import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Info, Dumbbell, Route, Target, Link as LinkIcon, CheckCircle2, Waves, Zap, Timer, Repeat, Ruler, Camera, Users, Flame, ShieldAlert, XCircle, Trophy, Lock, Globe, UserCheck, Calendar } from "lucide-react";
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
  const [scoringSystem, setScoringSystem] = useState("checkin");
  const [isPublic, setIsPublic] = useState(true);
  const [validationType, setValidationType] = useState("foto");
  const [entryValue, setEntryValue] = useState("50");
  const [customDuration, setCustomDuration] = useState("");
  const [durationPreset, setDurationPreset] = useState("30");
  const [linkCopied, setLinkCopied] = useState(false);
  const [freq, setFreq] = useState("5");
  const [minParticipants, setMinParticipants] = useState("2");
  const [invitedUsers, setInvitedUsers] = useState<string[]>([]);
  const [moderators, setModerators] = useState(["Você (Criador)"]);
  const [splitPrize, setSplitPrize] = useState(false);
  const [splitPercentages, setSplitPercentages] = useState({ 1: 50, 2: 30, 3: 20 });

  const duration = durationPreset === "custom" ? customDuration || "0" : durationPreset;
  const numParticipants = invitedUsers.length + 1;
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
              <h2 className="text-2xl font-bold">Modalidade e Nome</h2>
              <p className="text-muted-foreground">Escolha o tipo de atividade e dê um nome ao seu desafio.</p>
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
              <h2 className="text-2xl font-bold">Sistema de Pontuação</h2>
              <p className="text-muted-foreground">Como os vencedores serão definidos?</p>
            </div>
            
            <div className="space-y-3">
              {[
                { id: "checkin", title: "Check-in Diário", icon: Calendar, description: "Todos que completarem a meta de check-ins dividem o prêmio igualmente." },
                { id: "ranking", title: "Ranking de Performance", icon: Trophy, description: "O prêmio é dividido entre os TOP 3 que mais acumularem pontos (repetições, km, etc)." },
                { id: "survival", title: "Sobrevivência", icon: Flame, description: "O último a sobrar ou quem não falhar nenhum dia leva tudo." }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setScoringSystem(item.id)}
                  className={`w-full text-left p-5 rounded-3xl border-2 transition-all space-y-2 ${scoringSystem === item.id ? 'border-primary bg-primary/10 shadow-lg shadow-primary/5' : 'border-border bg-card hover:bg-muted'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${scoringSystem === item.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      <item.icon size={20} />
                    </div>
                    <span className="font-bold">{item.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                </button>
              ))}
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <div className="space-y-2">
                <Label>Método de Validação</Label>
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
              </div>
            </div>

            <Button className="w-full h-14 rounded-2xl text-lg font-semibold mt-4" onClick={() => setStep(3)}>Próximo</Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Privacidade e Moderação</h2>
              <p className="text-muted-foreground">Quem pode participar e quem gerencia o desafio?</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setIsPublic(true)}
                className={`p-5 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${isPublic ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/5' : 'border-border bg-card text-muted-foreground'}`}
              >
                <Globe size={24} />
                <div className="text-center">
                  <p className="font-bold text-sm">Público</p>
                  <p className="text-[10px] opacity-70">Aparece no Explorar</p>
                </div>
              </button>
              <button
                onClick={() => setIsPublic(false)}
                className={`p-5 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${!isPublic ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/5' : 'border-border bg-card text-muted-foreground'}`}
              >
                <Lock size={24} />
                <div className="text-center">
                  <p className="font-bold text-sm">Privado</p>
                  <p className="text-[10px] opacity-70">Apenas via link</p>
                </div>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Moderadores</Label>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[9px]">GESTÃO</Badge>
              </div>
              <div className="flex gap-2 flex-wrap mb-2">
                {moderators.map(m => <Badge key={m} variant="secondary" className="rounded-full py-1.5 px-3 bg-muted text-muted-foreground border-none font-bold text-[10px] flex gap-2 items-center">{m} {m === "Você (Criador)" && <UserCheck size={12}/>}</Badge>)}
              </div>
              <div className="flex gap-2">
                <Input placeholder="@usuario" className="h-12 rounded-xl" id="mod-input-new" />
                <Button variant="outline" className="h-12 rounded-xl px-6" onClick={() => {
                  const input = document.getElementById('mod-input-new') as HTMLInputElement;
                  if (input.value) {
                    setModerators([...moderators, input.value.startsWith('@') ? input.value : `@${input.value}`]);
                    input.value = "";
                  }
                }}>Add</Button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-600 flex gap-3">
              <ShieldAlert size={18} className="shrink-0" />
              <p className="leading-relaxed">Como criador, você é o moderador padrão e deve validar as provas enviadas pelos participantes.</p>
            </div>

            <Button className="w-full h-14 rounded-2xl text-lg font-semibold mt-4" onClick={() => setStep(4)}>Próximo</Button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Participantes e Convites</h2>
              <p className="text-muted-foreground">Quem você quer desafiar hoje?</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <Label>Convidar Membros</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="@usuario" 
                    className="h-12 rounded-xl" 
                    id="invite-input-v2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.currentTarget;
                        if (input.value) {
                          setInvitedUsers([...invitedUsers, input.value.startsWith('@') ? input.value : `@${input.value}`]);
                          input.value = "";
                        }
                      }
                    }}
                  />
                  <Button variant="outline" className="h-12 rounded-xl px-6" onClick={() => {
                    const input = document.getElementById('invite-input-v2') as HTMLInputElement;
                    if (input.value) {
                      setInvitedUsers([...invitedUsers, input.value.startsWith('@') ? input.value : `@${input.value}`]);
                      input.value = "";
                    }
                  }}>Convidar</Button>
                </div>
                
                {invitedUsers.length > 0 && (
                  <div className="flex gap-2 flex-wrap p-3 bg-muted/30 rounded-2xl animate-in fade-in zoom-in-95 duration-200">
                    {invitedUsers.map((user, i) => (
                      <Badge key={i} className="bg-primary/10 text-primary border-primary/20 py-1.5 px-3 rounded-full flex gap-2 items-center">
                        {user}
                        <button onClick={() => setInvitedUsers(invitedUsers.filter((_, idx) => idx !== i))} className="hover:text-destructive transition-colors">
                          <XCircle size={14} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <Label>Duração e Frequência</Label>
                <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Dias</p>
                    <Select value={durationPreset} onValueChange={setDurationPreset}>
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 dias</SelectItem>
                        <SelectItem value="30">30 dias</SelectItem>
                        <SelectItem value="custom">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Check-ins/Semana</p>
                    <Select value={freq} onValueChange={setFreq}>
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6,7].map(n => <SelectItem key={n} value={String(n)}>{n}x</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {durationPreset === "custom" && <Input type="number" placeholder="Ex: 15 dias" value={customDuration} onChange={(e) => setCustomDuration(e.target.value)} className="h-12 rounded-xl" />}
              </div>
            </div>

            <Button className="w-full h-14 rounded-2xl text-lg font-semibold mt-4" onClick={() => setStep(5)}>Próximo</Button>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Finanças</h2>
              <p className="text-muted-foreground">Último passo: defina o compromisso financeiro.</p>
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
                  <span className="text-muted-foreground">Pote Simulado ({invitedUsers.length + 1} pessoas)</span>
                  <span className="font-bold text-primary text-lg">R$ {prizePool.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">*Já descontados 10% da taxa da plataforma</p>
            </div>

            <Button 
              className="w-full h-14 rounded-2xl text-lg font-semibold mt-4 shadow-lg shadow-primary/20" 
              onClick={() => setLocation("/dashboard")} 
              disabled={isEntryInvalid || (splitPrize && Object.values(splitPercentages).reduce((a, b) => a + b, 0) !== 100)}
            >
              Publicar Desafio
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}