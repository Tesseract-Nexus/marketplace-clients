'use client';

import React from 'react';
import { Store, Mail, MessageCircle } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground py-16 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-warm-100 rounded-lg flex items-center justify-center">
                <span className="text-foreground font-semibold text-lg">T</span>
              </div>
              <span className="text-lg font-serif font-medium text-warm-50">Tesseract Hub</span>
            </div>
            <p className="text-warm-400 text-sm leading-relaxed">
              The simplest way to launch and grow your online store. Built for creators, makers, and small businesses.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-warm-100 font-medium mb-4">Product</h4>
            <ul className="space-y-3 text-sm text-warm-400">
              <li><a href="#features" className="hover:text-warm-100 transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-warm-100 transition-colors">Pricing</a></li>
              <li><a href="/presentation" className="hover:text-warm-100 transition-colors">Demo</a></li>
              <li><a href="#" className="hover:text-warm-100 transition-colors">Integrations</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-warm-100 font-medium mb-4">Resources</h4>
            <ul className="space-y-3 text-sm text-warm-400">
              <li><a href="#faq" className="hover:text-warm-100 transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-warm-100 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-warm-100 transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-warm-100 transition-colors">Guides</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-warm-100 font-medium mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-warm-400">
              <li><a href="/about" className="hover:text-warm-100 transition-colors">About</a></li>
              <li><a href="/contact" className="hover:text-warm-100 transition-colors">Contact</a></li>
              <li><a href="/privacy" className="hover:text-warm-100 transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-warm-100 transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-warm-800/40 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-warm-500">
            © {currentYear} Tesseract Hub. Made with care for people who make things.
          </p>
          <div className="flex items-center gap-4">
            <a href="mailto:hello@tesseracthub.com" className="text-warm-500 hover:text-warm-300 transition-colors">
              <Mail className="w-5 h-5" />
            </a>
            <a href="#" className="text-warm-500 hover:text-warm-300 transition-colors">
              <MessageCircle className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
