
import { useEffect } from "react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import ParticleNetworkCanvas from "@/components/ui/particle-network";
import { 
  Link as LinkIcon, 
  ShoppingCart, 
  Mail, 
  ChartBar, 
  Users, 
  Paintbrush
} from "lucide-react";
import { GradientFeatherIcon } from "@/components/ui/gradient-feather-icon";

// Import our new components
import ToolsHeroSection from "@/components/tools/ToolsHeroSection";
import IntegrationShowcase from "@/components/tools/IntegrationShowcase";
import ToolsCta from "@/components/tools/ToolsCta";
import { toolsData } from "@/components/tools/toolsData";
import { ToolCardProps } from "@/components/tools/ToolCard";

const Tools = () => {
  useEffect(() => {
    document.title = "Tools & Integrations | Vibe Tech";
  }, []);

  // Create the actual tools data with components
  const toolsWithIcons: ToolCardProps[] = toolsData.map(tool => {
    let iconComponent;
    
    switch (tool.icon) {
      case 'linkIcon':
        iconComponent = <GradientFeatherIcon icon={LinkIcon} size={24} variant="blue-purple" />;
        break;
      case 'shoppingCart':
        iconComponent = <GradientFeatherIcon icon={ShoppingCart} size={24} variant="purple-teal" />;
        break;
      case 'mail':
        iconComponent = <GradientFeatherIcon icon={Mail} size={24} variant="blue-teal" />;
        break;
      case 'chartBar':
        iconComponent = <GradientFeatherIcon icon={ChartBar} size={24} variant="blue-purple" />;
        break;
      case 'users':
        iconComponent = <GradientFeatherIcon icon={Users} size={24} variant="purple-teal" />;
        break;
      case 'paintbrush':
        iconComponent = <GradientFeatherIcon icon={Paintbrush} size={24} variant="blue-teal" />;
        break;
      default:
        iconComponent = <GradientFeatherIcon icon={LinkIcon} size={24} variant="blue-purple" />;
    }
    
    return {
      ...tool,
      icon: iconComponent
    };
  });

  return (
    <div className="min-h-screen bg-aura-background relative overflow-hidden">
      <NavBar />
      <ParticleNetworkCanvas className="z-0" particleCount={20} opacity={0.1} />
      
      {/* Hero Section with Tools Cards */}
      <ToolsHeroSection toolsData={toolsWithIcons} />
      
      {/* Integration Showcase Section */}
      <IntegrationShowcase />
      
      {/* CTA Section */}
      <ToolsCta />
      
      <Footer />
    </div>
  );
};

export default Tools;
