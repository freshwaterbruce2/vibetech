
import { Link } from "react-router-dom";
import { NeonButton } from "@/components/ui/neon-button";

const CtaSection = () => {
  return (
    <section className="py-20 px-4 relative">
      <div className="max-w-4xl mx-auto text-center relative z-10 glass-card p-12 border border-[rgba(185,51,255,0.2)] hover:border-[rgba(185,51,255,0.4)] hover:shadow-neon-purple-soft">
        <h2 className="text-3xl font-bold mb-4 font-heading bg-gradient-to-r from-[#c87eff] via-[#8d4dff] to-[#00f7ff] text-transparent bg-clip-text">Let's Build Something Amazing</h2>
        <p className="text-white mb-8 text-lg max-w-2xl mx-auto">
          Whether you're launching a new product or refreshing your brand, I'm here to make it fast, fluent, and unforgettable.
        </p>
        <NeonButton variant="gradient" size="lg" asChild>
          <Link to="/contact">Contact Me</Link>
        </NeonButton>
      </div>
    </section>
  );
};

export default CtaSection;
