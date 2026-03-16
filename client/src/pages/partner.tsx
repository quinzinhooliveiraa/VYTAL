import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Handshake, Megaphone, BarChart3, Zap, Instagram, Globe, Target, FileText, ArrowRight, CheckCircle2, Loader2, Sparkles, Heart, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const STEPS = [
  {
    id: "intro",
    title: "Seja Parceiro VYTAL",
    subtitle: "Programa de Parceiros",
    description: "Conecte sua marca ao mundo fitness e esportivo. Alcance milhares de atletas engajados.",
    icon: Handshake,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    id: "benefit1",
    title: "Visibilidade Premium",
    description: "Sua marca aparece dentro de desafios, comunidades e na experiência do app. Público qualificado e engajado.",
    icon: Megaphone,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    id: "benefit2",
    title: "Dados e Métricas",
    description: "Acompanhe o desempenho da sua parceria com relatórios de engajamento, alcance e conversões em tempo real.",
    icon: BarChart3,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
  {
    id: "benefit3",
    title: "Parcerias Flexíveis",
    description: "Patrocine desafios específicos, ofereça cupons de desconto como premiação ou crie ações exclusivas com nossa base.",
    icon: Zap,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
  {
    id: "form",
    title: "Candidate-se como Parceiro",
    description: "Preencha o formulário para nossa equipe entrar em contato.",
    icon: Heart,
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
];

export default function Partner() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    fullName: "",
    company: "",
    role: "",
    instagram: "",
    website: "",
    otherSocials: "",
    segment: "",
    objectives: "",
    proposal: "",
    budget: "",
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const message = [
        `📋 CANDIDATURA - PARCEIRO DO APP`,
        ``,
        `👤 Nome: ${formData.fullName}`,
        `🏢 Empresa/Marca: ${formData.company}`,
        `💼 Cargo: ${formData.role}`,
        `📸 Instagram: ${formData.instagram}`,
        `🌐 Website: ${formData.website || "N/A"}`,
        `📱 Outras redes: ${formData.otherSocials || "N/A"}`,
        `🏷️ Segmento: ${formData.segment}`,
        `🎯 Objetivos: ${formData.objectives}`,
        `📝 Proposta de parceria: ${formData.proposal}`,
        `💰 Budget estimado: ${formData.budget || "A definir"}`,
        ``,
        `📧 Email: ${user?.email}`,
        `👤 Username: ${user?.username}`,
      ].join("\n");

      const res = await apiRequest("POST", "/api/support", { type: "parceiro", message });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({ title: "Candidatura enviada!", description: "Nossa equipe vai analisar." });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const canSubmit = formData.fullName.trim() && formData.company.trim() && formData.instagram.trim() && formData.segment.trim() && formData.objectives.trim() && formData.proposal.trim();

  const currentStep = STEPS[step];
  const isForm = step === STEPS.length - 1;

  if (submitted) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-background">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="text-blue-500" size={48} />
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-2xl font-display font-bold text-center mb-2">
          Candidatura Enviada!
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-muted-foreground text-center text-sm max-w-xs mb-8">
          Recebemos seu interesse em ser parceiro da VYTAL. Nossa equipe vai analisar e entrar em contato em breve.
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
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="px-6 pt-6 pb-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-full -ml-2" onClick={() => step > 0 ? setStep(step - 1) : setLocation("/dashboard")} data-testid="button-back">
          <ChevronLeft size={24} />
        </Button>
        <div className="flex-1">
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-blue-500" : "bg-muted"}`} />
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
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold uppercase tracking-wider">
                      <Sparkles size={14} /> Programa de Parceiros
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
                      { icon: Megaphone, label: "Visibilidade\nPremium", color: "text-purple-500" },
                      { icon: BarChart3, label: "Dados e\nMétricas", color: "text-cyan-500" },
                      { icon: Zap, label: "Parcerias\nFlexíveis", color: "text-yellow-500" },
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
                    <Input value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} placeholder="Seu nome completo" className="h-12 rounded-xl bg-card border-border" data-testid="input-partner-name" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1"><Building2 size={12} /> Empresa *</label>
                      <Input value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} placeholder="Nome da empresa" className="h-12 rounded-xl bg-card border-border" data-testid="input-partner-company" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Cargo</label>
                      <Input value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} placeholder="Seu cargo" className="h-12 rounded-xl bg-card border-border" data-testid="input-partner-role" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1"><Instagram size={12} /> Instagram *</label>
                    <Input value={formData.instagram} onChange={e => setFormData({ ...formData, instagram: e.target.value })} placeholder="@perfildamarca" className="h-12 rounded-xl bg-card border-border" data-testid="input-partner-instagram" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1"><Globe size={12} /> Website</label>
                      <Input value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} placeholder="www.site.com" className="h-12 rounded-xl bg-card border-border" data-testid="input-partner-website" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Segmento *</label>
                      <Input value={formData.segment} onChange={e => setFormData({ ...formData, segment: e.target.value })} placeholder="Ex: Suplementos" className="h-12 rounded-xl bg-card border-border" data-testid="input-partner-segment" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1"><Target size={12} /> Objetivos da Parceria *</label>
                    <textarea value={formData.objectives} onChange={e => setFormData({ ...formData, objectives: e.target.value })} placeholder="O que sua marca busca ao se tornar parceira da VYTAL?" className="w-full bg-card border border-border rounded-xl p-3 focus:border-primary outline-none min-h-[70px] resize-none text-sm" data-testid="input-partner-objectives" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1"><Handshake size={12} /> Proposta de Parceria *</label>
                    <textarea value={formData.proposal} onChange={e => setFormData({ ...formData, proposal: e.target.value })} placeholder="Como imagina a parceria? Patrocínio, cupons, ações conjuntas..." className="w-full bg-card border border-border rounded-xl p-3 focus:border-primary outline-none min-h-[70px] resize-none text-sm" data-testid="input-partner-proposal" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Budget Estimado</label>
                    <Input value={formData.budget} onChange={e => setFormData({ ...formData, budget: e.target.value })} placeholder="Ex: R$ 5.000/mês ou a definir" className="h-12 rounded-xl bg-card border-border" data-testid="input-partner-budget" />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="fixed bottom-20 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
        {isForm ? (
          <Button
            className="w-full h-14 rounded-2xl font-bold text-base shadow-xl shadow-blue-500/20 bg-blue-500 hover:bg-blue-600 text-white"
            disabled={!canSubmit || submitMutation.isPending}
            onClick={() => submitMutation.mutate()}
            data-testid="button-submit-partner"
          >
            {submitMutation.isPending ? <Loader2 className="animate-spin mr-2" size={18} /> : <CheckCircle2 className="mr-2" size={18} />}
            Enviar Candidatura
          </Button>
        ) : (
          <Button
            className="w-full h-14 rounded-2xl font-bold text-base shadow-xl shadow-blue-500/20 bg-blue-500 hover:bg-blue-600 text-white"
            onClick={() => setStep(step + 1)}
            data-testid="button-next-step"
          >
            {step === 0 ? "Quero Ser Parceiro" : "Continuar"}
            <ArrowRight className="ml-2" size={18} />
          </Button>
        )}
      </div>
    </div>
  );
}
