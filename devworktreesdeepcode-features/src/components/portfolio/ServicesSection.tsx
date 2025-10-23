
import { Code, Globe, Tag } from "lucide-react";
import ServiceCard from "./ServiceCard";

const ServicesSection = () => {
  const services = [
    {
      title: "Web Development",
      icon: <Code className="h-10 w-10 text-[#8d4dff]" />,
      description: "We create responsive, high-performance websites and web applications using modern frameworks and technologies."
    },
    {
      title: "Digital Strategy",
      icon: <Globe className="h-10 w-10 text-[#c87eff]" />,
      description: "We help businesses develop comprehensive digital strategies to meet their objectives and reach target audiences."
    },
    {
      title: "Brand Identity",
      icon: <Tag className="h-10 w-10 text-[#00f7ff]" />,
      description: "We design cohesive brand identities that communicate your values and resonate with your audience."
    }
  ];

  return (
    <section className="py-16 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#20003c] via-[#4a007d] to-[#9426ff] opacity-50"></div>
      <div className="particles-bg-dense absolute inset-0 z-[1] opacity-60 pointer-events-none"></div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        <h2 className="text-3xl font-bold mb-12 text-center font-heading bg-gradient-to-r from-[#c87eff] via-[#8d4dff] to-[#00f7ff] text-transparent bg-clip-text">Our Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <ServiceCard 
              key={index}
              title={service.title}
              description={service.description}
              icon={service.icon}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
