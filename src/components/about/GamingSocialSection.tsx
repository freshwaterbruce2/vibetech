
import React from "react";
import { Youtube, Gamepad, User } from "lucide-react";

const GamingSocialSection = () => {
  return (
    <section className="py-16 px-4 bg-aura-backgroundLight/30">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-lg blur-xl"></div>
            <div className="relative tech-border rounded-lg overflow-hidden">
              <div className="aspect-w-16 aspect-h-9 bg-aura-backgroundLight/40">
                <img src="/placeholder.svg" alt="Gaming and social media content" className="object-cover w-full h-full" />
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-6 font-heading text-fuchsia-500">
              Gaming & <span className="bg-gradient-to-r from-purple-400 to-aura-accent bg-clip-text text-fuchsia-500 text-3xl">Media</span>
            </h2>
            <div className="w-24 h-1.5 bg-gradient-to-r from-purple-400 to-aura-accent mb-6 rounded-full"></div>
            <p className="text-lg mb-4 text-white">
              Led by Blake Freshwater, our gaming and social media division creates engaging content across multiple platforms to connect with audiences worldwide.
            </p>
            <p className="text-lg mb-6 text-white">
              From YouTube tutorials and gameplay videos to managing our social media presence, Blake brings creativity and expertise to expand our digital footprint.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-2 bg-aura-background border border-aura-accent/20 rounded-full flex items-center gap-2">
                <Youtube size={16} className="text-aura-accent" />
                <span className="text-white">YouTube Content</span>
              </div>
              <div className="px-4 py-2 bg-aura-background border border-aura-accent/20 rounded-full flex items-center gap-2">
                <Gamepad size={16} className="text-aura-accent" />
                <span className="text-white">Gaming</span>
              </div>
              <div className="px-4 py-2 bg-aura-background border border-aura-accent/20 rounded-full flex items-center gap-2">
                <User size={16} className="text-aura-accent" />
                <span className="text-white">Social Media</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GamingSocialSection;
