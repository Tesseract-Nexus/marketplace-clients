'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, Loader2, CheckCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTenant } from '@/context/TenantContext';
import { ContentPage } from '@/types/storefront';
import { createSanitizedHtml } from '@/lib/utils/sanitize';

interface ContactPageClientProps {
  page: ContentPage | null;
  tenantName: string;
}

// Default contact info
const defaultContactInfo = [
  {
    icon: Mail,
    title: 'Email Us',
    value: 'support@store.com',
    description: 'We will respond within 24 hours',
  },
  {
    icon: Phone,
    title: 'Call Us',
    value: '+1 (555) 123-4567',
    description: 'Mon-Fri, 9am-6pm EST',
  },
  {
    icon: MapPin,
    title: 'Visit Us',
    value: '123 Commerce St',
    description: 'New York, NY 10001',
  },
  {
    icon: Clock,
    title: 'Business Hours',
    value: 'Mon - Fri: 9AM - 6PM',
    description: 'Sat: 10AM - 4PM, Sun: Closed',
  },
];

const inquiryTypes = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'order', label: 'Order Support' },
  { value: 'product', label: 'Product Question' },
  { value: 'returns', label: 'Returns & Refunds' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'other', label: 'Other' },
];

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

// Format date safely
function formatDate(dateString: string | undefined): string | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function ContactPageClient({ page, tenantName }: ContactPageClientProps) {
  const { tenant } = useTenant();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    inquiryType: '',
    subject: '',
    message: '',
  });

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      inquiryType: '',
      subject: '',
      message: '',
    });
  };

  // If we have page content from database, render dynamic content
  if (page && page.content) {
    const contactInfo = extractContactInfo(page.content);
    const formattedDate = formatDate(page.updatedAt);

    const breadcrumbItems = [
      { label: 'Home', href: '/' },
      { label: page.title || 'Contact Us' },
    ];

    if (isSubmitted) {
      return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md mx-auto px-4"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Message Sent!</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for reaching out. We have received your message and will get back to you within 24 hours.
            </p>
            <Button onClick={resetForm} className="btn-tenant-primary">
              Send Another Message
            </Button>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
        {/* Hero Section */}
        <header className="relative bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
          <div className="max-w-4xl mx-auto px-6 py-8 md:py-12 lg:py-16">
            <Breadcrumb items={breadcrumbItems} />

            <div className="mt-8 md:mt-12">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 mb-6">
                <Mail className="w-6 h-6 text-tenant-primary" />
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--text-primary)] font-heading">
                {page.title || 'Contact Us'}
              </h1>

              {page.excerpt && (
                <p className="mt-6 text-lg md:text-xl text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl">
                  {page.excerpt}
                </p>
              )}

              {formattedDate && (
                <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-stone-500 dark:text-stone-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    Updated {formattedDate}
                  </span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="py-12 md:py-16 lg:py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
              {/* Left Column - Contact Info */}
              <div className="lg:col-span-2 space-y-8">
                <div>
                  <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4 font-heading">
                    Get in Touch
                  </h2>
                  <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                    Have questions? We would love to hear from you. Send us a message and we will respond as soon as possible.
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

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={handleChange('name')}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={formData.email}
                          onChange={handleChange('email')}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          value={formData.phone}
                          onChange={handleChange('phone')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inquiryType">Inquiry Type *</Label>
                        <Select
                          value={formData.inquiryType}
                          onValueChange={(value) =>
                            setFormData((prev) => ({ ...prev, inquiryType: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a topic" />
                          </SelectTrigger>
                          <SelectContent>
                            {inquiryTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        placeholder="How can we help you?"
                        value={formData.subject}
                        onChange={handleChange('subject')}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        placeholder="Please describe your inquiry in detail..."
                        value={formData.message}
                        onChange={handleChange('message')}
                        rows={5}
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full btn-tenant-primary h-12"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
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
      </div>
    );
  }

  // Fallback: Render default static content if no database content
  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Message Sent!</h2>
          <p className="text-muted-foreground mb-6">
            Thank you for reaching out. We have received your message and will get back to you within 24 hours.
          </p>
          <Button onClick={resetForm} className="btn-tenant-primary">
            Send Another Message
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--tenant-primary)]/10 via-background to-[var(--tenant-secondary)]/10" />
        <div
          className="absolute top-20 left-1/4 w-72 h-72 rounded-full blur-3xl opacity-20"
          style={{ background: 'var(--tenant-primary)' }}
        />

        <div className="container-tenant relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tenant-primary/10 text-tenant-primary mb-6">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm font-medium">Get in Touch</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
            <p className="text-lg text-muted-foreground">
              Have a question or feedback? We would love to hear from you. Our team is always ready to help.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12 border-y bg-muted/30">
        <div className="container-tenant">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {defaultContactInfo.map((info, index) => (
              <motion.div
                key={info.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-xl p-6 border text-center hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--tenant-primary)]/10 flex items-center justify-center">
                  <info.icon className="h-6 w-6 text-tenant-primary" />
                </div>
                <h3 className="font-semibold mb-1">{info.title}</h3>
                <p className="text-tenant-primary font-medium mb-1">{info.value}</p>
                <p className="text-sm text-muted-foreground">{info.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 md:py-20">
        <div className="container-tenant">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl border p-8 md:p-10 shadow-sm"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Send us a Message</h2>
                <p className="text-muted-foreground">
                  Fill out the form below and we will get back to you as soon as possible
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange('name')}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange('email')}
                      required
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={handleChange('phone')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inquiryType">Inquiry Type *</Label>
                    <Select
                      value={formData.inquiryType}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, inquiryType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                      <SelectContent>
                        {inquiryTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    placeholder="How can we help you?"
                    value={formData.subject}
                    onChange={handleChange('subject')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Please describe your inquiry in detail..."
                    value={formData.message}
                    onChange={handleChange('message')}
                    rows={5}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full btn-tenant-primary h-12"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Teaser */}
      <section className="py-16 bg-muted/30">
        <div className="container-tenant">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground mb-6">
              Before reaching out, you might find your answer in our FAQ section.
              We have compiled answers to the most common questions.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div className="bg-card rounded-lg p-4 border">
                <p className="font-medium mb-1">Shipping</p>
                <p className="text-muted-foreground">Free shipping on orders over $100</p>
              </div>
              <div className="bg-card rounded-lg p-4 border">
                <p className="font-medium mb-1">Returns</p>
                <p className="text-muted-foreground">30-day hassle-free returns</p>
              </div>
              <div className="bg-card rounded-lg p-4 border">
                <p className="font-medium mb-1">Support</p>
                <p className="text-muted-foreground">24/7 customer service</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
