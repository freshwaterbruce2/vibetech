
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    question: "How do your prices compare to freelancers?",
    answer: "While freelancer rates typically range from $30-150 per hour (often resulting in unpredictable project costs), our subscription model provides consistent, professional service at a fixed monthly rate. This eliminates surprise costs and ensures ongoing support."
  },
  {
    question: "Why choose your service over DIY platforms?",
    answer: "DIY platforms like Wix or Squarespace ($14-39/month) offer templates but lack professional design expertise. Our service includes custom professional design, development, and ongoing support at competitive rates, resulting in a higher-quality, unique website that truly represents your brand."
  },
  {
    question: "Can I upgrade or downgrade my plan?",
    answer: "Yes, you can upgrade or downgrade your plan at any time. If you upgrade, you'll be charged the prorated difference for the remainder of your billing cycle. If you downgrade, the new rate will apply at the start of your next billing cycle."
  },
  {
    question: "Is there a setup fee or contract?",
    answer: "No, we don't charge any setup fees and there are no long-term contracts. You can cancel your subscription at any time without penalty."
  },
  {
    question: "What happens if I need additional services?",
    answer: "If you need services beyond what's included in your plan, we offer custom quotes for additional work. Our team will assess your requirements and provide transparent pricing before any work begins."
  }
];

const PricingFAQ = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="max-w-4xl mx-auto"
    >
      <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-aura-accent to-aura-accentSecondary bg-clip-text text-transparent">
        Frequently Asked Questions
      </h2>
      
      <Accordion type="single" collapsible className="w-full">
        {faqItems.map((item, index) => (
          <AccordionItem 
            key={index} 
            value={`item-${index}`}
            className="bg-aura-backgroundLight rounded-lg mb-4 px-6 border border-aura-accent/10 overflow-hidden"
          >
            <AccordionTrigger className="py-5 text-left text-lg font-medium hover:no-underline">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-aura-textSecondary pb-5">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      
      <div className="mt-12 text-center">
        <p className="text-aura-textSecondary">
          Still have questions? <a href="/contact" className="text-aura-accent hover:underline">Contact our team</a> for more information.
        </p>
      </div>
    </motion.div>
  );
};

export default PricingFAQ;
