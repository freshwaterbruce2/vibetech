import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Code2, 
  Palette, 
  Cog, 
  Smartphone, 
  ArrowRight, 
  Sparkles, 
  CheckCircle,
  ExternalLink 
} from "lucide-react";

interface Service {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  features: string[];
  color: string;
  link: string;
}

const services: Service[] = [
  {
    icon: Code2,
    title: "Web Development",
    description: "Lightning-fast, scalable web applications built with modern frameworks like React, Next.js, and TypeScript.",
    features: [
      "React & Next.js expertise",
      "Performance optimization",
      "SEO-friendly architecture",
      "Modern deployment pipelines"
    ],
    color: "from-blue-400 to-cyan-400",
    link: "/services#web-development"
  },
  {
    icon: Palette,
    title: "UI/UX Design",
    description: "User-centered design that combines beautiful aesthetics with intuitive functionality and seamless user journeys.",
    features: [
      "User research & personas",
      "Wireframing & prototyping", 
      "Design system creation",
      "Accessibility compliance"
    ],
    color: "from-purple-400 to-pink-400",
    link: "/services#ui-ux-design"
  },
  {
    icon: Cog,
    title: "Custom Software",
    description: "Enterprise-grade solutions tailored to your specific business needs, from APIs to complex automation systems.",
    features: [
      "Business process automation",
      "API development & integration",
      "Database architecture",
      "Scalable cloud solutions"
    ],
    color: "from-green-400 to-emerald-400",
    link: "/services#custom-software"
  },
  {
    icon: Smartphone,
    title: "App Development",
    description: "Cross-platform mobile applications that deliver native performance and exceptional user experiences.",
    features: [
      "React Native development",
      "iOS & Android optimization",
      "App Store deployment",
      "Push notifications & analytics"
    ],
    color: "from-orange-400 to-red-400",
    link: "/services#app-development"
  }
];

const ServicesSection = () => {
  const [activeService, setActiveService] = useState<number | null>(null);
  const [hoveredService, setHoveredService] = useState<number | null>(null);

  const handleServiceClick = (index: number, link: string) => {
    if (activeService === index) {
      // If clicked service is already active, navigate to its page
      window.location.href = link;
    } else {
      // Otherwise, expand the service details
      setActiveService(activeService === index ? null : index);
    }
  };

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
        <div className="absolute top-32 right-20 w-3 h-3 bg-purple-400 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-2 h-2 bg-pink-400 rounded-full animate-pulse delay-2000"></div>
        <div className="absolute bottom-32 right-1/3 w-3 h-3 bg-blue-400 rounded-full animate-pulse delay-500"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-heading bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
            What I Bring to the Table
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Cutting-edge solutions that transform your vision into powerful digital experiences
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => {
            const IconComponent = service.icon;
            const isActive = activeService === index;
            const isHovered = hoveredService === index;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative cursor-pointer transition-all duration-300 ${
                  isActive ? 'lg:col-span-2' : ''
                }`}
                onClick={() => handleServiceClick(index, service.link)}
                onMouseEnter={() => setHoveredService(index)}
                onMouseLeave={() => setHoveredService(null)}
              >
                <div className={`glass-card p-6 border border-[rgba(185,51,255,0.2)] hover:border-[rgba(185,51,255,0.6)] hover:shadow-neon-purple-soft transform transition-all duration-300 h-full ${
                  isHovered || isActive 
                    ? 'scale-[1.02] -translate-y-2 shadow-2xl' 
                    : 'hover:scale-[1.01] hover:-translate-y-1'
                }`}>
                  
                  {/* Icon with gradient background */}
                  <div className="relative mb-6">
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${service.color} opacity-20 absolute`}></div>
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${service.color} relative`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    {(isHovered || isActive) && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute -top-1 -right-1"
                      >
                        <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
                      </motion.div>
                    )}
                  </div>

                  {/* Title and description */}
                  <h3 className="text-xl font-semibold mb-3 font-heading bg-gradient-to-r from-white to-gray-300 text-transparent bg-clip-text">
                    {service.title}
                  </h3>
                  
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    {service.description}
                  </p>

                  {/* Interactive expand/collapse for features */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-gray-600 pt-4 mt-4"
                      >
                        <h4 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Key Features:
                        </h4>
                        <ul className="space-y-2">
                          {service.features.map((feature, featureIndex) => (
                            <motion.li
                              key={featureIndex}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: featureIndex * 0.1 }}
                              className="text-sm text-gray-300 flex items-center gap-2"
                            >
                              <div className="h-1.5 w-1.5 bg-cyan-400 rounded-full"></div>
                              {feature}
                            </motion.li>
                          ))}
                        </ul>
                        
                        {/* Call to action */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="mt-4 pt-4 border-t border-gray-600"
                        >
                          <Link
                            to={service.link}
                            className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors group"
                          >
                            Learn More About {service.title}
                            <ExternalLink className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Hover indicator */}
                  <div className="flex items-center justify-between mt-4">
                    <motion.div
                      animate={{ 
                        width: isHovered ? '60%' : '30%',
                        opacity: isHovered ? 1 : 0.5
                      }}
                      className={`h-0.5 bg-gradient-to-r ${service.color} rounded-full transition-all duration-300`}
                    />
                    <motion.div
                      animate={{ 
                        x: isHovered ? 5 : 0,
                        opacity: isHovered ? 1 : 0.7
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </motion.div>
                  </div>
                </div>

                {/* Glow effect on hover */}
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-10 rounded-lg -z-10 blur-xl`}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-16"
        >
          <p className="text-gray-300 mb-6">
            Ready to turn your ideas into reality?
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white px-8 py-3 rounded-lg font-semibold hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-cyan-500/25"
          >
            Get Started Today
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default ServicesSection;