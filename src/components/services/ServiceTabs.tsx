
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ServiceCard from "./ServiceCard";
import { ServiceType } from "./types";
import { NeonButton } from "@/components/ui/neon-button";

interface ServiceTabsProps {
  services: ServiceType[];
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const ServiceTabs = ({ services, activeTab, setActiveTab }: ServiceTabsProps) => {
  return (
    <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-10">
      <TabsList className="grid grid-cols-3 md:grid-cols-7 mb-8 bg-aura-backgroundLight">
        <TabsTrigger value="all" className="data-[state=active]:text-[color:var(--c-cyan)] data-[state=active]:bg-[color:var(--c-cyan)]/20 data-[state=active]:shadow-neon-blue-soft">All</TabsTrigger>
        <TabsTrigger value="web" className="data-[state=active]:text-[color:var(--c-cyan)] data-[state=active]:bg-[color:var(--c-cyan)]/20 data-[state=active]:shadow-neon-blue-soft">Web</TabsTrigger>
        <TabsTrigger value="app" className="data-[state=active]:text-[color:var(--c-purple)] data-[state=active]:bg-[color:var(--c-purple)]/20 data-[state=active]:shadow-neon-purple-soft">Apps</TabsTrigger>
        <TabsTrigger value="ai" className="data-[state=active]:text-[color:var(--c-teal)] data-[state=active]:bg-[color:var(--c-teal)]/20 data-[state=active]:shadow-neon-teal-soft">AI</TabsTrigger>
        <TabsTrigger value="cloud" className="data-[state=active]:text-[color:var(--c-cyan)] data-[state=active]:bg-[color:var(--c-cyan)]/20 data-[state=active]:shadow-neon-blue-soft">Cloud</TabsTrigger>
        <TabsTrigger value="security" className="data-[state=active]:text-[color:var(--c-purple)] data-[state=active]:bg-[color:var(--c-purple)]/20 data-[state=active]:shadow-neon-purple-soft">Security</TabsTrigger>
        <TabsTrigger value="consulting" className="data-[state=active]:text-[color:var(--c-teal)] data-[state=active]:bg-[color:var(--c-teal)]/20 data-[state=active]:shadow-neon-teal-soft">Consulting</TabsTrigger>
      </TabsList>
      
      <TabsContent value="all">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </TabsContent>
      
      {services.map((service) => (
        <TabsContent key={service.id} value={service.id}>
          <div className="grid grid-cols-1 gap-6">
            <ServiceCard service={service} />
            
            {/* Add contact CTA button for individual service pages */}
            <div className="mt-8 text-center">
              <NeonButton variant="gradient" className="px-8 py-3 font-medium">
                Get a Free Consultation
              </NeonButton>
            </div>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default ServiceTabs;
