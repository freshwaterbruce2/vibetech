
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";

interface NewsletterSubscribeProps {
  title?: string;
  description?: string;
  className?: string;
}

const NewsletterSubscribe = ({
  title = "Subscribe to our newsletter",
  description = "Stay updated with our latest tech insights and service offerings.",
  className = "",
}: NewsletterSubscribeProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    // Simulating API call
    setTimeout(() => {
      toast({
        title: "Success!",
        description: "You've been subscribed to our newsletter.",
      });
      setEmail("");
      setIsLoading(false);
    }, 1500);
    
    // In a real implementation, you would send this to your backend:
    // await fetch('/api/subscribe', {
    //   method: 'POST',
    //   body: JSON.stringify({ email }),
    //   headers: { 'Content-Type': 'application/json' }
    // });
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="bg-aura-backgroundLight border border-aura-accent/10 rounded-lg p-6 shadow-lg backdrop-blur-sm">
        <h3 className="text-xl font-bold mb-2 font-heading">{title}</h3>
        <p className="text-aura-textSecondary mb-4">{description}</p>
        
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-aura-textSecondary h-4 w-4" />
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-aura-accent to-aura-accentSecondary hover:opacity-90 transition-opacity">
            {isLoading ? "Subscribing..." : "Subscribe"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default NewsletterSubscribe;
