'use client';

import React from 'react';
import {
  HelpCircle,
  Book,
  MessageCircle,
  Mail,
  ExternalLink,
  FileText,
  Video,
  Zap,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';

interface SupportCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  href: string;
  external?: boolean;
}

const supportCards: SupportCard[] = [
  {
    icon: <Book className="h-6 w-6" />,
    title: 'Documentation',
    description: 'Browse our comprehensive guides and tutorials to learn how to use the platform.',
    action: 'View Docs',
    href: 'https://docs.tesserix.com',
    external: true,
  },
  {
    icon: <Video className="h-6 w-6" />,
    title: 'Video Tutorials',
    description: 'Watch step-by-step video guides to get started quickly.',
    action: 'Watch Videos',
    href: 'https://docs.tesserix.com/videos',
    external: true,
  },
  {
    icon: <FileText className="h-6 w-6" />,
    title: 'FAQs',
    description: 'Find answers to commonly asked questions about the platform.',
    action: 'View FAQs',
    href: 'https://docs.tesserix.com/faq',
    external: true,
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: 'Feature Requests',
    description: 'Have an idea for a new feature? We\'d love to hear from you.',
    action: 'Submit Request',
    href: 'https://feedback.tesserix.com',
    external: true,
  },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Help & Support"
          description="Get help with using the platform, find documentation, or contact our support team."
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Support' },
          ]}
        />

        {/* Contact Support Card */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Need Help?</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Our support team is available to help you with any questions or issues.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => window.open('mailto:support@tesserix.com', '_blank')}
              >
                <Mail className="h-4 w-4 mr-2" />
                Email Support
              </Button>
              <Button
                onClick={() => window.open('https://support.tesserix.com', '_blank')}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </div>
          </div>
        </div>

        {/* Support Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {supportCards.map((card, index) => (
            <a
              key={index}
              href={card.href}
              target={card.external ? '_blank' : undefined}
              rel={card.external ? 'noopener noreferrer' : undefined}
              className="bg-card rounded-lg border border-border p-6 shadow-sm hover:border-primary/50 hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors text-primary">
                  {card.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                    {card.title}
                    {card.external && (
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{card.description}</p>
                  <span className="inline-flex items-center text-sm text-primary font-medium mt-3 group-hover:underline">
                    {card.action}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Additional Help */}
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Quick Tips</h3>
          </div>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">1.</span>
              Use the search bar (Cmd/Ctrl + K) to quickly find any page or feature.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">2.</span>
              Check the documentation for detailed guides on setting up your store.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">3.</span>
              For urgent issues, contact support directly via email or chat.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">4.</span>
              Join our community to connect with other merchants and share tips.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
