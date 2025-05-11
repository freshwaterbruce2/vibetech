
import NavBar from "@/components/NavBar";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

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
  }[];
  highlighted?: boolean;
  badge?: string;
};

const pricingTiers: PricingTier[] = [
  {
    name: "Starter",
    price: {
      monthly: "$99",
      yearly: "$79",
    },
    description: "Perfect for small businesses just getting started with web presence.",
    features: [
      { text: "Responsive Website Design", included: true },
      { text: "3 Page Website", included: true },
      { text: "Contact Form", included: true },
      { text: "Basic SEO Setup", included: true },
      { text: "1 Month Support", included: true },
      { text: "Content Management System", included: false },
      { text: "E-commerce Integration", included: false },
      { text: "Custom Animations", included: false },
    ],
  },
  {
    name: "Professional",
    price: {
      monthly: "$199",
      yearly: "$159",
    },
    description: "Ideal for growing businesses that need more features and customization.",
    features: [
      { text: "Responsive Website Design", included: true },
      { text: "10 Page Website", included: true },
      { text: "Contact Form", included: true },
      { text: "Advanced SEO Setup", included: true },
      { text: "3 Months Support", included: true },
      { text: "Content Management System", included: true },
      { text: "E-commerce Integration", included: true },
      { text: "Custom Animations", included: false },
    ],
    highlighted: true,
    badge: "Popular",
  },
  {
    name: "Enterprise",
    price: {
      monthly: "$349",
      yearly: "$279",
    },
    description: "Complete solution for established businesses with complex requirements.",
    features: [
      { text: "Responsive Website Design", included: true },
      { text: "Unlimited Pages", included: true },
      { text: "Contact Form", included: true },
      { text: "Premium SEO Setup", included: true },
      { text: "12 Months Support", included: true },
      { text: "Content Management System", included: true },
      { text: "E-commerce Integration", included: true },
      { text: "Custom Animations", included: true },
    ],
  },
];

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  
  return (
    <div className="min-h-screen bg-aura-background pb-16">
      <NavBar />
      
      <div className="max-w-7xl mx-auto px-4 pt-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-6 bg-gradient-to-r from-aura-accent to-aura-accentSecondary bg-clip-text text-transparent">
            Our Pricing Plans
          </h1>
          <p className="text-aura-textSecondary max-w-3xl mx-auto mb-8">
            Choose the perfect plan to elevate your digital presence with tailored solutions designed to meet your specific needs.
          </p>
          
          {/* Billing toggle */}
          <div className="flex items-center justify-center mb-12">
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
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {pricingTiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex flex-col h-full"
            >
              <Card className={`flex flex-col h-full border-aura-accent/10 ${
                tier.highlighted ? "shadow-lg shadow-aura-accent/20 border-aura-accent/30" : "shadow-md"
              } hover-scale`}>
                <CardHeader className={tier.highlighted ? "bg-aura-accent/5 rounded-t-lg" : ""}>
                  {tier.badge && (
                    <Badge className="w-fit mb-2 bg-aura-accent text-white">
                      {tier.badge}
                    </Badge>
                  )}
                  <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-4xl font-bold">{billingCycle === "monthly" ? tier.price.monthly : tier.price.yearly}</span>
                    <span className="text-aura-textSecondary">/ month</span>
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
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className={`w-full ${tier.highlighted 
                      ? "bg-gradient-to-r from-aura-accent to-aura-accentSecondary text-white" 
                      : "bg-aura-backgroundLight text-aura-text border border-aura-accent/20"}`}
                  >
                    Get Started
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Need a custom solution?</h2>
          <p className="mb-6 text-aura-textSecondary">
            We offer tailored services for businesses with specific requirements. 
            Contact us for a personalized consultation and quote.
          </p>
          <Button className="bg-aura-backgroundLight text-aura-text border border-aura-accent/20 hover:bg-aura-accent/10">
            Contact Sales
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
