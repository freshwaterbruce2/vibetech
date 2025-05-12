
import { Link } from "react-router-dom";

interface Service {
  title: string;
  description: string;
}

const services: Service[] = [
  {
    title: "Web Development",
    description: "Modern, responsive websites built with the latest technologies and best practices for optimal performance."
  },
  {
    title: "UI/UX Design",
    description: "Intuitive interfaces and user experiences that balance aesthetics with functionality."
  },
  {
    title: "Custom Software",
    description: "Tailored software solutions that address specific business challenges and objectives."
  },
  {
    title: "App Development",
    description: "Native and cross-platform mobile applications with seamless user experiences."
  }
];

const ServicesSection = () => {
  return (
    <section className="py-16 px-4 relative">
      <div className="max-w-6xl mx-auto relative z-10">
        <h2 className="text-3xl font-bold mb-12 text-center font-heading bg-gradient-to-r from-[#c87eff] via-[#8d4dff] to-[#00f7ff] text-transparent bg-clip-text">Services I Offer</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <div 
              key={index} 
              className="glass-card p-6 border border-[color:var(--c-purple)/20] hover:border-[color:var(--c-purple)/40] hover:shadow-neon-purple-soft transform transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
            >
              <h3 className="text-xl font-semibold mb-3 font-heading bg-gradient-to-r from-[#c87eff] via-[#8d4dff] to-[#00f7ff] text-transparent bg-clip-text">{service.title}</h3>
              <p className="text-slate-200/90">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
