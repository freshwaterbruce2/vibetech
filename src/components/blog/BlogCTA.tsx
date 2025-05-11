
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const BlogCTA = () => {
  return (
    <section className="py-16 px-4 bg-aura-backgroundLight/30">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4 font-heading">Have a Topic in Mind?</h2>
        <p className="text-aura-textSecondary mb-8 text-lg max-w-2xl mx-auto">
          Is there a specific topic you'd like us to cover in our blog? Let us know and we might write about it!
        </p>
        <Button asChild size="lg" className="bg-aura-accent hover:bg-aura-accent/90">
          <Link to="/contact">Suggest a Topic</Link>
        </Button>
      </div>
    </section>
  );
};

export default BlogCTA;
