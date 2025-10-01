
import { useState } from "react";
import { Button } from "@/components/ui/button";
import SmartLeadForm from "@/components/lead/SmartLeadForm";
import { motion } from "framer-motion";

const BlogCTA = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <section className="py-16 px-4 bg-aura-backgroundLight/30">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4 font-heading text-white">Have a Topic in Mind?</h2>
        <p className="text-white mb-8 text-lg max-w-2xl mx-auto">
          Is there a specific topic you'd like us to cover in our blog? Let us know and we might write about it!
        </p>
        
        {showForm ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-aura-backgroundLight/50 p-6 rounded-lg max-w-md mx-auto"
          >
            <h3 className="text-xl font-semibold mb-4 text-white">Suggest a Topic</h3>
            <SmartLeadForm 
              variant="popup"
              buttonText="Submit Topic"
              onSuccess={() => setShowForm(false)}
            />
          </motion.div>
        ) : (
          <Button onClick={() => setShowForm(true)} asChild size="lg" className="bg-aura-accent hover:bg-aura-accent/90 text-white">
            <button>Suggest a Topic</button>
          </Button>
        )}
      </div>
    </section>
  );
};

export default BlogCTA;
