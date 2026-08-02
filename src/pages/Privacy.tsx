import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle font-[Inter]">
      <Navigation />
      
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-5xl font-bold mb-8 animate-fade-in-up">Privacy Policy</h1>
          
          <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground animate-fade-in">
            <p className="text-sm text-muted-foreground">Last updated: July 27, 2026</p>
            
            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">1. Introduction</h2>
              <p>
                Estate Nest Inc. ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you visit our website (www.estatenest.ca), use our automated quote engines, or interact with our services. We operate in strict compliance with the Alberta Personal Information Protection Act (PIPA), the federal Personal Information Protection and Electronic Documents Act (PIPEDA) for Ontario operations, and applicable provincial insurance regulations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">2. Information We Collect</h2>
              <p>We collect sensitive personal, financial, and medical information that you voluntarily provide directly to us, including:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Identity & Contact Data:</strong> Name, email address, phone number, and mailing address.</li>
                <li><strong>Demographic & Government Identifiers:</strong> Date of birth, gender, and Social Insurance Number (SIN). Note: Providing your SIN is completely optional for standard quotes but may be required by underwriters for identity verification and anti-money laundering (AML) compliance during formal applications.</li>
                <li><strong>Underwriting Data:</strong> Health histories, medical records, family medical background, and lifestyle habits (e.g., smoking status) relevant to life insurance underwriting.</li>
                <li><strong>Financial Data:</strong> Income, employment details, net worth, assets, and banking details necessary for financial planning and processing premium payments.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">3. How We Use Your Information</h2>
              <p>We use the collected information strictly to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Process, analyze, and generate life, critical illness, disability, mortgage, and travel insurance quotes.</li>
                <li>Submit formal underwriting applications to third-party insurance carriers on your behalf.</li>
                <li>Communicate with you regarding quotes, policy maintenance, updates, and regulatory changes.</li>
                <li>Comply with our legal obligations, anti-money laundering (AML) mandates, and provincial regulatory requirements.</li>
                <li>Detect, prevent, and mitigate security threats, cyberattacks, or fraudulent application attempts.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">4. Consent & Voluntary Submission</h2>
              <p>
                By submitting your information via our web forms or automated quote tools, you explicitly consent to the collection, use, and disclosure of your personal data as outlined in this policy. You retain the right to withdraw your consent at any time; however, doing so will immediately terminate our ability to provide insurance brokerage services or maintain active quote processing.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">5. Information Sharing & Third-Party Disclosure</h2>
              <p>To fulfill your service requests, we share your data with:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Licensed Insurance Underwriters:</strong> Third-party carrier companies to obtain accurate risk assessments and issue policies.</li>
                <li><strong>Managing General Agencies (MGAs):</strong> Intermediary compliance networks that manage processing pipelines between our brokers and insurers.</li>
                <li><strong>Legal & Regulatory Authorities:</strong> The Alberta Insurance Council (AIC), the Financial Services Regulatory Authority of Ontario (FSRA), or law enforcement bodies when mandated by Canadian law.</li>
              </ul>
              <p className="mt-4">
                <strong>We do not sell, rent, or trade your personal, medical, or financial information to third parties under any circumstances.</strong>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">Chatbot Enquiries, Consent & Retention</h2>
              <p>
                If you choose to use the Estate Nest Insurance Assistant, we collect your consent decision, name, phone number, email address, broad insurance interests, source page, limited campaign attribution, and session timestamps to create or update a prospect record and arrange advisor follow-up. Enquiry consent and optional marketing consent are recorded separately; marketing consent is not required to use the assistant.
              </p>
              <p className="mt-4">
                The first release uses a versioned, deterministic FAQ library and does not store a raw chat transcript. Do not enter medical, banking, payment, password, government-identification, or other sensitive information. Chatbot session metadata is retained for a configurable period that currently defaults to 180 days, subject to legitimate legal, regulatory, security, and record-management requirements. Contact hello@estatenest.ca to request access, correction, or deletion where applicable.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">6. Cybersecurity Safeguards & Limitation of Liability</h2>
              <p>
                We implement robust administrative, physical, and technical security controls (including active SSL encryption, network firewalls, and isolated database architectures) to secure your information. However, no data transmission over the internet or electronic storage infrastructure is 100% secure.
              </p>
              <p className="mt-4">
                While Estate Nest Inc. maintains comprehensive Errors & Omissions (E&O) professional liability insurance as required by provincial regulators, this coverage is for professional advice and licensing compliance, and does not serve as a data breach indemnity fund. To the maximum extent permitted by Canadian law, Estate Nest Inc. shall not be held liable for direct, indirect, or consequential damages resulting from unauthorized third-party data interception, malicious cyber warfare, or systemic network breaches that occur beyond our direct technological control.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">7. Your Privacy Rights</h2>
              <p>Depending on your province of residence (Alberta or Ontario), you have specific statutory rights:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>The right to request access to and a copy of the personal information we hold about you.</li>
                <li>The right to request correction of inaccurate, incomplete, or outdated information.</li>
                <li>The right to request the deletion of your personal data, subject to mandatory statutory retention periods imposed on insurance brokerages by the AIC and FSRA.</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, submit a formal written request to our Privacy Officer at hello@estatenest.ca.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">8. Cookies & Digital Tracking</h2>
              <p>
                We utilize essential, analytical, and functional cookies to monitor website performance, remember user preferences, and streamline our automated quoting pipelines. You can configure your browser to reject cookies, though doing so may break certain automated form features on our site.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">9. Contact Us</h2>
              <p>For inquiries regarding this Privacy Policy or our general data security protocols:</p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="font-semibold text-foreground">Estate Nest Inc.</p>
                <p>Email: hello@estatenest.ca</p>
                <p>Phone: 780-860-3191</p>
                <p>Website: www.estatenest.ca</p>
                <p>Corporate Address: Edmonton, Alberta, Canada</p>
              </div>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Privacy;
