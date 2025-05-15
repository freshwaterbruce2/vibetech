
import { Link } from "react-router-dom";
import { NeonButton } from "@/components/ui/neon-button";
import SmartLeadForm from "@/components/lead/SmartLeadForm";

const HeroSection = () => {
  return (
    <section className="pt-28 pb-20">
      <div className="glass-card mx-auto max-w-6xl px-6 py-10 lg:flex lg:items-center relative z-10 border border-[color:var(--c-cyan)/20] hover:border-[color:var(--c-cyan)/40] hover:shadow-neon-blue-soft">
        {/* Left side - Avatar with neon border */}
        <div className="w-full md:w-1/3 mb-10 md:mb-0 spotlight">
          <div className="relative w-64 h-64 mx-auto">
            <img 
              src="/lovable-uploads/08428935-73c2-4027-a962-e5ef443f73ce.png" 
              alt="Bruce Freshwater" 
              className="rounded-full object-cover w-full h-full animate-glow border-4 border-[color:var(--c-cyan)/80] shadow-[0_0_25px_var(--c-cyan)]"
            />
          </div>
        </div>
        
        {/* Right side - Text with neon elements */}
        <div className="w-full md:w-2/3 md:pl-12">
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
            Hello! I'm <span className="text-[color:var(--c-cyan)]">Bruce Freshwater</span>
          </h1>
          <div className="mb-6 flex items-center">
            <span className="text-2xl md:text-3xl font-semibold">
              I'm a <span className="text-[color:var(--c-cyan)]">Software Engineer</span>
            </span>
            <span className="ml-1 text-3xl animate-pulse">|</span>
          </div>
          <p className="lead-text mb-8 max-w-2xl">
            Currently, I'm a Software Engineer at Vibe Tech. I specialize in building exceptional digital experiences that are fast, accessible, and visually appealing.
          </p>
          
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3 text-[color:var(--c-cyan)]">Get in touch</h3>
            <SmartLeadForm 
              variant="inline" 
              buttonText="Contact Me" 
              showServiceInterest={false}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <NeonButton variant="gradient" size="lg" asChild>
              <Link to="/portfolio">View My Work</Link>
            </NeonButton>
            <NeonButton variant="secondary" size="lg" asChild>
              <Link to="/contact">Get In Touch</Link>
            </NeonButton>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
