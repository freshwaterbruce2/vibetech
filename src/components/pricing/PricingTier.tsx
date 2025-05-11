
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Info, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PricingTier as PricingTierType } from "./types";

interface PricingTierProps {
  tier: PricingTierType;
  billingCycle: "monthly" | "yearly";
  index: number;
  onSubscribe: (plan: string) => void;
}

const PricingTier = ({ tier, billingCycle, index, onSubscribe }: PricingTierProps) => {
  return (
    <motion.div
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
            onClick={() => onSubscribe(tier.name)}
          >
            {tier.cta}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default PricingTier;
