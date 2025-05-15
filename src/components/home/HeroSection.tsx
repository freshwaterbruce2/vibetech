import { Link } from "react-router-dom";
import { NeonButton } from "@/components/ui/neon-button";
import SmartLeadForm from "@/components/lead/SmartLeadForm";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
const HeroSection = () => {
  return <section className="pt-28 pb-20">
      <div className="glass-card mx-auto max-w-6xl px-6 py-10 lg:flex lg:items-center relative z-10 border border-[rgba(185,51,255,0.2)] hover:border-[rgba(185,51,255,0.4)] hover:shadow-neon-purple-soft">
        {/* Left side - Avatar with neon border */}
        <div className="w-full md:w-1/3 mb-10 md:mb-0 spotlight">
          <div className="relative w-64 h-64 mx-auto overflow-hidden rounded-full border-4 border-[rgba(185,51,255,0.8)] shadow-[0_0_25px_rgba(185,51,255,0.6)]">
            <img src="/lovable-uploads/ae54484e-f918-4266-a5e6-212b191a2e99.png" alt="Bruce Freshwater" className="w-full h-full object-center object-scale-down" />
          </div>
        </div>
        
        {/* Right side - Text with neon elements */}
        <div className="w-full md:w-2/3 md:pl-12">
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight text-white">
            Hello, I'm <span className="text-[color:var(--c-cyan)]">Bruce Freshwater</span>
          </h1>
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-white">
              Your Partner in Next-Level Digital Experiences
            </h2>
          </div>
          <p className="lead-text mb-8 max-w-2xl text-white">
            Imagine a world where your website or app loads instantly, welcomes every user, and feels as intuitive as a conversation. That's the power of design and code working in perfect harmony.
          </p>
          
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3 text-[color:var(--c-cyan)]">Ready to Ignite Your Vision?</h3>
            <p className="mb-4 text-white">Tell me your goals, and together we'll craft a digital solution that dazzles and delivers.</p>
            <SmartLeadForm variant="inline" buttonText="Contact Me" showServiceInterest={false} />
            
            <div className="text-center my-4">
              <span className="px-4 relative inline-flex items-center">
                <span className="neon-divider-purple absolute left-0 w-full top-1/2"></span>
                <span className="bg-aura-background px-4 relative z-10 text-white">or</span>
              </span>
            </div>
          </div>
          
          <div className="text-center">
            <NeonButton variant="gradient" size="lg" asChild>
              <Link to="/portfolio">View My Work</Link>
            </NeonButton>
          </div>
        </div>
      </div>
    </section>;
};
export default HeroSection;