
import { Link } from "react-router-dom";
import { NeonButton } from "@/components/ui/neon-button";

const CtaSection = () => {
  return (
    <section className="py-20 px-4 relative">
      <div className="max-w-4xl mx-auto text-center relative z-10 glass-card p-12 border border-[color:var(--c-purple)/20] hover:border-[color:var(--c-purple)/40] hover:shadow-neon-purple-soft">
        <h2 className="text-3xl font-bold mb-4 font-heading bg-gradient-to-r from-[#c87eff] via-[#8d4dff] to-[#00f7ff] text-transparent bg-clip-text">Let's Work Together</h2>
        <p className="text-slate-200/90 mb-8 text-lg max-w-2xl mx-auto">
          Ready to bring your ideas to life? Get in touch today to discuss how we can collaborate on your next project.
        </p>
        <NeonButton variant="gradient" size="lg" asChild>
          <Link to="/contact">Contact Me</Link>
        </NeonButton>
      </div>
    </section>
  );
};

export default CtaSection;
