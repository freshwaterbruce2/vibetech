
import { useState, useEffect } from "react";
import PageLayout from "@/components/layout/PageLayout";
import UniformServicesHero from "@/components/services/UniformServicesHero";
import UniformServicesContent from "@/components/services/UniformServicesContent";
import UniformServicesPricing from "@/components/services/UniformServicesPricing";
import UniformServicesCtaSection from "@/components/services/UniformServicesCtaSection";
import { personalizedServices } from "@/components/services/personalizedServicesData";
import { useAnalytics } from "@/hooks/useAnalytics";

const Services = () => {
  const [activeTab, setActiveTab] = useState("all");
  const { trackEvent, trackServiceView } = useAnalytics();
  
  // Track page view with custom dimension
  useEffect(() => {
    trackEvent('page_view', {
      category: 'Page Visits',
      label: 'Services Page',
      customDimensions: {
        page_section: 'services',
        page_template: 'service_list'
      }
    });
  }, [trackEvent]);
  
  // Track when services are viewed
  useEffect(() => {
    if (activeTab !== 'all') {
      const service = personalizedServices.find(s => s.id === activeTab);
      if (service) {
        trackServiceView(service.id, service.name);
      }
    }
  }, [activeTab, trackServiceView]);

  return (
    <PageLayout 
      title="Specialized Business Solutions" 
      description="Revenue-driven technology solutions: Advanced trading systems, enterprise PWAs, AI content generation, booking platforms, and business process automation."
      keywords="crypto trading systems, enterprise PWA, AI content generation, hotel booking platform, business automation, financial technology"
    >
      {/* Hero Section - matches other pages */}
      <UniformServicesHero />
      
      {/* Services Content */}
      <UniformServicesContent 
        services={personalizedServices} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />
      
      {/* Pricing Section */}
      <UniformServicesPricing />
      
      {/* CTA Section - matches other pages */}
      <UniformServicesCtaSection />
    </PageLayout>
  );
};

export default Services;
