
import { Link } from "react-router-dom";
import { Instagram, Linkedin, Mail, Twitter } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-aura-backgroundLight py-12 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <Link to="/" className="text-2xl font-heading font-bold bg-gradient-to-r from-aura-accent to-purple-400 bg-clip-text text-transparent">
            Aura
          </Link>
          <p className="mt-4 text-aura-textSecondary">
            Creating innovative digital solutions with a focus on design and functionality.
          </p>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
          <ul className="space-y-2">
            <li>
              <Link to="/" className="text-aura-textSecondary hover:text-aura-accent transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link to="/about" className="text-aura-textSecondary hover:text-aura-accent transition-colors">
                About
              </Link>
            </li>
            <li>
              <Link to="/portfolio" className="text-aura-textSecondary hover:text-aura-accent transition-colors">
                Portfolio
              </Link>
            </li>
            <li>
              <Link to="/blog" className="text-aura-textSecondary hover:text-aura-accent transition-colors">
                Blog
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
          <h3 className="text-lg font-semibold mb-4">Connect</h3>
          <div className="flex space-x-4 mb-4">
            <a href="#" className="text-aura-textSecondary hover:text-aura-accent transition-colors">
              <Twitter size={20} />
              <span className="sr-only">Twitter</span>
            </a>
            <a href="#" className="text-aura-textSecondary hover:text-aura-accent transition-colors">
              <Instagram size={20} />
              <span className="sr-only">Instagram</span>
            </a>
            <a href="#" className="text-aura-textSecondary hover:text-aura-accent transition-colors">
              <Linkedin size={20} />
              <span className="sr-only">LinkedIn</span>
            </a>
            <a href="mailto:contact@example.com" className="text-aura-textSecondary hover:text-aura-accent transition-colors">
              <Mail size={20} />
              <span className="sr-only">Email</span>
            </a>
          </div>
          <p className="text-aura-textSecondary">
            contact@example.com
          </p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-aura-accent/20 text-center">
        <p className="text-aura-textSecondary text-sm">
          © {currentYear} Aura. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
