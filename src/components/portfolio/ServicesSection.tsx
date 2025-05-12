
import { Code, Globe, Tag } from "lucide-react";
import ServiceCard from "./ServiceCard";

const ServicesSection = () => {
  const services = [
    {
      title: "Web Development",
      icon: <Code className="h-10 w-10 text-aura-accent" />,
      description: "We create responsive, high-performance websites and web applications using modern frameworks and technologies."
    },
    {
      title: "Digital Strategy",
      icon: <Globe className="h-10 w-10 text-aura-accent" />,
      description: "We help businesses develop comprehensive digital strategies to meet their objectives and reach target audiences."
    },
    {
      title: "Brand Identity",
      icon: <Tag className="h-10 w-10 text-aura-accent" />,
      description: "We design cohesive brand identities that communicate your values and resonate with your audience."
    }
  ];

  return (
    <section className="py-16 px-4 bg-aura-backgroundLight/30">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-12 text-center font-heading">Our Services</h2>
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
