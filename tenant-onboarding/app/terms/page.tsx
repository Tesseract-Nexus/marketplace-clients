'use client';

import Header from '../../components/Header';
import { Footer } from '../../components/Footer';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-12 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight mb-4 text-foreground">
            Terms of Service
          </h1>
          <p className="text-foreground-secondary">
            Last Updated: January 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="prose prose-lg text-foreground-secondary space-y-8">

            {/* Introduction */}
            <div className="p-6 bg-warm-50 rounded-xl border border-warm-200">
              <p className="text-foreground leading-relaxed m-0">
                Welcome to Tesserix. These Terms of Service govern your use of our platform and services. By using Tesserix, you agree to these Terms. We've written these in plain language, but they're still a legal agreement.
              </p>
            </div>

            {/* Section 1 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">1. Accepting These Terms</h2>
              <p className="leading-relaxed">
                By creating a Tesserix account or using our services, you agree to these Terms of Service, our Privacy Policy, and our Acceptable Use Policy.
              </p>
              <p className="leading-relaxed mt-4">
                <strong>Age Requirement:</strong> You must be at least 18 years old to use Tesserix.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">2. Our Service</h2>

              <h3 className="font-medium text-foreground text-lg mt-6 mb-3">What We Provide</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Store hosting and infrastructure</li>
                <li>Product management tools</li>
                <li>Payment processing integration</li>
                <li>Order management system</li>
                <li>Customer support tools</li>
                <li>Analytics and reporting</li>
                <li>24/7 human customer support</li>
              </ul>

              <h3 className="font-medium text-foreground text-lg mt-6 mb-3">What We Don't Provide</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>We don't manufacture, ship, or fulfill your products</li>
                <li>We don't provide legal, tax, or business advice</li>
                <li>We don't guarantee sales or revenue</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">3. Your Account</h2>
              <p className="leading-relaxed">You're responsible for:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Providing accurate and complete information</li>
                <li>Maintaining the security of your password</li>
                <li>All activity that occurs under your account</li>
                <li>Notifying us immediately of unauthorized access</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">4. Pricing and Payments</h2>

              <div className="p-4 bg-sage-50 border border-sage-200 rounded-lg mb-6">
                <p className="text-sage-700 m-0">
                  <strong>Free Trial:</strong> 12 months completely free. No credit card required.
                </p>
                <p className="text-sage-700 mt-2 mb-0">
                  <strong>After Free Period:</strong> ₹500/month. No transaction fees. Cancel anytime.
                </p>
              </div>

              <h3 className="font-medium text-foreground text-lg mt-6 mb-3">Payment Terms</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Charges are billed monthly in advance</li>
                <li>We accept major credit cards and UPI</li>
                <li>Prices exclude applicable taxes (GST, etc.)</li>
              </ul>

              <h3 className="font-medium text-foreground text-lg mt-6 mb-3">Failed Payments</h3>
              <p className="leading-relaxed">
                If a payment fails, we'll notify you. After 7 days, we may suspend your account. After 30 days, we may delete your account and data.
              </p>

              <h3 className="font-medium text-foreground text-lg mt-6 mb-3">Refunds</h3>
              <p className="leading-relaxed">
                We offer refunds within 14 days of purchase. Contact support@tesserix.app. After 14 days, charges are non-refundable, but you can cancel anytime.
              </p>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">5. Your Responsibilities</h2>
              <p className="leading-relaxed">You agree to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Comply with all applicable laws and regulations</li>
                <li>Obtain necessary licenses and permits</li>
                <li>Accurately represent your products and services</li>
                <li>Honor your obligations to customers</li>
                <li>Pay all applicable taxes</li>
                <li>Handle customer service and returns</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">6. Acceptable Use Policy</h2>

              <h3 className="font-medium text-foreground text-lg mt-6 mb-3">You May Not Use Tesserix To</h3>

              <h4 className="font-medium text-foreground mt-4 mb-2">Sell Illegal or Restricted Items:</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Illegal drugs or substances</li>
                <li>Weapons, firearms, or explosives</li>
                <li>Stolen goods or counterfeit products</li>
                <li>Items that violate intellectual property rights</li>
              </ul>

              <h4 className="font-medium text-foreground mt-4 mb-2">Engage in Fraudulent Activity:</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Pyramid schemes or MLM</li>
                <li>Deceptive business practices</li>
                <li>Credit card fraud or money laundering</li>
              </ul>

              <h4 className="font-medium text-foreground mt-4 mb-2">Harm Our Service:</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Upload malware or malicious code</li>
                <li>Attempt unauthorized access</li>
                <li>Interfere with other users' stores</li>
              </ul>

              <p className="leading-relaxed mt-4">
                <strong>Consequences:</strong> Violating these policies may result in warning, suspension, or permanent termination.
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">7. Payment Processing</h2>
              <p className="leading-relaxed">
                We partner with PCI DSS-compliant payment processors. You're responsible for all chargebacks, refunds, and disputes with your customers.
              </p>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">8. Intellectual Property</h2>
              <p className="leading-relaxed">
                <strong>Your Property:</strong> You retain all rights to the content you upload.
              </p>
              <p className="leading-relaxed mt-2">
                <strong>Our Property:</strong> Tesserix, our logo, and platform are protected by intellectual property laws.
              </p>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">9. Data and Privacy</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your customer data belongs to you</li>
                <li>We process it only to provide our service</li>
                <li>You can export your data anytime</li>
                <li>See our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a> for full details</li>
              </ul>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">10. Uptime and Support</h2>
              <p className="leading-relaxed">
                We strive for 99.9% uptime but can't guarantee uninterrupted service. We're not liable for lost sales during downtime, but we'll work hard to restore service quickly.
              </p>
              <h3 className="font-medium text-foreground text-lg mt-6 mb-3">Support Response Times</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Critical issues: Within 2 hours</li>
                <li>General support: Within 4 hours</li>
              </ul>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">11. Termination</h2>

              <h3 className="font-medium text-foreground text-lg mt-6 mb-3">Your Right to Cancel</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Cancel anytime through your account settings</li>
                <li>No cancellation fees or penalties</li>
                <li>Download your data before canceling</li>
              </ul>

              <h3 className="font-medium text-foreground text-lg mt-6 mb-3">Our Right to Terminate</h3>
              <p className="leading-relaxed">
                We may suspend or terminate your account if you violate these Terms, engage in illegal activity, or fail to pay for 30 days.
              </p>
            </section>

            {/* Section 12 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">12. Disclaimers</h2>
              <p className="leading-relaxed">
                Tesserix is provided "as is." We don't guarantee sales, revenue, or that the service will be uninterrupted or error-free.
              </p>
            </section>

            {/* Section 13 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">13. Limitation of Liability</h2>
              <p className="leading-relaxed">
                To the fullest extent permitted by law, Tesserix's total liability is limited to the amount you paid us in the 12 months before the claim arose. We're not liable for lost profits, lost data, or indirect damages.
              </p>
            </section>

            {/* Section 14 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">14. Dispute Resolution</h2>
              <p className="leading-relaxed">
                <strong>Informal Resolution:</strong> If you have a dispute, contact us first at legal@tesserix.app. We'll work in good faith to resolve it.
              </p>
              <p className="leading-relaxed mt-4">
                <strong>Governing Law:</strong> These Terms are governed by the laws of India. Disputes will be resolved in the courts of Maharashtra, India.
              </p>
            </section>

            {/* Section 15 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">15. Changes to These Terms</h2>
              <p className="leading-relaxed">
                We may update these Terms from time to time. We'll notify you of significant changes via email. Continued use means you accept the updated Terms.
              </p>
            </section>

            {/* Section 16 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">16. Contact Us</h2>
              <div className="mt-4 p-4 bg-warm-50 border border-warm-200 rounded-lg">
                <p className="m-0"><strong>Legal Questions:</strong> <a href="mailto:legal@tesserix.app" className="text-primary hover:underline">legal@tesserix.app</a></p>
                <p className="mt-2 mb-0"><strong>General Support:</strong> <a href="mailto:support@tesserix.app" className="text-primary hover:underline">support@tesserix.app</a></p>
              </div>
            </section>

            {/* Closing */}
            <section className="mt-12 p-6 bg-sage-50 rounded-xl border border-sage-200">
              <p className="text-sage-700 font-medium m-0 text-center">
                Thank you for choosing Tesserix. We're honored to be part of your business journey.
              </p>
            </section>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
