// Term Life Insurance Funnel Page
import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, ArrowRight, Shield, Check, Phone, Mail } from 'lucide-react';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  province: string;
  age: string;
  coverageAmount: string;
  termLength: string;
  message: string;
  consent: boolean;
}

interface FunnelProps {
  funnelType: string;
  funnelTitle: string;
  funnelDescription: string;
  funnelIcon: React.ReactNode;
}

const TermLifeFunnel = ({ funnelType, funnelTitle, funnelDescription, funnelIcon }: FunnelProps) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    province: '',
    age: '',
    coverageAmount: '',
    termLength: '',
    message: '',
    consent: false,
  });

  const provinces = [
    { value: 'AB', label: 'Alberta' },
    { value: 'ON', label: 'Ontario' },
  ];

  const coverageOptions = [
    { value: '100000', label: '$100,000' },
    { value: '250000', label: '$250,000' },
    { value: '500000', label: '$500,000' },
    { value: '750000', label: '$750,000' },
    { value: '1000000', label: '$1,000,000' },
    { value: '1500000', label: '$1,500,000' },
    { value: '2000000', label: '$2,000,000+' },
  ];

  const termOptions = [
    { value: '10', label: '10 Years' },
    { value: '15', label: '15 Years' },
    { value: '20', label: '20 Years' },
    { value: '25', label: '25 Years' },
    { value: '30', label: '30 Years' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleConsentChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, consent: checked }));
  };

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        return !!(formData.firstName && formData.lastName && formData.email && formData.province);
      case 2:
        return !!(formData.age && formData.coverageAmount && formData.termLength);
      case 3:
        return formData.consent;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 3));
    } else {
      toast({
        title: 'Please fill in all required fields',
        description: 'All fields marked with * are required',
        variant: 'destructive',
      });
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) {
      toast({
        title: 'Please accept the consent',
        description: 'You must agree to the terms to continue',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get UTM parameters from URL
      const urlParams = new URLSearchParams(window.location.search);
      
      const response = await fetch('/api/webhooks/inbound-lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          province: formData.province,
          insuranceInterest: 'TERM_LIFE',
          source: urlParams.get('source') || 'ORGANIC_SEARCH',
          campaign: urlParams.get('campaign'),
          utmSource: urlParams.get('utm_source'),
          utmMedium: urlParams.get('utm_medium'),
          utmCampaign: urlParams.get('utm_campaign'),
          landingPage: window.location.href,
          notes: `Age: ${formData.age}\nCoverage Amount: ${formData.coverageAmount}\nTerm Length: ${formData.termLength}\n\n${formData.message}`,
          marketingConsent: formData.consent,
          idempotencyId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit');
      }

      setSubmitted(true);
      
      toast({
        title: 'Thank you!',
        description: 'One of our advisors will contact you within 24 hours.',
      });
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: 'Error',
        description: 'There was a problem submitting your request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <Card className="max-w-lg w-full mx-4 text-center">
          <CardHeader>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-3xl">Thank You!</CardTitle>
            <CardDescription className="text-lg">
              Your term life insurance quote request has been received.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              One of our licensed advisors will review your information and contact you within 24 hours to discuss your term life insurance options.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="tel:780-860-3191">
                <Button variant="outline" className="w-full sm:w-auto">
                  <Phone className="mr-2 w-4 h-4" />
                  Call 780-860-3191
                </Button>
              </a>
              <a href="mailto:hello@estatenest.ca">
                <Button variant="outline" className="w-full sm:w-auto">
                  <Mail className="mr-2 w-4 h-4" />
                  Email Us
                </Button>
              </a>
            </div>
            <Button variant="link" onClick={() => window.location.href = '/'}>
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="py-12 md:py-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
            {funnelIcon}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{funnelTitle}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {funnelDescription}
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold
                    ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                  `}>
                    {step > s ? <Check className="w-5 h-5" /> : s}
                  </div>
                  {s < 3 && (
                    <div className={`w-16 md:w-24 h-1 mx-2 ${step > s ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </div>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>
                  {step === 1 && 'Your Information'}
                  {step === 2 && 'Coverage Details'}
                  {step === 3 && 'Review & Submit'}
                </CardTitle>
                <CardDescription>
                  {step === 1 && 'Tell us about yourself'}
                  {step === 2 && 'Help us understand your coverage needs'}
                  {step === 3 && 'Review your information and submit'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1: Contact Info */}
                {step === 1 && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          placeholder="John"
                          value={formData.firstName}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          placeholder="Smith"
                          value={formData.lastName}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john.smith@email.com"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="780-555-1234"
                          value={formData.phone}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="province">Province *</Label>
                        <Select
                          value={formData.province}
                          onValueChange={(value) => handleSelectChange('province', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select province" />
                          </SelectTrigger>
                          <SelectContent>
                            {provinces.map((prov) => (
                              <SelectItem key={prov.value} value={prov.value}>
                                {prov.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}

                {/* Step 2: Coverage Details */}
                {step === 2 && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="age">Your Age *</Label>
                        <Input
                          id="age"
                          name="age"
                          type="number"
                          min="18"
                          max="75"
                          placeholder="35"
                          value={formData.age}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="coverageAmount">Desired Coverage *</Label>
                        <Select
                          value={formData.coverageAmount}
                          onValueChange={(value) => handleSelectChange('coverageAmount', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select coverage" />
                          </SelectTrigger>
                          <SelectContent>
                            {coverageOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="termLength">Term Length *</Label>
                      <Select
                        value={formData.termLength}
                        onValueChange={(value) => handleSelectChange('termLength', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select term length" />
                        </SelectTrigger>
                        <SelectContent>
                          {termOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Additional Information (Optional)</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Tell us about your situation or any questions you have..."
                        value={formData.message}
                        onChange={handleChange}
                        rows={4}
                      />
                    </div>
                  </>
                )}

                {/* Step 3: Review & Consent */}
                {step === 3 && (
                  <>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <h4 className="font-semibold">Review Your Information</h4>
                      <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
                      <p><strong>Email:</strong> {formData.email}</p>
                      <p><strong>Phone:</strong> {formData.phone || 'Not provided'}</p>
                      <p><strong>Province:</strong> {formData.province}</p>
                      <p><strong>Age:</strong> {formData.age}</p>
                      <p><strong>Coverage:</strong> ${parseInt(formData.coverageAmount).toLocaleString()}</p>
                      <p><strong>Term:</strong> {formData.termLength} Years</p>
                      {formData.message && <p><strong>Notes:</strong> {formData.message}</p>}
                    </div>
                    
                    <div className="flex items-start space-x-3 p-4 border rounded-lg">
                      <Checkbox
                        id="consent"
                        checked={formData.consent}
                        onCheckedChange={handleConsentChange}
                      />
                      <div className="space-y-1">
                        <Label htmlFor="consent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          I consent to being contacted by Estate Nest Inc. regarding term life insurance options.
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Your information is secure and will only be used to provide you with insurance quotes. We do not share your information with third parties.
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4">
                  {step > 1 && (
                    <Button variant="outline" onClick={handleBack}>
                      <ArrowLeft className="mr-2 w-4 h-4" />
                      Back
                    </Button>
                  )}
                  <div className="ml-auto">
                    {step < 3 ? (
                      <Button onClick={handleNext}>
                        Next
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    ) : (
                      <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Get My Quote'}
                        {!isSubmitting && <ArrowRight className="ml-2 w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trust Indicators */}
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span>E&O Insured</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span>Licensed in AB & ON</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

// Term Life Funnel Page Component
const TermLifeFunnelPage = () => {
  return (
    <TermLifeFunnel
      funnelType="TERM_LIFE"
      funnelTitle="Term Life Insurance Quote"
      funnelDescription="Get a free, no-obligation term life insurance quote tailored to your needs. Licensed advisors in Alberta and Ontario."
      funnelIcon={<Shield className="w-8 h-8 text-primary" />}
    />
  );
};

export default TermLifeFunnelPage;
