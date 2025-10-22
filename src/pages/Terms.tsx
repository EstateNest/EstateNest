import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle font-[Inter]">
      <Navigation />
      
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-5xl font-bold mb-8 animate-fade-in-up">Terms & Conditions</h1>
          
          <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground animate-fade-in">
            <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
            
            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using the Estate Nest Inc. website (www.estatenest.ca) and services, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our website or services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">2. Services</h2>
              <p>
                Estate Nest Inc. provides insurance brokerage services, including but not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Life insurance</li>
                <li>Critical illness insurance</li>
                <li>Disability insurance</li>
                <li>Mortgage insurance</li>
                <li>Travel insurance</li>
                <li>Segregated funds and investment products</li>
              </ul>
              <p className="mt-4">
                We are licensed to operate in Alberta and Ontario, Canada.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">3. Professional Services</h2>
              <p>
                Estate Nest Inc. is a licensed insurance brokerage with E&O (Errors and Omissions) insurance coverage. We provide professional advice and recommendations based on your individual circumstances. However, final insurance decisions and policy issuance are subject to underwriter approval.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">4. Quotes and Applications</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>All quotes provided are estimates and subject to underwriter approval</li>
                <li>Quotes are valid for a limited time and may change based on market conditions</li>
                <li>Complete and accurate information must be provided for all applications</li>
                <li>Misrepresentation or withholding of information may result in policy denial or cancellation</li>
                <li>We reserve the right to decline to provide services at our discretion</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">5. Client Responsibilities</h2>
              <p>As a client, you agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate and complete information</li>
                <li>Disclose all material facts relevant to insurance applications</li>
                <li>Review all policy documents carefully</li>
                <li>Pay premiums on time</li>
                <li>Notify us promptly of any changes to your circumstances</li>
                <li>Comply with all policy terms and conditions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">6. Website Use</h2>
              <p>When using our website, you agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Not use the website for any unlawful purpose</li>
                <li>Not attempt to gain unauthorized access to our systems</li>
                <li>Not transmit viruses, malware, or other harmful code</li>
                <li>Not collect or harvest personal information of other users</li>
                <li>Respect intellectual property rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">7. Intellectual Property</h2>
              <p>
                All content on this website, including text, graphics, logos, images, and software, is the property of Estate Nest Inc. or its content suppliers and is protected by copyright and intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">8. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, Estate Nest Inc. shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our services or website. Our E&O insurance provides coverage as outlined in our policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">9. Third-Party Links</h2>
              <p>
                Our website may contain links to third-party websites. We are not responsible for the content, privacy practices, or terms of service of these external sites.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">10. Privacy</h2>
              <p>
                Your use of our services is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">11. Termination</h2>
              <p>
                We reserve the right to terminate or suspend access to our services immediately, without prior notice, for any reason, including breach of these Terms and Conditions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">12. Governing Law</h2>
              <p>
                These Terms and Conditions are governed by the laws of the Province of Alberta, Canada. Any disputes shall be resolved in the courts of Alberta.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">13. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms and Conditions at any time. Changes will be effective immediately upon posting to the website. Your continued use of our services constitutes acceptance of modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">14. Contact Information</h2>
              <p>
                For questions about these Terms and Conditions, please contact us:
              </p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="font-semibold text-foreground">Estate Nest Inc.</p>
                <p>Email: hello@estatenest.ca</p>
                <p>Phone: 780-860-3191</p>
                <p>Website: www.estatenest.ca</p>
              </div>
            </section>

            <section className="mt-8 p-6 bg-primary/10 rounded-lg">
              <p className="text-foreground">
                <strong>Licensing & Insurance:</strong> Estate Nest Inc. is licensed to provide insurance services in Alberta and Ontario. We maintain Errors & Omissions (E&O) insurance coverage for your protection. License information is available upon request.
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Terms;

