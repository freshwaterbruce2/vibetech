
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

const NotFound = () => {
  useEffect(() => {
    document.title = "Page Not Found | Aura";
  }, []);

  return (
    <div className="min-h-screen bg-aura-background">
      <NavBar />
      
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4">
        <div className="text-center p-8 max-w-md">
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full bg-aura-accent opacity-20 animate-ping"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl font-bold text-aura-accent">404</span>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold mb-4 font-heading">Page Not Found</h1>
          <p className="text-aura-textSecondary mb-8">
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back on track.
          </p>
          
          <div className="space-y-4">
            <Button asChild size="lg" className="bg-aura-accent hover:bg-aura-accent/90">
              <Link to="/">Return Home</Link>
            </Button>
            <div className="pt-2">
              <Link to="/contact" className="text-aura-accent hover:underline">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default NotFound;
