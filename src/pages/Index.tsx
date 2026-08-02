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
  CheckCircle,
  Award,
  Clock,
  Phone,
  ArrowRight,
} from "lucide-react";
import mainImage from "@/assets/5.jpeg";
import iconLife from "@/assets/icon-life.png";
import iconCritical from "@/assets/icon-critical.png";
import iconDisability from "@/assets/icon-disability.png";
import iconMortgage from "@/assets/icon-mortgage.png";

const Index = () => {
  const services = [
    {
      icon: iconLife,
      title: "Life Insurance",
      description: "Protect your family's future with comprehensive life coverage tailored to your needs.",
      color: "from-primary to-primary-glow",
    },
    {
      icon: iconCritical,
      title: "Critical Illness",
      description: "Financial security when you need it most, covering major illnesses and medical conditions.",
      color: "from-secondary to-primary",
    },
    {
      icon: iconDisability,
      title: "Disability Insurance",
      description: "Income protection to maintain your lifestyle if you're unable to work.",
      color: "from-primary to-secondary",
    },
    {
      icon: iconMortgage,
      title: "Mortgage Insurance",
      description: "Keep your home protected, ensuring your mortgage is covered no matter what.",
      color: "from-accent to-primary",
    },
    {
      icon: <Heart className="w-12 h-12" />,
      title: "Final Expense",
      description: "Peace of mind for your loved ones, covering end-of-life expenses.",
      color: "from-primary-glow to-accent",
    },
    {
      icon: <PlaneTakeoff className="w-12 h-12" />,
      title: "Travel Insurance",
      description: "Stay protected while exploring the world, for visitors and Canadians abroad.",
      color: "from-secondary to-accent",
    },
  ];

  const trustIndicators = [
    { icon: Award, label: "E&O Insured", value: "Professional Protection" },
    { icon: Users, label: "Service Areas", value: "Alberta & Ontario" },
    { icon: Shield, label: "Needs-Based Planning", value: "Personalized Guidance" },
    { icon: CheckCircle, label: "Quote Support", value: "Human Advisor Review" },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle font-[Inter]">
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-hero opacity-10 animate-float" />
        <div className="relative z-10 container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in-up">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary/10 rounded-full">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                <span className="text-sm font-medium text-primary">Protecting Canadian Families Since Day One</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Protecting What Matters{" "}
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Most
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                Comprehensive life insurance and financial protection guidance for modern families. Serving Alberta and Ontario with professional E&O coverage.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="w-full sm:w-auto bg-gradient-accent hover:shadow-glow text-lg px-8 group">
                  <Link to="/quote" data-testid="homepage-hero-quote">
                    Get Free Quote
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 group">
                  <a href="tel:780-860-3191" data-testid="homepage-hero-phone">
                    <Phone className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                    780-860-3191
                  </a>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
                {trustIndicators.map((item, index) => (
                  <div
                    key={index}
                    className="text-center p-4 rounded-xl bg-card shadow-card hover:shadow-elegant transition-all hover:scale-105"
                  >
                    <item.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="font-bold text-foreground">{item.value}</div>
                    <div className="text-xs text-muted-foreground">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative animate-fade-in">
              <div className="absolute inset-0 bg-gradient-primary rounded-3xl blur-3xl opacity-20 animate-pulse" />
            <img
  src={mainImage}
  alt="Happy family protected by Estate Nest insurance"
  className="relative rounded-3xl shadow-elegant w-full object-cover h-65" // h-64 is 16rem height
/>


            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Comprehensive Protection{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Solutions
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From life insurance to travel coverage, we've got you and your family protected
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card
                key={index}
                className="group hover:shadow-glow transition-all duration-300 hover:scale-105 border-border/50 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-8">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-card`}>
                    {typeof service.icon === 'string' ? (
                      <img src={service.icon} alt={service.title} className="w-10 h-10" />
                    ) : (
                      <div className="text-white">{service.icon}</div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">{service.title}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {service.description}
                  </p>
                  <Link
                    to="/services"
                    className="inline-flex items-center text-primary font-medium hover:text-primary-glow transition-colors group"
                  >
                    Learn more
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button asChild size="lg" variant="outline" className="group">
              <Link to="/services">
                View All Services
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to Protect Your Family's Future?
            </h2>
            <p className="text-xl text-primary-foreground/90">
              Get a personalized quote in minutes. No obligations, just peace of mind.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-glow px-8">
                <Link to="/quote">
                  Get Your Free Quote
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-glow px-8">
                <Link to="/calculators">
                  Try Our Calculators
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
