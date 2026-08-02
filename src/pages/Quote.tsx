import { useState } from "react";
import { Link } from "react-router-dom";
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
import { Shield, CheckCircle, Award } from "lucide-react";

type AnalyticsWindow = Window & {
  gtag?: (command: string, eventName: string, parameters: Record<string, string>) => void;
};

const Quote = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    province: "",
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
  const [submissionConfirmation, setSubmissionConfirmation] = useState<{ message: string; leadReference?: string } | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (
      !formData.firstName
      || !formData.lastName
      || !formData.email
      || !formData.phone
      || !formData.province
      || !formData.smokingHistory
      || !formData.medicalHistory
      || !formData.insuranceAmount
      || !formData.insuranceType
      || !formData.readyToProceed
    ) {
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
    const cleanPhone = formData.phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
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

    // Submit to API
    setSubmissionConfirmation(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/submit-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmissionConfirmation({
          message: result.message || "Your quote request was securely accepted. We'll contact you within 24 hours.",
          leadReference: result.leadReference,
        });
        // Conversion tracking - fire after successful submission
        // Note: Does NOT send any PII to analytics
        if (typeof window !== 'undefined') {
          // Google Analytics 4
          const gtag = (window as AnalyticsWindow).gtag;
          if (typeof gtag === 'function') {
            gtag('event', 'quote_request_submitted', {
              event_category: 'lead_generation',
              event_label: 'quote_form',
              insurance_type: formData.insuranceType
            });
          }
          // Console log for debugging (remove in production if not needed)
          console.log('[Analytics] Quote request submitted successfully');
        }

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
          province: "",
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
      } else {
        toast({
          title: "Submission Failed",
          description: result.message || "Please try again or contact us directly.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Connection Error",
        description: "Please check your internet connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
          <div className="grid md:grid-cols-4 gap-4 mb-12 animate-fade-in">
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
                <div className="font-semibold text-sm">Families</div>
                <div className="text-xs text-muted-foreground">Protected in AB & ON</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-card rounded-xl shadow-card">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <div className="font-semibold text-sm">$50M+</div>
                <div className="text-xs text-muted-foreground">Coverage Placed</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-card rounded-xl shadow-card">
              <Award className="w-8 h-8 text-primary" />
              <div>
                <div className="font-semibold text-sm">5.0 ★ Google</div>
                <div className="text-xs text-muted-foreground">47 Reviews</div>
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
              {submissionConfirmation && (
                <div role="status" aria-live="polite" data-testid="quote-accepted" className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
                  <p className="font-semibold">Quote Request Submitted!</p>
                  <p className="mt-1 text-sm">{submissionConfirmation.message}</p>
                  {submissionConfirmation.leadReference && <p className="mt-2 text-xs font-medium">Reference: {submissionConfirmation.leadReference}</p>}
                </div>
              )}
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                {/* Personal Information */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
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
                      name="lastName"
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
                      name="email"
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
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="780-123-4567"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="province">Province *</Label>
                  <Select
                    value={formData.province}
                    onValueChange={(value) => setFormData({ ...formData, province: value })}
                  >
                    <SelectTrigger id="province">
                      <SelectValue placeholder="Select your province" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AB">Alberta</SelectItem>
                      <SelectItem value="ON">Ontario</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Online advisory services are currently available in Alberta and Ontario.</p>
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
                      <SelectTrigger id="smokingHistory">
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
                      <SelectTrigger id="medicalHistory">
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
                      <SelectTrigger id="insuranceType">
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
                      <SelectTrigger id="readyToProceed">
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

                  <div className="p-4 bg-muted rounded-lg border border-primary/20">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <strong>Disclaimer:</strong> By clicking "Get My Quote", you explicitly initiate this request of your own free will and confirm you are under no obligation. We protect your details and will share with insurance companies only if you choose to proceed after speaking with our licensed advisor. Estate Nest Inc. is fully licensed in AB & ON and carries professional E&O insurance. By submitting, you agree to our Privacy and Cookie Policies, and the standard limitations on cyber transmission risk outlined in our full Terms & Conditions.
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-accent hover:shadow-glow text-lg"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    'Get My Quote'
                  )}
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
              <Link to="/faq">
                <Button variant="outline" size="lg">
                  View FAQ
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Quote;
