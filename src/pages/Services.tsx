
import { useState, useEffect } from "react";
import PageLayout from "@/components/layout/PageLayout";
import ServicesHeader from "@/components/services/ServicesHeader";
import OptimizedServiceTabs from "@/components/services/OptimizedServiceTabs";
import { services } from "@/components/services/servicesData";
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
      const service = services.find(s => s.id === activeTab);
      if (service) {
        trackServiceView(service.id, service.name);
      }
    }
  }, [activeTab, trackServiceView]);

  return (
    <PageLayout 
      title="Services" 
      description="Explore the full range of digital services offered by Vibe Tech - from web development to UI/UX design, custom software solutions, and mobile app development."
      keywords="web development, UI/UX design, custom software, mobile app development, digital services"
    >
      <div className="max-w-7xl mx-auto px-4 pt-24 relative z-10">
        <ServicesHeader />
        <OptimizedServiceTabs 
          services={services} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />
      </div>
    </PageLayout>
  );
};

export default Services;
