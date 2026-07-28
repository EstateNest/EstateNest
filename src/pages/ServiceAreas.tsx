import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, ArrowRight, Shield, CheckCircle } from "lucide-react";

const ServiceAreas = () => {
  const albertaCities = [
    "Calgary", "Edmonton", "Red Deer", "Lethbridge", "Airdrie", 
    "St. Albert", "Grande Prairie", "Medicine Hat", "Spruce Grove", 
    "Leduc", "Lloydminster", "Fort Saskatchewan", "Chestermere", 
    "Camrose", "Brooks", "Cold Lake", "Lacombe", "Wetaskiwin", 
    "Sylvan Lake", "Sherwood Park", "Strathcona County"
  ];

  const ontarioCities = [
    // Major Cities
    "Toronto", "Ottawa", "Brampton", "Mississauga", "Hamilton",
    "London", "Markham", "Vaughan", "Kitchener", "Windsor",
    // Cities
    "Barrie", "Greater Sudbury", "Guelph", "Cambridge", "Kingston",
    "St. Catharines", "Waterloo", "Thunder Bay", "Brantford", "Pickering",
    "Niagara Falls", "Peterborough", "Sarnia", "Kawartha Lakes", "Belleville",
    "Sault Ste. Marie", "Welland", "North Bay", "Cornwall", "Woodstock",
    "St. Thomas", "Quinte West", "Timmins", "Stratford", "Orillia",
    "Owen Sound", "Clarence-Rockland", "Port Colborne", "Thorold", "Kenora",
    "Pembroke", "Elliot Lake", "Temiskaming Shores", "Dryden", "Fort Frances",
    "Kirkland Lake",
    // Regional Municipalities & Towns (Critical Insurance Markets)
    "Oakville", "Milton", "Whitby", "Ajax", "Clarington", "Richmond Hill"
  ];

  const albertaRegions = [
    { name: "Calgary Area", cities: ["Calgary", "Airdrie", "Chestermere"] },
    { name: "Edmonton Area", cities: ["Edmonton", "St. Albert", "Sherwood Park", "Spruce Grove", "Leduc", "Fort Saskatchewan"] },
    { name: "Central Alberta", cities: ["Red Deer", "Lacombe", "Sylvan Lake", "Wetaskiwin", "Camrose"] },
    { name: "Southern Alberta", cities: ["Lethbridge", "Medicine Hat", "Brooks"] },
    { name: "Northern Alberta", cities: ["Grande Prairie", "Cold Lake", "Lloydminster"] },
  ];

  const ontarioRegions = [
    { name: "Greater Toronto Area (GTA)", cities: ["Toronto", "Brampton", "Mississauga", "Markham", "Vaughan", "Oakville", "Milton", "Whitby", "Ajax", "Clarington", "Richmond Hill"] },
    { name: "Hamilton & Niagara", cities: ["Hamilton", "St. Catharines", "Niagara Falls", "Welland", "Port Colborne", "Thorold", "Cambridge", "Waterloo", "Guelph", " Brantford"] },
    { name: "Southwestern Ontario", cities: ["London", "Windsor", "Sarnia", "Woodstock", "St. Thomas", "Stratford", "Owen Sound"] },
    { name: "Eastern Ontario", cities: ["Ottawa", "Kingston", "Belleville", "Quinte West", "Cornwall", "Pembroke", "Clarence-Rockland"] },
    { name: "Central Ontario", cities: ["Barrie", "Orillia", "Greater Sudbury", "Sault Ste. Marie", "North Bay", "Timmins", "Kirkland Lake", "Temiskaming Shores"] },
    { name: "Northern Ontario", cities: ["Thunder Bay", "Kenora", "Dryden", "Fort Frances", "Elliot Lake"] },
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
          <div className="max-w-4xl mx-auto text-center space-y-6 animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl font-bold">
              Insurance Coverage Across Alberta & Ontario
            </h1>
            <p className="text-xl text-primary-foreground/90">
              Licensed to serve communities from coast to coast. Find trusted life insurance advisors near you.
            </p>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-8 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-medium">E&O Insured</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="font-medium">Licensed in Alberta & Ontario</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              <span className="font-medium">780-860-3191</span>
            </div>
          </div>
        </div>
      </section>

      {/* Alberta Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Alberta
                </span> Insurance Coverage
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                From the Rocky Mountains to theprairies, we're here to protect Alberta families with comprehensive insurance solutions.
              </p>
            </div>

            {/* Alberta by Region */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {albertaRegions.map((region) => (
                <Card key={region.name} className="hover:shadow-glow transition-all">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      {region.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {region.cities.join(", ")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* All Alberta Cities */}
            <div className="bg-card rounded-xl p-6 shadow-card">
              <h3 className="text-xl font-bold text-foreground mb-4">All Alberta Communities We Serve</h3>
              <div className="flex flex-wrap gap-2">
                {albertaCities.map((city) => (
                  <span 
                    key={city} 
                    className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                  >
                    {city}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ontario Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Ontario
                </span> Insurance Coverage
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Serving Ontario's diverse communities from the Greater Toronto Area to Northern Ontario's vibrant towns.
              </p>
            </div>

            {/* Ontario by Region */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {ontarioRegions.map((region) => (
                <Card key={region.name} className="hover:shadow-glow transition-all">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      {region.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {region.cities.join(", ")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* All Ontario Cities */}
            <div className="bg-card rounded-xl p-6 shadow-card">
              <h3 className="text-xl font-bold text-foreground mb-4">All Ontario Communities We Serve</h3>
              <div className="flex flex-wrap gap-2">
                {ontarioCities.map((city) => (
                  <span 
                    key={city} 
                    className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                  >
                    {city}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl animate-float" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to Get Your Free Quote?
            </h2>
            <p className="text-xl text-primary-foreground/90">
              Whether you're in Calgary, Toronto, or anywhere in between, we're here to help you protect what matters most.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/quote">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-glow px-8">
                  Get Your Free Quote
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="tel:780-860-3191">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8">
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

export default ServiceAreas;
