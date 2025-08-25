
import { ToolCardProps } from "./ToolCard";

export interface AffiliateLink {
  name: string;
  url: string;
  description: string;
  commission?: string;
  category: string;
}

export const toolsData: (ToolCardProps & { affiliateLinks?: AffiliateLink[] })[] = [
  {
    title: "Development Tools",
    description: "Essential development tools and platforms for building modern web applications, with special discounts and affiliate partnerships for maximum value.",
    icon: "code",
    category: "Development",
    tools: ["Vercel Pro", "Netlify", "GitHub Copilot", "VSCode Extensions"],
    variant: "blue",
    affiliateLinks: [
      {
        name: "Vercel Pro",
        url: "https://vercel.com/signup?utm_source=vibetech&utm_campaign=dev_tools",
        description: "Deploy your React apps instantly with zero configuration",
        commission: "30-day free trial",
        category: "Hosting"
      },
      {
        name: "GitHub Copilot",
        url: "https://github.com/features/copilot?utm_source=vibetech",
        description: "AI-powered code completion that transforms development",
        commission: "Free trial available",
        category: "AI Tools"
      }
    ]
  },
  {
    title: "Design & UI Tools",
    description: "Professional design tools for creating stunning user interfaces, prototypes, and visual assets with industry-leading software.",
    icon: "paintbrush",
    category: "Design",
    tools: ["Figma Pro", "Adobe Creative Cloud", "Framer", "Sketch"],
    variant: "purple",
    affiliateLinks: [
      {
        name: "Figma Professional",
        url: "https://figma.com/pricing?utm_source=vibetech&utm_campaign=design_tools",
        description: "Collaborative design tool for modern teams",
        commission: "Up to 50% off first year",
        category: "Design"
      },
      {
        name: "Adobe Creative Cloud",
        url: "https://adobe.com/creativecloud?utm_source=vibetech",
        description: "Complete creative suite for professionals",
        commission: "Free trial + student discounts",
        category: "Design"
      }
    ]
  },
  {
    title: "Marketing & Analytics",
    description: "Advanced marketing automation and analytics platforms to grow your business with data-driven insights and automated campaigns.",
    icon: "chartBar",
    category: "Marketing",
    tools: ["ConvertKit", "Hotjar", "Mixpanel", "Google Analytics Pro"],
    variant: "teal",
    affiliateLinks: [
      {
        name: "ConvertKit",
        url: "https://convertkit.com?lmref=vibetech_affiliate",
        description: "Email marketing automation for creators",
        commission: "30% recurring commission",
        category: "Email Marketing"
      },
      {
        name: "Hotjar",
        url: "https://hotjar.com/r/vibetech",
        description: "Understand user behavior with heatmaps and recordings",
        commission: "Free plan available",
        category: "Analytics"
      }
    ]
  },
  {
    title: "Learning & Education",
    description: "Top-rated online courses and learning platforms to master new technologies, programming languages, and business skills.",
    icon: "book",
    category: "Education", 
    tools: ["Udemy Courses", "Pluralsight", "Frontend Masters", "Coursera Plus"],
    variant: "blue",
    affiliateLinks: [
      {
        name: "Udemy Business",
        url: "https://udemy.com/course/react-the-complete-guide/?referralCode=VIBETECH2024",
        description: "Complete React development course with real projects",
        commission: "Special discount codes available",
        category: "Programming"
      },
      {
        name: "Frontend Masters",
        url: "https://frontendmasters.com/?utm_source=vibetech",
        description: "Advanced web development courses by industry experts", 
        commission: "Free trial + group discounts",
        category: "Frontend"
      }
    ]
  },
  {
    title: "Productivity & Business",
    description: "Business tools and productivity software to streamline workflows, manage projects, and scale your development business.",
    icon: "briefcase",
    category: "Business",
    tools: ["Notion Pro", "Calendly", "Loom", "Stripe"],
    variant: "purple",
    affiliateLinks: [
      {
        name: "Notion Pro",
        url: "https://notion.so/pricing?utm_source=vibetech_referral",
        description: "All-in-one workspace for notes, projects, and collaboration",
        commission: "$10 credit for new users",
        category: "Productivity"
      },
      {
        name: "Calendly Premium",
        url: "https://calendly.com/pricing?utm_source=vibetech",
        description: "Advanced scheduling automation for professionals",
        commission: "14-day free trial",
        category: "Scheduling"
      }
    ]
  },
  {
    title: "Hardware & Gear",
    description: "Recommended development hardware, monitors, keyboards, and tech gear for optimal coding performance and workspace setup.",
    icon: "monitor",
    category: "Hardware",
    tools: ["MacBook Pro", "4K Monitors", "Mechanical Keyboards", "Audio Equipment"],
    variant: "teal",
    affiliateLinks: [
      {
        name: "LG UltraWide Monitor",
        url: "https://amazon.com/dp/B07YGZ7C1K?tag=vibetech-20",
        description: "34-inch curved ultrawide monitor perfect for coding",
        commission: "Amazon Associates Program",
        category: "Monitors"
      },
      {
        name: "Keychron Keyboards",
        url: "https://keychron.com?aff=vibetech",
        description: "Premium mechanical keyboards for developers",
        commission: "Exclusive discount codes",
        category: "Keyboards"
      }
    ]
  }
];
