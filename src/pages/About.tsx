import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import { Shield, Users, Award, Target, Heart, CheckCircle, ArrowRight, MapPin, Mail, Phone } from "lucide-react";

const About = () => {
  const values = [
    {
      icon: Shield,
      title: "Trust & Integrity",
      description: "We operate with complete transparency and hold E&O insurance for your protection.",
    },
    {
      icon: Heart,
      title: "Client-First Approach",
      description: "Your family's security is our top priority. We tailor solutions to your unique needs.",
    },
    {
      icon: Award,
      title: "Excellence",
      description: "Licensed in Alberta & Ontario, we maintain the highest professional standards.",
    },
    {
      icon: Target,
      title: "Needs-Based Guidance",
      description: "We begin with your goals and explain suitable next steps in clear language.",
    },
  ];

  const stats = [
    { label: "Service Areas", value: "AB & ON", icon: MapPin },
    { label: "Approach", value: "Needs-Based", icon: Target },
    { label: "Consultation", value: "No Obligation", icon: Heart },
    { label: "Support", value: "Human-Led", icon: Users },
  ];

  const whyChooseUs = [
    "Licensed advisors serving Alberta and Ontario",
    "Professional E&O insurance coverage",
    "Personalized insurance solutions tailored to your family",
    "Guidance through the application and underwriting process",
    "No-obligation free consultations and quotes",
    "Product options reviewed against your stated needs",
    "Ongoing support and policy reviews",
    "Transparent, honest advice you can trust",
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle font-[Inter]">
      <Navigation />
      <ChatBot />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-hero text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-float" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl font-bold">About Estate Nest</h1>
            <p className="text-xl text-primary-foreground/90">
              Insurance and financial-protection guidance for families in Alberta and Ontario
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16 animate-fade-in-up">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Our{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Mission
                </span>
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                At Estate Nest Inc., we believe every family deserves access to comprehensive, affordable insurance protection. Based in Edmonton, Alberta, we've built our reputation on trust, expertise, and unwavering commitment to our clients' financial security.
              </p>
            </div>

            <div className="space-y-6 mb-16 animate-fade-in">
              <p className="text-lg text-muted-foreground leading-relaxed">
                With licenses in both Alberta and Ontario, we serve families across Canada with a wide range of insurance and financial products. Our team of experienced advisors takes the time to understand your unique situation, goals, and concerns before recommending solutions.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We maintain professional E&O coverage and focus on clear, needs-based guidance. Our role is to help clients understand available options, application steps, and the questions an insurer may consider during underwriting.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
              {stats.map((stat, index) => (
                <Card
                  key={index}
                  className="text-center hover:shadow-glow transition-all hover:scale-105 animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-6">
                    <stat.icon className="w-10 h-10 text-primary mx-auto mb-3" />
                    <div className="mb-1 text-2xl font-bold text-foreground md:text-3xl">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Our{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Core Values
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card
                key={index}
                className="group hover:shadow-glow transition-all hover:scale-105 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform shadow-card">
                    <value.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">{value.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16 animate-fade-in-up">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Why Choose{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Estate Nest?
                </span>
              </h2>
              <p className="text-xl text-muted-foreground">
                We're more than just insurance advisors—we're your partners in financial security
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-12">
              {whyChooseUs.map((reason, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-4 bg-card rounded-xl shadow-card hover:shadow-elegant transition-all animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{reason}</span>
                </div>
              ))}
            </div>

            <div className="text-center space-y-6 animate-fade-in-up">
              <p className="text-lg text-muted-foreground">
                Ready to experience the Estate Nest difference?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/quote">
                  <Button size="lg" className="bg-gradient-accent hover:shadow-glow px-8 group">
                    Get Free Quote
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/faq">
                  <Button size="lg" variant="outline" className="px-8">
                    View FAQ
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Location & Contact Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Contact & Location</h2>
              <p className="text-muted-foreground">Get in touch with our team</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="text-center">
                <CardContent className="p-6">
                  <MapPin className="w-10 h-10 text-primary mx-auto mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Our Office</h3>
                  <p className="text-muted-foreground text-sm">
                    7739 8 Ave SW<br />
                    Edmonton, Alberta<br />
                    T6X 0A3, Canada
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    By appointment only
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <Phone className="w-10 h-10 text-primary mx-auto mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Phone</h3>
                  <a href="tel:780-860-3191" className="text-primary hover:underline">
                    780-860-3191
                  </a>
                  <p className="text-xs text-muted-foreground mt-2">
                    Monday - Friday: 9 AM - 5 PM MT
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <Mail className="w-10 h-10 text-primary mx-auto mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Email</h3>
                  <a href="mailto:hello@estatenest.ca" className="text-primary hover:underline">
                    hello@estatenest.ca
                  </a>
                  <p className="text-xs text-muted-foreground mt-2">
                    We respond within 24 hours
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Regulatory Information */}
            <div className="mt-12 p-6 bg-card rounded-xl shadow-card">
              <h3 className="font-bold text-foreground mb-4 text-center">Regulatory Information</h3>
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Alberta</h4>
                  <p className="text-muted-foreground">
                    Insurance licensing and market conduct in Alberta are regulated by the Alberta Insurance Council (AIC).
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Ontario</h4>
                  <p className="text-muted-foreground">
                    Insurance activities in Ontario are regulated by the Financial Services Regulatory Authority of Ontario (FSRA).
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Estate Nest Inc. operates under applicable provincial licensing requirements. E&O insurance coverage in effect.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
