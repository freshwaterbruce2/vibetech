
import { ReactNode } from "react";

interface ServiceCardProps {
  title: string;
  description: string;
  icon: ReactNode;
}

const ServiceCard = ({ title, description, icon }: ServiceCardProps) => {
  return (
    <div className="glass-card p-6 border border-[color:var(--c-cyan)/20] hover:border-[color:var(--c-cyan)/40] hover:shadow-neon-blue-soft transform transition-all duration-300 hover:-translate-y-1">
      <div className="mb-5 flex items-center justify-center w-16 h-16 rounded-full bg-[rgba(0,240,255,0.1)] border border-[color:var(--c-cyan)/20]">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3 font-heading text-aura-text">{title}</h3>
      <p className="text-aura-textSecondary">{description}</p>
    </div>
  );
};

export default ServiceCard;
