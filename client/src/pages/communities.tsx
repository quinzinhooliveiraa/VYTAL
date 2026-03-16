import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Crown, Users, Trophy, TrendingUp, DollarSign, Star, Instagram, Globe, Target, FileText, ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const STEPS = [
  {
    id: "intro",
    title: "Comunidades",
    subtitle: "Em Breve",
    description: "Estamos preparando algo incrível para organizadores de eventos e grupos esportivos.",
    icon: Users,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    id: "benefit1",
    title: "Crie Desafios Exclusivos",
    description: "Organize desafios para seus membros com regras personalizadas e premiações reais.",
    icon: Trophy,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
  {
    id: "benefit2",
    title: "Ganhe 5% de Comissão",
    description: "Receba automaticamente 5% do pote total de cada desafio criado na sua comunidade. Quanto mais desafios, mais você ganha.",
    icon: DollarSign,
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    id: "benefit3",
    title: "Gerencie Seu Grupo",
    description: "Modere participantes, aprove entradas e construa uma comunidade engajada em torno do esporte.",
    icon: Crown,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    id: "form",
    title: "Cadastre-se como Organizador",
    description: "Preencha o formulário abaixo para ser um dos primeiros organizadores da plataforma.",
    icon: Star,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
];

export default function Communities() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    fullName: "",
    instagram: "",
    otherSocials: "",
    sport: "",
    groupSize: "",
    objectives: "",
    actionPlan: "",
    experience: "",
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const message = [
        `📋 CANDIDATURA - ORGANIZADOR DE EVENTOS`,
        ``,
        `👤 Nome: ${formData.fullName}`,
        `📸 Instagram: ${formData.instagram}`,
        `🌐 Outras redes: ${formData.otherSocials || "N/A"}`,
        `⚽ Esporte/Modalidade: ${formData.sport}`,
        `👥 Tamanho do grupo: ${formData.groupSize}`,
        `🎯 Objetivos: ${formData.objectives}`,
        `📝 Plano de ação: ${formData.actionPlan}`,
        `💪 Experiência prévia: ${formData.experience || "N/A"}`,
        ``,
        `📧 Email: ${user?.email}`,
        `👤 Username: ${user?.username}`,
      ].join("\n");

      const res = await apiRequest("POST", "/api/support", { type: "organizador", message });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({ title: "Candidatura enviada!", description: "Entraremos em contato em breve." });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const canSubmit = formData.fullName.trim() && formData.instagram.trim() && formData.sport.trim() && formData.groupSize.trim() && formData.objectives.trim() && formData.actionPlan.trim();

  const currentStep = STEPS[step];
  const isLastBenefit = step === STEPS.length - 2;
  const isForm = step === STEPS.length - 1;

  if (submitted) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-background">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="text-primary" size={48} />
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-2xl font-display font-bold text-center mb-2">
          Candidatura Enviada!
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-muted-foreground text-center text-sm max-w-xs mb-8">
          Recebemos sua candidatura de organizador. Vamos analisar e entrar em contato em breve.
        </motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <Button className="rounded-2xl h-12 px-8 font-bold" onClick={() => setLocation("/dashboard")} data-testid="button-back-home">
            Voltar ao Início
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background max-w-md mx-auto">
      <header className="px-6 pt-6 pb-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-full -ml-2" onClick={() => step > 0 ? setStep(step - 1) : setLocation("/dashboard")} data-testid="button-back">
          <ChevronLeft size={24} />
        </Button>
        <div className="flex-1">
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 px-6 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {!isForm ? (
              <div className="flex flex-col items-center text-center pt-8 space-y-6">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring" }}
                  className={`w-24 h-24 ${currentStep.bg} rounded-[2rem] flex items-center justify-center`}
                >
                  <currentStep.icon className={currentStep.color} size={44} />
                </motion.div>

                {step === 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs font-bold uppercase tracking-wider">
                      <Sparkles size={14} /> Em Breve
                    </span>
                  </motion.div>
                )}

                <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-3xl font-display font-bold">
                  {currentStep.title}
                </motion.h1>

                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                  {currentStep.description}
                </motion.p>

                {step === 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="grid grid-cols-3 gap-3 w-full max-w-sm pt-4">
                    {[
                      { icon: Trophy, label: "Desafios\nExclusivos", color: "text-yellow-500" },
                      { icon: DollarSign, label: "5% de\nComissão", color: "text-green-500" },
                      { icon: Users, label: "Gerencie\nSeu Grupo", color: "text-blue-500" },
                    ].map((item, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }} className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center gap-2">
                        <item.icon className={item.color} size={24} />
                        <span className="text-[10px] font-bold text-center whitespace-pre-line leading-tight">{item.label}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="space-y-5 pt-4">
                <div className="text-center space-y-2">
                  <div className={`w-16 h-16 ${currentStep.bg} rounded-full flex items-center justify-center mx-auto`}>
                    <currentStep.icon className={currentStep.color} size={28} />
                  </div>
                  <h2 className="text-xl font-display font-bold">{currentStep.title}</h2>
                  <p className="text-xs text-muted-foreground">{currentStep.description}</p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1"><FileText size={12} /> Nome Completo *</label>
                    <Input value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} placeholder="Seu nome completo" className="h-12 rounded-xl bg-card border-border" data-testid="input-org-name" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1"><Instagram size={12} /> Instagram *</label>
                    <Input value={formData.instagram} onChange={e => setFormData({ ...formData, instagram: e.target.value })} placeholder="@seuperfil" className="h-12 rounded-xl bg-card border-border" data-testid="input-org-instagram" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1"><Globe size={12} /> Outras Redes Sociais</label>
                    <Input value={formData.otherSocials} onChange={e => setFormData({ ...formData, otherSocials: e.target.value })} placeholder="TikTok, YouTube, etc." className="h-12 rounded-xl bg-card border-border" data-testid="input-org-socials" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Esporte *</label>
                      <Input value={formData.sport} onChange={e => setFormData({ ...formData, sport: e.target.value })} placeholder="Ex: Corrida" className="h-12 rounded-xl bg-card border-border" data-testid="input-org-sport" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Tamanho do Grupo *</label>
                      <Input value={formData.groupSize} onChange={e => setFormData({ ...formData, groupSize: e.target.value })} placeholder="Ex: 100 pessoas" className="h-12 rounded-xl bg-card border-border" data-testid="input-org-group" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1"><Target size={12} /> Objetivos com a Comunidade *</label>
                    <textarea value={formData.objectives} onChange={e => setFormData({ ...formData, objectives: e.target.value })} placeholder="O que você quer alcançar com sua comunidade na VYTAL?" className="w-full bg-card border border-border rounded-xl p-3 focus:border-primary outline-none min-h-[70px] resize-none text-sm" data-testid="input-org-objectives" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1"><TrendingUp size={12} /> Plano de Ação *</label>
                    <textarea value={formData.actionPlan} onChange={e => setFormData({ ...formData, actionPlan: e.target.value })} placeholder="Como pretende engajar seus membros? Quais desafios quer criar?" className="w-full bg-card border border-border rounded-xl p-3 focus:border-primary outline-none min-h-[70px] resize-none text-sm" data-testid="input-org-plan" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Experiência Prévia</label>
                    <textarea value={formData.experience} onChange={e => setFormData({ ...formData, experience: e.target.value })} placeholder="Já organizou eventos ou grupos esportivos? Conte-nos!" className="w-full bg-card border border-border rounded-xl p-3 focus:border-primary outline-none min-h-[60px] resize-none text-sm" data-testid="input-org-experience" />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 pb-24 bg-gradient-to-t from-background via-background to-transparent z-40 max-w-md mx-auto">
        {isForm ? (
          <Button
            className="w-full h-14 rounded-2xl font-bold text-base shadow-xl shadow-primary/20"
            disabled={!canSubmit || submitMutation.isPending}
            onClick={() => submitMutation.mutate()}
            data-testid="button-submit-org"
          >
            {submitMutation.isPending ? <Loader2 className="animate-spin mr-2" size={18} /> : <CheckCircle2 className="mr-2" size={18} />}
            Enviar Candidatura
          </Button>
        ) : (
          <Button
            className="w-full h-14 rounded-2xl font-bold text-base shadow-xl shadow-primary/20"
            onClick={() => setStep(step + 1)}
            data-testid="button-next-step"
          >
            {step === 0 ? "Quero Ser Organizador" : "Continuar"}
            <ArrowRight className="ml-2" size={18} />
          </Button>
        )}
      </div>
    </div>
  );
}
