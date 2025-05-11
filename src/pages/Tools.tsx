
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import SectionHeading from "@/components/ui/section-heading";
import FuturisticCard from "@/components/ui/futuristic-card";
import ParticleNetworkCanvas from "@/components/ui/particle-network";
import { 
  Link as LinkIcon, 
  ShoppingCart, 
  Mail, 
  ChartBar, 
  Users, 
  Paintbrush, 
  ArrowRight 
} from "lucide-react";
import { motion } from "framer-motion";
import { GradientFeatherIcon } from "@/components/ui/gradient-feather-icon";

interface ToolCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  tools: string[];
  variant?: "blue" | "purple" | "teal";
}

const ToolCard = ({ title, description, icon, category, tools, variant = "blue" }: ToolCardProps) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <FuturisticCard className="h-full" variant={variant}>
      <div className="flex flex-col h-full">
        <div className="mb-6 flex items-start justify-between">
          <div className="p-3 rounded-lg bg-aura-backgroundLight/50">
            {icon}
          </div>
          <span className="text-xs uppercase tracking-wider text-aura-accent/70">
            {category}
          </span>
        </div>
        
        <h3 className="text-xl font-semibold mb-3 font-heading">
          {title}
        </h3>
        
        <p className="text-aura-textSecondary mb-6 flex-grow">
          {description}
        </p>
        
        <div className="mt-auto">
          <h4 className="text-sm font-semibold mb-2 text-aura-accent">Featured Tools</h4>
          <motion.ul 
            className="space-y-1"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {tools.map((tool, index) => (
              <motion.li 
                key={index} 
                className="text-sm text-aura-textSecondary flex items-center"
                variants={item}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-aura-accent mr-2"></span>
                {tool}
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>
    </FuturisticCard>
  );
};

const Tools = () => {
  useEffect(() => {
    document.title = "Tools & Integrations | Vibe Tech";
  }, []);

  const toolsData: ToolCardProps[] = [
    {
      title: "Affiliate Marketing",
      description: "Powerful tools to manage, track, and optimize your affiliate marketing campaigns with detailed analytics and easy link management.",
      icon: <GradientFeatherIcon icon={LinkIcon} size={24} variant="blue-purple" />,
      category: "Marketing",
      tools: ["Pretty Links", "ThirstyAffiliates", "Amazon Associates", "ShareASale"],
      variant: "blue"
    },
    {
      title: "E-Commerce",
      description: "Complete e-commerce solutions that allow you to sell products and services directly or promote affiliate products seamlessly.",
      icon: <GradientFeatherIcon icon={ShoppingCart} size={24} variant="purple-teal" />,
      category: "Sales",
      tools: ["Shopify", "WooCommerce", "Printful", "Gumroad"],
      variant: "purple"
    },
    {
      title: "Marketing Automation",
      description: "Streamline your marketing efforts with automated email campaigns and AI-powered content creation tools.",
      icon: <GradientFeatherIcon icon={Mail} size={24} variant="blue-teal" />,
      category: "Automation",
      tools: ["Mailchimp", "Rytr.me", "ConvertKit", "ActiveCampaign"],
      variant: "teal"
    },
    {
      title: "Analytics",
      description: "Gain valuable insights into user behavior, track conversion metrics, and optimize your site for better performance.",
      icon: <GradientFeatherIcon icon={ChartBar} size={24} variant="blue-purple" />,
      category: "Data",
      tools: ["Google Analytics", "Hotjar", "Mixpanel", "Plausible"],
      variant: "blue"
    },
    {
      title: "Collaboration",
      description: "Enhance team productivity with intuitive tools for brainstorming, project management, and collaborative work.",
      icon: <GradientFeatherIcon icon={Users} size={24} variant="purple-teal" />,
      category: "Teamwork",
      tools: ["Miro", "Notion", "Trello", "Asana"],
      variant: "purple"
    },
    {
      title: "Design Resources",
      description: "Create stunning visual assets that maintain our futuristic tech aesthetic with neon accents and glassmorphism.",
      icon: <GradientFeatherIcon icon={Paintbrush} size={24} variant="blue-teal" />,
      category: "Design",
      tools: ["Figma", "Framer", "Canva", "Adobe Creative Cloud"],
      variant: "teal"
    }
  ];

  return (
    <div className="min-h-screen bg-aura-background relative overflow-hidden">
      <NavBar />
      <ParticleNetworkCanvas className="z-0" particleCount={20} opacity={0.1} />
      
      {/* Hero Section */}
      <section className="pt-28 pb-16 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <SectionHeading size="xl">
            Power Your Digital Presence with <span className="bg-gradient-to-r from-aura-accent to-purple-400 bg-clip-text text-transparent">Advanced Tools</span>
          </SectionHeading>
          <p className="text-aura-textSecondary text-lg max-w-3xl mx-auto text-center mb-10">
            Discover our carefully curated suite of tools and integrations designed to enhance your online presence, 
            optimize your marketing efforts, and streamline your business operations.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {toolsData.map((tool, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ToolCard {...tool} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Integration Showcase */}
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
                  src="https://images.unsplash.com/photo-1535378620166-273708d44e4c?q=80&w=2942&auto=format&fit=crop&ixlib=rb-4.0.3" 
                  alt="Integrated dashboard showing various marketing tools" 
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
      
      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-aura-background to-aura-backgroundLight">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 font-heading">Ready to Supercharge Your Online Presence?</h2>
          <p className="text-aura-textSecondary mb-8 text-lg max-w-2xl mx-auto">
            Get started with our comprehensive suite of tools and integrations tailored to meet your specific needs.
          </p>
          <Button asChild size="lg" className="bg-aura-accent hover:bg-aura-accent/90 group">
            <Link to="/contact">
              Contact Us For Integration
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Tools;
