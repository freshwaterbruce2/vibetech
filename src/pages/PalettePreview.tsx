
import React from "react";
import { Card } from "@/components/ui/card";
import SectionHeading from "@/components/ui/section-heading";

type ColorSwatch = {
  name: string;
  value: string;
  cssVarName?: string;
  tailwindClass?: string;
};

const PalettePreview = () => {
  const tokenColors: ColorSwatch[] = [
    { name: "Cyan", value: "var(--c-cyan)", cssVarName: "--c-cyan", tailwindClass: "bg-cyan" },
    { name: "Purple", value: "var(--c-purple)", cssVarName: "--c-purple", tailwindClass: "bg-purple" },
    { name: "Glass Background", value: "var(--glass-bg)", cssVarName: "--glass-bg", tailwindClass: "bg-futuristic-glassOverlay" },
    { name: "Background Start", value: "var(--bg-start)", cssVarName: "--bg-start", tailwindClass: "bg-futuristic-darkBg" },
  ];

  const auraColors: ColorSwatch[] = [
    { name: "Aura Neon Blue", value: "var(--c-cyan)", tailwindClass: "bg-aura-neonBlue" },
    { name: "Aura Neon Purple", value: "var(--c-purple)", tailwindClass: "bg-aura-neonPurple" },
    { name: "Aura Neon Cyan", value: "var(--c-cyan)", tailwindClass: "bg-aura-neonCyan" },
    { name: "Aura Dark Background", value: "var(--bg-start)", tailwindClass: "bg-aura-darkBg" },
  ];

  const futuristicColors: ColorSwatch[] = [
    { name: "Futuristic Neon Blue", value: "var(--c-cyan)", tailwindClass: "bg-futuristic-neonBlue" },
    { name: "Futuristic Neon Purple", value: "var(--c-purple)", tailwindClass: "bg-futuristic-neonPurple" },
    { name: "Futuristic Dark Background", value: "var(--bg-start)", tailwindClass: "bg-futuristic-darkBg" },
    { name: "Futuristic Glass Overlay", value: "var(--glass-bg)", tailwindClass: "bg-futuristic-glassOverlay" },
  ];

  const renderColorCard = (color: ColorSwatch) => (
    <Card key={color.name} className="glass-card p-6">
      <div className="mb-4">
        <div 
          className={`h-24 w-full rounded-lg ${color.tailwindClass || ""}`} 
          style={{ background: !color.tailwindClass ? color.value : undefined }}
        ></div>
      </div>
      <div className="space-y-2">
        <h3 className="font-medium text-lg">{color.name}</h3>
        {color.cssVarName && (
          <p className="text-sm text-aura-textSecondary">{color.cssVarName}</p>
        )}
        <p className="text-sm font-mono bg-aura-backgroundLight/30 p-1 rounded">{color.value}</p>
        {color.tailwindClass && (
          <p className="text-sm font-mono bg-aura-backgroundLight/30 p-1 rounded">{color.tailwindClass}</p>
        )}
      </div>
    </Card>
  );

  return (
    <div className="container py-12">
      <SectionHeading>Color Palette Preview</SectionHeading>
      
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-6">CSS Token Colors</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {tokenColors.map(renderColorCard)}
        </div>
      </div>
      
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-6">Aura Theme Colors</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {auraColors.map(renderColorCard)}
        </div>
      </div>
      
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-6">Futuristic Theme Colors</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {futuristicColors.map(renderColorCard)}
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-6">Contrast Tests</h2>
        <div className="space-y-6">
          <Card className="p-6 bg-futuristic-darkBg">
            <h3 className="text-lg font-medium text-cyan mb-2">Cyan text on Dark Background</h3>
            <p className="text-cyan">This text should have acceptable contrast for accessibility.</p>
          </Card>
          
          <Card className="p-6 bg-futuristic-darkBg">
            <h3 className="text-lg font-medium text-purple mb-2">Purple text on Dark Background</h3>
            <p className="text-purple">This text should have acceptable contrast for accessibility.</p>
          </Card>
          
          <Card className="p-6 bg-cyan">
            <h3 className="text-lg font-medium text-futuristic-darkBg mb-2">Dark Background text on Cyan</h3>
            <p className="text-futuristic-darkBg">This text should have acceptable contrast for accessibility.</p>
          </Card>
          
          <Card className="p-6 bg-purple">
            <h3 className="text-lg font-medium text-futuristic-darkBg mb-2">Dark Background text on Purple</h3>
            <p className="text-futuristic-darkBg">This text should have acceptable contrast for accessibility.</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PalettePreview;
