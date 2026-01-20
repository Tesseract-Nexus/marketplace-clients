'use client';

import Link from 'next/link';
import Header from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Mail, MessageCircle, Clock, MapPin, ArrowRight, Twitter, Linkedin, Instagram, HelpCircle, Send } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight mb-6 text-foreground">
            We're Here to Help
          </h1>
          <p className="text-xl text-foreground-secondary leading-relaxed">
            Whether you have a question, need support, or just want to say hello, we'd love to hear from you.
          </p>
        </div>
      </section>

      {/* Support Hours Badge */}
      <section className="pb-12 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-3 p-4 bg-sage-50 border border-sage-200 rounded-xl">
            <Clock className="w-5 h-5 text-sage-600" />
            <span className="font-medium text-sage-700">24/7 Human Support</span>
            <span className="text-sage-600">— No bots, no automated responses, just real people who care</span>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 px-6 border-t border-warm-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl font-medium text-foreground mb-8 text-center">Get in Touch</h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Email Support */}
            <div className="p-6 bg-white border border-warm-200 rounded-xl">
              <div className="w-12 h-12 rounded-xl bg-warm-100 flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-warm-600" />
              </div>
              <h3 className="font-medium text-foreground text-lg mb-2">Email Support</h3>
              <a href="mailto:support@tesseracthub.com" className="text-primary hover:underline font-medium">
                support@tesseracthub.com
              </a>
              <p className="text-foreground-secondary mt-2 text-sm">
                For general questions, technical help, or account assistance.
              </p>
              <p className="text-sm text-sage-600 mt-3">Average response: Under 2 hours</p>
            </div>

            {/* Sales */}
            <div className="p-6 bg-white border border-warm-200 rounded-xl">
              <div className="w-12 h-12 rounded-xl bg-warm-100 flex items-center justify-center mb-4">
                <Send className="w-6 h-6 text-warm-600" />
              </div>
              <h3 className="font-medium text-foreground text-lg mb-2">Sales Inquiries</h3>
              <a href="mailto:sales@tesseracthub.com" className="text-primary hover:underline font-medium">
                sales@tesseracthub.com
              </a>
              <p className="text-foreground-secondary mt-2 text-sm">
                Questions about pricing, features, or whether Tesseract Hub is right for you.
              </p>
              <p className="text-sm text-sage-600 mt-3">Average response: Under 1 hour</p>
            </div>

            {/* Live Chat */}
            <div className="p-6 bg-white border border-warm-200 rounded-xl">
              <div className="w-12 h-12 rounded-xl bg-warm-100 flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-warm-600" />
              </div>
              <h3 className="font-medium text-foreground text-lg mb-2">Live Chat</h3>
              <p className="text-foreground-secondary text-sm">
                Click the chat icon in the bottom right corner of any page for instant help.
              </p>
              <p className="text-sm text-sage-600 mt-3">Available 24/7</p>
            </div>

            {/* Partnerships */}
            <div className="p-6 bg-white border border-warm-200 rounded-xl">
              <div className="w-12 h-12 rounded-xl bg-warm-100 flex items-center justify-center mb-4">
                <HelpCircle className="w-6 h-6 text-warm-600" />
              </div>
              <h3 className="font-medium text-foreground text-lg mb-2">Partnership Opportunities</h3>
              <a href="mailto:partners@tesseracthub.com" className="text-primary hover:underline font-medium">
                partners@tesseracthub.com
              </a>
              <p className="text-foreground-secondary mt-2 text-sm">
                Interested in partnering with us? We'd love to explore how we can work together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Media & Location */}
      <section className="py-16 px-6 bg-warm-50">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
          {/* Social Media */}
          <div>
            <h2 className="font-serif text-2xl font-medium text-foreground mb-6">Follow Us</h2>
            <div className="flex gap-4">
              <a href="https://twitter.com/tesseracthub" target="_blank" rel="noopener noreferrer"
                 className="w-12 h-12 rounded-xl bg-white border border-warm-200 flex items-center justify-center hover:border-warm-300 transition-colors">
                <Twitter className="w-5 h-5 text-foreground-secondary" />
              </a>
              <a href="https://instagram.com/tesseracthub" target="_blank" rel="noopener noreferrer"
                 className="w-12 h-12 rounded-xl bg-white border border-warm-200 flex items-center justify-center hover:border-warm-300 transition-colors">
                <Instagram className="w-5 h-5 text-foreground-secondary" />
              </a>
              <a href="https://linkedin.com/company/tesseracthub" target="_blank" rel="noopener noreferrer"
                 className="w-12 h-12 rounded-xl bg-white border border-warm-200 flex items-center justify-center hover:border-warm-300 transition-colors">
                <Linkedin className="w-5 h-5 text-foreground-secondary" />
              </a>
            </div>
          </div>

          {/* Location */}
          <div>
            <h2 className="font-serif text-2xl font-medium text-foreground mb-6">Where We're Based</h2>
            <div className="flex gap-3">
              <MapPin className="w-5 h-5 text-foreground-tertiary flex-shrink-0 mt-1" />
              <div className="text-foreground-secondary">
                <p>Tesseract Hub</p>
                <p>Bangalore, Karnataka</p>
                <p>India</p>
                <p className="text-sm mt-2 italic">We operate remotely-first, but if you're in the area and want to meet, drop us a note.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feedback Section */}
      <section className="py-16 px-6 border-t border-warm-200">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-2xl font-medium text-foreground mb-4">We Love Feedback</h2>
          <p className="text-foreground-secondary mb-4">
            Building something great? Found a bug? Have an idea for a new feature? We want to hear it all.
          </p>
          <a href="mailto:feedback@tesseracthub.com" className="text-primary hover:underline font-medium">
            feedback@tesseracthub.com
          </a>
          <p className="text-sm text-foreground-tertiary mt-2">Your input directly shapes what we build next.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-warm-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-3xl font-medium text-foreground mb-4">Not a Customer Yet?</h2>
          <p className="text-foreground-secondary mb-8">See why thousands of small businesses trust us with their online stores.</p>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary-hover transition-colors"
          >
            Try Tesseract Hub Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
