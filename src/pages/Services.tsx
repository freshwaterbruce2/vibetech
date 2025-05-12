
import { useState } from "react";
import NavBar from "@/components/NavBar";
import MeshAuroraBackground from "@/components/ui/mesh-aurora-background";
import ParticleNetworkCanvas from "@/components/ui/particle-network";
import ServicesHeader from "@/components/services/ServicesHeader";
import ServiceTabs from "@/components/services/ServiceTabs";
import { services } from "@/components/services/servicesData";
import Footer from "@/components/Footer";

const Services = () => {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="min-h-screen dashboard-bg relative overflow-hidden">
      {/* Enhanced background elements */}
      <MeshAuroraBackground intensity="medium" />
      <ParticleNetworkCanvas particleCount={15} opacity={0.08} />
      
      {/* Add subtle particle overlay for more tech effect */}
      <div className="particles-bg-dense absolute inset-0 z-[1] opacity-70 pointer-events-none"></div>
      
      <NavBar />
      
      <div className="max-w-7xl mx-auto px-4 pt-24 relative z-10">
        <ServicesHeader />
        <ServiceTabs 
          services={services} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />
      </div>
      
      {/* Enhanced floating neon elements */}
      <div className="fixed bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[color:var(--c-cyan)]/5 to-transparent z-[1] pointer-events-none"></div>
      <div className="fixed top-1/4 -left-20 w-40 h-40 rounded-full bg-[color:var(--c-purple)]/10 blur-3xl z-[1] pointer-events-none animate-pulse"></div>
      <div className="fixed top-3/4 -right-20 w-40 h-40 rounded-full bg-[color:var(--c-teal)]/10 blur-3xl z-[1] pointer-events-none animate-pulse"></div>
      
      {/* Add corner circuit decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 border-t-2 border-l-2 border-[color:var(--c-cyan)]/20 pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-20 h-20 border-b-2 border-r-2 border-[color:var(--c-purple)]/20 pointer-events-none"></div>
      
      <Footer />
    </div>
  );
};

export default Services;
