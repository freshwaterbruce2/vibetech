
import { ToolCardProps } from "./ToolCard";

export const toolsData: ToolCardProps[] = [
  {
    title: "Affiliate Marketing",
    description: "Powerful tools to manage, track, and optimize your affiliate marketing campaigns with detailed analytics and easy link management.",
    icon: "linkIcon", // This will be replaced with the actual component in the Tools page
    category: "Marketing",
    tools: ["Pretty Links", "ThirstyAffiliates", "Amazon Associates", "ShareASale"],
    variant: "blue"
  },
  {
    title: "E-Commerce",
    description: "Complete e-commerce solutions that allow you to sell products and services directly or promote affiliate products seamlessly.",
    icon: "shoppingCart",
    category: "Sales",
    tools: ["Shopify", "WooCommerce", "Printful", "Gumroad"],
    variant: "purple"
  },
  {
    title: "Marketing Automation",
    description: "Streamline your marketing efforts with automated email campaigns and AI-powered content creation tools.",
    icon: "mail",
    category: "Automation",
    tools: ["Mailchimp", "Rytr.me", "ConvertKit", "ActiveCampaign"],
    variant: "teal"
  },
  {
    title: "Analytics",
    description: "Gain valuable insights into user behavior, track conversion metrics, and optimize your site for better performance.",
    icon: "chartBar",
    category: "Data",
    tools: ["Google Analytics", "Hotjar", "Mixpanel", "Plausible"],
    variant: "blue"
  },
  {
    title: "Collaboration",
    description: "Enhance team productivity with intuitive tools for brainstorming, project management, and collaborative work.",
    icon: "users",
    category: "Teamwork",
    tools: ["Miro", "Notion", "Trello", "Asana"],
    variant: "purple"
  },
  {
    title: "Design Resources",
    description: "Create stunning visual assets that maintain our futuristic tech aesthetic with neon accents and glassmorphism.",
    icon: "paintbrush",
    category: "Design",
    tools: ["Figma", "Framer", "Canva", "Adobe Creative Cloud"],
    variant: "teal"
  }
];
