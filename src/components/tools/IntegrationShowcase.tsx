
import React from "react";
import { motion } from "framer-motion";
import FuturisticCard from "@/components/ui/futuristic-card";
import { NeonButton } from "@/components/ui/neon-button";
import { Paintbrush, Mail, ChartBar, ShoppingCart, Link2, Users } from "lucide-react";

const IntegrationShowcase: React.FC = () => {
  const integrations = [
    {
      name: "Pretty Links",
      description: "Manage and track affiliate links with powerful analytics and click data.",
      icon: <Link2 className="h-6 w-6" />,
      variant: "blue",
      buttonText: "Affiliate Links"
    },
    {
      name: "Shopify",
      description: "Create a beautiful storefront for selling products and services online.",
      icon: <ShoppingCart className="h-6 w-6" />,
      variant: "purple",
      buttonText: "E-Commerce"
    },
    {
      name: "Mailchimp",
      description: "Automate email marketing campaigns and grow your audience effectively.",
      icon: <Mail className="h-6 w-6" />,
      variant: "teal",
      buttonText: "Email Marketing"
    },
    {
      name: "Google Analytics",
      description: "Track user behavior and conversion metrics to optimize your site.",
      icon: <ChartBar className="h-6 w-6" />,
      variant: "blue",
      buttonText: "Analytics"
    },
    {
      name: "Miro & Notion",
      description: "Collaborate on projects with powerful brainstorming and management tools.",
      icon: <Users className="h-6 w-6" />,
      variant: "purple",
      buttonText: "Collaboration"
    },
    {
      name: "Figma & Framer",
      description: "Design stunning interfaces with our futuristic tech aesthetic.",
      icon: <Paintbrush className="h-6 w-6" />,
      variant: "teal",
      buttonText: "Design"
    }
  ];

  return (
    <section className="py-20 px-4 relative">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-4 text-center font-heading">
          Featured <span className="bg-gradient-to-r from-purple-400 to-aura-accent bg-clip-text text-transparent">Integrations</span>
        </h2>
        <p className="text-aura-textSecondary text-center mb-12 max-w-2xl mx-auto">
          Explore our featured integrations that can help elevate your digital presence and streamline your workflow.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <FuturisticCard className="h-full" variant={integration.variant as "blue" | "purple" | "teal"}>
                <div className="flex flex-col h-full">
                  <div className="mb-4 p-3 rounded-lg bg-aura-backgroundLight/50 inline-block">
                    {integration.icon}
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2">{integration.name}</h3>
                  <p className="text-aura-textSecondary mb-6 flex-grow">{integration.description}</p>
                  
                  <div className="mt-auto">
                    <NeonButton variant={integration.variant as "blue" | "purple" | "teal"} size="sm">
                      {integration.buttonText}
                    </NeonButton>
                  </div>
                </div>
              </FuturisticCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IntegrationShowcase;
