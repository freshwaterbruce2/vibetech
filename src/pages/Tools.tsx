
import { Link } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import { toolsData } from "@/components/tools/toolsData"; 
import ToolsHeroSection from "@/components/tools/ToolsHeroSection";
import IntegrationShowcase from "@/components/tools/IntegrationShowcase";
import RemoteServicesBanner from "@/components/tools/RemoteServicesBanner";
import ToolsCta from "@/components/tools/ToolsCta";
import {
  ShoppingCart,
  Link2,
  Mail,
  ChartBar,
  Users,
  Paintbrush,
  Code,
  Book,
  Briefcase,
  Monitor
} from "lucide-react";

const Tools = () => {
  // Add icons to the toolsData
  const enrichedToolsData = toolsData.map(tool => {
    let iconComponent;
    
    switch (tool.icon) {
      case "code":
        iconComponent = <Code className="h-6 w-6 text-aura-accent" />;
        break;
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
      case "book":
        iconComponent = <Book className="h-6 w-6 text-aura-accent" />;
        break;
      case "briefcase":
        iconComponent = <Briefcase className="h-6 w-6 text-aura-accent" />;
        break;
      case "monitor":
        iconComponent = <Monitor className="h-6 w-6 text-aura-accent" />;
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
    <PageLayout title="Tools & Integrations">
      {/* Hero Section with Tools */}
      <ToolsHeroSection toolsData={enrichedToolsData} />
      
      {/* Integration Showcase */}
      <IntegrationShowcase />
      
      {/* Remote Services Banner */}
      <RemoteServicesBanner />
      
      {/* CTA Section */}
      <ToolsCta />
    </PageLayout>
  );
};

export default Tools;
