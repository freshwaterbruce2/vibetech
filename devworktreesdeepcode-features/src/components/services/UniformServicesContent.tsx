import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Code, Lightbulb, DollarSign } from "lucide-react";
import { ServiceType } from "./types";
import AnimateOnScroll from "@/components/ui/animate-on-scroll";

interface UniformServicesContentProps {
  services: ServiceType[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const UniformServicesContent: React.FC<UniformServicesContentProps> = ({
  services,
  activeTab,
  setActiveTab,
}) => {
  const allServices = [{ id: "all", name: "All Services" }, ...services];

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <AnimateOnScroll>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 mb-8 bg-card/50 backdrop-blur-sm">
              {allServices.map((service) => (
                <TabsTrigger 
                  key={service.id} 
                  value={service.id}
                  className="data-[state=active]:bg-aura-accent data-[state=active]:text-white"
                >
                  {service.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="space-y-8">
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {services.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </TabsContent>

            {services.map((service) => (
              <TabsContent key={service.id} value={service.id}>
                <DetailedServiceView service={service} />
              </TabsContent>
            ))}
          </Tabs>
        </AnimateOnScroll>
      </div>
    </section>
  );
};

const ServiceCard: React.FC<{ service: ServiceType }> = ({ service }) => {
  const IconComponent = service.icon.type;

  return (
    <AnimateOnScroll>
      <Card className="p-6 hover:shadow-lg hover:shadow-aura-accent/20 transition-all duration-300 bg-card/80 backdrop-blur-sm border-border/50 h-full">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 rounded-lg bg-gradient-to-r from-aura-accent/20 to-aura-accent/10">
            <IconComponent {...service.icon.props} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-2 text-gray-50">{service.name}</h3>
            <p className="text-gray-300 text-sm">{service.description}</p>
          </div>
        </div>

        {service.businessValue && (
          <div className="mb-4 p-3 bg-gradient-to-r from-green-500/10 to-transparent border-l-2 border-green-500/50 rounded-r">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-green-400" />
              <span className="text-xs font-medium text-green-400">Business Impact</span>
            </div>
            <p className="text-sm text-gray-300">{service.businessValue}</p>
          </div>
        )}

        <div className="space-y-2">
          {service.features.slice(0, 3).map((feature, index) => (
            <div key={index} className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-aura-accent mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-300">{feature}</span>
            </div>
          ))}
          {service.features.length > 3 && (
            <p className="text-xs text-gray-400 mt-2">
              +{service.features.length - 3} more capabilities
            </p>
          )}
        </div>
      </Card>
    </AnimateOnScroll>
  );
};

const DetailedServiceView: React.FC<{ service: ServiceType }> = ({ service }) => {
  const IconComponent = service.icon.type;

  return (
    <AnimateOnScroll>
      <div className="space-y-8">
        {/* Header */}
        <Card className="p-8 bg-gradient-to-r from-aura-accent/10 to-transparent border-aura-accent/20">
          <div className="flex items-start gap-6">
            <div className="p-4 rounded-xl bg-gradient-to-r from-aura-accent/20 to-aura-accent/10">
              <IconComponent className="h-12 w-12 text-aura-accent" />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-3 text-gray-50">{service.name}</h2>
              <p className="text-lg text-gray-300 mb-4">{service.description}</p>
              {service.businessValue && (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-400" />
                  <span className="text-green-100 font-medium">{service.businessValue}</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Core Features */}
          <Card className="p-6 bg-card/80 backdrop-blur-sm">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-50">
              <CheckCircle className="h-5 w-5 text-aura-accent" />
              Core Capabilities
            </h3>
            <div className="space-y-3">
              {service.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-aura-accent mt-1 flex-shrink-0" />
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Technologies */}
          {service.technologies && (
            <Card className="p-6 bg-card/80 backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-50">
                <Code className="h-5 w-5 text-purple-400" />
                Technologies Used
              </h3>
              <div className="flex flex-wrap gap-2">
                {service.technologies.map((tech, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="bg-purple-500/10 border-purple-500/20 text-purple-200"
                  >
                    {tech}
                  </Badge>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Real Projects */}
        {service.realProjects && (
          <Card className="p-6 bg-card/80 backdrop-blur-sm">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-50">
              <Lightbulb className="h-5 w-5 text-yellow-400" />
              Real Projects & Case Studies
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {service.realProjects.map((project, index) => (
                <div key={index} className="p-4 bg-gradient-to-r from-yellow-500/5 to-transparent border border-yellow-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-400 mt-1 flex-shrink-0" />
                    <span className="text-sm text-gray-300">{project}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AnimateOnScroll>
  );
};

export default UniformServicesContent;