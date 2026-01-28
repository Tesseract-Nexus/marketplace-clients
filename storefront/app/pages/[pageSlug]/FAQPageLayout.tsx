'use client';

import Link from 'next/link';
import { ContentPage } from '@/types/storefront';
import { ChevronDown, Search, MessageCircle, HelpCircle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { createSanitizedHtml } from '@/lib/utils/sanitize';

interface FAQPageLayoutProps {
  page: ContentPage;
}

interface FAQItem {
  question: string;
  answer: string;
  category?: string;
}

// Parse FAQ items from HTML content
function parseFAQItems(content: string): FAQItem[] {
  const items: FAQItem[] = [];

  // Try to parse structured FAQ content
  // Look for patterns like: <h3>Question</h3><p>Answer</p> or <strong>Q:</strong>
  const h3Pattern = /<h3[^>]*>(.*?)<\/h3>\s*([\s\S]*?)(?=<h3|<h2|$)/gi;
  const strongPattern = /<strong[^>]*>([^<]*\?)<\/strong>\s*([\s\S]*?)(?=<strong|<h2|<h3|$)/gi;

  let matches;

  // Try h3 pattern first
  while ((matches = h3Pattern.exec(content)) !== null) {
    const question = matches[1]?.replace(/<[^>]+>/g, '').trim() ?? '';
    const answer = matches[2]?.replace(/<\/?p[^>]*>/g, '').trim() ?? '';
    if (question && answer) {
      items.push({ question, answer });
    }
  }

  // If no h3 matches, try strong pattern
  if (items.length === 0) {
    while ((matches = strongPattern.exec(content)) !== null) {
      const question = matches[1]?.replace(/<[^>]+>/g, '').trim() ?? '';
      const answer = matches[2]?.replace(/<\/?p[^>]*>/g, '').replace(/<[^>]+>/g, '').trim() ?? '';
      if (question && answer) {
        items.push({ question, answer });
      }
    }
  }

  // If still no items, try to split by question marks
  if (items.length === 0) {
    const textContent = content.replace(/<[^>]+>/g, '\n');
    const lines = textContent.split('\n').filter(l => l.trim());

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim() ?? '';
      if (line.endsWith('?')) {
        const answer = lines[i + 1]?.trim() ?? '';
        if (answer && !answer.endsWith('?')) {
          items.push({ question: line, answer });
          i++; // Skip the answer line
        }
      }
    }
  }

  return items;
}

// FAQ Accordion Item Component
function FAQAccordionItem({ item, isOpen, onToggle, index }: { item: FAQItem; isOpen: boolean; onToggle: () => void; index: number }) {
  return (
    <div className="border-b border-[var(--border-default)] last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-4 py-5 text-left group"
        aria-expanded={isOpen}
      >
        <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-tenant-primary/10 flex items-center justify-center text-sm font-medium text-tenant-primary">
          {index + 1}
        </span>
        <span className="flex-1 font-medium text-foreground group-hover:text-tenant-primary transition-colors">
          {item.question}
        </span>
        <ChevronDown
          className={`flex-shrink-0 w-5 h-5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="pb-5 pl-12 pr-4">
          <p className="text-muted-foreground leading-relaxed">
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export function FAQPageLayout({ page }: FAQPageLayoutProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<Set<number>>(new Set([0])); // First item open by default

  const faqItems = useMemo(() => parseFAQItems(page.content), [page.content]);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return faqItems;
    const query = searchQuery.toLowerCase();
    return faqItems.filter(
      item =>
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query)
    );
  }, [faqItems, searchQuery]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setOpenItems(new Set(filteredItems.map((_, i) => i)));
  };

  const collapseAll = () => {
    setOpenItems(new Set());
  };

  return (
    <div className="py-12 md:py-16 lg:py-20">
      <div className="container-tenant">
        <div className="max-w-4xl mx-auto">
          {/* Search and Controls */}
          <div className="mb-10">
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search frequently asked questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[var(--border-default)] bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-tenant-primary/50 focus:border-tenant-primary transition-colors"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredItems.length} {filteredItems.length === 1 ? 'question' : 'questions'} found
              </p>
              <div className="flex gap-3">
                <button
                  onClick={expandAll}
                  className="text-sm text-tenant-primary hover:underline"
                >
                  Expand all
                </button>
                <span className="text-muted-foreground/30">|</span>
                <button
                  onClick={collapseAll}
                  className="text-sm text-tenant-primary hover:underline"
                >
                  Collapse all
                </button>
              </div>
            </div>
          </div>

          {/* FAQ List */}
          {filteredItems.length > 0 ? (
            <div className="bg-background rounded-xl border border-[var(--border-default)] shadow-sm">
              {filteredItems.map((item, index) => (
                <FAQAccordionItem
                  key={index}
                  item={item}
                  index={index}
                  isOpen={openItems.has(index)}
                  onToggle={() => toggleItem(index)}
                />
              ))}
            </div>
          ) : searchQuery ? (
            <div className="text-center py-12 bg-background rounded-xl border border-[var(--border-default)]">
              <HelpCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium text-foreground mb-2">No results found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or{' '}
                <button onClick={() => setSearchQuery('')} className="text-tenant-primary hover:underline">
                  clear the filter
                </button>
              </p>
            </div>
          ) : (
            // If no FAQ items could be parsed, show the raw content
            <div className="bg-background rounded-xl border border-[var(--border-default)] shadow-sm p-8">
              <article
                className="prose-editorial"
                dangerouslySetInnerHTML={createSanitizedHtml(page.content)}
              />
            </div>
          )}

          {/* Still have questions? CTA */}
          <div className="mt-12 bg-tenant-primary/5 rounded-2xl p-8 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-tenant-primary/10 flex items-center justify-center">
              <MessageCircle className="w-7 h-7 text-tenant-primary" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2 font-heading">
              Still have questions?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Can&apos;t find the answer you&apos;re looking for? Our support team is here to help.
            </p>
            <Link
              href="/pages/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-tenant-primary text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
