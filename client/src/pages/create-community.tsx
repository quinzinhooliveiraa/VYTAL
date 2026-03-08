import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Camera, Users, Target, Lock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function CreateCommunity() {
  const [, setLocation] = useLocation();
  const [isPrivate, setIsPrivate] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-background pb-24 flex flex-col">
      <header className="px-6 pt-6 pb-4 sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-full -ml-2" onClick={() => window.history.back()}>
              <ChevronLeft size={24} />
            </Button>
            <h1 className="text-xl font-display font-bold">Nova Comunidade</h1>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-8 flex-1">
        {/* Image Upload Mock */}
        <div className="w-full h-40 bg-muted border-2 border-dashed border-border rounded-[2rem] flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors">
          <Camera size={32} className="mb-2 opacity-50" />
          <p className="font-bold text-sm">Adicionar Capa</p>
          <p className="text-[10px]">1200 x 400 recomendado</p>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-primary">Nome da Comunidade</Label>
            <Input placeholder="Ex: Guerreiros do Crossfit" className="h-14 rounded-2xl bg-card border-border px-4 font-bold" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-primary">Descrição</Label>
            <Textarea 
              placeholder="Sobre o que é esta comunidade? Quem deve entrar?" 
              className="min-h-[100px] rounded-2xl bg-card border-border p-4 resize-none" 
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-primary">Esporte / Foco</Label>
            <div className="grid grid-cols-3 gap-2">
              {["Academia", "Corrida", "Crossfit", "Ciclismo", "Yoga", "Outro"].map((esporte, i) => (
                <div key={i} className={`p-3 rounded-xl border text-center text-xs font-bold cursor-pointer transition-colors ${i === 0 ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary/50 text-muted-foreground'}`}>
                  {esporte}
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 bg-card border border-border rounded-[2rem] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <div className={`p-2 rounded-lg ${isPrivate ? 'bg-orange-500/10 text-orange-500' : 'bg-green-500/10 text-green-500'}`}>
                  {isPrivate ? <Lock size={20} /> : <Globe size={20} />}
                </div>
                <div>
                  <p className="font-bold text-sm">Privacidade</p>
                  <p className="text-[10px] text-muted-foreground w-48">
                    {isPrivate ? "Apenas convidados podem ver os desafios e membros." : "Qualquer um pode encontrar e pedir para entrar."}
                  </p>
                </div>
              </div>
              <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-background border-t border-border mt-auto">
        <Button 
          className="w-full h-14 text-lg font-bold rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20"
          onClick={() => {
            alert("Comunidade criada com sucesso!");
            setLocation("/communities");
          }}
        >
          Criar Comunidade
        </Button>
      </div>
    </div>
  );
}