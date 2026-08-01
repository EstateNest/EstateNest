import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, Mail } from "lucide-react";
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

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const navItems = [
    { name: "Home", path: "/" },
    { name: "About Us", path: "/about" },
    { name: "Services", path: "/services" },
    { name: "Need Analysis", path: "/calculators" },
    { name: "FAQs", path: "/faq" },
    { name: "Service Areas", path: "/service-areas" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <nav
      aria-label="Primary navigation"
      className={cn(
        "fixed top-0 left-0 right-0 z-[60] transition-all duration-300",
        isOpen
          ? "bg-background shadow-elegant"
          : isScrolled
            ? "bg-background/95 backdrop-blur-md shadow-elegant"
            : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
         {/* Logo */}
<Link to="/" aria-label="Estate Nest home" className="flex items-center space-x-2 rounded-md group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
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
            <a
              href="tel:780-860-3191"
              aria-label="Call Estate Nest at 780-860-3191"
              className="hidden items-center space-x-2 rounded-md text-sm text-foreground/70 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:flex"
            >
              <Phone aria-hidden="true" className="w-4 h-4" />
              <span>780-860-3191</span>
            </a>
            <Button asChild className="bg-gradient-accent transition-all hover:shadow-glow">
              <Link to="/quote" data-testid="desktop-header-quote">
                Get Free Quote
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            type="button"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:hidden"
          >
            {isOpen ? <X aria-hidden="true" className="w-6 h-6" /> : <Menu aria-hidden="true" className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div
            id="mobile-navigation"
            data-testid="mobile-navigation-panel"
            className="absolute left-0 right-0 top-20 min-h-[calc(100dvh-5rem)] max-h-[calc(100dvh-5rem)] overflow-y-auto border-t border-border bg-background shadow-elegant animate-fade-in lg:hidden"
          >
            <div className="container mx-auto flex flex-col space-y-2 px-4 py-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex min-h-11 items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    location.pathname === item.path
                      ? "text-primary bg-primary/10"
                      : "text-foreground/70"
                  )}
                >
                  {item.name}
                </Link>
              ))}
              <div className="flex flex-col space-y-2 border-t border-border pt-4">
                <a
                  href="tel:780-860-3191"
                  className="flex min-h-11 items-center space-x-2 rounded-md text-sm text-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Phone aria-hidden="true" className="w-4 h-4" />
                  <span>780-860-3191</span>
                </a>
                <a
                  href="mailto:hello@estatenest.ca"
                  className="flex min-h-11 items-center space-x-2 rounded-md text-sm text-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Mail aria-hidden="true" className="w-4 h-4" />
                  <span>hello@estatenest.ca</span>
                </a>
                <Button asChild className="min-h-11 w-full bg-gradient-accent hover:shadow-glow">
                  <Link to="/quote" data-testid="mobile-header-quote" onClick={() => setIsOpen(false)}>
                    Get Free Quote
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
