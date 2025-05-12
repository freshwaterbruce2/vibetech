
import { useState } from "react";
import NavBar from "@/components/NavBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Code, Lightbulb, Layout, Database, Shield, Activity } from "lucide-react";
import AnimateOnScroll from "@/components/ui/animate-on-scroll";
import MeshAuroraBackground from "@/components/ui/mesh-aurora-background";
import { GradientFeatherIcon } from "@/components/ui/gradient-feather-icon";
import SectionHeading from "@/components/ui/section-heading";

const services = [
  {
    id: "web",
    name: "Web Development",
    description: "Modern web applications built with cutting-edge technologies.",
    icon: <Layout className="h-6 w-6 text-[color:var(--c-cyan)]" />,
    features: [
      "Responsive design for all devices",
      "SEO optimization for better visibility",
      "Interactive UI/UX design",
      "Cross-browser compatibility",
      "Performance optimization"
    ]
  },
  {
    id: "app",
    name: "App Development",
    description: "Native and cross-platform mobile applications for iOS and Android.",
    icon: <Code className="h-6 w-6 text-[color:var(--c-purple)]" />,
    features: [
      "Native iOS and Android development",
      "Cross-platform solutions",
      "Real-time synchronization",
      "Offline functionality",
      "Push notifications"
    ]
  },
  {
    id: "ai",
    name: "AI Solutions",
    description: "Leverage AI to automate processes and gain valuable insights.",
    icon: <Lightbulb className="h-6 w-6 text-[color:var(--c-teal)]" />,
    features: [
      "Machine learning integration",
      "Natural language processing",
      "Computer vision solutions",
      "AI-powered chatbots",
      "Predictive analytics"
    ]
  },
  {
    id: "cloud",
    name: "Cloud Services",
    description: "Scalable cloud infrastructure for your growing business needs.",
    icon: <Database className="h-6 w-6 text-[color:var(--c-cyan)]" />,
    features: [
      "Cloud migration strategy",
      "Serverless architecture",
      "Database optimization",
      "Microservices implementation",
      "Continuous deployment"
    ]
  },
  {
    id: "security",
    name: "Cybersecurity",
    description: "Protect your digital assets with comprehensive security solutions.",
    icon: <Shield className="h-6 w-6 text-[color:var(--c-purple)]" />,
    features: [
      "Security audits and assessments",
      "Penetration testing",
      "Vulnerability management",
      "Secure coding practices",
      "Compliance solutions"
    ]
  },
  {
    id: "consulting",
    name: "Tech Consulting",
    description: "Strategic guidance to transform your business with technology.",
    icon: <Activity className="h-6 w-6 text-[color:var(--c-teal)]" />,
    features: [
      "Digital transformation strategy",
      "Technology roadmapping",
      "IT infrastructure assessment",
      "Software selection assistance",
      "Technology training and workshops"
    ]
  }
];

