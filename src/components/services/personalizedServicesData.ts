import { TrendingUp, Zap, Brain, Building2, Globe, DollarSign } from "lucide-react";
import { ServiceType } from "./types";

export const personalizedServices: ServiceType[] = [
  {
    id: "fintech",
    name: "Financial Technology Solutions",
    description: "Advanced trading systems and financial applications with real-time market data integration.",
    icon: {
      type: TrendingUp,
      props: {
        className: "h-6 w-6 text-[color:var(--c-cyan)]"
      }
    },
    features: [
      "Cryptocurrency trading systems (Kraken WebSocket v2)",
      "Real-time market data processing and analysis", 
      "Automated trading algorithms with risk management",
      "Portfolio management and performance tracking",
      "Secure API integrations for financial platforms"
    ],
    technologies: ["Python", "WebSocket", "SQLite", "Kraken API", "Real-time Processing"],
    realProjects: [
      "Multi-agent crypto trading system with 1.0% profit targeting",
      "XLM/USD trading with advanced risk management",
      "Real-time WebSocket v2 integration for live market data"
    ],
    businessValue: "Automated revenue generation through systematic trading strategies"
  },
  {
    id: "enterprise-pwa",
    name: "Enterprise PWA Development", 
    description: "Mission-critical Progressive Web Apps for business operations with offline capabilities.",
    icon: {
      type: Building2,
      props: {
        className: "h-6 w-6 text-[color:var(--c-purple)]"
      }
    },
    features: [
      "Offline-first PWAs for operational continuity",
      "Windows 11 integration and desktop installation",
      "Real-time data synchronization and conflict resolution",
      "Enterprise-grade security and data management",
      "Custom workflow automation for business processes"
    ],
    technologies: ["React", "TypeScript", "Service Workers", "IndexedDB", "Electron"],
    realProjects: [
      "Walmart DC shipping management PWA (doors 332-454)", 
      "Windows 11 productivity dashboard with SQLite integration",
      "Document generation platform for legal workflows"
    ],
    businessValue: "Operational efficiency gains through specialized business applications"
  },
  {
    id: "ai-content",
    name: "AI-Powered Content & Marketing",
    description: "Intelligent content generation and marketing automation systems that drive engagement and revenue.",
    icon: {
      type: Brain,
      props: {
        className: "h-6 w-6 text-[color:var(--c-teal)]"
      }
    },
    features: [
      "AI content generation with DeepSeek and OpenAI integration",
      "Automated blog publishing with affiliate marketing",
      "Smart content optimization for SEO and conversions", 
      "Template-driven content creation systems",
      "Analytics integration for performance tracking"
    ],
    technologies: ["DeepSeek AI", "OpenAI", "Express.js", "SQLite", "Google Analytics"],
    realProjects: [
      "Blog publishing system with integrated affiliate marketing",
      "AI-powered content builder for multiple content types",
      "Template-based article generation with smart affiliate placement"
    ],
    businessValue: "Revenue generation through content marketing and affiliate partnerships"
  },
  {
    id: "booking-platforms",
    name: "Booking & Property Management",
    description: "Complete booking and property management solutions with real-time availability and payment processing.",
    icon: {
      type: Globe,
      props: {
        className: "h-6 w-6 text-[color:var(--c-cyan)]"
      }
    },
    features: [
      "Real hotel booking with LiteAPI integration",
      "Property rental management with zero listing fees",
      "Advanced search and filtering capabilities",
      "Date selection and availability management",
      "Payment processing and booking confirmations"
    ],
    technologies: ["React", "LiteAPI", "Express.js", "Payment APIs", "Real-time APIs"],
    realProjects: [
      "Vibe-Booking: Hotel platform with passion-based matching",
      "Vibe-Rentals: Zero-fee property rental marketplace", 
      "Advanced booking systems with environment preferences"
    ],
    businessValue: "Revenue through booking commissions and platform usage fees"
  },
  {
    id: "process-automation",
    name: "Business Process Automation",
    description: "Custom automation solutions that streamline workflows and eliminate manual tasks.",
    icon: {
      type: Zap,
      props: {
        className: "h-6 w-6 text-[color:var(--c-purple)]"
      }
    },
    features: [
      "Document generation and processing automation",
      "Workflow orchestration with error handling",
      "Data synchronization between systems",
      "Custom business logic implementation", 
      "Integration with existing enterprise systems"
    ],
    technologies: ["FastAPI", "Svelte", "Python", "SQLite", "PowerShell"],
    realProjects: [
      "Legal document generator with template system",
      "Automated content workflow management",
      "Multi-process orchestration with monitoring"
    ],
    businessValue: "Cost reduction through elimination of manual processes"
  },
  {
    id: "revenue-platforms",
    name: "Revenue Generation Platforms",
    description: "Complete systems designed to generate and optimize revenue streams through technology.",
    icon: {
      type: DollarSign,
      props: {
        className: "h-6 w-6 text-[color:var(--c-teal)]"
      }
    },
    features: [
      "Affiliate marketing integration and optimization",
      "E-commerce and marketplace development",
      "Revenue tracking and analytics dashboards",
      "Automated monetization strategies",
      "Performance optimization for conversions"
    ],
    technologies: ["React", "Affiliate APIs", "Analytics", "Payment Systems", "Conversion Tracking"],
    realProjects: [
      "Blog monetization system with affiliate integration",
      "E-commerce marketplace with vendor management",
      "Revenue tracking and optimization platforms"
    ],
    businessValue: "Direct revenue generation through multiple monetization channels"
  }
];

// Pricing tiers based on actual project complexity
export const pricingTiers = [
  {
    name: "Automation Solution",
    price: "$5,000 - $15,000",
    description: "Single business process automation",
    includes: [
      "Custom workflow automation",
      "Data processing and integration", 
      "Basic monitoring and alerts",
      "30-day support and maintenance"
    ]
  },
  {
    name: "Platform Development", 
    price: "$15,000 - $50,000",
    description: "Complete booking/content platform",
    includes: [
      "Full-stack web application",
      "API integrations (booking/AI/payment)",
      "Admin dashboard and analytics",
      "90-day support and training"
    ]
  },
  {
    name: "Financial Technology",
    price: "$25,000 - $100,000",
    description: "Advanced trading/fintech system",
    includes: [
      "Real-time trading system development",
      "Risk management and monitoring",
      "Advanced analytics and reporting",
      "6-month support and optimization"
    ]
  }
];

// Industries you actually serve based on projects
export const targetIndustries = [
  {
    name: "Financial Services",
    description: "Trading firms, investment platforms, crypto exchanges",
    projects: ["Kraken trading systems", "Portfolio management", "Risk assessment"]
  },
  {
    name: "Hospitality & Travel", 
    description: "Hotels, vacation rentals, booking platforms",
    projects: ["Hotel booking systems", "Rental marketplaces", "Travel management"]
  },
  {
    name: "Enterprise Operations",
    description: "Large corporations, logistics, manufacturing",
    projects: ["Walmart shipping management", "Process automation", "Productivity tools"]
  },
  {
    name: "Content & Marketing",
    description: "Publishers, content creators, affiliate marketers", 
    projects: ["Blog publishing platforms", "Content generation", "Affiliate systems"]
  }
];