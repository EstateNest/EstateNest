import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Clock, Facebook, Linkedin, Twitter } from "lucide-react";

const Contact = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle font-[Inter]">
      <Navigation />
      <ChatBot />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-hero text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-float" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl font-bold">Get In Touch</h1>
            <p className="text-xl text-primary-foreground/90">
              We're here to answer your questions and help protect your family's future
            </p>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              <Card className="group hover:shadow-glow transition-all hover:scale-105 animate-fade-in-up">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform shadow-card">
                    <Phone className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">Call Us</h3>
                  <a
                    href="tel:780-860-3191"
                    className="text-primary hover:text-primary-glow transition-colors text-lg font-semibold"
                  >
                    780-860-3191
                  </a>
                  <p className="text-sm text-muted-foreground mt-2">
                    Monday - Friday: 9 AM - 5 PM MT
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-glow transition-all hover:scale-105 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform shadow-card">
                    <Mail className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">Email Us</h3>
                  <a
                    href="mailto:hello@estatenest.ca"
                    className="text-primary hover:text-primary-glow transition-colors text-lg font-semibold break-all"
                  >
                    hello@estatenest.ca
                  </a>
                  <p className="text-sm text-muted-foreground mt-2">
                    We respond within 24 hours
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-glow transition-all hover:scale-105 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform shadow-card">
                    <MapPin className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">Visit Us</h3>
                  <p className="text-muted-foreground">
                    Edmonton, Alberta<br />
                    Canada
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    By appointment only
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Office Hours */}
            <Card className="mb-16 shadow-elegant animate-fade-in-up">
              <CardContent className="p-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                    <Clock className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Office Hours</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-foreground font-medium">Monday - Friday</span>
                      <span className="text-muted-foreground">9:00 AM - 5:00 PM</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-foreground font-medium">Saturday</span>
                      <span className="text-muted-foreground">By Appointment</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-foreground font-medium">Sunday</span>
                      <span className="text-muted-foreground">Closed</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center md:justify-end">
                    <div className="text-center md:text-right">
                      <p className="text-muted-foreground mb-4">
                        Need to speak with us outside business hours?
                      </p>
                      <a href="tel:780-860-3191">
                        <Button className="bg-gradient-accent hover:shadow-glow">
                          Call for Emergency
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Areas */}
            <Card className="mb-16 shadow-elegant animate-fade-in-up">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6 text-foreground">We Serve</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-lg text-foreground mb-3">Alberta</h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Edmonton & surrounding areas</li>
                      <li>• Calgary</li>
                      <li>• Red Deer</li>
                      <li>• All Alberta communities</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg text-foreground mb-3">Ontario</h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Toronto & GTA</li>
                      <li>• Ottawa</li>
                      <li>• Mississauga</li>
                      <li>• All Ontario communities</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-foreground">
                    <strong>Licensed & Insured:</strong> Estate Nest Inc. is fully licensed to operate in Alberta and Ontario with E&O insurance coverage.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Social Media */}
            <div className="text-center animate-fade-in-up">
              <h3 className="text-2xl font-bold mb-6 text-foreground">Connect With Us</h3>
              <div className="flex justify-center space-x-4 mb-8">
                <a
                  href="https://facebook.com/estatenest"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-all hover:scale-110 shadow-card"
                  aria-label="Facebook"
                >
                  <Facebook className="w-6 h-6" />
                </a>
                <a
                  href="https://linkedin.com/company/estatenest"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-all hover:scale-110 shadow-card"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-6 h-6" />
                </a>
                <a
                  href="https://twitter.com/estatenest"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-all hover:scale-110 shadow-card"
                  aria-label="Twitter"
                >
                  <Twitter className="w-6 h-6" />
                </a>
              </div>
              <p className="text-muted-foreground mb-6">
                Follow us for insurance tips, updates, and industry insights
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
