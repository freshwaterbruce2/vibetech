
import { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import ServicesHeader from "@/components/services/ServicesHeader";
import ServiceTabs from "@/components/services/ServiceTabs";
import { services } from "@/components/services/servicesData";

const Services = () => {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <PageLayout 
      title="Services" 
      description="Explore the full range of digital services offered by Vibe Tech - from web development to UI/UX design, custom software solutions, and mobile app development."
      keywords="web development, UI/UX design, custom software, mobile app development, digital services"
    >
      <div className="max-w-7xl mx-auto px-4 pt-24 relative z-10">
        <ServicesHeader />
        <ServiceTabs 
          services={services} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />
      </div>
    </PageLayout>
  );
};

export default Services;
