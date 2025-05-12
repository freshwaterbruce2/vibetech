
import { ReactNode } from "react";

interface ServiceCardProps {
  title: string;
  description: string;
  icon: ReactNode;
}

const ServiceCard = ({ title, description, icon }: ServiceCardProps) => {
  return (
    <div className="glass-card p-6 border border-[color:var(--c-purple)/20] hover:border-[color:var(--c-purple)/40] hover:shadow-neon-purple transform transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">
      <div className="mb-5 flex items-center justify-center w-16 h-16 rounded-full bg-[rgba(148,38,255,0.1)] border border-[color:var(--c-purple)/20]">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3 font-heading bg-gradient-to-r from-[#c87eff] via-[#8d4dff] to-[#00f7ff] text-transparent bg-clip-text">{title}</h3>
      <p className="text-slate-200/90">{description}</p>
    </div>
  );
};

export default ServiceCard;
