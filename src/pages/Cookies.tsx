import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Cookies = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle font-[Inter]">
      <Navigation />
      
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-5xl font-bold mb-8 animate-fade-in-up">Cookie Policy</h1>
          
          <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground animate-fade-in">
            <p className="text-sm text-muted-foreground">Last updated: July 27, 2026</p>
            
            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">1. Introduction</h2>
              <p>
                Estate Nest Inc. ("we," "our," or "us") uses cookies, tracking pixels, and web beacons on our website (www.estatenest.ca) to enhance platform performance, protect digital consumer submissions, and streamline our automated life insurance quote engines. This Cookie Policy explains what these technologies are, how we deploy them, and your statutory rights to control them under the Alberta Personal Information Protection Act (PIPA) and the federal Personal Information Protection and Electronic Documents Act (PIPEDA).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">2. What Are Cookies?</h2>
              <p>
                Cookies are small alphanumeric text files placed onto your computer, tablet, or smartphone when you visit web pages. They serve as a digital footprint, enabling our servers to recognize your browser configuration, remember form data inputs across multi-step insurance quotes, and ensure your session remains secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">3. Automated Operations & How We Use Cookies</h2>
              <p>
                As an independent insurance brokerage leveraging automation and AI system maps, we utilize cookies to completely automate and protect backend user flows. Specifically, we use them to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Maintain the security integrity of active life insurance form submissions.</li>
                <li>Prevent malicious automated bots from executing form-injection cyberattacks.</li>
                <li>Track anonymous user navigation paths to improve the usability of our Ontario and Alberta quote channels.</li>
                <li>Measure the operational conversion rates of our automated social media marketing campaigns.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">4. Categories of Cookies Deployed</h2>
              
              <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">Essential / Strictly Necessary Cookies</h3>
              <p>
                These are vital for basic operations. They manage secure logins, maintain session stability, and allow you to fill out multi-page financial health assessments without losing data between clicks. The website cannot function without them, and they do not require prior consumer consent under Canadian privacy frameworks.
              </p>
              <p className="mt-4">
                The public insurance assistant uses an HttpOnly same-site session cookie for up to 24 hours after you agree to begin. If you choose to continue to the quote form, a separate one-purpose HttpOnly handoff cookie securely prefills the form and expires after approximately 20 minutes or when the quote is submitted. These cookie values contain opaque random tokens, not your name, phone number, email address, or insurance interest.
              </p>

              <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">Functional / Preference Cookies</h3>
              <p>
                These allow our platform to remember your localized preferences, such as choosing specific provincial quoting pipelines (Alberta vs. Ontario) or custom language selections.
              </p>

              <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">Analytics & Performance Cookies</h3>
              <p>
                These cookies gather completely anonymized telemetry regarding how visitors interact with our layout (e.g., identifying which blog posts or policy descriptions are read most frequently).
              </p>
              <p className="mt-4">
                Chatbot analytics are limited to interaction events such as opening, consent, product selection, quote handoff, completion, or abandonment. Name, email, phone number, raw questions, health information, and other personal identifiers are not approved analytics parameters. Chatbot contact fields are marked for Microsoft Clarity masking.
              </p>

              <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">Targeting & Marketing Tracking Pixels</h3>
              <p>
                These cookies track online behaviors to monitor the efficacy of our advertising across external platforms. Note: If you arrive at our site via an automated social media campaign managed by third-party systems like Publer or Later, these pixels anonymously register that entry point to measure brand outreach.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">5. Third-Party Integration Cookies</h2>
              <p>
                To provide accurate, real-time insurance analysis, we integrate trusted third-party scripts that may place separate tracking elements on your system:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Web Analytics:</strong> Google Analytics (to monitor overall regional site performance).</li>
                <li><strong>Brokerage Infrastructure:</strong> Specialized secure widgets or embed protocols from Managing General Agencies (MGAs) or life insurance underwriting calculation tools.</li>
                <li><strong>Advertising & Outreach Networks:</strong> Anonymized marketing conversion trackers connected to Meta, LinkedIn, or Google Ad networks.</li>
              </ul>
              <p className="mt-4">
                Please note: We do not govern third-party code blocks. These providers maintain their own independent, legally binding privacy and cookie policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">6. Automated Data Privacy Shield & Limits of Liability</h2>
              <p>
                Any analytics or tracking data collected via our cookie architecture is strictly encrypted and handled in compliance with our primary Privacy Policy.
              </p>
              <p className="mt-4">
                While cookies help stabilize site safety protocols, we maintain professional Errors & Omissions (E&O) insurance strictly to cover professional advice and regulatory brokerage licensing rules. Our E&O insurance policy does not indemnify users against localized device malware infections or standard browser-side tracking vulnerabilities. Estate Nest Inc. shall not be held legally liable for data caching errors, local browser security cracks, or tracking pixel discrepancies occurring natively on user devices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">7. Managing and Revoking Your Cookie Consent</h2>
              <p>
                Under Canadian data privacy guidelines, you hold the ultimate right to accept or refuse tracking mechanisms:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Browser-Level Controls:</strong> You can adjust your native browser settings (Chrome, Safari, Edge, Firefox) to completely block all cookies, auto-purge cached cookies upon closing, or flag inbound tracking notifications.</li>
                <li><strong>The Opt-Out Impact:</strong> Disabling essential or performance cookies will break our automated quote form software. If cookies are blocked, you will be unable to generate a real-time digital insurance quote and must contact a human broker directly via telephone instead.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">8. Updates to This Policy</h2>
              <p>
                We reserve the right to modify this Cookie Policy at any time to preserve lockstep compliance with emerging Canadian cyber regulations and new operational platform features. Any updates will take effect immediately upon being uploaded to this active URL.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">9. Contact Us</h2>
              <p>
                For any specific technical or legal inquiries regarding our cookie tracking frameworks:
              </p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="font-semibold text-foreground">Estate Nest Inc.</p>
                <p>Email: hello@estatenest.ca</p>
                <p>Phone: 780-860-3191</p>
                <p>Website: www.estatenest.ca</p>
                <p>Jurisdiction Headquarters: Edmonton, Alberta, Canada</p>
              </div>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Cookies;
