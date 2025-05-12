
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
      return "bg-[color:var(--c-cyan)]/10 text-[color:var(--c-cyan)]";
    } else if (service.icon.props.className.includes("var(--c-purple)")) {
      return "bg-[color:var(--c-purple)]/10 text-[color:var(--c-purple)]";
    } else {
      return "bg-[color:var(--c-teal)]/10 text-[color:var(--c-teal)]";
    }
  };

  // Get the neon border color class
  const getNeonBorderClass = () => {
    if (service.icon.props.className.includes("var(--c-cyan)")) {
      return "neon-border";
    } else if (service.icon.props.className.includes("var(--c-purple)")) {
      return "neon-border-purple";
    } else {
      return "neon-border-teal";
    }
  };

  return (
    <AnimateOnScroll>
      <Card className={`hover-scale h-full glass-card ${getNeonBorderClass()} hover:shadow-lg transition-all duration-300`}>
        <CardHeader className="text-aura-text">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-[rgba(255,255,255,0.05)]">
              <GradientFeatherIcon icon={service.icon.type} size={24} />
            </div>
            <CardTitle className="text-aura-text gradient-text-full">{service.name}</CardTitle>
          </div>
          <CardDescription className="text-aura-textSecondary">{service.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {service.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-aura-text">
                <Badge variant="outline" className={`${getBadgeColor()} mt-0.5 animate-pulse-glow`}>
                  {index + 1}
                </Badge>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </AnimateOnScroll>
  );
};

export default ServiceCard;
