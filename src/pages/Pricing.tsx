
import NavBar from "@/components/NavBar";
import { motion } from "framer-motion";
import { Check, X, Info, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "@/components/ui/sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type PricingTier = {
  name: string;
  price: {
    monthly: string;
    yearly: string;
  };
  description: string;
  features: {
    text: string;
    included: boolean;
    tooltip?: string;
  }[];
  comparisons?: {
    text: string;
    tooltip?: string;
  }[];
  highlighted?: boolean;
  badge?: string;
  cta: string;
};

const pricingTiers: PricingTier[] = [
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

const marketComparisons = [
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

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  
  const handleSubscribe = (plan: string) => {
    toast.success(`Thank you for your interest in our ${plan} plan! A sales representative will contact you shortly.`);
  };

  return (
    <div className="min-h-screen bg-aura-background pb-16">
      <NavBar />
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 pt-24"
      >
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-6 bg-gradient-to-r from-aura-accent to-aura-accentSecondary bg-clip-text text-transparent"
          >
            Competitive Pricing Plans
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-aura-textSecondary max-w-3xl mx-auto mb-8"
          >
            Professional web design services at affordable rates. Get more value than DIY platforms 
            with the quality of agency work at a fraction of the price.
          </motion.p>
          
          {/* Market positioning badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-8"
          >
            <Badge variant="outline" className="px-4 py-2 bg-aura-accent/10 text-aura-accent border-aura-accent/30">
              Higher quality than DIY platforms, more affordable than agencies
            </Badge>
          </motion.div>
          
          {/* Billing toggle */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex items-center justify-center mb-12"
          >
            <span className={`mr-3 ${billingCycle === "monthly" ? "text-aura-text" : "text-aura-textSecondary"}`}>Monthly</span>
            <button
              onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aura-accent focus-visible:ring-offset-2 ${
                billingCycle === "yearly" ? "bg-aura-accent" : "bg-aura-textSecondary/30"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
                  billingCycle === "yearly" ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className={`ml-3 ${billingCycle === "yearly" ? "text-aura-text" : "text-aura-textSecondary"}`}>
              Yearly <Badge variant="outline" className="ml-1 bg-aura-accent/10 text-aura-accent">20% off</Badge>
            </span>
          </motion.div>
        </div>

        {/* Market comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mb-16 overflow-x-auto"
        >
          <div className="bg-aura-backgroundLight rounded-xl border border-aura-accent/10 p-6 shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center">How We Compare</h2>
            <div className="min-w-full">
              <div className="grid grid-cols-5 gap-4 mb-4 text-sm font-medium text-aura-textSecondary">
                <div></div>
                {marketComparisons.map((comparison, i) => (
                  <div 
                    key={i} 
                    className={`text-center ${comparison.highlighted ? "text-aura-accent" : ""}`}
                  >
                    {comparison.category}
                  </div>
                ))}
              </div>
              
              <div className="space-y-4">
                {/* Pricing Row */}
                <div className="grid grid-cols-5 gap-4">
                  <div className="font-medium text-aura-text">Pricing</div>
                  {marketComparisons.map((comparison, i) => (
                    <div 
                      key={i} 
                      className={`text-center ${comparison.highlighted 
                        ? "font-bold text-aura-accent" 
                        : "text-aura-textSecondary"}`}
                    >
                      {comparison.pricing}
                    </div>
                  ))}
                </div>
                
                {/* Description Row */}
                <div className="grid grid-cols-5 gap-4">
                  <div className="font-medium text-aura-text">Service</div>
                  {marketComparisons.map((comparison, i) => (
                    <div 
                      key={i} 
                      className={`text-center text-sm ${comparison.highlighted 
                        ? "font-medium text-aura-text" 
                        : "text-aura-textSecondary"}`}
                    >
                      {comparison.description}
                    </div>
                  ))}
                </div>
                
                {/* Limitations Row */}
                <div className="grid grid-cols-5 gap-4">
                  <div className="font-medium text-aura-text">Features</div>
                  {marketComparisons.map((comparison, i) => (
                    <div 
                      key={i} 
                      className={`text-center text-sm ${comparison.highlighted 
                        ? "font-medium text-aura-text" 
                        : "text-aura-textSecondary"}`}
                    >
                      {comparison.limitations}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {pricingTiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 + 0.7 }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              className="flex flex-col h-full"
            >
              <Card className={`relative flex flex-col h-full border-aura-accent/10 ${
                tier.highlighted 
                  ? "shadow-lg shadow-aura-accent/20 border-aura-accent/30 before:absolute before:inset-0 before:rounded-lg before:border before:border-aura-accent/20 before:p-px before:bg-gradient-to-r before:from-aura-accent/40 before:to-aura-accentSecondary/40 before:-z-10 before:animate-pulse" 
                  : "shadow-md hover:shadow-aura-accent/10 hover:border-aura-accent/20 transition-all duration-300"
              }`}>
                <CardHeader className={tier.highlighted ? "bg-aura-accent/5 rounded-t-lg" : ""}>
                  {tier.badge && (
                    <Badge className="w-fit mb-2 bg-aura-accent text-white animate-pulse">
                      {tier.badge}
                    </Badge>
                  )}
                  <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                  <div className="mt-2 flex items-end">
                    <span className="text-4xl font-bold bg-gradient-to-r from-aura-accent to-aura-accentSecondary bg-clip-text text-transparent">
                      {billingCycle === "monthly" ? tier.price.monthly : tier.price.yearly}
                    </span>
                    <span className="text-aura-textSecondary ml-1">/ month</span>
                  </div>
                  <CardDescription className="mt-2">{tier.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ul className="space-y-3">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        ) : (
                          <X className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                        )}
                        <span className={!feature.included ? "text-aura-textSecondary" : ""}>
                          {feature.text}
                          {feature.tooltip && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="inline-block h-4 w-4 ml-1 text-aura-textSecondary cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="bg-aura-backgroundLight border-aura-accent/20 text-aura-text p-2">
                                  {feature.tooltip}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                  
                  {/* Market comparison points */}
                  {tier.comparisons && (
                    <div className="mt-6 pt-4 border-t border-aura-accent/10">
                      <h4 className="font-medium text-sm mb-3 text-aura-accent">Market Comparison</h4>
                      <ul className="space-y-2">
                        {tier.comparisons.map((comparison, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <ArrowRight className="h-4 w-4 text-aura-accent shrink-0 mt-0.5" />
                            <span>
                              {comparison.text}
                              {comparison.tooltip && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Info className="inline-block h-3 w-3 ml-1 text-aura-textSecondary cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-aura-backgroundLight border-aura-accent/20 text-aura-text p-2 max-w-xs">
                                      {comparison.tooltip}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    className={`w-full ${tier.highlighted 
                      ? "bg-gradient-to-r from-aura-accent to-aura-accentSecondary text-white" 
                      : "bg-aura-backgroundLight text-aura-text border border-aura-accent/20 hover:bg-aura-accent/10"}`}
                    onClick={() => handleSubscribe(tier.name)}
                  >
                    {tier.cta}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          className="text-center max-w-2xl mx-auto p-8 bg-aura-backgroundLight rounded-xl border border-aura-accent/10 shadow-md"
        >
          <h2 className="text-2xl font-bold mb-4">Need a custom solution?</h2>
          <p className="mb-6 text-aura-textSecondary">
            We offer tailored services for businesses with specific requirements. 
            Our custom plans provide the perfect balance between affordability and professional quality,
            with transparent pricing and no hidden fees.
          </p>
          <Button 
            className="bg-gradient-to-r from-aura-accent to-aura-accentSecondary text-white hover:shadow-lg hover:shadow-aura-accent/20 transition-all"
            onClick={() => handleSubscribe("Custom")}
          >
            Get Custom Quote
          </Button>
        </motion.div>
        
        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-aura-accent to-aura-accentSecondary bg-clip-text text-transparent">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-aura-backgroundLight rounded-lg p-6 border border-aura-accent/10">
              <h3 className="font-bold text-xl mb-2">How do your prices compare to freelancers?</h3>
              <p className="text-aura-textSecondary">
                While freelancer rates typically range from $30-150 per hour (often resulting in unpredictable project costs),
                our subscription model provides consistent, professional service at a fixed monthly rate. This eliminates surprise 
                costs and ensures ongoing support.
              </p>
            </div>
            
            <div className="bg-aura-backgroundLight rounded-lg p-6 border border-aura-accent/10">
              <h3 className="font-bold text-xl mb-2">Why choose your service over DIY platforms?</h3>
              <p className="text-aura-textSecondary">
                DIY platforms like Wix or Squarespace ($14-39/month) offer templates but lack professional design expertise. 
                Our service includes custom professional design, development, and ongoing support at competitive rates, 
                resulting in a higher-quality, unique website that truly represents your brand.
              </p>
            </div>
            
            <div className="bg-aura-backgroundLight rounded-lg p-6 border border-aura-accent/10">
              <h3 className="font-bold text-xl mb-2">Can I upgrade or downgrade my plan?</h3>
              <p className="text-aura-textSecondary">
                Yes, you can upgrade or downgrade your plan at any time. If you upgrade, you'll be charged the prorated 
                difference for the remainder of your billing cycle. If you downgrade, the new rate will apply at the start 
                of your next billing cycle.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Pricing;
