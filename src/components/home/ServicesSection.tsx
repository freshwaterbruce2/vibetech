
import { Link } from "react-router-dom";

interface Service {
  icon: string;
  title: string;
  description: string;
}

const services: Service[] = [
  {
    icon: "🌐",
    title: "Web Development",
    description: "Performance-driven, responsive websites built with cutting-edge technology."
  },
  {
    icon: "🎨",
    title: "UI/UX Design",
    description: "Interfaces that feel natural, guide effortlessly, and leave a lasting impression."
  },
  {
    icon: "⚙️",
    title: "Custom Software",
    description: "Tailor-made solutions that solve your unique business challenges."
  },
  {
    icon: "📱",
    title: "App Development",
    description: "Native and cross-platform mobile apps that users love to engage with."
  }
];

const ServicesSection = () => {
  return (
    <section className="py-16 px-4 relative">
      <div className="max-w-6xl mx-auto relative z-10">
        <h2 className="text-3xl font-bold mb-12 text-center font-heading bg-gradient-to-r from-[#c87eff] via-[#8d4dff] to-[#00f7ff] text-transparent bg-clip-text">What I Bring to the Table</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <div 
              key={index} 
              className="glass-card p-6 border border-[rgba(185,51,255,0.2)] hover:border-[rgba(185,51,255,0.4)] hover:shadow-neon-purple-soft transform transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
            >
              <div className="text-4xl mb-3">{service.icon}</div>
              <h3 className="text-xl font-semibold mb-3 font-heading bg-gradient-to-r from-[#c87eff] via-[#8d4dff] to-[#00f7ff] text-transparent bg-clip-text">{service.title}</h3>
              <p className="text-white">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
