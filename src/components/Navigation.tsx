import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, Mail, Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "../assets/icon-02.png";


const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: "About", path: "/about" },
    { name: "Calculators", path: "/calculators" },
    { name: "Careers", path: "/careers" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-background/95 backdrop-blur-md shadow-elegant"
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
         {/* Logo */}
<Link to="/" className="flex items-center space-x-2 group">
  <div className="w-10 h-10 flex items-center justify-center group-hover:scale-110 transition-transform">
    <img
      src={logo}
      alt="Estate Nest Logo"
      className="w-10 h-10 object-contain"
    />
  </div>
  <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
    Estate Nest
  </span>
</Link>


          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary relative group",
                  location.pathname === item.path
                    ? "text-primary"
                    : "text-foreground/70"
                )}
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </Link>
            ))}
          </div>

          {/* Contact Info & CTA */}
          <div className="hidden lg:flex items-center space-x-4">
        <div className="hidden lg:flex items-center space-x-2 text-sm text-foreground/70 cursor-default select-none">
  <Phone className="w-4 h-4" />
  <span>780-860-3191</span>
</div>
            <Link to="/quote">
              <Button className="bg-gradient-accent hover:shadow-glow transition-all">
                Get Free Quote
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-foreground hover:text-primary transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary px-4 py-2",
                    location.pathname === item.path
                      ? "text-primary bg-primary/10"
                      : "text-foreground/70"
                  )}
                >
                  {item.name}
                </Link>
              ))}
              <div className="flex flex-col space-y-3 px-4 pt-4 border-t border-border">
                <a
                  href="tel:780-860-3191"
                  className="flex items-center space-x-2 text-sm text-foreground/70"
                >
                  <Phone className="w-4 h-4" />
                  <span>780-860-3191</span>
                </a>
                <a
                  href="mailto:hello@estatenest.ca"
                  className="flex items-center space-x-2 text-sm text-foreground/70"
                >
                  <Mail className="w-4 h-4" />
                  <span>hello@estatenest.ca</span>
                </a>
                <Link to="/quote" onClick={() => setIsOpen(false)}>
                  <Button className="w-full bg-gradient-accent hover:shadow-glow">
                    Get Free Quote
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
