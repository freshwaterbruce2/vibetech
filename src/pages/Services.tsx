
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

  return (
    <AnimateOnScroll>
      <Card className="hover-scale h-full glass-card border-[color:var(--c-cyan)]/10">
        <CardHeader>
          <div className="flex items-center gap-3">
            <GradientFeatherIcon icon={service.icon.type} size={24} />
            <CardTitle>{service.name}</CardTitle>
          </div>
          <CardDescription>{service.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {service.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <Badge variant="outline" className={`${getBadgeColor()} mt-0.5`}>
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
      {/* Mesh Aurora Background */}
      <MeshAuroraBackground intensity="low" />
      
      <NavBar />
      
      <div className="max-w-7xl mx-auto px-4 pt-24 relative z-10">
        <AnimateOnScroll>
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-6 gradient-text-full">
              Our Services
            </h1>
            <p className="text-aura-textSecondary max-w-3xl mx-auto">
              We offer a comprehensive range of technology solutions designed to transform your business and drive growth in today's digital landscape.
            </p>
          </div>
        </AnimateOnScroll>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-10">
          <TabsList className="grid grid-cols-3 md:grid-cols-7 mb-8 bg-aura-backgroundLight">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="web">Web</TabsTrigger>
            <TabsTrigger value="app">Apps</TabsTrigger>
            <TabsTrigger value="ai">AI</TabsTrigger>
            <TabsTrigger value="cloud">Cloud</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="consulting">Consulting</TabsTrigger>
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
    </div>
  );
};

export default Services;