const ServiceCard = ({ service }: { service: typeof services[0] }) => {
  // Determine which color to use for the badge based on service icon color
  const getBadgeColor = () => {
    if (service.icon.props.className.includes("var(--c-cyan)")) {
      return "bg-[color:var(--c-cyan)]/10 text-[color:var(--c-cyan)]";
    } else if (service.icon.props.className.includes("var(--c-purple)")) {
      return "bg-[color:var(--c-purple)]/10 text-[color:var(--c-purple)]";
    } else {
      return "bg-[color:var(--c-teal)]/10 text-[color:var(--c-teal)]";
    }
  };

  // Get the neon border color class
  const getNeonBorderClass = () => {
    if (service.icon.props.className.includes("var(--c-cyan)")) {
      return "neon-border";
    } else if (service.icon.props.className.includes("var(--c-purple)")) {
      return "neon-border-purple";
    } else {
      return "neon-border-teal";
    }
  };

  return (
    <AnimateOnScroll>
      <Card className={`hover-scale h-full glass-card ${getNeonBorderClass()} hover:shadow-lg transition-all duration-300`}>
        <CardHeader className="text-aura-text">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-[rgba(255,255,255,0.05)]">
              <GradientFeatherIcon icon={service.icon.type} size={24} />
            </div>
            <CardTitle className="text-aura-text gradient-text-full">{service.name}</CardTitle>
          </div>
          <CardDescription className="text-aura-textSecondary">{service.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {service.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-aura-text">
                <Badge variant="outline" className={`${getBadgeColor()} mt-0.5 animate-pulse-glow`}>
                  {index + 1}
                </Badge>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </AnimateOnScroll>
  );
};

const Services = () => {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="min-h-screen bg-aura-background pb-16 relative overflow-hidden">
      {/* Mesh Aurora Background with increased intensity */}
      <MeshAuroraBackground intensity="medium" />
      
      {/* Add subtle particle overlay for more neon effect */}
      <div className="particles-bg-dense absolute inset-0 z-[1] opacity-70"></div>
      
      <NavBar />
      
      <div className="max-w-7xl mx-auto px-4 pt-24 relative z-10">
        <AnimateOnScroll>
          <div className="text-center mb-16">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="mb-4"
            >
              <div className="inline-block">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-6 gradient-text-full relative">
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
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-10">
          <TabsList className="grid grid-cols-3 md:grid-cols-7 mb-8 bg-aura-backgroundLight">
            <TabsTrigger value="all" className="data-[state=active]:text-[color:var(--c-cyan)] data-[state=active]:bg-[color:var(--c-cyan)]/20 data-[state=active]:shadow-neon-blue-soft">All</TabsTrigger>
            <TabsTrigger value="web" className="data-[state=active]:text-[color:var(--c-cyan)] data-[state=active]:bg-[color:var(--c-cyan)]/20 data-[state=active]:shadow-neon-blue-soft">Web</TabsTrigger>
            <TabsTrigger value="app" className="data-[state=active]:text-[color:var(--c-purple)] data-[state=active]:bg-[color:var(--c-purple)]/20 data-[state=active]:shadow-neon-purple-soft">Apps</TabsTrigger>
            <TabsTrigger value="ai" className="data-[state=active]:text-[color:var(--c-teal)] data-[state=active]:bg-[color:var(--c-teal)]/20 data-[state=active]:shadow-neon-teal-soft">AI</TabsTrigger>
            <TabsTrigger value="cloud" className="data-[state=active]:text-[color:var(--c-cyan)] data-[state=active]:bg-[color:var(--c-cyan)]/20 data-[state=active]:shadow-neon-blue-soft">Cloud</TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:text-[color:var(--c-purple)] data-[state=active]:bg-[color:var(--c-purple)]/20 data-[state=active]:shadow-neon-purple-soft">Security</TabsTrigger>
            <TabsTrigger value="consulting" className="data-[state=active]:text-[color:var(--c-teal)] data-[state=active]:bg-[color:var(--c-teal)]/20 data-[state=active]:shadow-neon-teal-soft">Consulting</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </TabsContent>
          
          {services.map((service) => (
            <TabsContent key={service.id} value={service.id}>
              <div className="grid grid-cols-1 gap-6">
                <ServiceCard service={service} />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
      
      {/* Add floating neon elements to enhance the visual appeal */}
      <div className="fixed bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[color:var(--c-cyan)]/5 to-transparent z-[1] pointer-events-none"></div>
      <div className="fixed top-1/4 -left-20 w-40 h-40 rounded-full bg-[color:var(--c-purple)]/10 blur-3xl z-[1] pointer-events-none animate-pulse"></div>
      <div className="fixed top-3/4 -right-20 w-40 h-40 rounded-full bg-[color:var(--c-teal)]/10 blur-3xl z-[1] pointer-events-none animate-pulse"></div>
    </div>
  );
};

export default Services;
