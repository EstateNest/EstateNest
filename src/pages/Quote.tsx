import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import { toast } from "@/hooks/use-toast";
import { Shield, CheckCircle } from "lucide-react";
import { CHATBOT_DISCLAIMER } from "@/content/chatbotContent";
import { trackChatbotEvent } from "@/lib/chatbotAnalytics";

type AnalyticsWindow = Window & {
  gtag?: (command: string, eventName: string, parameters: Record<string, string>) => void;
};

const Quote = () => {
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
    website: "",
  });
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [submissionConfirmed, setSubmissionConfirmed] = useState(false);
  const [submissionConfirmation, setSubmissionConfirmation] = useState<{ message: string; leadReference?: string } | null>(null);
  const [chatbotPrefilled, setChatbotPrefilled] = useState(false);
  const updateFormField = (field: keyof typeof formData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

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

  useEffect(() => {
    let active = true;
    const loadSecureHandoff = async () => {
      try {
        const response = await fetch('/api/chatbot?action=handoff', {
          method: 'GET',
          credentials: 'same-origin',
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) return;
        const result = await response.json() as { success?: boolean; prefill?: Partial<typeof formData> };
        if (!active || !result.success || !result.prefill) return;
        setFormData((current) => ({
          ...current,
          firstName: String(result.prefill?.firstName || current.firstName),
          lastName: String(result.prefill?.lastName || current.lastName),
          email: String(result.prefill?.email || current.email),
          phone: String(result.prefill?.phone || current.phone),
          province: String(result.prefill?.province || current.province),
          insuranceType: String(result.prefill?.insuranceType || current.insuranceType),
        }));
        setChatbotPrefilled(true);
      } catch {
        setChatbotPrefilled(false);
      }
    };
    void loadSecureHandoff();
    return () => { active = false; };
  }, []);

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

    if (!submissionConfirmed) {
      toast({
        title: "Confirmation Required",
        description: "Please confirm that you are requesting contact from Estate Nest.",
        variant: "destructive",
      });
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
            message: result.message || "Your quote request was securely accepted. We'll contact you about the next steps.",
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
        }
        if (result.chatbotLinked) {
          trackChatbotEvent("chatbot_quote_completed", { step: "quote_submitted" });
        }

        toast({
          title: "Quote Request Submitted!",
          description: "We'll contact you to discuss the next steps.",
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
          website: "",
        });
        setAcceptedPrivacy(false);
        setSubmissionConfirmed(false);
        setChatbotPrefilled(false);
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
                <div className="text-xs text-muted-foreground">Professional Coverage</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-card rounded-xl shadow-card">
              <CheckCircle className="w-8 h-8 text-primary" />
              <div>
                <div className="font-semibold text-sm">Service Areas</div>
                <div className="text-xs text-muted-foreground">Alberta & Ontario</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-card rounded-xl shadow-card">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <div className="font-semibold text-sm">Needs-Based</div>
                <div className="text-xs text-muted-foreground">Advisor Guidance</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-card rounded-xl shadow-card">
              <CheckCircle className="w-8 h-8 text-primary" />
              <div>
                <div className="font-semibold text-sm">Secure Request</div>
                <div className="text-xs text-muted-foreground">Human Follow-Up</div>
              </div>
            </div>
          </div>

          <Card className="shadow-elegant animate-scale-in">
            <CardHeader>
              <CardTitle className="text-2xl">Quote Request Form</CardTitle>
              <CardDescription>
                Fill out the form below and an Estate Nest advisor will review your request.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chatbotPrefilled && (
                <div role="status" aria-live="polite" data-testid="chatbot-prefill-notice" className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
                  <p className="font-semibold">Secure chatbot handoff received</p>
                  <p className="mt-1 leading-relaxed">Your contact details and broad insurance interest were transferred without placing personal information in the URL. Review and edit every field before submitting.</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{CHATBOT_DISCLAIMER}</p>
                </div>
              )}
              {submissionConfirmation && (
                <div role="status" aria-live="polite" data-testid="quote-accepted" className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
                  <p className="font-semibold">Quote Request Submitted!</p>
                  <p className="mt-1 text-sm">{submissionConfirmation.message}</p>
                  {submissionConfirmation.leadReference && <p className="mt-2 text-xs font-medium">Reference: {submissionConfirmation.leadReference}</p>}
                </div>
              )}
              <form onSubmit={handleSubmit} noValidate data-clarity-mask="true" className="space-y-6">
                {/* Personal Information */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={(event) => updateFormField("firstName", event.target.value)}
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
                      onChange={(event) => updateFormField("lastName", event.target.value)}
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
                      onChange={(event) => updateFormField("email", event.target.value)}
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
                      onChange={(event) => updateFormField("phone", event.target.value)}
                      placeholder="780-123-4567"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="province">Province *</Label>
                  <Select
                    value={formData.province}
                    onValueChange={(value) => updateFormField("province", value)}
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
                      onValueChange={(value) => updateFormField("smokingHistory", value)}
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
                      onValueChange={(value) => updateFormField("medicalHistory", value)}
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
                          onChange={(event) => updateFormField("medicalCondition", event.target.value)}
                          placeholder="Please describe your condition"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="medicineName">Medicine Name (if any)</Label>
                        <Input
                          id="medicineName"
                          value={formData.medicineName}
                          onChange={(event) => updateFormField("medicineName", event.target.value)}
                          placeholder="Medicine name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dosage">Dosage</Label>
                        <Input
                          id="dosage"
                          value={formData.dosage}
                          onChange={(event) => updateFormField("dosage", event.target.value)}
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
                      onValueChange={(value) => updateFormField("insuranceType", value)}
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
                      inputMode="numeric"
                      value={formData.insuranceAmount}
                      onChange={(event) => updateFormField("insuranceAmount", event.target.value)}
                      placeholder="e.g., $500,000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="readyToProceed">Are You Ready to Proceed? *</Label>
                    <Select
                      value={formData.readyToProceed}
                      onValueChange={(value) => updateFormField("readyToProceed", value)}
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
                  <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={formData.website}
                      onChange={(event) => updateFormField("website", event.target.value)}
                    />
                  </div>
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="privacy"
                      checked={acceptedPrivacy}
                      onCheckedChange={(checked) => setAcceptedPrivacy(checked as boolean)}
                    />
                    <Label htmlFor="privacy" className="text-sm leading-relaxed cursor-pointer">
                      I agree to the Privacy Policy and consent to Estate Nest Inc. contacting me about this request. I understand this is a request for contact, not an insurance application or binding quote.
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="submission-confirmation"
                      checked={submissionConfirmed}
                      onCheckedChange={(checked) => setSubmissionConfirmed(checked as boolean)}
                    />
                    <Label htmlFor="submission-confirmation" className="text-sm cursor-pointer">
                      I confirm the information above is accurate and I am requesting contact from Estate Nest.
                    </Label>
                  </div>

                  <div className="p-4 bg-muted rounded-lg border border-primary/20">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <strong>Important:</strong> Submitting this form requests contact from Estate Nest and does not create coverage or guarantee eligibility, pricing, or approval. Those depend on insurer underwriting and policy terms. Information provided here is handled as described in our Privacy Policy and is not legal, tax, medical, or individualized insurance advice.
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
