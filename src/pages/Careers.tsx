import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import {
  Briefcase,
  Users,
  TrendingUp,
  Heart,
  Award,
  GraduationCap,
  DollarSign,
  Clock,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const Careers = () => {
  const benefits = [
    {
      icon: DollarSign,
      title: "Competitive Compensation",
      description: "Base salary plus uncapped commission structure and performance bonuses",
    },
    {
      icon: TrendingUp,
      title: "Career Growth",
      description: "Clear advancement paths with ongoing training and development opportunities",
    },
    {
      icon: GraduationCap,
      title: "Comprehensive Training",
      description: "Industry-leading training program and support for licensing",
    },
    {
      icon: Clock,
      title: "Work-Life Balance",
      description: "Flexible schedule with remote work options",
    },
    {
      icon: Heart,
      title: "Health Benefits",
      description: "Comprehensive health, dental, and vision coverage",
    },
    {
      icon: Award,
      title: "Recognition Program",
      description: "Regular recognition and rewards for outstanding performance",
    },
  ];

  const positions = [
    {
      title: "Licensed Insurance Advisor",
      type: "Full-Time",
      location: "Edmonton, AB / Remote",
      description:
        "Join our team as a licensed insurance advisor. Help families secure their financial future with comprehensive insurance solutions.",
      requirements: [
        "Valid insurance license (Life, A&S) in Alberta or Ontario",
        "2+ years of insurance sales experience preferred",
        "Strong communication and interpersonal skills",
        "Self-motivated with excellent organizational abilities",
        "Commitment to providing exceptional client service",
      ],
    },
    {
      title: "Junior Insurance Advisor",
      type: "Full-Time",
      location: "Edmonton, AB",
      description:
        "Perfect for those looking to start their career in insurance. We provide comprehensive training and mentorship.",
      requirements: [
        "High school diploma or equivalent required",
        "Bachelor's degree in Business, Finance, or related field preferred",
        "Strong desire to help people and build relationships",
        "Excellent communication skills",
        "Willingness to obtain insurance licensing (we'll support you)",
      ],
    },
    {
      title: "Client Service Representative",
      type: "Full-Time",
      location: "Edmonton, AB / Hybrid",
      description:
        "Support our advisors and clients with policy administration, renewals, and customer service excellence.",
      requirements: [
        "2+ years of customer service experience",
        "Experience in insurance or financial services preferred",
        "Strong attention to detail and organizational skills",
        "Proficiency in Microsoft Office and CRM systems",
        "Excellent written and verbal communication skills",
      ],
    },
  ];

  const culture = [
    "Collaborative team environment focused on mutual success",
    "Client-first mindset in everything we do",
    "Continuous learning and professional development",
    "Work-life balance and flexibility",
    "Transparent communication and open-door policy",
    "Community involvement and giving back",
    "Innovation and embracing new technologies",
    "Recognition and celebration of achievements",
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle font-[Inter]">
      <Navigation />
      <ChatBot />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-hero text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl animate-float" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl font-bold">Join Our Team</h1>
            <p className="text-xl text-primary-foreground/90">
              Build a rewarding career helping families protect what matters most
            </p>
            <Button
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-glow"
            >
              View Open Positions
            </Button>
          </div>
        </div>
      </section>

      {/* Why Estate Nest */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why Work{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                With Us?
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join a company that invests in your success and values your contribution
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card
                key={index}
                className="group hover:shadow-glow transition-all hover:scale-105 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-card">
                    <benefit.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Open{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Positions
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Explore exciting opportunities to grow your career with Estate Nest
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {positions.map((position, index) => (
              <Card
                key={index}
                className="shadow-elegant hover:shadow-glow transition-all animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold mb-2 text-foreground">{position.title}</h3>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Briefcase className="w-4 h-4 mr-1" />
                          {position.type}
                        </span>
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {position.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-6 leading-relaxed">{position.description}</p>

                  <div className="mb-6">
                    <h4 className="font-semibold text-foreground mb-3">Requirements:</h4>
                    <ul className="space-y-2">
                      {position.requirements.map((req, idx) => (
                        <li key={idx} className="flex items-start space-x-3 text-sm">
                          <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <a href="mailto:hello@estatenest.ca?subject=Application for ${position.title}">
                    <Button className="bg-gradient-accent hover:shadow-glow group">
                      Apply Now
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Our Culture */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16 animate-fade-in-up">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Our{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Culture
                </span>
              </h2>
              <p className="text-xl text-muted-foreground">
                A workplace where you can thrive and make a difference
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-12">
              {culture.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-4 bg-card rounded-xl shadow-card hover:shadow-elegant transition-all animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{item}</span>
                </div>
              ))}
            </div>

            <div className="text-center space-y-6 animate-fade-in-up">
              <p className="text-lg text-muted-foreground">
                Ready to start your career with Estate Nest?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="mailto:hello@estatenest.ca?subject=Career Inquiry">
                  <Button size="lg" className="bg-gradient-accent hover:shadow-glow px-8">
                    Send Your Resume
                  </Button>
                </a>
                <Link to="/contact">
                  <Button size="lg" variant="outline" className="px-8">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Careers;
