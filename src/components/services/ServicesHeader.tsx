
import React from "react";
import { motion } from "framer-motion";
import AnimateOnScroll from "@/components/ui/animate-on-scroll";

const ServicesHeader = () => {
  return (
    <AnimateOnScroll>
      <div className="text-center mb-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-4"
        >
          <div className="inline-block">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-6 gradient-text-full relative neon-text-glow">
              Our Services
              <span className="absolute -inset-1 rounded-lg blur-xl bg-gradient-to-r from-[color:var(--c-cyan)]/20 via-[color:var(--c-purple)]/20 to-[color:var(--c-teal)]/20 z-[-1]"></span>
            </h1>
            <div className="neon-divider w-3/4 mx-auto"></div>
          </div>
        </motion.div>
        <p className="text-aura-textSecondary max-w-3xl mx-auto">
          We offer a comprehensive range of technology solutions designed to transform your business and drive growth in today's digital landscape.
        </p>
      </div>
    </AnimateOnScroll>
  );
};

export default ServicesHeader;
