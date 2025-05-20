
import { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import ServicesHeader from "@/components/services/ServicesHeader";
import OptimizedServiceTabs from "@/components/services/OptimizedServiceTabs";
import { services } from "@/components/services/servicesData";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useEffect } from "react";

const Services = () => {
  const [activeTab, setActiveTab] = useState("all");
  const { trackEvent } = useAnalytics();
  
  // Track page view with custom dimension
  useEffect(() => {
    trackEvent('page_view', 'Services', 'Services Page Visit');
  }, [trackEvent]);

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
