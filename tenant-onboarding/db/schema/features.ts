import { pgTable, uuid, varchar, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';

export const features = pgTable('features', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description').notNull(),
  iconName: varchar('icon_name', { length: 50 }), // Lucide icon name
  category: varchar('category', { length: 100 }),
  pageContext: varchar('page_context', { length: 50 }), // 'home', 'pricing', 'features'
  sortOrder: integer('sort_order').default(0),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('features_page_context_idx').on(table.pageContext),
  index('features_category_idx').on(table.category),
  index('features_active_idx').on(table.active),
]);
