
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PageLayout from "@/components/layout/PageLayout";

const NotFound = () => {
  return (
    <PageLayout title="Page Not Found">
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 relative overflow-hidden">
        {/* Background grid effect */}
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="h-full w-full bg-[linear-gradient(90deg,rgba(160,32,240,0.15)_1px,transparent_1px),linear-gradient(rgba(160,32,240,0.15)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        </div>
        
        {/* Center content */}
        <div className="text-center p-8 max-w-md z-10 relative">
          <div className="relative w-40 h-40 mx-auto mb-8">
            {/* Outer glow ring */}
            <div className="absolute inset-0 rounded-full bg-aura-accent/20 blur-xl animate-pulse"></div>
            
            {/* Middle glow ring */}
            <div className="absolute inset-[10%] rounded-full bg-aura-accent/40 blur-md animate-pulse" 
                style={{ animationDelay: "0.2s" }}></div>
            
            {/* Inner content with text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-aura-accent to-blue-400 animate-glow">404</span>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold mb-4 font-heading text-transparent bg-clip-text bg-gradient-to-r from-white to-aura-textSecondary">
            Page Not Found
          </h1>
          <p className="text-aura-textSecondary mb-8 backdrop-blur-sm">
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back on track.
          </p>
          
          <div className="space-y-4">
            <Button asChild size="lg" 
              className="bg-gradient-to-r from-aura-accent to-purple-600 hover:opacity-90 transition-all shadow-lg shadow-aura-accent/25 border border-aura-accent/20">
              <Link to="/">Return Home</Link>
            </Button>
            <div className="pt-2">
              <Link to="/contact" 
                className="text-aura-accent hover:text-aura-accent/80 transition-colors underline decoration-aura-accent/30 underline-offset-4">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default NotFound;
