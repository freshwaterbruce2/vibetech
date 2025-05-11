
import NavBar from "@/components/NavBar";
import { motion } from "framer-motion";
import { Check, X, Info } from "lucide-react";
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
  highlighted?: boolean;
  badge?: string;
  cta: string;
};

const pricingTiers: PricingTier[] = [
  {
    name: "Basic",
    price: {
      monthly: "$49",
      yearly: "$39",
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
    cta: "Start Basic",
  },
  {
    name: "Professional",
    price: {
      monthly: "$149",
      yearly: "$119",
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
    highlighted: true,
    badge: "Most Popular",
    cta: "Choose Pro",
  },
  {
    name: "Enterprise",
    price: {
      monthly: "$299",
      yearly: "$239",
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
    cta: "Contact Sales",
  },
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
            Professional web design services at affordable rates. More features and customization than DIY platforms 
            with the quality of agency work at a fraction of the price.
          </motion.p>
          
          {/* Market comparison badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-8"
          >
            <Badge variant="outline" className="px-4 py-2 bg-aura-accent/10 text-aura-accent border-aura-accent/30">
              Up to 70% more affordable than traditional agency services
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {pricingTiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 + 0.6 }}
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
            Our custom plans are up to 70% more affordable than traditional agency rates,
            with the same professional quality.
          </p>
          <Button 
            className="bg-gradient-to-r from-aura-accent to-aura-accentSecondary text-white hover:shadow-lg hover:shadow-aura-accent/20 transition-all"
            onClick={() => handleSubscribe("Custom")}
          >
            Get Custom Quote
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Pricing;
