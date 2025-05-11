
import React from "react";
import { motion } from "framer-motion";
import SectionHeading from "@/components/ui/section-heading";

const IntegrationShowcase: React.FC = () => {
  return (
    <section className="py-16 px-4 bg-aura-backgroundLight/30">
      <div className="max-w-6xl mx-auto">
        <SectionHeading>
          Seamless Integration Experience
        </SectionHeading>
        <p className="text-aura-textSecondary text-center max-w-2xl mx-auto mb-10">
          Our platform is designed to work flawlessly with all the tools you need, providing a unified experience across your digital ecosystem.
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <motion.div 
            className="relative"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-aura-accent/20 to-transparent rounded-lg blur-xl"></div>
            <div className="relative tech-border rounded-lg overflow-hidden h-full">
              <img 
                src="/lovable-uploads/5a915379-4dea-4d4f-956a-26170c18bcc8.png" 
                alt="Advanced tech integration with futuristic interface" 
                className="w-full h-auto object-cover" 
              />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h3 className="text-2xl font-bold mb-4 font-heading">Why Choose Our Platform?</h3>
            <div className="space-y-6">
              {[
                {
                  title: "Unified Dashboard",
                  desc: "Access all your tools from a single, intuitive interface"
                },
                {
                  title: "Automated Workflows",
                  desc: "Connect your tools to create powerful automation sequences"
                },
                {
                  title: "Data Synchronization",
                  desc: "Keep your information consistent across all platforms"
                },
                {
                  title: "Responsive Design",
                  desc: "Optimized experience on desktop, tablet, and mobile devices"
                }
              ].map((feature, index) => (
                <div key={index} className="flex items-start">
                  <div className="mr-4 mt-1 text-aura-accent">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z" fill="currentColor"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">{feature.title}</h4>
                    <p className="text-sm text-aura-textSecondary">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default IntegrationShowcase;
