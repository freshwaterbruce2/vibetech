import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
const CtaSection = () => {
  return <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4 font-heading">Have a Project in Mind?</h2>
        <p className="mb-8 text-lg max-w-2xl mx-auto text-gray-50">
          Whether you need a website, mobile app, or custom software solution, we're here to help turn your vision into reality.
        </p>
        <Button asChild size="lg" className="bg-aura-accent hover:bg-aura-accent/90">
          <Link to="/contact">Start a Project</Link>
        </Button>
      </div>
    </section>;
};
export default CtaSection;