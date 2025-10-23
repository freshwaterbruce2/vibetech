
import React, { memo, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ServiceCard from "./ServiceCard";
import { ServiceType } from "./types";
import { NeonButton } from "@/components/ui/neon-button";
import { useAnalytics } from "@/hooks/useAnalytics";

interface ServiceTabsProps {
  services: ServiceType[];
  activeTab: string;
  setActiveTab: (value: string) => void;
}

// Memoized individual tab trigger to prevent unnecessary re-renders
const TabTrigger = memo(({ value, label, className }: { value: string; label: string; className?: string }) => (
  <TabsTrigger 
    value={value} 
    className={className}
  >
    {label}
  </TabsTrigger>
));
TabTrigger.displayName = 'TabTrigger';

// Memoized service card to prevent unnecessary re-renders
const MemoizedServiceCard = memo(ServiceCard);

const OptimizedServiceTabs = ({ services, activeTab, setActiveTab }: ServiceTabsProps) => {
  const { trackEvent, trackButtonClick, trackFeatureInteraction } = useAnalytics();
  
  // Track tab changes with enhanced analytics
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    trackFeatureInteraction('service_tab', `Changed to ${value}`);
  }, [setActiveTab, trackFeatureInteraction]);
  
  // Track consultation button clicks with enhanced analytics
  const handleConsultationClick = useCallback(() => {
    trackButtonClick('Get a Free Consultation', `Services tab: ${activeTab}`);
    
    // You could also track this as a conversion event
    trackEvent('conversion_start', {
      category: 'Lead Generation',
      label: 'Consultation Request',
      customDimensions: {
        source_tab: activeTab,
        conversion_type: 'consultation'
      }
    });
  }, [activeTab, trackButtonClick, trackEvent]);

  return (
    <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange} className="mb-10">
      <TabsList className="grid grid-cols-3 md:grid-cols-7 mb-8 bg-aura-backgroundLight">
        <TabTrigger 
          value="all" 
          label="All"
          className="data-[state=active]:text-[color:var(--c-cyan)] data-[state=active]:bg-[color:var(--c-cyan)]/20 data-[state=active]:shadow-neon-blue-soft"
        />
        <TabTrigger 
          value="web" 
          label="Web"
          className="data-[state=active]:text-[color:var(--c-cyan)] data-[state=active]:bg-[color:var(--c-cyan)]/20 data-[state=active]:shadow-neon-blue-soft"
        />
        <TabTrigger 
          value="app" 
          label="Apps"
          className="data-[state=active]:text-[color:var(--c-purple)] data-[state=active]:bg-[color:var(--c-purple)]/20 data-[state=active]:shadow-neon-purple-soft"
        />
        <TabTrigger 
          value="ai" 
          label="AI"
          className="data-[state=active]:text-[color:var(--c-teal)] data-[state=active]:bg-[color:var(--c-teal)]/20 data-[state=active]:shadow-neon-teal-soft"
        />
        <TabTrigger 
          value="cloud" 
          label="Cloud"
          className="data-[state=active]:text-[color:var(--c-cyan)] data-[state=active]:bg-[color:var(--c-cyan)]/20 data-[state=active]:shadow-neon-blue-soft"
        />
        <TabTrigger 
          value="security" 
          label="Security"
          className="data-[state=active]:text-[color:var(--c-purple)] data-[state=active]:bg-[color:var(--c-purple)]/20 data-[state=active]:shadow-neon-purple-soft"
        />
        <TabTrigger 
          value="consulting" 
          label="Consulting"
          className="data-[state=active]:text-[color:var(--c-teal)] data-[state=active]:bg-[color:var(--c-teal)]/20 data-[state=active]:shadow-neon-teal-soft"
        />
      </TabsList>
      
      <TabsContent value="all">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <MemoizedServiceCard key={service.id} service={service} />
          ))}
        </div>
      </TabsContent>
      
      {services.map((service) => (
        <TabsContent key={service.id} value={service.id}>
          <div className="grid grid-cols-1 gap-6">
            <MemoizedServiceCard service={service} />
            
            {/* Add contact CTA button for individual service pages with enhanced analytics tracking */}
            <div className="mt-8 text-center">
              <NeonButton 
                variant="gradient" 
                className="px-8 py-3 font-medium"
                onClick={handleConsultationClick}
              >
                Get a Free Consultation
              </NeonButton>
            </div>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default OptimizedServiceTabs;
