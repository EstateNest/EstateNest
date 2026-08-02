import { useEffect, useRef, useState } from "react";
import { ArrowRight, CircleHelp, Mail, MessageCircle, Phone, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ChatBot = () => {
  const location = useLocation();
  const launcherRef = useRef<HTMLButtonElement>(null);
  const primaryActionRef = useRef<HTMLAnchorElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const isQuotePage = location.pathname === "/quote";

  useEffect(() => {
    setIsOpen(false);

    if (isQuotePage) {
      setIsVisible(false);
      return;
    }

    const updateVisibility = () => {
      const threshold = window.innerWidth < 640 ? 420 : 180;
      setIsVisible(window.scrollY >= threshold);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);

    return () => {
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, [isQuotePage, location.pathname]);

  useEffect(() => {
    if (!isVisible) setIsOpen(false);
  }, [isVisible]);

  useEffect(() => {
    if (!isOpen) return;

    primaryActionRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      launcherRef.current?.focus();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (isQuotePage || !isVisible) return null;

  return (
    <>
      <button
        ref={launcherRef}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
        aria-label={isOpen ? "Close contact assistant" : "Open contact assistant"}
        aria-expanded={isOpen}
        aria-controls="estate-nest-contact-assistant"
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-accent shadow-glow transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none sm:bottom-6 sm:right-6 sm:h-14 sm:w-14"
      >
        {isOpen ? (
          <X aria-hidden="true" className="h-6 w-6 text-accent-foreground" />
        ) : (
          <MessageCircle aria-hidden="true" className="h-6 w-6 text-accent-foreground" />
        )}
      </button>

      {isOpen && (
        <section
          id="estate-nest-contact-assistant"
          data-testid="contact-assistant-panel"
          aria-label="Estate Nest contact options"
          className="fixed bottom-20 right-3 z-50 w-[calc(100vw-1.5rem)] max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-elegant animate-scale-in motion-reduce:animate-none sm:bottom-24 sm:right-6"
        >
          <div className="bg-gradient-primary p-5 text-primary-foreground">
            <h2 className="text-lg font-semibold">How can we help?</h2>
            <p className="mt-1 text-sm text-primary-foreground/85">
              Choose a secure way to connect with Estate Nest.
            </p>
          </div>

          <div className="space-y-3 p-4">
            <Button asChild className="min-h-11 w-full justify-between bg-gradient-accent hover:shadow-glow">
              <Link ref={primaryActionRef} to="/quote" onClick={() => setIsOpen(false)}>
                Get Your Free Quote
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="min-h-11 w-full justify-start">
              <a href="tel:780-860-3191">
                <Phone aria-hidden="true" className="mr-2 h-4 w-4" />
                Call 780-860-3191
              </a>
            </Button>
            <Button asChild variant="outline" className="min-h-11 w-full justify-start">
              <a href="mailto:hello@estatenest.ca">
                <Mail aria-hidden="true" className="mr-2 h-4 w-4" />
                Email Estate Nest
              </a>
            </Button>
            <Button asChild variant="ghost" className="min-h-11 w-full justify-start">
              <Link to="/faq" onClick={() => setIsOpen(false)}>
                <CircleHelp aria-hidden="true" className="mr-2 h-4 w-4" />
                Read common insurance questions
              </Link>
            </Button>
            <p className="rounded-lg bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
              Information on this website is general. Eligibility, pricing, and coverage depend on insurer underwriting and policy terms. A licensed advisor should confirm recommendations.
            </p>
          </div>
        </section>
      )}
    </>
  );
};

export default ChatBot;
