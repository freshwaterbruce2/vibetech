
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const BlogSubscribe = () => {
  return (
    <div className="p-6 rounded-lg border border-aura-accent/20 bg-aura-background">
      <h3 className="text-xl font-semibold mb-4 font-heading text-white">Subscribe</h3>
      <p className="text-white text-sm mb-4">
        Stay updated with our latest articles and insights. Subscribe to our newsletter.
      </p>
      <div className="space-y-3">
        <Input
          type="email"
          placeholder="Your email address"
          className="bg-aura-backgroundLight/20 border-aura-accent/20 focus-visible:ring-aura-accent/30 text-white placeholder:text-white/70"
        />
        <Button className="w-full bg-aura-accent hover:bg-aura-accent/90 text-white">
          Subscribe
        </Button>
      </div>
    </div>
  );
};

export default BlogSubscribe;
