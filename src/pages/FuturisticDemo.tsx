
import PageLayout from "@/components/layout/PageLayout";
import FuturisticCard from "@/components/ui/futuristic-card";
import { NeonButton } from "@/components/ui/neon-button";
import { Link } from "react-router-dom";
import { Terminal, Sparkles, Zap, Code } from "lucide-react";

const FuturisticDemo = () => {
  return (
    <PageLayout title="Neon Glassmorphism UI" auroraIntensity="high" particleCount={28}>
      <div className="container mx-auto px-4 py-16 relative z-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center bg-gradient-to-r from-cyan via-purple to-pink bg-clip-text text-transparent neon-text-glow">
          Neon Glassmorphism UI
        </h1>
        
        <p className="text-xl text-center text-white/80 max-w-3xl mx-auto mb-16">
          Experience the fusion of neon aesthetics and glassmorphism with circuit board inspired designs
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {/* Cyan variant */}
          <div className="glass-card-cyan p-8">
            <div className="flex items-center justify-center mb-5 w-16 h-16 rounded-full bg-[rgba(0,255,255,0.1)] border border-[color:var(--c-cyan)/20]">
              <Terminal className="h-8 w-8 text-cyan" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-cyan neon-text">Neon Cyan Card</h3>
            <p className="text-white/80 mb-6">This card features an electric cyan glow effect with glass morphism and circuit-inspired design.</p>
            <NeonButton variant="primary">Cyan Button</NeonButton>
          </div>
          
          {/* Purple variant */}
          <div className="glass-card-purple p-8">
            <div className="flex items-center justify-center mb-5 w-16 h-16 rounded-full bg-[rgba(185,51,255,0.1)] border border-[color:var(--c-purple)/20]">
              <Sparkles className="h-8 w-8 text-purple" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-purple neon-text-purple">Neon Purple Card</h3>
            <p className="text-white/80 mb-6">This card features a vibrant purple neon glow effect with enhanced glass morphism.</p>
            <NeonButton variant="secondary">Purple Button</NeonButton>
          </div>
          
          {/* Pink variant */}
          <div className="glass-card-pink p-8">
            <div className="flex items-center justify-center mb-5 w-16 h-16 rounded-full bg-[rgba(255,0,170,0.1)] border border-[color:var(--c-pink)/20]">
              <Zap className="h-8 w-8 text-pink" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-pink neon-text-pink">Neon Pink Card</h3>
            <p className="text-white/80 mb-6">This card features a hot pink neon glow effect with glass morphism and circuit accents.</p>
            <NeonButton variant="accent">Pink Button</NeonButton>
          </div>
          
          {/* Full width card with circuit corners */}
          <div className="md:col-span-2 lg:col-span-3 glass-card relative p-10 backdrop-blur-2xl overflow-hidden">
            <div className="circuit-corner-tl"></div>
            <div className="circuit-corner-tr"></div>
            <div className="circuit-corner-bl"></div>
            <div className="circuit-corner-br"></div>
            
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-3 text-white">Neon Circuit Glassmorphism</h3>
              <p className="text-white/80 max-w-3xl mx-auto mb-8">
                This premium UI design system combines the depth of glassmorphism with vibrant neon accents and circuit board aesthetics, creating an immersive high-tech experience perfect for modern digital products.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <NeonButton variant="gradient" glowIntensity="high">
                  Explore Features
                </NeonButton>
                <NeonButton variant="electric">
                  <Code className="mr-2 h-4 w-4" />
                  View Code
                </NeonButton>
              </div>
            </div>
          </div>
        </div>
        
        {/* Neon dividers */}
        <div className="my-20">
          <div className="neon-divider"></div>
          <div className="neon-divider-purple mt-3"></div>
          <div className="neon-divider-pink mt-3"></div>
        </div>
        
        {/* Additional showcase items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          <div className="glass-card p-6 neon-card-hover-cyan">
            <h3 className="text-xl font-bold mb-3 gradient-text">Hover Glow Effect</h3>
            <p className="text-white/80 mb-4">
              Cards with interactive hover states that add neon glow effects when users interact with them.
            </p>
            <div className="neon-box-cyan p-4 mt-6">
              <p className="text-sm">This box has a subtle pulsing cyan glow effect.</p>
            </div>
          </div>
          
          <div className="glass-card p-6 neon-card-hover-pink">
            <h3 className="text-xl font-bold mb-3 gradient-text">Neon Text Effects</h3>
            <p className="text-white/80 mb-4">
              Text with various neon glow effects and animations.
            </p>
            <div className="space-y-4 mt-6">
              <h4 className="neon-text-glow text-lg">Cyan Glow Text</h4>
              <h4 className="neon-text-glow-pink text-lg">Pink Glow Text</h4>
              <h4 className="neon-text-glow-purple text-lg">Purple Glow Text</h4>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default FuturisticDemo;
