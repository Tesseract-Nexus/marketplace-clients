import { pgTable, uuid, varchar, text, integer, boolean, index } from 'drizzle-orm/pg-core';

export const trustBadges = pgTable('trust_badges', {
  id: uuid('id').defaultRandom().primaryKey(),
  label: varchar('label', { length: 100 }).notNull(),
  iconName: varchar('icon_name', { length: 50 }),
  description: text('description'),
  pageContext: varchar('page_context', { length: 50 }),
  sortOrder: integer('sort_order').default(0),
  active: boolean('active').default(true),
}, (table) => [
  index('trust_badges_page_context_idx').on(table.pageContext),
  index('trust_badges_active_idx').on(table.active),
]);
