'use client';

import { ContentPage } from '@/types/storefront';
import { Mail, Phone, Clock, MapPin, Send, MessageSquare, Building2 } from 'lucide-react';
import { useState } from 'react';
import { createSanitizedHtml } from '@/lib/utils/sanitize';

interface ContactPageLayoutProps {
  page: ContentPage;
}

// Extract contact info from HTML content
function extractContactInfo(content: string) {
  const info = {
    email: '',
    phone: '',
    hours: '',
    address: '',
    businessEmail: '',
  };

  // Extract email
  const emailMatch = content.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) info.email = emailMatch[1] ?? '';

  // Extract phone
  const phoneMatch = content.match(/(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|1-800-[A-Z0-9-]+)/i);
  if (phoneMatch) info.phone = phoneMatch[1] ?? '';

  // Extract business email if different
  const businessEmailMatch = content.match(/business[^:]*:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (businessEmailMatch) info.businessEmail = businessEmailMatch[1] ?? '';

  return info;
}

export function ContactPageLayout({ page }: ContactPageLayoutProps) {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const contactInfo = extractContactInfo(page.content);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSubmitted(true);
    setIsSubmitting(false);
  };

  return (
    <div className="py-12 md:py-16 lg:py-20">
      <div className="max-w-6xl mx-auto px-6">
        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
          {/* Left Column - Contact Info */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-2xl font-semibold text-stone-900 dark:text-stone-50 mb-4" style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}>
                Get in Touch
              </h2>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                Have questions? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
              </p>
            </div>

            {/* Contact Cards */}
            <div className="space-y-4">
              {/* Email Card */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 transition-all hover:border-tenant-primary/50 hover:shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-tenant-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-tenant-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-stone-900 dark:text-stone-100">Email Us</h3>
                  <a href={`mailto:${contactInfo.email || 'support@example.com'}`} className="text-sm text-tenant-primary hover:underline">
                    {contactInfo.email || 'support@example.com'}
                  </a>
                  {contactInfo.businessEmail && (
                    <p className="text-xs text-stone-500 mt-1">
                      Business: <a href={`mailto:${contactInfo.businessEmail}`} className="text-tenant-primary hover:underline">{contactInfo.businessEmail}</a>
                    </p>
                  )}
                </div>
              </div>

              {/* Phone Card */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 transition-all hover:border-tenant-primary/50 hover:shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-tenant-primary/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-tenant-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-stone-900 dark:text-stone-100">Call Us</h3>
                  <a href={`tel:${contactInfo.phone || '1-800-XXX-XXXX'}`} className="text-sm text-tenant-primary hover:underline">
                    {contactInfo.phone || '1-800-XXX-XXXX'}
                  </a>
                </div>
              </div>

              {/* Hours Card */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 transition-all hover:border-tenant-primary/50 hover:shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-tenant-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-tenant-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-stone-900 dark:text-stone-100">Business Hours</h3>
                  <p className="text-sm text-stone-600 dark:text-stone-400">Monday - Friday</p>
                  <p className="text-sm text-stone-600 dark:text-stone-400">9:00 AM - 5:00 PM EST</p>
                </div>
              </div>

              {/* Response Time */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 transition-all hover:border-tenant-primary/50 hover:shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-tenant-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-tenant-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-stone-900 dark:text-stone-100">Response Time</h3>
                  <p className="text-sm text-stone-600 dark:text-stone-400">We typically respond within 24 hours</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Contact Form */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-tenant-primary/10 flex items-center justify-center">
                  <Send className="w-5 h-5 text-tenant-primary" />
                </div>
                <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  Send us a Message
                </h2>
              </div>

              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-stone-900 dark:text-stone-50 mb-2">Message Sent!</h3>
                  <p className="text-stone-600 dark:text-stone-400">Thank you for reaching out. We&apos;ll get back to you soon.</p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormState({ name: '', email: '', subject: '', message: '' });
                    }}
                    className="mt-6 text-sm text-tenant-primary hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                        Your Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        required
                        value={formState.name}
                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-tenant-primary/50 focus:border-tenant-primary transition-colors"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        required
                        value={formState.email}
                        onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-tenant-primary/50 focus:border-tenant-primary transition-colors"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      required
                      value={formState.subject}
                      onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-tenant-primary/50 focus:border-tenant-primary transition-colors"
                      placeholder="How can we help?"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                      Message
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={5}
                      value={formState.message}
                      onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-tenant-primary/50 focus:border-tenant-primary transition-colors resize-none"
                      placeholder="Tell us more about your inquiry..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-6 py-3 bg-tenant-primary text-white font-medium rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-tenant-primary/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Additional Content from Admin */}
            {page.content && (
              <div className="mt-8 prose-editorial text-sm">
                <details className="group">
                  <summary className="cursor-pointer text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 transition-colors">
                    Additional Information
                  </summary>
                  <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-800" dangerouslySetInnerHTML={createSanitizedHtml(page.content)} />
                </details>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
