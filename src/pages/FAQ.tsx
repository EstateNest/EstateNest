import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Shield, Phone, Mail } from "lucide-react";

const FAQ = () => {
  const generalFAQs = [
    {
      question: "How is life insurance advice regulated in Alberta and Ontario?",
      answer: `Insurance licensing and market conduct are regulated at the provincial level in Canada.

In Alberta, insurance brokers and agents are regulated by the Alberta Insurance Council (AIC), which administers licensing, continuing education, and consumer protection under provincial legislation.

In Ontario, the Financial Services Regulatory Authority of Ontario (FSRA) oversees insurance intermediaries and protects consumers under Ontario's Insurance Act and other applicable legislation.

Estate Nest Inc. operates under applicable provincial licensing requirements. We help clients understand their insurance options and compare available coverage from different insurers.`
    },
    {
      question: "Can I get life insurance if I have a pre-existing medical condition?",
      answer: `Having a pre-existing medical condition does not automatically prevent you from obtaining life insurance. Eligibility, coverage, premiums, and underwriting requirements depend on factors such as the condition itself, its severity and stability, treatment history, your age, and each insurer's specific underwriting criteria.

Some insurers offer simplified underwriting or no-medical-exam options that may be suitable depending on your situation. Where appropriate, Estate Nest can help clients with medical histories compare available insurance options to find coverage that fits their needs.`
    },
    {
      question: "What is the difference between personal term life insurance and mortgage insurance offered through a lender?",
      answer: `These products work differently in several important ways:

Personal Term Life Insurance:
• You select the coverage amount based on your needs
• You designate beneficiaries who receive the death benefit
• The benefit is paid according to policy terms, regardless of how it's used
• Coverage amount does not automatically decrease with your mortgage balance
• Generally portable if you change lenders

Mortgage Creditor Insurance (through your lender):
• Coverage is typically tied to your outstanding mortgage balance
• The lender is often the beneficiary
• May have different terms, exclusions, and underwriting compared to personal policies
• May not be portable if you refinance or switch lenders

We encourage consumers to compare beneficiary structure, coverage amounts, portability, underwriting requirements, premiums, exclusions, and policy terms when evaluating options.`
    },
    {
      question: "How much life insurance do I need?",
      answer: `The amount of life insurance you need depends on your individual circumstances, including:

• Outstanding debts (mortgage, loans, credit cards)
• Income replacement needs for your family
• Children's education expenses
• Final expenses (funeral, estate settlement)
• Existing savings or coverage
• Long-term financial goals

A common starting point is coverage of 10-12 times your annual income, but your specific needs may be higher or lower. Estate Nest advisors can help you calculate a more personalized estimate based on your situation.`
    },
    {
      question: "What term length should I choose for term life insurance?",
      answer: `Common term lengths are 10, 15, 20, and 30 years. Consider:

• 10-year term: Lower premiums, suitable if you need coverage for a specific short-term obligation or expect your needs to change
• 15 or 20-year term: Often chosen to match mortgage amortization periods or to cover the years until children are financially independent
• 30-year term: May be appropriate for younger applicants with long-term financial obligations

Consider how long your financial obligations will last and whether you want coverage to align with major milestones like paying off your mortgage or retirement.`
    },
    {
      question: "Can I get life insurance without a medical exam?",
      answer: `Yes, many insurers offer no-medical-exam or simplified underwriting options. These may be suitable if you:

• Prefer to avoid medical examinations
• Have health conditions that might complicate traditional underwriting
• Need coverage quickly

Available options vary by insurer and may have different premium rates or coverage limits compared to fully underwritten policies. Estate Nest can help you explore which options may be available based on your circumstances.`
    },
    {
      question: "What affects life insurance premiums?",
      answer: `Insurance premiums are based on your individual risk profile. Key factors include:

• Age and gender
• Health and medical history
• Lifestyle factors (including tobacco use)
• Coverage amount and policy type
• Term length
• Occupation and hobbies

Each insurer weighs these factors differently, which is why premium quotes can vary. We help clients compare options across multiple insurers to find competitive rates.`
    },
    {
      question: "Can term life insurance be renewed or converted?",
      answer: `Many term life insurance policies offer:

• Renewal options at the end of the term, potentially at higher premiums based on your age
• Conversion privileges that allow you to convert term coverage to permanent coverage without additional medical underwriting

The specific terms vary by policy and insurer. If maintaining permanent coverage for the long term is important to you, ask about conversion options when comparing policies.`
    },
  ];

  const lifeInsuranceFAQs = [
    {
      question: "What is the difference between term life and whole life insurance?",
      answer: `Term Life Insurance provides coverage for a specified period (such as 10, 20, or 30 years). If the insured passes away during the term, the death benefit is paid. Term policies typically have lower premiums but no cash value accumulation.

Whole Life Insurance provides permanent coverage for the insured's lifetime, as long as premiums are paid. These policies include a cash value component that grows over time and can potentially be accessed through loans or withdrawals. Whole life premiums are generally higher than term premiums.

Each type serves different purposes. Term insurance may be appropriate for covering temporary obligations like a mortgage, while whole life may be considered for long-term estate planning or permanent coverage needs.`
    },
    {
      question: "How does cash value work in whole life insurance?",
      answer: `Whole life insurance policies build cash value over time. Key points:

• A portion of your premium payments goes toward building cash value
• Cash value grows on a tax-deferred basis
• You may be able to borrow against or withdraw from the cash value (reducing the death benefit if unpaid)
• Cash value can provide flexibility for future financial needs

The specific growth rate and options depend on the policy. Your Estate Nest advisor can explain how cash value works in the context of your overall financial plan.`
    },
  ];

  const mortgageFAQs = [
    {
      question: "Do I need mortgage life insurance?",
      answer: `Mortgage life insurance (or mortgage protection insurance) can help ensure your mortgage is paid off if you pass away. Whether you need it depends on:

• Your existing life insurance coverage
• Your savings and other assets
• Your family situation and financial obligations
• Whether you have co-borrowers

Some homeowners prefer personally owned term life insurance because it offers more flexibility in how the benefit is used and who receives it. Your Estate Nest advisor can help you evaluate whether additional mortgage protection makes sense for your situation.`
    },
    {
      question: "What happens to life insurance when my mortgage is paid off?",
      answer: `If you have a standalone mortgage protection policy, you may choose to cancel it when your mortgage is paid off since the original purpose has been served.

If you have a term life insurance policy that was partially used for mortgage protection, the coverage continues and the benefit can be used for other purposes—children's education, income replacement, estate taxes, or other financial goals.

Reviewing your coverage as major financial milestones occur (paying off a mortgage, children finishing school, approaching retirement) helps ensure your protection remains appropriate.`
    },
  ];

  const criticalIllnessFAQs = [
    {
      question: "What does critical illness insurance generally cover?",
      answer: `Critical illness insurance provides a lump-sum benefit if you are diagnosed with a covered condition. Common covered conditions may include:

• Heart attack, stroke, coronary artery disease
• Major cancer diagnoses
• Kidney failure
• Major organ transplant
• Paralysis
• Severe burns

Coverage varies by insurer and policy. The benefit can be used however you need—medical bills, mortgage payments, rehabilitation, or daily living expenses. Estate Nest can explain specific coverage options and help you compare policies.`
    },
    {
      question: "How does a critical illness benefit work?",
      answer: `If you are diagnosed with a covered condition and meet the policy's definition (which varies by insurer), you submit a claim and receive the lump-sum benefit.

Unlike health insurance, which covers treatment costs, critical illness insurance gives you flexibility in how you use the money. You could cover medical treatments not insured by provincial health plans, replace income during recovery, pay household expenses, or anything else you need.

Survival periods (waiting time after diagnosis before benefits are paid) and specific condition definitions vary by policy.`
    },
  ];

  const businessFAQs = [
    {
      question: "What is key person insurance?",
      answer: `Key person insurance provides coverage on the life of a key employee or owner of a business. If that person passes away, the benefit helps the business:

• Cover costs of finding and recruiting a replacement
• Pay debts or obligations tied to that person
• Maintain operations during transition
• Protect shareholder interests

This type of coverage can be particularly relevant for partnerships, closely held corporations, and businesses where one or a few individuals are essential to operations.`
    },
    {
      question: "How can life insurance support a buy-sell arrangement?",
      answer: `Buy-sell (or buyout) insurance helps ensure business continuity if an owner passes away. A common structure:

• Each business owner holds a policy on the lives of the other co-owners
• If an owner dies, the insurance proceeds help fund the purchase of their share from their estate
• This provides liquidity to complete the transaction without forcing a sale to outside parties

Properly structured buy-sell arrangements can help ensure smooth business transitions and protect the interests of all parties. Your Estate Nest advisor can coordinate with legal and financial advisors to help implement appropriate arrangements.`
    },
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
            <h1 className="text-5xl md:text-6xl font-bold">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-primary-foreground/90">
              Clear answers to common questions about life insurance, mortgage protection, and financial planning in Canada
            </p>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-8 bg-gradient-to-r from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/quote">
              <Button className="bg-gradient-accent hover:shadow-glow text-white font-semibold px-6 py-3">
                Get a Free Quote
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <a href="tel:7808603191">
              <Button variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3">
                <Phone className="mr-2 w-4 h-4" />
                Call 780-860-3191
              </Button>
            </a>
            <a href="mailto:hello@estatenest.ca?subject=Insurance Inquiry from estatenest.ca">
              <Button variant="default" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold px-6 py-3">
                <Mail className="mr-2 w-4 h-4" />
                Email Us
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* General Insurance FAQs */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                General Insurance Questions
              </h2>
              <p className="text-muted-foreground">
                Understanding how life insurance works in Canada
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-4">
              {generalFAQs.map((faq, index) => (
                <AccordionItem 
                  key={`general-${index}`} 
                  value={`general-${index}`}
                  className="bg-card rounded-xl shadow-card px-6"
                >
                  <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary py-6">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-6 leading-relaxed whitespace-pre-line">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Life Insurance FAQs */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                Life Insurance
              </h2>
              <p className="text-muted-foreground">
                Term life, whole life, and coverage decisions
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-4">
              {lifeInsuranceFAQs.map((faq, index) => (
                <AccordionItem 
                  key={`life-${index}`} 
                  value={`life-${index}`}
                  className="bg-card rounded-xl shadow-card px-6"
                >
                  <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary py-6">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-6 leading-relaxed whitespace-pre-line">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-8 text-center">
              <Link to="/services">
                <Button variant="outline" className="bg-background">
                  View All Our Insurance Services
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mortgage Protection FAQs */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                Mortgage Protection
              </h2>
              <p className="text-muted-foreground">
                Protecting your home and family
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-4">
              {mortgageFAQs.map((faq, index) => (
                <AccordionItem 
                  key={`mortgage-${index}`} 
                  value={`mortgage-${index}`}
                  className="bg-card rounded-xl shadow-card px-6"
                >
                  <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary py-6">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-6 leading-relaxed whitespace-pre-line">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Critical Illness FAQs */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                Critical Illness Insurance
              </h2>
              <p className="text-muted-foreground">
                Financial protection during medical challenges
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-4">
              {criticalIllnessFAQs.map((faq, index) => (
                <AccordionItem 
                  key={`critical-${index}`} 
                  value={`critical-${index}`}
                  className="bg-card rounded-xl shadow-card px-6"
                >
                  <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary py-6">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-6 leading-relaxed whitespace-pre-line">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Business Insurance FAQs */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                Business Insurance
              </h2>
              <p className="text-muted-foreground">
                Protecting your business and key people
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-4">
              {businessFAQs.map((faq, index) => (
                <AccordionItem 
                  key={`business-${index}`} 
                  value={`business-${index}`}
                  className="bg-card rounded-xl shadow-card px-6"
                >
                  <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary py-6">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-6 leading-relaxed whitespace-pre-line">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-float" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold">
              Still Have Questions?
            </h2>
            <p className="text-xl text-primary-foreground/90">
              Our experienced advisors are here to help you find the right coverage for your unique situation.
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
                  <Phone className="mr-2 w-5 h-5" />
                  780-860-3191
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-muted/50">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Important Disclaimer:</strong> The information on this page is provided for general educational purposes only and does not constitute professional advice. Insurance products, terms, and availability vary by individual circumstances, insurer, and provincial regulations. For personalized guidance, please consult with a qualified insurance advisor. Estate Nest Inc. is licensed to serve clients in Alberta and Ontario.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQ;
