
import React from "react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import MeshAuroraBackground from "@/components/ui/mesh-aurora-background";
import ParticleNetworkCanvas from "@/components/ui/particle-network";

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  particleOpacity?: number;
  particleCount?: number;
  auroraIntensity?: "low" | "medium" | "high";
}

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
  particleOpacity = 0.08,
  particleCount = 15,
  auroraIntensity = "medium"
}) => {
  // Set page title if provided
  React.useEffect(() => {
    if (title) {
      document.title = `${title} | Vibe Tech`;
    }
  }, [title]);

  return (
    <div className="min-h-screen dashboard-bg relative overflow-hidden">
      {/* Common background elements */}
      <MeshAuroraBackground intensity={auroraIntensity} />
      <ParticleNetworkCanvas particleCount={particleCount} opacity={particleOpacity} />
      
      {/* Subtle particle overlay for tech effect */}
      <div className="particles-bg-dense absolute inset-0 z-[1] opacity-70 pointer-events-none"></div>
      
      {/* Main content */}
      <NavBar />
      <main className="relative z-10">
        {children}
      </main>
      <Footer />
      
      {/* Enhanced floating neon elements */}
      <div className="fixed bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#9426ff]/5 to-transparent z-[1] pointer-events-none"></div>
      <div className="fixed top-1/4 -left-20 w-40 h-40 rounded-full bg-[#4a007d]/10 blur-3xl z-[1] pointer-events-none animate-pulse"></div>
      <div className="fixed top-3/4 -right-20 w-40 h-40 rounded-full bg-[#00f7ff]/10 blur-3xl z-[1] pointer-events-none animate-pulse"></div>
      
      {/* Add corner circuit decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 border-t-2 border-l-2 border-[#9426ff]/20 pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-20 h-20 border-b-2 border-r-2 border-[#00f7ff]/20 pointer-events-none"></div>
    </div>
  );
};

export default PageLayout;
