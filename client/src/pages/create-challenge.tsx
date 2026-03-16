import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ChevronLeft, Info, Dumbbell, Route, Target, Waves, Zap, Timer, Repeat, Ruler, Camera, Users, Flame, ShieldAlert, XCircle, Trophy, Lock, Globe, CheckCircle2, Copy, Share2, Plus, Loader2, Wallet, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

const DRAFT_KEY = "vytal-challenge-draft";

function saveDraft(data: Record<string, any>) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...data, savedAt: Date.now() }));
}

function loadDraft(): Record<string, any> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.savedAt > 60 * 60 * 1000) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return data;
  } catch { return null; }
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

export default function CreateChallenge() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [createdChallengeId, setCreatedChallengeId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [modalidade, setModalidadeState] = useState("academia");
  const [scoringSystem, setScoringSystem] = useState("ranking");
  const [validationType, setValidationType] = useState("foto");
  const [restoredDraft, setRestoredDraft] = useState(false);

  const setModalidade = (mod: string) => {
    setModalidadeState(mod);
    const autoValidation: Record<string, string> = {
      corrida: "distancia",
      ciclismo: "distancia",
      natacao: "distancia",
      academia: "foto",
      crossfit: "foto",
      funcional: "foto",
      yoga: "foto",
      hiit: "tempo",
      personalizado: "foto",
    };
    setValidationType(autoValidation[mod] || "foto");
  };
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
  const [maxMissedDays, setMaxMissedDays] = useState("3");
  const [bannerPreview, setBannerPreview] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [uploadingBanner, setUploadingBanner] = useState(false);

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      if (draft.modalidade) setModalidadeState(draft.modalidade);
      if (draft.scoringSystem) setScoringSystem(draft.scoringSystem);
      if (draft.validationType) setValidationType(draft.validationType);
      if (draft.challengeName) setChallengeName(draft.challengeName);
      if (draft.challengeDesc) setChallengeDesc(draft.challengeDesc);
      if (draft.startDate) setStartDate(draft.startDate);
      if (draft.durationDays) setDurationDays(draft.durationDays);
      if (draft.numMembers) setNumMembers(draft.numMembers);
      if (draft.entryValue) setEntryValue(draft.entryValue);
      if (draft.splitPrize !== undefined) setSplitPrize(draft.splitPrize);
      if (draft.splitPercentages) setSplitPercentages(draft.splitPercentages);
      if (draft.combinationSpec) setCombinationSpec(draft.combinationSpec);
      if (draft.maxMissedDays) setMaxMissedDays(draft.maxMissedDays);
      if (draft.bannerUrl) { setBannerUrl(draft.bannerUrl); setBannerPreview(draft.bannerUrl); }
      if (draft.isPublic !== undefined) setIsPublic(draft.isPublic);
      if (draft.step) setStep(draft.step);
      setRestoredDraft(true);
      clearDraft();
    }
  }, []);

  const getCurrentDraft = () => ({
    modalidade, scoringSystem, validationType,
    challengeName, challengeDesc, startDate, durationDays,
    numMembers, entryValue, splitPrize, splitPercentages,
    combinationSpec, maxMissedDays, bannerUrl, isPublic, step,
  });

  const handleRechargeAndSave = () => {
    saveDraft(getCurrentDraft());
    setLocation("/wallet?recharge=1");
  };

  const { data: walletData } = useQuery({
    queryKey: ["/api/wallet/balance"],
    queryFn: async () => {
      const res = await fetch("/api/wallet/balance", { credentials: "include" });
      return res.ok ? res.json() : { balance: 0, lockedBalance: 0, availableBalance: 0 };
    },
  });
  const availableBalance = Number(walletData?.availableBalance || 0);
  const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const createChallengeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: challengeName,
          description: challengeDesc,
          type: scoringSystem,
          sport: modalidade,
          entryFee: entry.toString(),
          maxParticipants: parseInt(numMembers),
          duration: parseInt(durationDays),
          validationType,
          goalTarget: scoringSystem === "corrida" && combinationSpec ? parseInt(combinationSpec) : null,
          maxMissedDays: scoringSystem === "survival" ? parseInt(maxMissedDays) : 0,
          image: bannerUrl || "",
          startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
          createdBy: "placeholder",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao criar desafio");
      return data;
    },
    onSuccess: (data) => {
      setCreatedChallengeId(data.id);
      setCreateError(null);
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      setStep(5);
    },
    onError: (error: Error) => {
      setCreateError(error.message);
    },
  });

  const resizeBanner = (file: File, maxW: number, maxH: number): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        const ratio = Math.min(maxW / w, maxH / h, 1);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.85);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleBannerPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      const resized = await resizeBanner(file, 1200, 600);
      setBannerPreview(URL.createObjectURL(resized));
      const res = await fetch("/api/upload/challenge-banner", {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: resized,
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setBannerUrl(data.url);
      }
    } catch { }
    setUploadingBanner(false);
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
  const isStep3Valid = scoringSystem && validationType && (validationType !== "combinacao" || combinationSpec.trim()) && (scoringSystem !== "corrida" || parseInt(combinationSpec) > 0);
  const isStep4Valid = entryValue && parseInt(entryValue) >= 10;

  const numParticipants = parseInt(numMembers) || 1;
  const entry = parseInt(entryValue) || 0;
  const insufficientBalance = entry > 0 && availableBalance < entry;
  const rawTotal = entry * numParticipants;
  const prizePool = rawTotal * 0.9;

  const copyLink = () => {
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const challengeUrl = createdChallengeId ? `${window.location.origin}/challenge/${createdChallengeId}` : "";

  useEffect(() => {
    if (step === 5 && challengeUrl) {
      setTimeout(() => {
        const shareData = {
          title: challengeName,
          text: `Entra no meu desafio "${challengeName}" no VYTAL!`,
          url: challengeUrl
        };
        if (navigator.share) {
          navigator.share(shareData).catch(console.error);
        }
      }, 800);
    }
  }, [step, challengeName, challengeUrl]);

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

              <div className="space-y-2">
                <Label>Banner do Desafio</Label>
                <label className="block cursor-pointer">
                  {bannerPreview ? (
                    <div className="relative w-full h-36 rounded-2xl overflow-hidden border-2 border-primary/30 group">
                      <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={24} className="text-white" />
                        <span className="text-white text-sm font-medium ml-2">Trocar</span>
                      </div>
                      {uploadingBanner && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Loader2 size={24} className="text-white animate-spin" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-36 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 transition-colors bg-muted/30">
                      <Camera size={28} className="text-muted-foreground" />
                      <span className="text-sm text-muted-foreground font-medium">Escolher imagem</span>
                      <span className="text-[10px] text-muted-foreground/60">JPG, PNG — até 5MB</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerPick}
                    className="hidden"
                    data-testid="input-banner-upload"
                  />
                </label>
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
                {parseInt(numMembers || '0') >= 200 && (
                  <div className="p-3 bg-accent/10 border border-accent/20 rounded-xl mt-2 flex items-start gap-2">
                    <ShieldAlert size={16} className="text-accent shrink-0 mt-0.5" />
                    <p className="text-[10px] text-accent leading-relaxed">
                      Desafios com 200+ participantes: a moderação <strong>não é feita pela plataforma</strong>. A comunidade ou criador deverá moderar os check-ins manualmente.
                    </p>
                  </div>
                )}
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
                  description: "Disciplina total: faltou 1 dia, está fora.",
                  details: [
                    "Selfie + foto do ambiente todo dia para comprovar presença",
                    "Tolerância ZERO: faltou 1 dia = eliminado automaticamente",
                    "Quem completar todos os dias divide o prêmio igualmente",
                    "Validação: foto dupla (selfie + ambiente) + GPS"
                  ],
                  methods: ["foto"]
                },
                { 
                  id: "survival", 
                  title: "Sobrevivência", 
                  icon: Flame, 
                  description: "Flexível: tolera algumas falhas antes de eliminar.",
                  details: [
                    "Selfie + foto do ambiente para comprovar presença",
                    "Você define quantas falhas são permitidas (ex: 2 ou 3 dias)",
                    "Acumulou mais falhas que o limite = eliminado automaticamente",
                    "Validação: foto dupla (selfie + ambiente) + GPS"
                  ],
                  methods: ["foto"]
                },
                { 
                  id: "corrida", 
                  title: "Modo Corrida", 
                  icon: Zap, 
                  description: "O primeiro a bater a meta leva tudo.",
                  details: [
                    "Você define uma meta (ex: 100km, 500 reps, 600 min)",
                    "Cada check-out acumula progresso real (km do GPS, reps, ou minutos)",
                    "O primeiro a atingir a meta vence e leva o prêmio",
                    "Se ninguém bater a meta, quem chegou mais perto ganha"
                  ],
                  methods: ["distancia", "repeticoes", "tempo"]
                },
                { 
                  id: "ranking", 
                  title: "Ranking de Performance", 
                  icon: Trophy, 
                  description: "Os TOP 3 com mais acúmulo dividem o prêmio.",
                  details: [
                    "Cada check-out acumula dados reais: km (GPS), reps, ou minutos",
                    "No final do prazo, os TOP 3 dividem o prêmio (50% / 30% / 20%)",
                    "O ranking atualiza em tempo real a cada check-out",
                    "Desistentes perdem a entrada para o prêmio"
                  ],
                  methods: ["distancia", "repeticoes", "tempo", "combinacao"]
                }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setScoringSystem(item.id);
                    if (item.id === "checkin" || item.id === "survival") setValidationType("foto");
                  }}
                  className={`w-full text-left p-5 rounded-3xl border-2 transition-all ${scoringSystem === item.id ? 'border-primary bg-primary/10' : 'border-border bg-card hover:bg-muted'}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-xl ${scoringSystem === item.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      <item.icon size={20} />
                    </div>
                    <div>
                      <p className="font-bold">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  {scoringSystem === item.id && (
                    <div className="mt-3 space-y-1.5 pl-2 border-l-2 border-primary/30 ml-5 animate-in fade-in slide-in-from-top-2">
                      {item.details.map((d, i) => (
                        <p key={i} className="text-[11px] text-muted-foreground flex items-start gap-2">
                          <span className="text-primary font-bold mt-0.5 shrink-0">{i + 1}.</span>
                          {d}
                        </p>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {(scoringSystem === "checkin" || scoringSystem === "survival") && (
              <div className="p-4 bg-muted/50 rounded-2xl border border-border animate-in fade-in">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Comparação rápida</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-xl border-2 ${scoringSystem === "checkin" ? "border-primary bg-primary/10" : "border-border bg-card"}`}>
                    <p className="text-xs font-bold mb-1">Check-in Diário</p>
                    <p className="text-[10px] text-muted-foreground">Falhas: <strong className="text-destructive">0 (zero)</strong></p>
                    <p className="text-[10px] text-muted-foreground">Faltou 1 dia = eliminado</p>
                    <p className="text-[10px] text-muted-foreground">Prêmio: divisão igual</p>
                  </div>
                  <div className={`p-3 rounded-xl border-2 ${scoringSystem === "survival" ? "border-orange-500 bg-orange-500/10" : "border-border bg-card"}`}>
                    <p className="text-xs font-bold mb-1">Sobrevivência</p>
                    <p className="text-[10px] text-muted-foreground">Falhas: <strong className="text-orange-500">configurável</strong></p>
                    <p className="text-[10px] text-muted-foreground">Tolera X dias de folga</p>
                    <p className="text-[10px] text-muted-foreground">Prêmio: sobreviventes</p>
                  </div>
                </div>
              </div>
            )}

            {scoringSystem && (scoringSystem === "checkin" || scoringSystem === "survival") && (
              <div className="p-4 bg-green-500/5 rounded-2xl border border-green-500/20 animate-in zoom-in-95">
                <div className="flex items-center gap-2 mb-1">
                  <Camera size={14} className="text-green-500" />
                  <p className="text-sm font-bold text-green-500">Validação: Foto Dupla + GPS</p>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Selfie + foto do ambiente no check-in e check-out. GPS registra a localização automaticamente.
                </p>
              </div>
            )}

            {scoringSystem && scoringSystem !== "checkin" && scoringSystem !== "survival" && (
              <div className="space-y-3 p-4 bg-primary/5 rounded-2xl border border-primary/20 animate-in zoom-in-95">
                <div className="space-y-2">
                  <p className="text-sm font-bold text-primary">Método de Validação</p>
                  <p className="text-xs text-muted-foreground">
                    Como cada check-out será medido e comprovado:
                  </p>
                </div>

                <div className="space-y-2">
                  {validationTypes
                    .filter(type => {
                      const recommendedMethods: Record<string, string[]> = {
                        checkin: ["foto"],
                        survival: ["foto"],
                        corrida: ["distancia", "repeticoes", "tempo"],
                        ranking: ["distancia", "repeticoes", "tempo", "combinacao"],
                      };
                      return recommendedMethods[scoringSystem]?.includes(type.id);
                    })
                    .map((type) => {
                      const explanations: Record<string, string> = {
                        foto: "Selfie + foto do ambiente no check-in e check-out. GPS registra localização. Pontuação por presença.",
                        distancia: "GPS rastreia distância em tempo real durante a atividade. Km acumulados definem a pontuação. Modo indoor: foto do painel + distância manual.",
                        tempo: "Tempo cronometrado do check-in ao check-out. Minutos acumulados definem a pontuação.",
                        repeticoes: "No check-out, informe quantas repetições fez. Total de reps acumuladas define a pontuação.",
                        combinacao: "Moderador define critérios personalizados. Check-in duplo obrigatório + critérios do moderador."
                      };
                      return (
                        <button
                          key={type.id}
                          onClick={() => setValidationType(type.id)}
                          className={`w-full text-left p-3 rounded-xl border-2 transition-all ${validationType === type.id ? 'border-primary bg-primary/20' : 'border-primary/20 bg-primary/5 hover:bg-primary/10'}`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <type.icon size={14} className={validationType === type.id ? "text-primary" : "text-muted-foreground"} />
                            <span className={`text-xs font-bold ${validationType === type.id ? "text-primary" : "text-muted-foreground"}`}>{type.label}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">{explanations[type.id]}</p>
                        </button>
                      );
                    })}
                </div>

                {validationType === "combinacao" && scoringSystem !== "corrida" && (
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

                {scoringSystem === "corrida" && (
                  <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-xl animate-in zoom-in-95">
                    <Label className="text-sm font-bold text-primary mb-2 block">Meta para Vencer</Label>
                    <p className="text-[10px] text-muted-foreground mb-2">
                      {validationType === "distancia" ? "Quantos km o participante precisa acumular para vencer? (Ex: 100 = 100km)" :
                       validationType === "tempo" ? "Quantos minutos o participante precisa acumular? (Ex: 600 = 10 horas)" :
                       "Quantas repetições o participante precisa acumular? (Ex: 500 reps)"}
                    </p>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number"
                        placeholder="Valor da meta" 
                        value={combinationSpec}
                        onChange={(e) => setCombinationSpec(e.target.value)}
                        className="h-10 rounded-xl px-3 text-sm flex-1"
                      />
                      <span className="text-sm font-bold text-primary">
                        {validationType === "distancia" ? "km" : validationType === "tempo" ? "min" : "reps"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {scoringSystem === "survival" && (
              <div className="p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20 animate-in zoom-in-95">
                <Label className="text-sm font-bold text-orange-500 mb-2 block">Falhas Permitidas</Label>
                <p className="text-[10px] text-muted-foreground mb-2">
                  Quantos dias o participante pode faltar antes de ser eliminado?
                </p>
                <div className="flex items-center gap-3">
                  {["1", "2", "3", "5"].map((v) => (
                    <button
                      key={v}
                      onClick={() => setMaxMissedDays(v)}
                      className={`flex-1 h-12 rounded-xl border-2 font-bold text-lg transition-all ${
                        maxMissedDays === v 
                          ? "border-orange-500 bg-orange-500/20 text-orange-500" 
                          : "border-border bg-card hover:bg-muted text-foreground"
                      }`}
                      data-testid={`button-missed-days-${v}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Personalizado:</span>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={maxMissedDays}
                    onChange={(e) => setMaxMissedDays(e.target.value)}
                    className="h-8 w-20 rounded-lg px-2 text-sm text-center"
                    data-testid="input-max-missed-days"
                  />
                  <span className="text-xs text-muted-foreground">dias</span>
                </div>
                <p className="text-[10px] text-orange-500/70 mt-2">
                  Diferente do Check-in Diário (0 falhas), aqui o participante tem margem para faltar até {maxMissedDays} dia{parseInt(maxMissedDays) !== 1 ? "s" : ""}.
                </p>
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
            {restoredDraft && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-primary/10 border border-primary/30 flex items-center gap-3"
              >
                <CheckCircle2 size={18} className="text-primary shrink-0" />
                <div className="text-xs flex-1">
                  <p className="font-bold text-primary">Configurações restauradas!</p>
                  <p className="text-muted-foreground">Seu desafio está como você deixou. Continue de onde parou.</p>
                </div>
                <Button variant="ghost" size="icon" className="w-6 h-6 shrink-0" onClick={() => setRestoredDraft(false)}>
                  <XCircle size={14} />
                </Button>
              </motion.div>
            )}
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
              <div
                onClick={() => setShowTopThreeExplain(!showTopThreeExplain)}
                className="w-full flex items-center justify-between p-4 bg-muted/50 rounded-2xl hover:bg-muted/70 transition-colors cursor-pointer"
              >
                <div className="text-left">
                  <p className="text-xs font-bold">Distribuir entre TOP 3</p>
                  <p className="text-[10px] text-muted-foreground">Recomendado</p>
                </div>
                <Switch checked={splitPrize} onCheckedChange={setSplitPrize} onClick={(e) => e.stopPropagation()} />
              </div>

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

            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/15">
              <div className="flex gap-3">
                <Info size={18} className="text-blue-500 shrink-0 flex-shrink-0" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-blue-600 dark:text-blue-400">Como funciona o pote</p>
                  <p className="text-muted-foreground">10% vai para manutenção da plataforma. Os outros 90% vão direto para os vencedores!</p>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border ${insufficientBalance ? 'bg-destructive/10 border-destructive/30' : 'bg-primary/5 border-primary/20'}`}>
              <div className="flex items-center gap-3">
                <Wallet size={18} className={insufficientBalance ? 'text-destructive' : 'text-primary'} />
                <div className="text-xs flex-1">
                  <p className={`font-bold ${insufficientBalance ? 'text-destructive' : 'text-primary'}`}>
                    Seu saldo disponível: {formatBRL(availableBalance)}
                  </p>
                  {entry > 0 && (
                    <p className="text-muted-foreground">
                      Entrada de {formatBRL(entry)} será debitada ao criar
                    </p>
                  )}
                  {insufficientBalance && (
                    <p className="text-destructive font-semibold mt-1">
                      Saldo insuficiente! Faltam {formatBRL(entry - availableBalance)}.
                    </p>
                  )}
                </div>
                {insufficientBalance && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 rounded-xl border-primary text-primary hover:bg-primary/10 font-bold text-xs"
                    onClick={handleRechargeAndSave}
                    data-testid="button-recharge-from-challenge"
                  >
                    <Wallet size={14} className="mr-1.5" /> Recarregar
                  </Button>
                )}
              </div>
            </div>

            {createError && (
              <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-center gap-3">
                <AlertTriangle size={18} className="text-destructive shrink-0" />
                <p className="text-xs text-destructive font-semibold">{createError}</p>
              </div>
            )}

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

            {insufficientBalance ? (
              <div className="space-y-3 mt-4">
                <Button 
                  className="w-full h-14 rounded-2xl text-lg font-semibold bg-primary"
                  onClick={handleRechargeAndSave}
                  data-testid="button-recharge-challenge"
                >
                  <Wallet size={20} className="mr-2" /> Recarregar Saldo
                </Button>
                <p className="text-[11px] text-center text-muted-foreground">
                  Suas configurações serão salvas. Após recarregar, volte aqui para continuar.
                </p>
              </div>
            ) : (
              <Button 
                className="w-full h-14 rounded-2xl text-lg font-semibold mt-4"
                onClick={() => { clearDraft(); createChallengeMutation.mutate(); }}
                disabled={!isStep4Valid || createChallengeMutation.isPending}
                data-testid="button-create-challenge"
              >
                {createChallengeMutation.isPending ? (
                  <><Loader2 className="animate-spin mr-2" size={20} /> Criando...</>
                ) : (
                  "Criar Desafio"
                )}
              </Button>
            )}
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
                  <Button
                    variant="outline"
                    className="flex-1 h-14 rounded-2xl border-primary text-primary hover:bg-primary/5 font-bold flex gap-2"
                    onClick={() => {
                      const shareData = {
                        title: challengeName,
                        text: `Entre no meu desafio ${challengeName} no VYTAL!`,
                        url: challengeUrl
                      };
                      if (navigator.share) {
                        navigator.share(shareData).catch(console.error);
                      } else {
                        if (challengeUrl) {
                          navigator.clipboard.writeText(challengeUrl);
                        }
                        copyLink();
                      }
                    }}
                  >
                    <Share2 size={20} />
                    Compartilhar
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
                onClick={() => {
                  if (challengeUrl) {
                    const shareData = { title: challengeName, text: `Entra no meu desafio "${challengeName}" no VYTAL!`, url: challengeUrl };
                    if (navigator.share) {
                      navigator.share(shareData).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(challengeUrl);
                    }
                    copyLink();
                  }
                }}
              >
                <Share2 size={20} /> Compartilhar com Amigos
              </Button>
              <Button 
                variant="outline"
                className="w-full h-14 rounded-2xl text-lg font-semibold"
                onClick={() => setLocation(createdChallengeId ? `/challenge/${createdChallengeId}` : "/dashboard")}
              >
                Ver Desafio
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
