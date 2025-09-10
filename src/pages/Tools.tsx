import React, { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { toolsData } from "@/components/tools/toolsData"; 
import ToolsHeroSection from "@/components/tools/ToolsHeroSection";
import IntegrationShowcase from "@/components/tools/IntegrationShowcase";
import RemoteServicesBanner from "@/components/tools/RemoteServicesBanner";
import ToolsCta from "@/components/tools/ToolsCta";
import ToolPricing from "@/components/tools/ToolPricing";
import AdminLogin from "@/components/admin/AdminLogin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAdmin } from "@/contexts/AdminContext";
import { useToast } from "@/hooks/use-toast";
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
  Monitor,
  Shield,
  LogOut,
  Crown
} from "lucide-react";

const Tools = () => {
  const { isAdmin, logout } = useAdmin();
  const { toast } = useToast();
  const [showAdminLogin, setShowAdminLogin] = useState(false);

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

  const handlePurchase = (toolName: string) => {
    toast({
      title: "Purchase Initiated",
      description: `Redirecting to purchase ${toolName}. This would integrate with Stripe/PayPal in production.`,
      variant: "default"
    });
    // In production, this would integrate with payment processor
  };

  const handleAdminLogout = () => {
    logout();
    toast({
      title: "Admin Logged Out",
      description: "You have been logged out of admin mode.",
      variant: "default"
    });
  };

  return (
    <PageLayout title="Tools & Integrations">
      {/* Admin Controls */}
      <div className="fixed top-4 right-4 z-50">
        {isAdmin ? (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-600 text-white">
              <Crown className="h-3 w-3 mr-1" />
              Admin Mode
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAdminLogout}
              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        ) : (
          <Dialog open={showAdminLogin} onOpenChange={setShowAdminLogin}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Shield className="h-4 w-4 mr-1" />
                Admin Login
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-aura-background border-[rgba(185,51,255,0.3)]">
              <DialogHeader>
                <DialogTitle className="text-white">Admin Access</DialogTitle>
              </DialogHeader>
              <AdminLogin onClose={() => setShowAdminLogin(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Hero Section with Tools */}
      <ToolsHeroSection toolsData={enrichedToolsData} />
      
      {/* Advanced Tools with Pricing */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Advanced Tools & Services
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Premium tools and services to accelerate your development workflow. 
              {isAdmin ? " Admin access grants free access to all tools." : " Choose your plan below."}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {toolsData.filter(tool => tool.pricing).map((tool, index) => (
              <ToolPricing
                key={index}
                toolName={tool.title}
                description={tool.description}
                price={tool.pricing?.price || 0}
                originalPrice={tool.pricing?.originalPrice}
                features={tool.pricing?.features || []}
                isAdvanced={tool.pricing?.isAdvanced || false}
                accessUrl={tool.pricing?.accessUrl}
                onPurchase={() => handlePurchase(tool.title)}
              />
            ))}
          </div>
        </div>
      </section>
      
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