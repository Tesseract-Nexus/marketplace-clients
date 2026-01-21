import { pgTable, uuid, varchar, text, decimal, date, boolean, timestamp, index } from 'drizzle-orm/pg-core';

export const reviews = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  platformName: varchar('platform_name', { length: 100 }), // e.g., 'G2', 'Capterra'
  reviewerName: varchar('reviewer_name', { length: 100 }).notNull(),
  reviewerCompany: varchar('reviewer_company', { length: 100 }),
  content: text('content').notNull(),
  rating: decimal('rating', { precision: 2, scale: 1 }).notNull(),
  reviewDate: date('review_date'),
  sourceUrl: varchar('source_url', { length: 500 }),
  verified: boolean('verified').default(false),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('reviews_active_idx').on(table.active),
  index('reviews_platform_idx').on(table.platformName),
]);
