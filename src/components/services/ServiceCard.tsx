
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GradientFeatherIcon } from "@/components/ui/gradient-feather-icon";
import AnimateOnScroll from "@/components/ui/animate-on-scroll";
import { ServiceType } from "./types";

interface ServiceCardProps {
  service: ServiceType;
}

const ServiceCard = ({ service }: ServiceCardProps) => {
  // Determine which color to use for the badge based on service icon color
  const getBadgeColor = () => {
    if (service.icon.props.className.includes("var(--c-cyan)")) {
      return "bg-[#00f7ff]/10 text-[#00f7ff] border border-[#00f7ff]/20";
    } else if (service.icon.props.className.includes("var(--c-purple)")) {
      return "bg-[#9426ff]/10 text-[#9426ff] border border-[#9426ff]/20";
    } else {
      return "bg-[#00f7ff]/10 text-[#00f7ff] border border-[#00f7ff]/20";
    }
  };

  return (
    <AnimateOnScroll>
      <Card className="hover-scale h-full glass-card border border-[rgba(255,255,255,0.15)] hover:border-[rgba(255,255,255,0.25)] backdrop-blur-[24px] bg-[rgba(255,255,255,0.05)] shadow-[0_0_18px_rgba(148,38,255,0.35)] hover:shadow-[0_0_28px_rgba(148,38,255,0.45)] transition-all duration-300 hover:scale-[1.02]">
        <CardHeader className="text-aura-text">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-[rgba(255,255,255,0.05)]">
              <GradientFeatherIcon icon={service.icon.type} size={24} />
            </div>
            <CardTitle className="bg-gradient-to-r from-[#c87eff] via-[#8d4dff] to-[#00f7ff] text-transparent bg-clip-text">{service.name}</CardTitle>
          </div>
          <CardDescription className="text-slate-200/90">{service.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mt-2">
            {service.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-2 mb-3">
                <Badge variant="outline" className={`${getBadgeColor()} animate-pulse-glow`}>
                  {index + 1}
                </Badge>
                <span className="text-slate-200/90">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AnimateOnScroll>
  );
};

export default ServiceCard;
