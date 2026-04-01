import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  TrendingUp, 
  LayoutDashboard, 
  Globe, 
  Search, 
  Wand2, 
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Niche, Region } from '../types';

interface OnboardingProps {
  step: number;
  setStep: (step: number) => void;
  onComplete: () => void;
  selectedNiches: Niche[];
  setSelectedNiches: React.Dispatch<React.SetStateAction<Niche[]>>;
  selectedRegion: Region;
  setSelectedRegion: (region: Region) => void;
  niches: Niche[];
  regions: Region[];
}

export default function Onboarding({
  step,
  setStep,
  onComplete,
  selectedNiches,
  setSelectedNiches,
  selectedRegion,
  setSelectedRegion,
  niches,
  regions
}: OnboardingProps) {
  const toggleNiche = (niche: Niche) => {
    setSelectedNiches(prev => 
      prev.includes(niche) ? prev.filter(n => n !== niche) : [...prev, niche]
    );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col p-6 overflow-y-auto scrollbar-hide">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map(i => (
            <div 
              key={i} 
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                step === i ? "w-8 bg-accent" : "w-2 bg-border"
              )}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              <div className="text-center space-y-4 mb-12">
                <div className="w-20 h-20 bg-accent/10 rounded-3xl flex items-center justify-center mx-auto accent-glow">
                  <Zap className="text-accent fill-accent" size={40} />
                </div>
                <h2 className="text-3xl font-bold tracking-tighter">Welcome to XFLOW</h2>
                <p className="text-text-secondary">Your AI-powered command center for viral X content.</p>
              </div>

              <div className="space-y-6 flex-1">
                <div className="flex gap-4 p-4 rounded-2xl bg-card border border-border">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="text-accent" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary">Scan Trends</h3>
                    <p className="text-sm text-text-muted">Real-time analysis of what's trending across your favorite niches.</p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-2xl bg-card border border-border">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <LayoutDashboard className="text-accent" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary">Generate Posts</h3>
                    <p className="text-sm text-text-muted">AI creates high-engagement tweets tailored to current viral patterns.</p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-2xl bg-card border border-border">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <ImageIcon className="text-accent" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary">AI Visuals</h3>
                    <p className="text-sm text-text-muted">Every post gets a custom-generated image using Imagen 4.0.</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setStep(2)}
                className="w-full py-4 bg-accent text-background rounded-2xl font-bold flex items-center justify-center gap-2 mt-8 hover:opacity-90 transition-opacity"
              >
                Next Step
                <ChevronRight size={20} />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-bold tracking-tighter">Personalize Your Feed</h2>
                <p className="text-text-secondary text-sm">Select the niches and region you want to dominate.</p>
              </div>

              <div className="space-y-6 flex-1">
                <section className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
                    <Globe size={12} />
                    Target Region
                  </label>
                  <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
                    {regions.map(region => (
                      <button
                        key={region}
                        onClick={() => setSelectedRegion(region)}
                        className={cn(
                          "px-4 py-2 rounded-full text-xs font-medium transition-all border whitespace-nowrap",
                          selectedRegion === region
                            ? "bg-accent/20 text-accent border-accent"
                            : "bg-card border-border text-text-secondary"
                        )}
                      >
                        {region}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="space-y-3 flex-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
                    <Search size={12} />
                    Select Niches
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto p-1 scrollbar-hide">
                    {niches.map(niche => (
                      <button
                        key={niche}
                        onClick={() => toggleNiche(niche)}
                        className={cn(
                          "px-4 py-2 rounded-full text-xs font-medium transition-all border",
                          selectedNiches.includes(niche)
                            ? "bg-accent text-background border-accent"
                            : "bg-card border-border text-text-secondary"
                        )}
                      >
                        {niche}
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              <button 
                onClick={() => setStep(3)}
                disabled={selectedNiches.length === 0}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 mt-8 transition-all",
                  selectedNiches.length > 0 
                    ? "bg-accent text-background" 
                    : "bg-card text-text-muted cursor-not-allowed"
                )}
              >
                Continue
                <ChevronRight size={20} />
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-bold tracking-tighter">Refine with AI</h2>
                <p className="text-text-secondary text-sm">Fine-tune your content with a single click.</p>
              </div>

              <div className="flex-1 flex flex-col justify-center gap-8">
                <div className="p-6 rounded-3xl bg-card border border-border relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3">
                    <Sparkles className="text-accent animate-pulse" size={24} />
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 w-3/4 bg-border rounded-full" />
                    <div className="h-4 w-1/2 bg-border rounded-full" />
                    <div className="pt-4 flex gap-2">
                      <div className="px-3 py-1.5 rounded-xl bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold">
                        THREAD
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold">
                        CONDENSE
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="text-accent" size={16} />
                    </div>
                    <p className="text-sm text-text-secondary">
                      Click the <span className="text-accent font-bold">Wand</span> icon on any post to open the AI Refiner.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="text-accent" size={16} />
                    </div>
                    <p className="text-sm text-text-secondary">
                      Choose a preset like "Make it a Thread" or type your own instructions.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="text-accent" size={16} />
                    </div>
                    <p className="text-sm text-text-secondary">
                      XFLOW will instantly rewrite the post while maintaining the viral hook.
                    </p>
                  </div>
                </div>
              </div>

              <button 
                onClick={onComplete}
                className="w-full py-4 bg-accent text-background rounded-2xl font-bold flex items-center justify-center gap-2 mt-8 hover:scale-[1.02] active:scale-[0.98] transition-all accent-glow"
              >
                Get Started
                <Zap size={20} className="fill-background" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
