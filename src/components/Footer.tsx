import { Link } from "react-router-dom";
import { CheckCircle2, Facebook, Linkedin, Twitter, Mail, Phone, MapPin } from "lucide-react";
import logo from "../assets/icon-02.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-muted/50 to-muted pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company Info - Match Header Style */}
          <div className="space-y-4">
            <Link to="/" aria-label="Estate Nest home" className="flex items-center space-x-2 rounded-md group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <div className="w-10 h-10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <img 
                  src={logo}
                  alt=""
                  className="w-10 h-10 object-contain"
                />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Estate Nest
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Insurance and financial-protection guidance for families in Alberta and Ontario.
            </p>
            <div className="flex items-center space-x-2 text-sm">
              <div aria-hidden="true" className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <span className="font-semibold text-foreground">E&O Insured</span>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
                <span>Serving families across AB & ON</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
                <span>Needs-based insurance guidance</span>
              </li>
            </ul>
            {/* Contact Info - Match Header */}
            <a href="tel:780-860-3191" className="flex min-h-11 items-center space-x-2 rounded-md text-sm text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Phone aria-hidden="true" className="w-4 h-4" />
              <span>780-860-3191</span>
            </a>
          </div>

          {/* Quick Links - Match Header Navigation */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { name: "Home", path: "/" },
                { name: "About Us", path: "/about" },
                { name: "Services", path: "/services" },
                { name: "Need Analysis", path: "/calculators" },
                { name: "FAQs", path: "/faq" },
                { name: "Service Areas", path: "/service-areas" },
                { name: "Contact", path: "/contact" },
                { name: "Get a Quote", path: "/quote" },
              ].map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="inline-flex min-h-11 items-center rounded-md text-sm text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-0"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/management"
                  className="inline-flex min-h-11 items-center rounded-md text-sm text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-0"
                >
                  Admin Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Our Services</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Life Insurance</li>
              <li>Critical Illness Insurance</li>
              <li>Disability Insurance</li>
              <li>Mortgage Insurance</li>
              <li>Final Expense Insurance</li>
              <li>Travel Insurance</li>
              <li>Group Benefits</li>
              <li>Segregated Funds</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Contact Us</h3>
            <div className="space-y-3">
              <a
                href="tel:780-860-3191"
                className="flex min-h-11 items-center space-x-3 rounded-md text-sm text-muted-foreground transition-colors group hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Phone aria-hidden="true" className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>780-860-3191</span>
              </a>
              <a
                href="mailto:hello@estatenest.ca"
                className="flex min-h-11 items-center space-x-3 rounded-md text-sm text-muted-foreground transition-colors group hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Mail aria-hidden="true" className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>hello@estatenest.ca</span>
              </a>
              <div className="flex items-start space-x-3 text-sm text-muted-foreground">
                <MapPin aria-hidden="true" className="w-4 h-4 mt-0.5" />
                <span>7739 8 Ave SW, Edmonton, Alberta T6X 0A3</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-foreground mb-3">Follow Us</h4>
              <div className="flex space-x-3">
                <a
                  href="https://facebook.com/estatenest"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary transition-all hover:scale-110 hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href="https://linkedin.com/company/estatenest"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary transition-all hover:scale-110 hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <a
                  href="https://twitter.com/estatenest"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary transition-all hover:scale-110 hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © {currentYear} Estate Nest Inc. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2 text-sm">
              <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                Terms & Conditions
              </Link>
              <Link to="/cookies" className="text-muted-foreground hover:text-primary transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Estate Nest Inc is licensed by the{" "}
              <a 
                href="https://www.fsrao.ca/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Financial Services Regulatory Authority of Ontario (FSRA)
              </a>{" "}
              and the{" "}
              <a 
                href="https://www.abcouncil.ab.ca/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Alberta Insurance Council (AIC)
              </a>
              . E&O Insured.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
