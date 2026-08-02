import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  Shield,
  Heart,
  Users,
  Home,
  PlaneTakeoff,
  TrendingUp,
  Briefcase,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const Services = () => {
  const services = [
    {
      icon: Shield,
      title: "Life Insurance",
      description: "Secure your family's financial future with comprehensive life insurance coverage. We offer term life, whole life, and universal life policies designed to meet your unique needs.",
      features: [
        "Flexible coverage amounts",
        "Affordable premiums",
        "Quick approval process",
        "No medical exam options available",
      ],
    },
    {
      icon: Heart,
      title: "Critical Illness Insurance",
      description: "Receive a lump-sum payment if diagnosed with a covered critical illness. Use the funds however you need - medical bills, mortgage payments, or recovery costs.",
      features: [
        "Coverage for 25+ critical illnesses",
        "Lump sum payment upon diagnosis",
        "Tax-free benefit",
        "Return of premium options",
      ],
    },
    {
      icon: Users,
      title: "Disability Insurance",
      description: "Protect your income if illness or injury prevents you from working. Maintain your lifestyle and meet your financial obligations during recovery.",
      features: [
        "Short and long-term options",
        "Up to 70% income replacement",
        "Own occupation coverage",
        "Cost of living adjustments",
      ],
    },
    {
      icon: Home,
      title: "Mortgage Insurance",
      description: "Ensure your mortgage is paid off if the unexpected happens. Keep your family in their home with comprehensive mortgage protection coverage.",
      features: [
        "Coverage matches mortgage balance",
        "Named beneficiary of your choice",
        "Portable if you move",
        "No re-qualification needed",
      ],
    },
    {
      icon: Heart,
      title: "Final Expense Insurance",
      description: "Cover funeral and burial costs, leaving your loved ones without financial burden during an already difficult time.",
      features: [
        "Guaranteed acceptance options",
        "No medical exam required",
        "Immediate coverage available",
        "Affordable monthly premiums",
      ],
    },
    {
      icon: Briefcase,
      title: "Group Benefits",
      description: "Comprehensive employee benefit packages that attract and retain top talent while keeping your team healthy and protected.",
      features: [
        "Extended health coverage",
        "Dental and vision care",
        "Life and disability insurance",
        "Customizable benefit plans",
      ],
    },
    {
      icon: Users,
      title: "Buy-Sell / Criss-Cross Insurance",
      description: "Business succession planning made simple. Protect your business partnership with properly structured insurance.",
      features: [
        "Funded buyout agreements",
        "Business continuity planning",
        "Fair market value protection",
        "Tax-efficient structuring",
      ],
    },
    {
      icon: PlaneTakeoff,
      title: "Travel Insurance",
      description: "Whether you're visiting Canada or traveling abroad, stay protected with comprehensive travel medical insurance.",
      features: [
        "Emergency medical coverage",
        "Trip cancellation protection",
        "Single trip or annual plans",
        "Coverage for pre-existing conditions",
      ],
    },
    {
      icon: TrendingUp,
      title: "Segregated Funds",
      description: "Investment solutions with insurance benefits. Grow your wealth while protecting your principal with RRSP, RESP, LIRA, LIF, and Non-Reg accounts.",
      features: [
        "Principal protection guarantees",
        "Creditor protection",
        "Tax-efficient growth",
        "Professional money management",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle font-[Inter]">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-hero text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl animate-float" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl font-bold">Our Services</h1>
            <p className="text-xl text-primary-foreground/90">
              Comprehensive insurance and financial protection solutions tailored to your needs
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card
                key={index}
                className="group hover:shadow-glow transition-all duration-300 hover:scale-105 border-border/50 animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-card">
                    <service.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-foreground">{service.title}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    {service.description}
                  </p>
                  <ul className="space-y-3 mb-6">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start space-x-3 text-sm">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/quote">
                    <Button className="w-full bg-gradient-accent hover:shadow-glow group">
                      Get Quote
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold">
              Not Sure Which Coverage is Right for You?
            </h2>
            <p className="text-xl text-muted-foreground">
              Our expert advisors are here to help you find the perfect protection plan
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/quote">
                <Button size="lg" className="bg-gradient-accent hover:shadow-glow px-8">
                  Get Free Consultation
                </Button>
              </Link>
              <Link to="/faq">
                <Button size="lg" variant="outline" className="px-8">
                  View FAQ
                </Button>
              </Link>
              <a href="tel:780-860-3191">
                <Button size="lg" variant="outline" className="px-8">
                  Call 780-860-3191
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Services;
