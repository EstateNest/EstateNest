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
            <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
            
            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">1. Introduction</h2>
              <p>
                Estate Nest Inc. ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website www.estatenest.ca or use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">2. Information We Collect</h2>
              <p>We collect information that you provide directly to us, including:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Name, email address, phone number, and mailing address</li>
                <li>Date of birth and social insurance number (for insurance applications)</li>
                <li>Health and medical information relevant to insurance underwriting</li>
                <li>Financial information necessary for insurance products</li>
                <li>Information you provide when contacting us or requesting a quote</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">3. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process insurance applications and claims</li>
                <li>Communicate with you about our services</li>
                <li>Send you quotes, policy information, and updates</li>
                <li>Comply with legal obligations and regulatory requirements</li>
                <li>Detect, prevent, and address fraud or security issues</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">4. Information Sharing</h2>
              <p>We may share your information with:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Insurance companies and underwriters for policy applications</li>
                <li>Service providers who assist in our business operations</li>
                <li>Legal and regulatory authorities when required by law</li>
                <li>Professional advisors including lawyers and accountants</li>
              </ul>
              <p className="mt-4">
                We do not sell your personal information to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">5. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the internet or electronic storage is 100% secure. We maintain E&O (Errors and Omissions) insurance coverage as an additional layer of protection.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">6. Your Rights</h2>
              <p>Under applicable privacy laws, you have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your information (subject to legal requirements)</li>
                <li>Withdraw consent for certain uses of your information</li>
                <li>Lodge a complaint with a privacy regulator</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">7. Cookies and Tracking</h2>
              <p>
                We use cookies and similar tracking technologies to improve your experience on our website. For more information, please see our Cookie Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">8. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">9. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy or our privacy practices, please contact us:
              </p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="font-semibold text-foreground">Estate Nest Inc.</p>
                <p>Email: hello@estatenest.ca</p>
                <p>Phone: 780-860-3191</p>
                <p>Address: Edmonton, Alberta, Canada</p>
              </div>
            </section>

            <section className="mt-8 p-6 bg-primary/10 rounded-lg">
              <p className="text-foreground">
                <strong>E&O Insurance Disclaimer:</strong> Estate Nest Inc. maintains Errors & Omissions insurance coverage. Your personal information is handled in accordance with industry best practices and applicable privacy legislation including PIPEDA (Personal Information Protection and Electronic Documents Act).
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Privacy;
