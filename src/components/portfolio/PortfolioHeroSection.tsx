
import PageHeader from "@/components/ui/page-header";
import { motion } from "framer-motion";

const PortfolioHeroSection = () => {
  return (
    <section className="pt-28 pb-12 px-4 relative z-10">
      <div className="max-w-6xl mx-auto">
        <PageHeader 
          title="Our Portfolio"
          subtitle="Explore our collection of projects spanning web development, mobile applications, and custom software solutions."
        />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="mt-8 text-center"
        >
          <p className="text-aura-textSecondary max-w-2xl mx-auto">
            Each project represents our commitment to innovative design, cutting-edge technology, 
            and exceptional user experiences. Browse our showcase to see how we transform ideas into reality.
          </p>
        </motion.div>
      </div>
      
      {/* Decorative elements to mimic circuit board patterns */}
      <div className="absolute top-24 left-10 w-24 h-24 rounded-full bg-aura-neonBlue/5 blur-xl"></div>
      <div className="absolute bottom-10 right-20 w-32 h-32 rounded-full bg-aura-neonPurple/5 blur-xl"></div>
    </section>
  );
};

export default PortfolioHeroSection;
