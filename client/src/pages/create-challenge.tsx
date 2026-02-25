import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Info, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";

export default function CreateChallenge() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [entryValue, setEntryValue] = useState("50");

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="px-6 py-6 flex items-center gap-4 sticky top-0 bg-background/80 backdrop-blur-xl z-50 border-b border-white/5">
        <button onClick={() => step > 1 ? setStep(step - 1) : setLocation("/dashboard")} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-display font-bold text-xl">Create Challenge</h1>
        <div className="ml-auto text-sm font-medium text-muted-foreground">
          Step {step}/3
        </div>
      </header>

      <div className="flex-1 p-6 space-y-8">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">The Basics</h2>
              <p className="text-muted-foreground">What's the goal of this challenge?</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Challenge Name</Label>
                <Input placeholder="e.g. 30 Days Summer Shred" className="h-14 bg-white/5 border-white/10 rounded-xl" />
              </div>

              <div className="space-y-3 pt-2">
                <Label>Duration</Label>
                <RadioGroup defaultValue="30" className="grid grid-cols-2 gap-4">
                  <div>
                    <RadioGroupItem value="7" id="duration-7" className="peer sr-only" />
                    <Label htmlFor="duration-7" className="flex flex-col items-center justify-center rounded-xl border-2 border-white/10 bg-white/5 p-4 hover:bg-white/10 peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all">
                      <span className="text-2xl font-display font-bold">7</span>
                      <span className="text-sm text-muted-foreground">Days</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="30" id="duration-30" className="peer sr-only" />
                    <Label htmlFor="duration-30" className="flex flex-col items-center justify-center rounded-xl border-2 border-white/10 bg-white/5 p-4 hover:bg-white/10 peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all">
                      <span className="text-2xl font-display font-bold">30</span>
                      <span className="text-sm text-muted-foreground">Days</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2 pt-2">
                <Label>Weekly Goal (Check-ins)</Label>
                <select className="flex h-14 w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none text-white">
                  <option value="3">3 times a week</option>
                  <option value="4">4 times a week</option>
                  <option value="5" selected>5 times a week</option>
                  <option value="7">Every day</option>
                </select>
              </div>
            </div>

            <Button className="w-full h-14 rounded-2xl text-lg font-semibold mt-8" onClick={() => setStep(2)}>
              Next Step
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">The Stakes</h2>
              <p className="text-muted-foreground">Put your money where your muscle is.</p>
            </div>

            <div className="glass-card rounded-3xl p-6 text-center space-y-6">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Entry Value (BRL)</p>
              
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-display text-muted-foreground">R$</span>
                <input 
                  type="number" 
                  value={entryValue}
                  onChange={(e) => setEntryValue(e.target.value)}
                  className="bg-transparent text-6xl font-display font-bold w-32 text-center outline-none text-white" 
                />
              </div>

              <div className="flex gap-2 justify-center">
                {["20", "50", "100", "200"].map(val => (
                  <button 
                    key={val}
                    onClick={() => setEntryValue(val)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border ${entryValue === val ? 'bg-primary text-primary-foreground border-primary' : 'bg-white/5 border-white/10 hover:bg-white/10'} transition-colors`}
                  >
                    R${val}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex gap-3 items-start">
              <Info className="text-blue-400 shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-blue-200 space-y-1">
                <p><strong>How the prize pool works:</strong></p>
                <p>All entry fees go into the pot. Users who fail the weekly goals lose their stake. The final pot is divided equally among the winners.</p>
                <p className="text-xs opacity-70 mt-2">*Platform keeps 10% fee from the total pool.</p>
              </div>
            </div>

            <Button className="w-full h-14 rounded-2xl text-lg font-semibold mt-8" onClick={() => setStep(3)}>
              Next Step
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Privacy & Review</h2>
              <p className="text-muted-foreground">Final touches before we go live.</p>
            </div>

            <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-lg">Public Challenge</p>
                <p className="text-sm text-muted-foreground">Anyone can discover and join.</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="border border-white/10 rounded-3xl p-6 space-y-4">
              <h3 className="font-display font-bold text-lg mb-4">Summary</h3>
              
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium text-right">30 Days Summer Shred</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-muted-foreground">Goal</span>
                <span className="font-medium text-right">5 check-ins / week</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium text-right">30 Days</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Entry Fee</span>
                <span className="font-medium text-primary text-right">R$ {entryValue},00</span>
              </div>
            </div>

            <Button 
              className="w-full h-14 rounded-2xl text-lg font-semibold mt-8 shadow-[0_0_20px_rgba(34,197,94,0.3)]" 
              onClick={() => setLocation("/dashboard")}
              data-testid="button-publish-challenge"
            >
              Publish & Deposit Stake
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}