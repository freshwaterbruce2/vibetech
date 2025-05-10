
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";

interface NavItem {
  text: string;
  href: string;
}

const navItems: NavItem[] = [
  { text: "Home", href: "/" },
  { text: "About", href: "/about" },
  { text: "Portfolio", href: "/portfolio" },
  { text: "Blog", href: "/blog" },
  { text: "Contact", href: "/contact" },
];

const NavBar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="fixed w-full top-0 z-50 bg-aura-background/90 backdrop-blur-md border-b border-aura-accent/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-heading font-bold bg-gradient-to-r from-aura-accent to-purple-400 bg-clip-text text-transparent">
                Vibe Tech
              </span>
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.text}
                  to={item.href}
                  className="text-aura-textSecondary hover:text-aura-accent px-3 py-2 text-sm font-medium transition-colors duration-200"
                >
                  {item.text}
                </Link>
              ))}
              <Button
                variant="outline"
                className="ml-4 text-aura-accent border-aura-accent hover:bg-aura-accent/10"
                asChild
              >
                <Link to="/login">Dashboard</Link>
              </Button>
            </div>
          </div>
          
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              className="text-aura-textSecondary"
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-aura-background/95 backdrop-blur-md border-b border-aura-accent/20">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <Link
                key={item.text}
                to={item.href}
                className="text-aura-textSecondary hover:text-aura-accent block px-3 py-2 text-base font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.text}
              </Link>
            ))}
            <Link
              to="/login"
              className="text-aura-accent hover:bg-aura-accent/10 block px-3 py-2 text-base font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
