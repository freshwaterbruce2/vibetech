
import { ReactNode } from "react";

interface ServiceCardProps {
  title: string;
  description: string;
  icon: ReactNode;
}

const ServiceCard = ({ title, description, icon }: ServiceCardProps) => {
  return (
    <div className="p-8 rounded-lg border border-aura-accent/20 bg-aura-background hover:shadow-neon transition-shadow">
      <div className="mb-5 flex items-center justify-center w-16 h-16 rounded-full bg-aura-accent/10 border border-aura-accent/20">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3 font-heading">{title}</h3>
      <p className="text-aura-textSecondary">{description}</p>
    </div>
  );
};

export default ServiceCard;
