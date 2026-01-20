'use client';

import Header from '../../components/Header';
import { Footer } from '../../components/Footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-12 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight mb-4 text-foreground">
            Privacy Policy
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
                At Tesseract Hub, we believe your data is yours. We only collect what we need to provide you with a great service, and we're transparent about how we use it.
              </p>
            </div>

            {/* Section 1 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">1. Who We Are</h2>
              <p className="leading-relaxed">
                Tesseract Hub is an e-commerce platform that helps small businesses launch and manage online stores. We're based in India and serve customers globally.
              </p>
              <p className="leading-relaxed mt-4">
                <strong>Contact:</strong> privacy@tesseracthub.com
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">2. Information We Collect</h2>

              <h3 className="font-medium text-foreground text-lg mt-6 mb-3">Information You Give Us</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Information:</strong> Name, email address, phone number, business name, and password</li>
                <li><strong>Business Information:</strong> Store name, product details, descriptions, images, and pricing</li>
                <li><strong>Payment Information:</strong> Billing address and payment method details (we never store full card details)</li>
                <li><strong>Communications:</strong> Messages you send us through email, chat, or support</li>
              </ul>

              <h3 className="font-medium text-foreground text-lg mt-6 mb-3">Information We Collect Automatically</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Usage Data:</strong> How you interact with our platform, features you use, pages you visit</li>
                <li><strong>Device Information:</strong> IP address, browser type, operating system, device type</li>
                <li><strong>Cookies:</strong> We use cookies to improve your experience (see Cookie Policy below)</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">3. How We Use Your Information</h2>

              <h3 className="font-medium text-foreground text-lg mt-6 mb-3">To Provide Our Service</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Create and manage your account</li>
                <li>Process transactions and send confirmations</li>
                <li>Enable your online store functionality</li>
                <li>Provide customer support</li>
              </ul>

              <h3 className="font-medium text-foreground text-lg mt-6 mb-3">To Improve Our Service</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Understand how you use our platform</li>
                <li>Develop new features and improvements</li>
                <li>Fix bugs and technical issues</li>
              </ul>

              <h3 className="font-medium text-foreground text-lg mt-6 mb-3">To Communicate With You</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Send important updates about your account</li>
                <li>Respond to your questions and support requests</li>
                <li>Send marketing emails (only if you've opted in)</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">4. How We Share Your Information</h2>

              <div className="p-4 bg-sage-50 border border-sage-200 rounded-lg mb-6">
                <p className="text-sage-700 font-medium m-0">We don't sell your personal information. Period.</p>
              </div>

              <p className="leading-relaxed">We only share your data in limited circumstances:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>Service Providers:</strong> Payment processors, cloud hosting, email services</li>
                <li><strong>Your Customers:</strong> Information necessary to fulfill orders</li>
                <li><strong>Legal Requirements:</strong> When required by law or court order</li>
                <li><strong>Business Transfers:</strong> In case of merger or acquisition (with notice)</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">5. Cookie Policy</h2>
              <p className="leading-relaxed mb-4">
                We use cookies to make our platform work and improve your experience.
              </p>

              <h3 className="font-medium text-foreground text-lg mt-6 mb-3">Types of Cookies</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Essential:</strong> Required for the platform to function (login, shopping cart)</li>
                <li><strong>Analytics:</strong> Help us understand how you use our platform</li>
                <li><strong>Preferences:</strong> Remember your settings (language, region)</li>
                <li><strong>Marketing:</strong> Used only if you consent</li>
              </ul>
              <p className="leading-relaxed mt-4">
                You can control cookies through your browser settings.
              </p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">6. Data Security</h2>
              <p className="leading-relaxed">We take security seriously:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>SSL/TLS encryption for all data transmission</li>
                <li>PCI DSS compliant payment processing</li>
                <li>GDPR compliance for data protection</li>
                <li>Regular security audits</li>
                <li>Access controls for authorized personnel only</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">7. Data Retention</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Active Accounts:</strong> We retain data while your account is active</li>
                <li><strong>Closed Accounts:</strong> Personal data deleted within 90 days</li>
                <li><strong>Transaction Records:</strong> Kept for 7 years for tax compliance</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">8. Your Rights</h2>
              <p className="leading-relaxed mb-4">You have control over your data:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your data</li>
                <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
                <li><strong>Object:</strong> Object to processing for marketing</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent anytime</li>
              </ul>
              <p className="leading-relaxed mt-4">
                To exercise your rights, email <a href="mailto:privacy@tesseracthub.com" className="text-primary hover:underline">privacy@tesseracthub.com</a>. We'll respond within 30 days.
              </p>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">9. International Data Transfers</h2>
              <p className="leading-relaxed">
                We're based in India but serve customers globally. When we transfer data internationally, we ensure protection through standard contractual clauses and GDPR compliance.
              </p>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">10. Children's Privacy</h2>
              <p className="leading-relaxed">
                Tesseract Hub is not intended for children under 16. We don't knowingly collect information from children. If you believe your child has provided us with personal data, contact us at privacy@tesseracthub.com.
              </p>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">11. Changes to This Policy</h2>
              <p className="leading-relaxed">
                We may update this Privacy Policy from time to time. When we make significant changes, we'll notify you by email and display a notice on our platform.
              </p>
            </section>

            {/* Section 12 */}
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-4">12. Contact Us</h2>
              <p className="leading-relaxed">Questions about this Privacy Policy?</p>
              <div className="mt-4 p-4 bg-warm-50 border border-warm-200 rounded-lg">
                <p className="m-0"><strong>Email:</strong> <a href="mailto:privacy@tesseracthub.com" className="text-primary hover:underline">privacy@tesseracthub.com</a></p>
                <p className="mt-2 mb-0"><strong>Data Protection Officer:</strong> <a href="mailto:dpo@tesseracthub.com" className="text-primary hover:underline">dpo@tesseracthub.com</a></p>
              </div>
              <p className="leading-relaxed mt-4">
                We're here to help and will respond to all privacy inquiries within 48 hours.
              </p>
            </section>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
