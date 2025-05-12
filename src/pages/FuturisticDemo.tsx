
import React from "react";
import FuturisticCard from "@/components/ui/futuristic-card";
import { NeonButton } from "@/components/ui/neon-button";
import MeshAuroraBackground from "@/components/ui/mesh-aurora-background";

const FuturisticDemo = () => {
  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-futuristic-darkBg">
      {/* Enhanced background effect */}
      <MeshAuroraBackground intensity="high" />
      
      <div className="container mx-auto px-4 py-16 relative z-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center bg-gradient-to-r from-cyan via-purple to-teal bg-clip-text text-transparent">
          Futuristic UI Components
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {/* Blue variant */}
          <FuturisticCard variant="blue" glowIntensity="medium">
            <h3 className="text-xl font-bold mb-3 text-cyan">Neon Blue Card</h3>
            <p className="text-white/80">This card features a blue neon glow effect with glass morphism.</p>
            <div className="mt-4">
              <NeonButton variant="blue">Blue Button</NeonButton>
            </div>
          </FuturisticCard>
          
          {/* Purple variant */}
          <FuturisticCard variant="purple" glowIntensity="high">
            <h3 className="text-xl font-bold mb-3 text-purple">Neon Purple Card</h3>
            <p className="text-white/80">This card features a purple neon glow effect with glass morphism.</p>
            <div className="mt-4">
              <NeonButton variant="purple">Purple Button</NeonButton>
            </div>
          </FuturisticCard>
          
          {/* Teal variant */}
          <FuturisticCard variant="teal" glowIntensity="medium">
            <h3 className="text-xl font-bold mb-3 text-teal">Neon Teal Card</h3>
            <p className="text-white/80">This card features a teal neon glow effect with glass morphism.</p>
            <div className="mt-4">
              <NeonButton variant="teal">Teal Button</NeonButton>
            </div>
          </FuturisticCard>
          
          {/* Glass variant */}
          <FuturisticCard variant="glass" className="md:col-span-2 lg:col-span-3 backdrop-blur-xl">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-3 text-white">Pure Glassmorphism</h3>
              <p className="text-white/80 max-w-2xl mx-auto">
                This card demonstrates our enhanced glassmorphism effect with subtle neon border highlights.
              </p>
              <div className="mt-6 flex justify-center gap-4">
                <NeonButton variant="gradient">Gradient Button</NeonButton>
                <NeonButton variant="electric-teal">Electric Teal</NeonButton>
              </div>
            </div>
          </FuturisticCard>
        </div>
      </div>
    </div>
  );
};

export default FuturisticDemo;
