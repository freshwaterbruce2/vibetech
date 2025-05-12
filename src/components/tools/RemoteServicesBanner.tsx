
import React from "react";
import { motion } from "framer-motion";
import { NeonButton } from "@/components/ui/neon-button";
import { Link } from "react-router-dom";
import { Laptop, User } from "lucide-react";

const RemoteServicesBanner: React.FC = () => {
  return (
    <section className="py-16 px-4 bg-aura-backgroundLight/30">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-4 font-heading">
              Personalized <span className="bg-gradient-to-r from-aura-accent to-purple-400 bg-clip-text text-transparent">Integration Services</span>
            </h2>
            <div className="w-32 h-1.5 bg-gradient-to-r from-aura-accent to-purple-400 mb-6 rounded-full"></div>
            
            <p className="text-aura-textSecondary text-lg mb-4">
              We offer both in-person and remote assistance to help you set up and optimize 
              any of our featured tools and integrations for your specific needs.
            </p>
            
            <p className="text-aura-textSecondary text-lg mb-6">
              Whether you need help with affiliate link management, e-commerce setup, or 
              marketing automation, our team of experts is ready to assist you.
            </p>
            
            <div className="flex flex-wrap gap-4 mt-8">
              <div className="bg-aura-background border border-aura-accent/20 rounded-lg p-4 flex items-center gap-4">
                <div className="p-3 rounded-full bg-aura-accent/10">
                  <User className="h-5 w-5 text-aura-accent" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">In-Person Assistance</h3>
                  <p className="text-sm text-aura-textSecondary">Local support in Somerton, SC</p>
                </div>
              </div>
              
              <div className="bg-aura-background border border-aura-accent/20 rounded-lg p-4 flex items-center gap-4">
                <div className="p-3 rounded-full bg-aura-accent/10">
                  <Laptop className="h-5 w-5 text-aura-accent" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Remote Services</h3>
                  <p className="text-sm text-aura-textSecondary">Available nationwide</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <NeonButton asChild variant="purple">
                <Link to="/contact">
                  Schedule a Consultation
                </Link>
              </NeonButton>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-lg blur-xl"></div>
            <div className="relative tech-border rounded-lg overflow-hidden">
              <div className="aspect-w-16 aspect-h-9 bg-aura-backgroundLight/40 p-8 flex flex-col justify-center items-center">
                <div className="flex gap-6 flex-wrap justify-center">
                  <div className="p-5 rounded-full bg-aura-background border border-aura-accent/30 shadow-neon-blue-soft">
                    <Link2 className="h-8 w-8 text-aura-accent" />
                  </div>
                  <div className="p-5 rounded-full bg-aura-background border border-purple-400/30 shadow-neon-purple-soft">
                    <ShoppingCart className="h-8 w-8 text-purple-400" />
                  </div>
                  <div className="p-5 rounded-full bg-aura-background border border-teal-400/30 shadow-neon-teal-soft">
                    <Mail className="h-8 w-8 text-teal-400" />
                  </div>
                </div>
                <p className="text-center mt-8 text-aura-textSecondary">
                  Connecting your digital tools for seamless workflows
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default RemoteServicesBanner;
