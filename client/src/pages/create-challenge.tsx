import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Info, Dumbbell, Route, Target, Link as LinkIcon, CheckCircle2, Waves, Zap, Timer, Repeat, Ruler, Camera, Users, Flame, ShieldAlert, XCircle, Trophy, Lock, Globe, UserCheck, Calendar, Copy, Share2 } from "lucide-react";
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
  const [scoringSystem, setScoringSystem] = useState("ranking");
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
  const [splitPrize, setSplitPrize] = useState(true);
  const [splitPercentages, setSplitPercentages] = useState({ 1: 50, 2: 30, 3: 20 });
  const [challengeName, setChallengeName] = useState("");
  const [challengeDesc, setChallengeDesc] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
              <h2 className="text-2xl font-bold">Informações Básicas</h2>
              <p className="text-muted-foreground">Nome, descrição e datas do desafio.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Modalidade</Label>
                <div className="grid grid-cols-3 gap-3">
                  {modalidades.map((mod) => (
                    <button
                      key={mod.id}
                      onClick={() => setModalidade(mod.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${modalidade === mod.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:bg-muted'}`}
                    >
                      <mod.icon size={18} className="mb-1" />
                      <span className="text-[9px] font-semibold text-center">{mod.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nome do Desafio</Label>
                <Input 
                  placeholder="Ex: Maratona de Inverno" 
                  value={challengeName}
                  onChange={(e) => setChallengeName(e.target.value)}
                  className="h-12 rounded-xl px-4" 
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input 
                  placeholder="Descreva o objetivo e regras do desafio" 
                  value={challengeDesc}
                  onChange={(e) => setChallengeDesc(e.target.value)}
                  className="h-12 rounded-xl px-4" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Data de Início</Label>
                  <Input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-12 rounded-xl px-4" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Duração (dias)</Label>
                  <Select value={durationPreset} onValueChange={setDurationPreset}>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 dias</SelectItem>
                      <SelectItem value="14">14 dias</SelectItem>
                      <SelectItem value="30">30 dias</SelectItem>
                      <SelectItem value="90">90 dias</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {durationPreset === "custom" && (
                <div className="space-y-2">
                  <Label className="text-xs">Duração Personalizada (dias)</Label>
                  <Input 
                    type="number" 
                    placeholder="Ex: 15" 
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                    className="h-12 rounded-xl" 
                  />
                </div>
              )}

              {startDate && (
                <div className="p-4 bg-muted/50 rounded-2xl border border-border/50">
                  <p className="text-xs text-muted-foreground mb-2">Data Final Estimada:</p>
                  <p className="text-sm font-bold">{new Date(startDate).toLocaleDateString('pt-BR')}</p>
                </div>
              )}
            </div>

            <Button 
              className="w-full h-14 rounded-2xl text-lg font-semibold mt-4" 
              onClick={() => setStep(2)}
              disabled={!challengeName || !startDate}
            >
              Próximo
            </Button>
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
                { id: "ranking", title: "Ranking de Performance", icon: Trophy, description: "O prêmio é dividido entre os TOP 3 que mais acumularem pontos." },
                { id: "survival", title: "Sobrevivência", icon: Flame, description: "O último a sobrar ou quem não falhar nenhum dia leva tudo." }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setScoringSystem(item.id)}
                  className={`w-full text-left p-5 rounded-3xl border-2 transition-all space-y-2 ${scoringSystem === item.id ? 'border-primary bg-primary/10' : 'border-border bg-card hover:bg-muted'}`}
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

            <div className="space-y-4 pt-6 border-t border-border">
              <div className="space-y-3">
                <Label>Método de Validação (Recomendado para {modalidades.find(m => m.id === modalidade)?.label})</Label>
                <div className="grid grid-cols-2 gap-3">
                  {validationTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setValidationType(type.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${validationType === type.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:bg-muted'}`}
                    >
                      <type.icon size={18} />
                      <span className="text-xs font-semibold text-center">{type.label}</span>
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
              <h2 className="text-2xl font-bold">Defina o Valor</h2>
              <p className="text-muted-foreground">Quanto cada pessoa vai investir no desafio?</p>
            </div>

            <div className="glass-card rounded-3xl p-6 text-center space-y-4">
              <Label className="uppercase text-[10px] tracking-widest text-muted-foreground">
                Entrada Mínima: R$ 10
              </Label>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-display text-muted-foreground">R$</span>
                <input 
                  type="number" 
                  min="10" 
                  value={entryValue} 
                  onChange={(e) => setEntryValue(e.target.value)} 
                  className="bg-transparent text-5xl font-display font-bold w-32 text-center outline-none" 
                />
              </div>
              
              <div className="pt-4 border-t border-border">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-2xl">
                    <div className="text-left">
                      <p className="text-xs font-bold">Dividir prêmio entre TOP 3</p>
                      <p className="text-[10px] text-muted-foreground">(Recomendado)</p>
                    </div>
                    <Switch checked={splitPrize} onCheckedChange={setSplitPrize} />
                  </div>

                  {splitPrize && (
                    <div className="space-y-3 p-4 bg-muted/30 rounded-2xl animate-in zoom-in-95 duration-200">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Distribuição TOP 3 (%)</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3].map((pos) => (
                          <div key={pos} className="space-y-1">
                            <Label className="text-[9px] font-bold">1º</Label>
                            <Input 
                              type="number" 
                              value={splitPercentages[pos as keyof typeof splitPercentages]} 
                              onChange={(e) => {
                                const val = Math.min(100, Math.max(0, Number(e.target.value)));
                                setSplitPercentages(prev => ({ ...prev, [pos]: val }));
                              }}
                              className="h-9 px-2 text-xs font-bold rounded-lg text-center"
                            />
                            <p className="text-[9px] font-bold text-primary text-center">{splitPercentages[pos as keyof typeof splitPercentages]}%</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-accent/10 border border-accent/20 space-y-2">
              <div className="flex gap-2 items-start">
                <Info size={18} className="text-accent shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-accent">Regra dos 10%</p>
                  <p className="text-muted-foreground">10% do pote total é destinado à plataforma para manutenção e segurança. 90% vai para os vencedores.</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-card border border-border/50 rounded-2xl space-y-2">
              <p className="text-xs text-muted-foreground">Pote com {invitedUsers.length + 1} pessoas:</p>
              <p className="text-2xl font-bold text-primary">R$ {((Number(entryValue) * (invitedUsers.length + 1)) * 0.9).toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground">*Já descontados 10% da taxa da plataforma</p>
            </div>

            <Button className="w-full h-14 rounded-2xl text-lg font-semibold mt-4" onClick={() => setStep(5)}>
              Criar Desafio
            </Button>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 flex flex-col items-center justify-center py-16">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6"
            >
              <CheckCircle2 size={40} />
            </motion.div>

            <div className="text-center space-y-2 mb-8">
              <h2 className="text-3xl font-bold">Desafio Criado!</h2>
              <p className="text-muted-foreground">{challengeName} foi criado com sucesso.</p>
            </div>

            <div className="w-full bg-card border border-border/50 rounded-3xl p-6 space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Link de Convite</p>
                <div className="flex gap-2">
                  <div className="flex-1 p-4 bg-muted/50 rounded-2xl border border-border/50 font-mono text-sm truncate">
                    challenge.app/join/abc123xyz
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-14 w-14 rounded-2xl"
                    onClick={() => copyLink()}
                  >
                    <Copy size={20} />
                  </Button>
                </div>
                {linkCopied && <p className="text-xs text-primary font-semibold">✓ Copiado!</p>}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/50">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground">Duração</p>
                  <p className="text-sm font-bold">{durationPreset} dias</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground">Entrada</p>
                  <p className="text-sm font-bold">R$ {entryValue}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground">Privacidade</p>
                  <p className="text-sm font-bold">{isPublic ? "Público" : "Privado"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground">Participantes</p>
                  <p className="text-sm font-bold">{invitedUsers.length + 1} (você + convidados)</p>
                </div>
              </div>
            </div>

            <div className="w-full flex flex-col gap-3 mt-8">
              <Button 
                className="w-full h-14 rounded-2xl text-lg font-semibold flex gap-2"
                onClick={() => copyLink()}
              >
                <Share2 size={20} /> Compartilhar Desafio
              </Button>
              <Button 
                variant="outline"
                className="w-full h-14 rounded-2xl text-lg font-semibold"
                onClick={() => setLocation("/dashboard")}
              >
                Ir para Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}