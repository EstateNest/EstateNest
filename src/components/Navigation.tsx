import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "../assets/icon-02.png";

const navItems = [
  { name: "Home", path: "/" },
  { name: "About Us", path: "/about" },
  { name: "Services", path: "/services" },
  { name: "Need Analysis", path: "/calculators" },
  { name: "FAQs", path: "/faq" },
  { name: "Service Areas", path: "/service-areas" },
  { name: "Contact", path: "/contact" },
] as const;

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
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

  return (
    <nav
      aria-label="Primary navigation"
      className={cn(
        "fixed left-0 right-0 top-0 z-[60] border-b border-border bg-gradient-to-r from-background via-muted to-background transition-shadow duration-300",
        isOpen || isScrolled ? "shadow-elegant" : "shadow-sm"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
         {/* Logo */}
          <Link
            to="/"
            aria-label="Estate Nest home"
            className="group -ml-2 flex min-h-11 items-center space-x-2 rounded-xl bg-gradient-to-r from-transparent via-transparent to-transparent px-2 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:from-primary/10 hover:via-secondary/10 hover:to-accent/10 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div className="w-10 h-10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <img
                src={logo}
                alt="Estate Nest Logo"
                className="w-10 h-10 object-contain"
              />
            </div>
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-xl font-bold text-transparent">
              Estate Nest
            </span>
          </Link>


          {/* Desktop Navigation */}
          <div className="hidden items-center gap-1 xl:flex">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group relative inline-flex min-h-11 items-center rounded-xl px-3 py-2 text-sm font-semibold transition-[color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isActive
                      ? "bg-gradient-to-r from-primary/15 via-secondary/20 to-accent/15 text-foreground shadow-card ring-1 ring-primary/20"
                      : "text-foreground/75 hover:-translate-y-0.5 hover:bg-gradient-to-r hover:from-primary/10 hover:via-secondary/10 hover:to-accent/10 hover:text-foreground hover:shadow-card"
                  )}
                >
                  {item.name}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-x-3 bottom-1 h-0.5 origin-left rounded-full bg-gradient-to-r from-primary via-secondary to-accent transition-transform duration-200",
                      isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100 group-focus-visible:scale-x-100"
                    )}
                  />
                </Link>
              );
            })}
          </div>

          {/* Contact Info & CTA */}
          <div className="hidden items-center space-x-4 xl:flex">
            <a
              href="tel:780-860-3191"
              aria-label="Call Estate Nest at 780-860-3191"
              className="hidden min-h-11 items-center space-x-2 rounded-xl px-2 text-sm text-foreground/75 transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 xl:flex"
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
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 xl:hidden"
          >
            {isOpen ? <X aria-hidden="true" className="w-6 h-6" /> : <Menu aria-hidden="true" className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div
            id="mobile-navigation"
            data-testid="mobile-navigation-panel"
            className="absolute left-0 right-0 top-20 min-h-[calc(100dvh-5rem)] max-h-[calc(100dvh-5rem)] overflow-y-auto border-t border-border bg-background shadow-elegant animate-fade-in xl:hidden"
          >
            <div className="container mx-auto flex flex-col space-y-2 px-4 py-4">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex min-h-11 items-center rounded-xl px-4 py-2 text-sm font-semibold transition-[color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive
                        ? "bg-gradient-to-r from-primary/15 via-secondary/20 to-accent/15 text-foreground shadow-card ring-1 ring-primary/20"
                        : "text-foreground/75 hover:bg-gradient-to-r hover:from-primary/10 hover:via-secondary/10 hover:to-accent/10 hover:text-foreground"
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
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
