import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ChevronLeft, Info, Dumbbell, Route, Target, Waves, Zap, Timer, Repeat, Ruler, Camera, Users, Flame, ShieldAlert, XCircle, Trophy, Lock, Globe, CheckCircle2, Copy, Share2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function CreateChallenge() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [modalidade, setModalidade] = useState("academia");
  const [scoringSystem, setScoringSystem] = useState("ranking");
  const [validationType, setValidationType] = useState("foto");
  const [isPublic, setIsPublic] = useState(true);
  const [challengeName, setChallengeName] = useState("");
  const [challengeDesc, setChallengeDesc] = useState("");
  const [startDate, setStartDate] = useState("");
  const [durationDays, setDurationDays] = useState("30");
  const [numMembers, setNumMembers] = useState("2");
  const [entryValue, setEntryValue] = useState("50");
  const [splitPrize, setSplitPrize] = useState(true);
  const [splitPercentages, setSplitPercentages] = useState({ 1: 50, 2: 30, 3: 20 });
  const [linkCopied, setLinkCopied] = useState(false);
  const [showTopThreeExplain, setShowTopThreeExplain] = useState(false);
  const [combinationSpec, setCombinationSpec] = useState("");

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

  // Calcular data final
  const calculateEndDate = () => {
    if (!startDate) return "";
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + parseInt(durationDays));
    return end.toLocaleDateString('pt-BR');
  };

  // Validações
  const isStep1Valid = challengeName.trim() && startDate && durationDays;
  const isStep2Valid = numMembers && parseInt(numMembers) >= 2;
  const isStep3Valid = scoringSystem && validationType && (validationType !== "combinacao" || combinationSpec.trim());
  const isStep4Valid = entryValue && parseInt(entryValue) >= 10;

  const numParticipants = parseInt(numMembers) || 1;
  const entry = parseInt(entryValue) || 0;
  const rawTotal = entry * numParticipants;
  const prizePool = rawTotal * 0.9;

  const copyLink = () => {
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="px-6 py-6 flex items-center gap-4 sticky top-0 bg-background/80 backdrop-blur-xl z-50 border-b border-border">
        <button onClick={() => step > 1 ? setStep(step - 1) : setLocation("/dashboard")} className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-display font-bold text-xl">Criar Desafio</h1>
        <div className="ml-auto text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
          {step < 5 ? `Passo ${step}/4` : `Concluído`}
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
                  placeholder="Descreva o objetivo e regras" 
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
                  <Input 
                    type="number"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    min="1"
                    max="365"
                    className="h-12 rounded-xl px-4" 
                  />
                </div>
              </div>

              {startDate && durationDays && (
                <div className="p-4 bg-muted/50 rounded-2xl border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Data Final Estimada:</p>
                  <p className="text-sm font-bold">{calculateEndDate()}</p>
                </div>
              )}
            </div>

            <Button 
              className="w-full h-14 rounded-2xl text-lg font-semibold mt-4" 
              onClick={() => setStep(2)}
              disabled={!isStep1Valid}
            >
              Próximo
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Participantes e Privacidade</h2>
              <p className="text-muted-foreground">Quantas pessoas vão participar? Público ou privado?</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Número de Membros (Mínimo: 2)</Label>
                <Input 
                  type="number"
                  value={numMembers}
                  onChange={(e) => setNumMembers(e.target.value)}
                  min="2"
                  className="h-12 rounded-xl px-4" 
                />
                <p className="text-[10px] text-muted-foreground">Você + {Math.max(0, parseInt(numMembers || '0') - 1)} outro(s)</p>
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <Label>Privacidade</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setIsPublic(true)}
                    className={`p-5 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${isPublic ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'}`}
                  >
                    <Globe size={24} />
                    <div className="text-center">
                      <p className="font-bold text-sm">Público</p>
                      <p className="text-[10px] opacity-70">Aparece no Explorar</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setIsPublic(false)}
                    className={`p-5 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${!isPublic ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'}`}
                  >
                    <Lock size={24} />
                    <div className="text-center">
                      <p className="font-bold text-sm">Privado</p>
                      <p className="text-[10px] opacity-70">Apenas via link</p>
                    </div>
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  💡 {isPublic ? "Qualquer pessoa pode encontrar e entrar no desafio." : "Você recebe um link de convite. Quando alguém entra pelo link, o número de participantes aumenta e os valores são recalculados automaticamente."}
                </p>
              </div>
            </div>

            <Button 
              className="w-full h-14 rounded-2xl text-lg font-semibold mt-4" 
              onClick={() => setStep(3)}
              disabled={!isStep2Valid}
            >
              Próximo
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Sistema de Pontuação & Validação</h2>
              <p className="text-muted-foreground">Como funciona e como será medido o progresso?</p>
            </div>
            
            <div className="space-y-4">
              {[
                { 
                  id: "checkin", 
                  title: "Check-in Diário", 
                  icon: Camera, 
                  description: "Apenas quem registrar check-in todos os dias (sem faltar) divide o prêmio igualmente.",
                  methods: ["foto"]
                },
                { 
                  id: "ranking", 
                  title: "Ranking de Performance", 
                  icon: Trophy, 
                  description: "O prêmio é dividido entre os TOP 3 que mais acumularem pontos.",
                  methods: ["distancia", "repeticoes", "tempo", "combinacao"]
                },
                { 
                  id: "survival", 
                  title: "Sobrevivência", 
                  icon: Flame, 
                  description: "O último a sobrar ou quem não falhar nenhum dia leva tudo.",
                  methods: ["foto", "tempo"]
                }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setScoringSystem(item.id)}
                  className={`w-full text-left p-5 rounded-3xl border-2 transition-all space-y-4 ${scoringSystem === item.id ? 'border-primary bg-primary/10' : 'border-border bg-card hover:bg-muted'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${scoringSystem === item.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      <item.icon size={20} />
                    </div>
                    <div>
                      <p className="font-bold">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {scoringSystem && (
              <div className="space-y-3 p-4 bg-primary/5 rounded-2xl border border-primary/20 animate-in zoom-in-95">
                <div className="space-y-2">
                  <p className="text-sm font-bold text-primary">Método de Validação</p>
                  <p className="text-xs text-muted-foreground">
                    Como o progresso será medido e comprovado para este sistema:
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {validationTypes
                    .filter(type => {
                      const recommendedMethods = {
                        checkin: ["foto"],
                        ranking: ["distancia", "repeticoes", "tempo", "combinacao"],
                        survival: ["foto", "tempo"]
                      };
                      return recommendedMethods[scoringSystem as keyof typeof recommendedMethods]?.includes(type.id);
                    })
                    .map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setValidationType(type.id)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${validationType === type.id ? 'border-primary bg-primary/20 text-primary' : 'border-primary/30 bg-primary/5 text-muted-foreground hover:bg-primary/10'}`}
                      >
                        <type.icon size={16} />
                        <span className="text-[10px] font-semibold text-center">{type.label}</span>
                      </button>
                    ))}
                </div>

                {validationType === "combinacao" && (
                  <div className="mt-4 p-3 bg-accent/10 border border-accent/20 rounded-xl animate-in zoom-in-95">
                    <Label className="text-sm font-bold text-accent mb-2 block">Especifique a Combinação</Label>
                    <p className="text-[10px] text-muted-foreground mb-2">Ex: Foto + Tempo, Distância + Repetições, etc</p>
                    <Input 
                      placeholder="Ex: Foto + Tempo de Treino" 
                      value={combinationSpec}
                      onChange={(e) => setCombinationSpec(e.target.value)}
                      className="h-10 rounded-xl px-3 text-sm"
                    />
                  </div>
                )}
              </div>
            )}

            <Button 
              className="w-full h-14 rounded-2xl text-lg font-semibold mt-4" 
              onClick={() => setStep(4)}
              disabled={!isStep3Valid}
            >
              Próximo
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Defina o Valor da Entrada</h2>
              <p className="text-muted-foreground">Mínimo: R$ 10</p>
            </div>

            <div className="glass-card rounded-3xl p-8 text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-display text-muted-foreground">R$</span>
                <input 
                  type="number" 
                  min="10" 
                  value={entryValue} 
                  onChange={(e) => setEntryValue(e.target.value)} 
                  className="bg-transparent text-6xl font-display font-bold outline-none text-center" 
                  style={{ width: "140px" }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setShowTopThreeExplain(!showTopThreeExplain)}
                className="w-full flex items-center justify-between p-4 bg-muted/50 rounded-2xl hover:bg-muted/70 transition-colors"
              >
                <div className="text-left">
                  <p className="text-xs font-bold">Distribuir entre TOP 3</p>
                  <p className="text-[10px] text-muted-foreground">Recomendado</p>
                </div>
                <Switch checked={splitPrize} onCheckedChange={setSplitPrize} onClick={(e) => e.stopPropagation()} />
              </button>

              {splitPrize && (
                <div className="space-y-3 p-4 bg-muted/30 rounded-2xl animate-in zoom-in-95">
                  {showTopThreeExplain && (
                    <div className="p-3 bg-accent/10 border border-accent/20 rounded-xl mb-3">
                      <p className="text-xs font-bold text-accent mb-2">💡 Como Funciona</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        O prêmio é dividido entre os 3 melhores colocados. Você define qual percentual cada um recebe. Por exemplo: 1º lugar 50%, 2º lugar 30%, 3º lugar 20%.
                      </p>
                    </div>
                  )}
                  
                  <p className="text-[10px] font-bold uppercase text-muted-foreground text-center">Distribuição</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((pos) => (
                      <div key={pos} className="space-y-1 text-center">
                        <Label className="text-[9px] font-bold">{pos === 1 ? "🥇" : pos === 2 ? "🥈" : "🥉"} {pos}º</Label>
                        <Input 
                          type="number" 
                          value={splitPercentages[pos as keyof typeof splitPercentages]} 
                          onChange={(e) => {
                            setSplitPercentages(prev => ({ ...prev, [pos]: Number(e.target.value) }));
                          }}
                          className="h-9 text-xs font-bold text-center"
                        />
                        <p className="text-[9px] font-bold text-primary">{splitPercentages[pos as keyof typeof splitPercentages]}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-accent/10 border border-accent/20">
              <div className="flex gap-3">
                <Info size={18} className="text-accent shrink-0 flex-shrink-0" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-accent">Regra dos 10%</p>
                  <p className="text-muted-foreground">10% vai para a plataforma. 90% para os vencedores.</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground mb-1">Participantes</p>
                  <p className="text-xl font-bold text-primary">{numParticipants}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground mb-1">Valor Total</p>
                  <p className="text-xl font-bold">R$ {rawTotal.toFixed(2)}</p>
                </div>
              </div>
              <div className="pt-3 border-t border-border">
                <p className="text-[10px] font-bold text-muted-foreground mb-1">Pote (após 10%)</p>
                <p className="text-2xl font-bold text-primary">R$ {prizePool.toFixed(2)}</p>
              </div>

              {splitPrize && (
                <div className="pt-3 border-t border-border space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground mb-2">Distribuição TOP 3 (100% do pote)</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((pos) => {
                      const percentage = splitPercentages[pos as keyof typeof splitPercentages];
                      const value = (prizePool * percentage) / 100;
                      return (
                        <div key={pos} className="text-center p-2 bg-primary/5 rounded-lg border border-primary/20">
                          <p className="text-[9px] font-bold text-primary mb-1">{pos === 1 ? "🥇" : pos === 2 ? "🥈" : "🥉"}</p>
                          <p className="text-xs font-bold">R$ {value.toFixed(2)}</p>
                          <p className="text-[8px] text-muted-foreground">{percentage}%</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <Button 
              className="w-full h-14 rounded-2xl text-lg font-semibold mt-4"
              onClick={() => setStep(5)}
              disabled={!isStep4Valid}
            >
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
                  <p className="text-sm font-bold">{durationDays} dias</p>
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
                  <p className="text-sm font-bold">{numParticipants}</p>
                </div>
              </div>
            </div>

            <div className="w-full flex flex-col gap-3 mt-8">
              <Button 
                className="w-full h-14 rounded-2xl text-lg font-semibold flex gap-2"
                onClick={() => copyLink()}
              >
                <Share2 size={20} /> Compartilhar com Amigos
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
