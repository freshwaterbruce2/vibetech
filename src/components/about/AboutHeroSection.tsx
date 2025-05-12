
import React from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/ui/page-header";

const AboutHeroSection = () => {
  return (
    <section className="pt-28 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <PageHeader 
          title="About Vibe Tech"
          subtitle="Creating innovative digital solutions that combine stunning design with powerful functionality."
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-14">
          <div>
            <p className="text-aura-textSecondary text-lg mb-6">
              Vibe Tech is a cutting-edge tech company founded by Bruce Freshwater, focused on creating innovative digital solutions that combine stunning design with powerful functionality.
            </p>
            <p className="text-aura-textSecondary text-lg mb-6">
              Founded in 2020, our team brings together decades of combined experience in software development, UI/UX design, and digital strategy to deliver exceptional results for our clients.
            </p>
            <p className="text-aura-textSecondary text-lg">
              Our mission is to help businesses and individuals harness the power of technology to achieve their goals, with a focus on creating intuitive, accessible, and visually striking digital experiences.
            </p>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-aura-accent/20 to-transparent rounded-lg blur-xl"></div>
            <div className="relative tech-border rounded-lg overflow-hidden h-full">
              <img 
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158" 
                alt="Team working on tech projects" 
                className="w-full h-full object-cover" 
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutHeroSection;
