import { pgTable, uuid, varchar, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';

// Status enum for testimonial approval workflow
export type TestimonialStatus = 'pending' | 'approved' | 'rejected' | 'revision_needed';

export const testimonials = pgTable('testimonials', {
  id: uuid('id').defaultRandom().primaryKey(),
  quote: text('quote').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  role: varchar('role', { length: 100 }),
  company: varchar('company', { length: 100 }),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  initials: varchar('initials', { length: 5 }),
  rating: integer('rating').default(5),
  featured: boolean('featured').default(false),
  pageContext: varchar('page_context', { length: 50 }), // 'home', 'pricing', 'presentation'
  sortOrder: integer('sort_order').default(0),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),

  // Tenant submission fields
  tenantId: uuid('tenant_id'), // Links to submitting tenant (null for seeded/admin-created)
  status: varchar('status', { length: 20 }).default('approved'), // pending, approved, rejected, revision_needed
  submittedAt: timestamp('submitted_at'), // When tenant submitted
  reviewedAt: timestamp('reviewed_at'), // When admin reviewed
  reviewedBy: varchar('reviewed_by', { length: 100 }), // Admin who reviewed
  revisionNotes: text('revision_notes'), // Feedback if revision needed
}, (table) => [
  index('testimonials_active_idx').on(table.active),
  index('testimonials_featured_idx').on(table.featured),
  index('testimonials_page_context_idx').on(table.pageContext),
  index('testimonials_tenant_id_idx').on(table.tenantId),
  index('testimonials_status_idx').on(table.status),
]);
