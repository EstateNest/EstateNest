import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import { toast } from "@/hooks/use-toast";
import { Shield, CheckCircle } from "lucide-react";

const Quote = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    smokingHistory: "",
    medicalHistory: "",
    medicalCondition: "",
    medicineName: "",
    dosage: "",
    insuranceAmount: "",
    insuranceType: "",
    readyToProceed: "",
  });
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);

  const insuranceTypes = [
    "Life Insurance",
    "Critical Illness Insurance",
    "Disability Insurance",
    "Mortgage Insurance",
    "Final Expense Insurance",
    "Travel Insurance",
    "Group Benefits",
    "Buy-Sell / Criss-Cross Insurance",
    "Segregated Funds (RRSP)",
    "Segregated Funds (RESP)",
    "Other",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    // Phone validation (basic)
    const phoneRegex = /^\d{10}$/;
    const cleanPhone = formData.phone.replace(/\D/g, "");
    if (!phoneRegex.test(cleanPhone)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number.",
        variant: "destructive",
      });
      return;
    }

    if (!acceptedPrivacy) {
      toast({
        title: "Privacy Policy",
        description: "Please accept the privacy policy to continue.",
        variant: "destructive",
      });
      return;
    }

    if (!captchaVerified) {
      toast({
        title: "Verification Required",
        description: "Please complete the verification.",
        variant: "destructive",
      });
      return;
    }

    if (formData.readyToProceed === "no") {
      navigate("/");
      return;
    }

    // In production, this would send to hello@estatenest.ca
    console.log("Form submitted:", formData);
    
    toast({
      title: "Quote Request Submitted!",
      description: "We'll contact you within 24 hours to discuss your coverage options.",
    });

    // Reset form
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      smokingHistory: "",
      medicalHistory: "",
      medicalCondition: "",
      medicineName: "",
      dosage: "",
      insuranceAmount: "",
      insuranceType: "",
      readyToProceed: "",
    });
    setAcceptedPrivacy(false);
    setCaptchaVerified(false);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle font-[Inter]">
      <Navigation />
      <ChatBot />

      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12 animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Get Your{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Free Quote
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Take the first step towards protecting your family's future
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="grid md:grid-cols-3 gap-4 mb-12 animate-fade-in">
            <div className="flex items-center space-x-3 p-4 bg-card rounded-xl shadow-card">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <div className="font-semibold text-sm">E&O Insured</div>
                <div className="text-xs text-muted-foreground">Fully Licensed</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-card rounded-xl shadow-card">
              <CheckCircle className="w-8 h-8 text-primary" />
              <div>
                <div className="font-semibold text-sm">500+ Families</div>
                <div className="text-xs text-muted-foreground">Protected</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-card rounded-xl shadow-card">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <div className="font-semibold text-sm">$50M+</div>
                <div className="text-xs text-muted-foreground">Coverage Placed</div>
              </div>
            </div>
          </div>

          <Card className="shadow-elegant animate-scale-in">
            <CardHeader>
              <CardTitle className="text-2xl">Quote Request Form</CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you within 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john.doe@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="780-123-4567"
                      required
                    />
                  </div>
                </div>

                {/* Health Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Health Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="smokingHistory">Smoking History *</Label>
                    <Select
                      value={formData.smokingHistory}
                      onValueChange={(value) => setFormData({ ...formData, smokingHistory: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select smoking status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medicalHistory">Medical History *</Label>
                    <Select
                      value={formData.medicalHistory}
                      onValueChange={(value) => setFormData({ ...formData, medicalHistory: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Do you have any medical conditions?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.medicalHistory === "yes" && (
                    <div className="space-y-4 pl-4 border-l-2 border-primary">
                      <div className="space-y-2">
                        <Label htmlFor="medicalCondition">Medical Condition</Label>
                        <Input
                          id="medicalCondition"
                          value={formData.medicalCondition}
                          onChange={(e) => setFormData({ ...formData, medicalCondition: e.target.value })}
                          placeholder="Please describe your condition"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="medicineName">Medicine Name (if any)</Label>
                        <Input
                          id="medicineName"
                          value={formData.medicineName}
                          onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
                          placeholder="Medicine name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dosage">Dosage</Label>
                        <Input
                          id="dosage"
                          value={formData.dosage}
                          onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                          placeholder="e.g., 10mg daily"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Insurance Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Coverage Details</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="insuranceType">Type of Insurance *</Label>
                    <Select
                      value={formData.insuranceType}
                      onValueChange={(value) => setFormData({ ...formData, insuranceType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select insurance type" />
                      </SelectTrigger>
                      <SelectContent>
                        {insuranceTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="insuranceAmount">Coverage Amount Needed *</Label>
                    <Input
                      id="insuranceAmount"
                      value={formData.insuranceAmount}
                      onChange={(e) => setFormData({ ...formData, insuranceAmount: e.target.value })}
                      placeholder="e.g., $500,000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="readyToProceed">Are You Ready to Proceed? *</Label>
                    <Select
                      value={formData.readyToProceed}
                      onValueChange={(value) => setFormData({ ...formData, readyToProceed: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your answer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes, I'm ready</SelectItem>
                        <SelectItem value="no">No, I need more information</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Privacy & Verification */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="privacy"
                      checked={acceptedPrivacy}
                      onCheckedChange={(checked) => setAcceptedPrivacy(checked as boolean)}
                    />
                    <Label htmlFor="privacy" className="text-sm leading-relaxed cursor-pointer">
                      I agree to the privacy policy and consent to Estate Nest Inc. contacting me regarding my insurance needs. I understand my information is protected by E&O insurance coverage.
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="captcha"
                      checked={captchaVerified}
                      onCheckedChange={(checked) => setCaptchaVerified(checked as boolean)}
                    />
                    <Label htmlFor="captcha" className="text-sm cursor-pointer">
                      I am not a robot (Verification)
                    </Label>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>E&O Insurance Disclaimer:</strong> Estate Nest Inc. is fully licensed and insured with Errors & Omissions coverage. Your information is handled with the highest level of professional care and confidentiality.
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-gradient-accent hover:shadow-glow text-lg"
                >
                  Submit Quote Request
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="mt-12 text-center space-y-4 animate-fade-in">
            <p className="text-muted-foreground">Prefer to speak with someone directly?</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="tel:780-860-3191">
                <Button variant="outline" size="lg">
                  Call 780-860-3191
                </Button>
              </a>
              <a href="mailto:hello@estatenest.ca">
                <Button variant="outline" size="lg">
                  Email Us
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

export default Quote;
