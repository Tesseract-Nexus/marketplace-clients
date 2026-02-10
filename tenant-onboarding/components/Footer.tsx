'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, MessageCircle } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground py-16 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center mb-4 hover:opacity-80 transition-opacity">
              <img
                src="/icon-192.png"
                alt="mark8ly icon"
                className="h-8 w-auto brightness-0 invert"
                style={{ marginRight: '0px' }}
              />
              <span className="text-lg font-serif font-medium tracking-[-0.015em] text-warm-100">mark8ly</span>
            </Link>
            <p className="text-warm-400 text-sm leading-relaxed">
              The simplest way to launch and grow your online store. Built for creators, makers, and small businesses.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-warm-100 font-medium mb-4">Product</h4>
            <ul className="space-y-3 text-sm text-warm-400">
              <li><Link href="/#features" className="hover:text-warm-100 transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-warm-100 transition-colors">Pricing</Link></li>
              <li><Link href="/presentation" className="hover:text-warm-100 transition-colors">Demo</Link></li>
              <li><Link href="/integrations" className="hover:text-warm-100 transition-colors">Integrations</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-warm-100 font-medium mb-4">Resources</h4>
            <ul className="space-y-3 text-sm text-warm-400">
              <li><Link href="/help" className="hover:text-warm-100 transition-colors">Help Center</Link></li>
              <li><Link href="/guides" className="hover:text-warm-100 transition-colors">Guides</Link></li>
              <li><Link href="/blog" className="hover:text-warm-100 transition-colors">Blog</Link></li>
              <li><Link href="/#faq" className="hover:text-warm-100 transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-warm-100 font-medium mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-warm-400">
              <li><Link href="/about" className="hover:text-warm-100 transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-warm-100 transition-colors">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-warm-100 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-warm-100 transition-colors">Terms of Service</Link></li>
              <li><Link href="/legal" className="hover:text-warm-100 transition-colors">Security & Compliance</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-warm-800/40 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-warm-500">
            &copy; {currentYear} mark8ly by Tesserix &middot; Crafted with care for people who make things.
          </p>
          <div className="flex items-center gap-4">
            <a href="mailto:hello@mark8ly.com" className="text-warm-500 hover:text-warm-300 transition-colors">
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
