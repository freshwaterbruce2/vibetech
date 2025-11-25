
import React from "react";
import { Link2, ShoppingCart, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import FuturisticCard from "@/components/ui/futuristic-card";
import SectionHeading from "@/components/ui/section-heading";
import AnimateOnScroll from "@/components/ui/animate-on-scroll";

const RemoteServicesBanner = () => {
  const services = [
    {
      title: "Affiliate Program Setup",
      icon: <Link2 className="h-10 w-10 text-aura-accent" />,
      description: "We'll help you set up and optimize your affiliate programs across multiple platforms to maximize your earnings potential.",
    },
    {
      title: "E-Commerce Integration",
      icon: <ShoppingCart className="h-10 w-10 text-aura-accent" />,
      description: "Our team will integrate and customize e-commerce solutions that align with your brand and business goals.",
    },
    {
      title: "Marketing Campaigns",
      icon: <Mail className="h-10 w-10 text-aura-accent" />,
      description: "Let us create and automate your marketing campaigns to drive engagement and conversions.",
    },
  ];

  return (
    <section className="py-20 px-4 bg-aura-backgroundLight/30">
      <div className="max-w-6xl mx-auto">
        <SectionHeading align="center" size="lg" className="text-white">
          Remote Integration Services
        </SectionHeading>

        <div className="max-w-3xl mx-auto text-center mb-12">
          <p className="text-lg text-gray-300">
            Don't have time to implement these tools yourself? Our team provides remote integration services to set up and optimize these tools for your specific needs.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {services.map((service, index) => (
            <AnimateOnScroll key={index} delay={index * 100}>
              <FuturisticCard 
                className="h-full" 
                variant={index === 0 ? "blue" : index === 1 ? "purple" : "teal"}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="mb-5 flex items-center justify-center w-16 h-16 rounded-full bg-aura-backgroundLight/40">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 font-heading">{service.title}</h3>
                  <p className="text-aura-textSecondary">{service.description}</p>
                </div>
              </FuturisticCard>
            </AnimateOnScroll>
          ))}
        </div>
        
        <div className="text-center">
          <Button 
            className="bg-aura-accent hover:bg-aura-accent/80 text-white" 
            size="lg"
          >
            Get a Custom Integration Quote
          </Button>
        </div>
      </div>
    </section>
  );
};

export default RemoteServicesBanner;
