
import { PricingTier, MarketComparisonType } from './types';

export const pricingTiers: PricingTier[] = [
  {
    name: "Starter",
    price: {
      monthly: "$29",
      yearly: "$24",
    },
    description: "Perfect for small businesses just getting started with web presence.",
    features: [
      { text: "Responsive Website Design", included: true },
      { text: "3 Page Website", included: true },
      { text: "Contact Form", included: true },
      { text: "Basic SEO Setup", included: true, tooltip: "Includes meta tags, sitemap, and basic keyword optimization" },
      { text: "1 Month Support", included: true },
      { text: "Content Management System", included: false },
      { text: "E-commerce Integration", included: false },
      { text: "Custom Animations", included: false },
    ],
    comparisons: [
      { text: "70% cheaper than typical freelancer rates", tooltip: "Based on average freelancer rates of $30-50/hour" },
      { text: "Comparable to DIY platforms but with professional design" }
    ],
    cta: "Start Basic",
  },
  {
    name: "Professional",
    price: {
      monthly: "$79",
      yearly: "$64",
    },
    description: "Ideal for growing businesses that need more features and customization.",
    features: [
      { text: "Responsive Website Design", included: true },
      { text: "10 Page Website", included: true },
      { text: "Contact Form", included: true },
      { text: "Advanced SEO Setup", included: true, tooltip: "Includes competitor analysis, keyword research, and performance tracking" },
      { text: "3 Months Support", included: true },
      { text: "Content Management System", included: true },
      { text: "E-commerce Integration", included: true },
      { text: "Custom Animations", included: false },
    ],
    comparisons: [
      { text: "Save 60% compared to agency project rates", tooltip: "Based on average agency project rates of $2,500-$4,500" },
      { text: "More features than premium SaaS platforms at comparable price" }
    ],
    highlighted: true,
    badge: "Most Popular",
    cta: "Choose Pro",
  },
  {
    name: "Enterprise",
    price: {
      monthly: "$149",
      yearly: "$119",
    },
    description: "Complete solution for established businesses with complex requirements.",
    features: [
      { text: "Responsive Website Design", included: true },
      { text: "Unlimited Pages", included: true },
      { text: "Contact Form", included: true },
      { text: "Premium SEO Setup", included: true, tooltip: "Includes advanced analytics, monthly SEO reports, and continuous optimization" },
      { text: "12 Months Support", included: true },
      { text: "Content Management System", included: true },
      { text: "E-commerce Integration", included: true },
      { text: "Custom Animations", included: true },
    ],
    comparisons: [
      { text: "50% lower than agency retainer packages", tooltip: "Based on typical agency retainer packages of $2,500+ per month" },
      { text: "Enterprise-grade features at mid-tier pricing" }
    ],
    cta: "Contact Sales",
  },
];

export const marketComparisons: MarketComparisonType[] = [
  {
    category: "DIY Platforms",
    description: "Basic website builders with templates",
    pricing: "$14-39/mo",
    limitations: "Limited design flexibility, generic templates, no custom code"
  },
  {
    category: "Our Solution",
    description: "Professional design with ongoing support",
    pricing: "$29-149/mo",
    limitations: "Custom design, professional development, dedicated support",
    highlighted: true
  },
  {
    category: "Freelancers",
    description: "One-time project with hourly billing",
    pricing: "$2,500-11,000",
    limitations: "Unpredictable costs, limited support after completion"
  },
  {
    category: "Agencies",
    description: "High-end custom development",
    pricing: "$4,500+ / project",
    limitations: "High cost, long timelines, complex contracts"
  }
];
