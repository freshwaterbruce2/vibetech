
import React, { useEffect } from "react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import ToolsHeroSection from "@/components/tools/ToolsHeroSection";
import IntegrationShowcase from "@/components/tools/IntegrationShowcase";
import RemoteServicesBanner from "@/components/tools/RemoteServicesBanner";
import ToolsCta from "@/components/tools/ToolsCta";
import { toolsData } from "@/components/tools/toolsData";

const Tools = () => {
  useEffect(() => {
    document.title = "Tools & Integrations | Vibe Tech";
  }, []);

  return (
    <div className="min-h-screen bg-aura-background">
      <NavBar />
      <ToolsHeroSection toolsData={toolsData} />
      <RemoteServicesBanner />
      <IntegrationShowcase />
      <ToolsCta />
      <Footer />
    </div>
  );
};

export default Tools;
