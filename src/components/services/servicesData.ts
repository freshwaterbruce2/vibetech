
import { Code, Lightbulb, Layout, Database, Shield, Activity } from "lucide-react";
import { ServiceType } from "./types";

export const services: ServiceType[] = [
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
