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
            <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
            
            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">1. What Are Cookies?</h2>
              <p>
                Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">2. How We Use Cookies</h2>
              <p>
                Estate Nest Inc. uses cookies to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Remember your preferences and settings</li>
                <li>Understand how you use our website</li>
                <li>Improve your user experience</li>
                <li>Analyze website traffic and performance</li>
                <li>Provide personalized content and recommendations</li>
                <li>Ensure website security</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">3. Types of Cookies We Use</h2>
              
              <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">Essential Cookies</h3>
              <p>
                These cookies are necessary for the website to function properly. They enable basic functions like page navigation, access to secure areas, and form submissions. The website cannot function properly without these cookies.
              </p>

              <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">Functional Cookies</h3>
              <p>
                These cookies enable enhanced functionality and personalization, such as remembering your preferences and choices (e.g., language preferences).
              </p>

              <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">Analytics Cookies</h3>
              <p>
                These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our website performance and user experience.
              </p>

              <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">Marketing Cookies</h3>
              <p>
                These cookies track your browsing habits to deliver personalized advertising and measure the effectiveness of our marketing campaigns.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">4. Third-Party Cookies</h2>
              <p>
                We may use third-party service providers who set cookies on our website to deliver their services. These include:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Google Analytics for website analytics</li>
                <li>Social media platforms for social sharing features</li>
                <li>Chat services for customer support</li>
                <li>Advertising networks for targeted advertising</li>
              </ul>
              <p className="mt-4">
                These third parties have their own privacy policies and cookie policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">5. Managing Cookies</h2>
              <p>
                You can control and manage cookies in several ways:
              </p>
              
              <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">Browser Settings</h3>
              <p>
                Most web browsers allow you to control cookies through their settings. You can typically:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>View what cookies are stored on your device</li>
                <li>Delete cookies</li>
                <li>Block cookies from specific websites</li>
                <li>Block all cookies</li>
                <li>Delete all cookies when you close your browser</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">Cookie Preferences</h3>
              <p>
                You can manage your cookie preferences on our website at any time. Note that blocking or deleting certain cookies may impact your user experience and website functionality.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">6. Cookie Duration</h2>
              <p>
                We use both session cookies (which expire when you close your browser) and persistent cookies (which remain on your device for a set period or until you delete them).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">7. Updates to This Policy</h2>
              <p>
                We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our business operations. We will notify you of any significant changes by posting the updated policy on our website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">8. Contact Us</h2>
              <p>
                If you have any questions about our use of cookies, please contact us:
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
                <strong>Your Privacy Matters:</strong> At Estate Nest Inc., we are committed to protecting your privacy and handling your data responsibly. For more information about how we collect and use your personal information, please see our Privacy Policy.
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Cookies;
