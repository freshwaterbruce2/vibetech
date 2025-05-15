import { Link } from "react-router-dom";
import NewsletterSubscribe from "./NewsletterSubscribe";

const Footer = () => {
  return (
    <footer className="border-t border-aura-accent/10 mt-auto py-10 relative z-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div>
            <h3 className="text-2xl font-bold mb-4 font-heading bg-gradient-to-r from-aura-accent to-aura-accentSecondary bg-clip-text text-transparent">
              Vibe Tech
            </h3>
            <p className="text-aura-textSecondary mb-4">
              Innovative digital solutions where bold design meets rock-solid functionality.
            </p>
            <div className="text-aura-textSecondary">
              <p>Bruce Freshwater · freshwaterbruce@icloud.com</p>
              <p>(803) 825-8860</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 text-lg">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-aura-textSecondary hover:text-aura-accent transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-aura-textSecondary hover:text-aura-accent transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/portfolio" className="text-aura-textSecondary hover:text-aura-accent transition-colors">
                  Portfolio
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-aura-textSecondary hover:text-aura-accent transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <NewsletterSubscribe className="w-full" />
          </div>
        </div>
        
        <div className="pt-6 border-t border-aura-accent/10 flex flex-col md:flex-row items-center justify-between">
          <p className="text-aura-textSecondary text-sm mb-4 md:mb-0">
            &copy; 2025 Vibe Tech. All rights reserved.
          </p>
          
          <div className="flex space-x-6">
            <Link to="/privacy" className="text-aura-textSecondary hover:text-aura-accent transition-colors text-sm">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-aura-textSecondary hover:text-aura-accent transition-colors text-sm">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
