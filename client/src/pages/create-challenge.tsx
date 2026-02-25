import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Info, Dumbbell, Route, Target, Link as LinkIcon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";

export default function CreateChallenge() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [modalidade, setModalidade] = useState("academia");
  const [entryValue, setEntryValue] = useState("50");
  const [customDuration, setCustomDuration] = useState("");
  const [durationPreset, setDurationPreset] = useState("30");
  const [linkCopied, setLinkCopied] = useState(false);

  const duration = durationPreset === "custom" ? customDuration || "0" : durationPreset;

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
          Passo {step}/4
        </div>
      </header>

      <div className="flex-1 p-6 space-y-8">
        {/* Step 1: Modalidade & Nome */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">O Básico</h2>
              <p className="text-muted-foreground">Qual será o foco deste desafio?</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Modalidade</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "academia", icon: Dumbbell, label: "Academia" },
                    { id: "corrida", icon: Route, label: "Corrida" },
                    { id: "personalizado", icon: Target, label: "Livre" }
                  ].map((mod) => {
                    const Icon = mod.icon;
                    const isActive = modalidade === mod.id;
                    return (
                      <button
                        key={mod.id}
                        onClick={() => setModalidade(mod.id)}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${isActive ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:bg-accent'}`}
                      >
                        <Icon size={24} className="mb-2" />
                        <span className="text-xs font-semibold">{mod.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nome do Desafio</Label>
                <Input placeholder="Ex: Projeto Verão 30 Dias" className="h-14 rounded-xl px-4" />
              </div>

              {modalidade === "corrida" && (
                <div className="space-y-2 bg-primary/5 p-4 rounded-xl border border-primary/20">
                  <Label className="text-primary">Meta de Distância (km)</Label>
                  <Input type="number" placeholder="Ex: 5" className="h-12 bg-background" />
                  <p className="text-xs text-muted-foreground">Check-in exigirá foto do painel/app mostrando os km.</p>
                </div>
              )}
            </div>

            <Button className="w-full h-14 rounded-2xl text-lg font-semibold mt-8" onClick={() => setStep(2)}>
              Próximo
            </Button>
          </div>
        )}

        {/* Step 2: Duração & Frequência */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Tempo & Regras</h2>
              <p className="text-muted-foreground">Defina a dificuldade do desafio.</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Duração do Desafio</Label>
                <RadioGroup value={durationPreset} onValueChange={setDurationPreset} className="grid grid-cols-3 gap-3">
                  <div>
                    <RadioGroupItem value="7" id="dur-7" className="peer sr-only" />
                    <Label htmlFor="dur-7" className="flex flex-col items-center justify-center rounded-xl border-2 border-border bg-card p-4 hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all">
                      <span className="text-2xl font-display font-bold">7</span>
                      <span className="text-[10px] uppercase">Dias</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="30" id="dur-30" className="peer sr-only" />
                    <Label htmlFor="dur-30" className="flex flex-col items-center justify-center rounded-xl border-2 border-border bg-card p-4 hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all">
                      <span className="text-2xl font-display font-bold">30</span>
                      <span className="text-[10px] uppercase">Dias</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="custom" id="dur-custom" className="peer sr-only" />
                    <Label htmlFor="dur-custom" className="flex flex-col items-center justify-center rounded-xl border-2 border-border bg-card p-4 hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all">
                      <span className="text-sm font-display font-bold mt-1">Outro</span>
                    </Label>
                  </div>
                </RadioGroup>

                {durationPreset === "custom" && (
                  <div className="pt-2 animate-in slide-in-from-top-2">
                    <Input 
                      type="number" 
                      placeholder="Dias (ex: 21)" 
                      value={customDuration}
                      onChange={(e) => setCustomDuration(e.target.value)}
                      className="h-14 rounded-xl px-4" 
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Frequência Semanal (Check-ins exigidos)</Label>
                <select className="flex h-14 w-full items-center justify-between rounded-xl border border-border bg-card px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none">
                  <option value="3">3 vezes na semana</option>
                  <option value="4">4 vezes na semana</option>
                  <option value="5">5 vezes na semana (Recomendado)</option>
                  <option value="6">6 vezes na semana</option>
                  <option value="7">Todos os dias (Hardcore)</option>
                </select>
              </div>
            </div>

            <Button className="w-full h-14 rounded-2xl text-lg font-semibold mt-8" onClick={() => setStep(3)}>
              Próximo
            </Button>
          </div>
        )}

        {/* Step 3: Valor da Entrada */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">A Aposta</h2>
              <p className="text-muted-foreground">Coloque dinheiro para criar compromisso.</p>
            </div>

            <div className="glass-card rounded-3xl p-6 text-center space-y-6 bg-card">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Entrada por pessoa</p>
              
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-display text-muted-foreground">R$</span>
                <input 
                  type="number" 
                  value={entryValue}
                  onChange={(e) => setEntryValue(e.target.value)}
                  className="bg-transparent text-6xl font-display font-bold w-32 text-center outline-none text-foreground" 
                />
              </div>

              <div className="flex gap-2 justify-center">
                {["20", "50", "100", "200"].map(val => (
                  <button 
                    key={val}
                    onClick={() => setEntryValue(val)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border ${entryValue === val ? 'bg-foreground text-background dark:bg-white dark:text-black border-foreground' : 'bg-card border-border hover:bg-accent'} transition-colors`}
                  >
                    R${val}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex gap-3 items-start">
              <Info className="text-blue-500 shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-blue-700 dark:text-blue-200 space-y-1">
                <p><strong>Como o prêmio funciona:</strong></p>
                <p>As entradas formam o pote total. Quem falhar nos check-ins semanais é eliminado e perde o valor. O pote final é dividido entre os vencedores.</p>
              </div>
            </div>

            <Button className="w-full h-14 rounded-2xl text-lg font-semibold mt-8" onClick={() => setStep(4)}>
              Revisar & Finalizar
            </Button>
          </div>
        )}

        {/* Step 4: Revisão e Link */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Tudo Certo!</h2>
              <p className="text-muted-foreground">Revise e publique seu desafio.</p>
            </div>

            <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-lg">Desafio Público</p>
                <p className="text-sm text-muted-foreground leading-tight mt-1">Aparece na aba Explorar. Se desligado, apenas com link.</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="border border-border rounded-3xl p-6 space-y-4 bg-card">
              <h3 className="font-display font-bold text-lg mb-4">Resumo</h3>
              
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Modalidade</span>
                <span className="font-medium text-right capitalize">{modalidade}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Duração</span>
                <span className="font-medium text-right">{duration} Dias</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Meta Semanal</span>
                <span className="font-medium text-right">5 check-ins</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Taxa de Entrada</span>
                <span className="font-medium text-primary text-right">R$ {entryValue},00</span>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <p className="font-semibold text-sm text-center">Seu Link de Convite</p>
              <Button 
                variant="outline" 
                className="w-full h-14 rounded-xl border-dashed border-primary/50 text-primary bg-primary/5"
                onClick={copyLink}
              >
                {linkCopied ? <CheckCircle2 className="mr-2" /> : <LinkIcon className="mr-2" size={18} />}
                {linkCopied ? "Copiado!" : "fitstake.app/c/x8a92k"}
              </Button>
            </div>

            <Button 
              className="w-full h-14 rounded-2xl text-lg font-semibold mt-4 shadow-lg shadow-primary/20" 
              onClick={() => setLocation("/dashboard")}
            >
              Publicar & Depositar Pix
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}