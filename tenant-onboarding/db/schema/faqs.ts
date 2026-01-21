import { pgTable, uuid, varchar, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const faqCategories = pgTable('faq_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').default(0),
  active: boolean('active').default(true),
}, (table) => [
  index('faq_categories_slug_idx').on(table.slug),
  index('faq_categories_active_idx').on(table.active),
]);

export const faqs = pgTable('faqs', {
  id: uuid('id').defaultRandom().primaryKey(),
  categoryId: uuid('category_id').references(() => faqCategories.id, { onDelete: 'set null' }),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  sortOrder: integer('sort_order').default(0),
  pageContext: varchar('page_context', { length: 50 }), // 'home', 'pricing', 'help'
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('faqs_category_id_idx').on(table.categoryId),
  index('faqs_page_context_idx').on(table.pageContext),
  index('faqs_active_idx').on(table.active),
]);

// Relations
export const faqCategoriesRelations = relations(faqCategories, ({ many }) => ({
  faqs: many(faqs),
}));

export const faqsRelations = relations(faqs, ({ one }) => ({
  category: one(faqCategories, {
    fields: [faqs.categoryId],
    references: [faqCategories.id],
  }),
}));
