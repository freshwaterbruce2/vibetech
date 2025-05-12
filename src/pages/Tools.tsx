
import { useEffect } from "react";
import { Link } from "react-router-dom";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { toolsData } from "@/components/tools/toolsData"; 
import ToolsHeroSection from "@/components/tools/ToolsHeroSection";
import MeshAuroraBackground from "@/components/ui/mesh-aurora-background";
import IntegrationShowcase from "@/components/tools/IntegrationShowcase";
import RemoteServicesBanner from "@/components/tools/RemoteServicesBanner";
import ToolsCta from "@/components/tools/ToolsCta";
import {
  ShoppingCart,
  Link2,
  Mail,
  ChartBar,
  Users,
  Paintbrush
} from "lucide-react";

const Tools = () => {
  useEffect(() => {
    document.title = "Tools & Integrations | Vibe Tech";
  }, []);

  // Add icons to the toolsData
  const enrichedToolsData = toolsData.map(tool => {
    let iconComponent;
    
    switch (tool.icon) {
      case "linkIcon":
        iconComponent = <Link2 className="h-6 w-6 text-aura-accent" />;
        break;
      case "shoppingCart":
        iconComponent = <ShoppingCart className="h-6 w-6 text-aura-accent" />;
        break;
      case "mail":
        iconComponent = <Mail className="h-6 w-6 text-aura-accent" />;
        break;
      case "chartBar":
        iconComponent = <ChartBar className="h-6 w-6 text-aura-accent" />;
        break;
      case "users":
        iconComponent = <Users className="h-6 w-6 text-aura-accent" />;
        break;
      case "paintbrush":
        iconComponent = <Paintbrush className="h-6 w-6 text-aura-accent" />;
        break;
      default:
        iconComponent = <Link2 className="h-6 w-6 text-aura-accent" />;
    }
    
    return {
      ...tool,
      icon: iconComponent
    };
  });

  return (
    <div className="min-h-screen bg-aura-background">
      <NavBar />
      <div className="relative">
        <MeshAuroraBackground intensity="medium" className="z-0" />
        
        {/* Hero Section with Tools */}
        <ToolsHeroSection toolsData={enrichedToolsData} />
        
        {/* Integration Showcase */}
        <IntegrationShowcase />
        
        {/* Remote Services Banner */}
        <RemoteServicesBanner />
        
        {/* CTA Section */}
        <ToolsCta />
      </div>
      <Footer />
    </div>
  );
};

export default Tools;
