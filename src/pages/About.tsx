
import { useEffect } from "react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import ParticleNetworkCanvas from "@/components/ui/particle-network";
import AboutHeroSection from "@/components/about/AboutHeroSection";
import CoreValuesSection from "@/components/about/CoreValuesSection";
import TeamSection from "@/components/about/TeamSection";
import GamingSocialSection from "@/components/about/GamingSocialSection";
import CtaSection from "@/components/about/CtaSection";

const About = () => {
  useEffect(() => {
    document.title = "About | Vibe Tech";
  }, []);

  return (
    <div className="min-h-screen bg-aura-background">
      <NavBar />
      <ParticleNetworkCanvas className="z-0" particleCount={20} opacity={0.1} />
      
      {/* Hero Section */}
      <AboutHeroSection />
      
      {/* Core Values */}
      <CoreValuesSection />
      
      {/* Team Section */}
      <TeamSection />
      
      {/* Blake's Section */}
      <GamingSocialSection />
      
      {/* CTA Section */}
      <CtaSection />
      
      <Footer />
    </div>
  );
};

export default About;
