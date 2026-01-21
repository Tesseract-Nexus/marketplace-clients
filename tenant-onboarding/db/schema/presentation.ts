import { pgTable, uuid, varchar, text, integer, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

export const presentationSlides = pgTable('presentation_slides', {
  id: uuid('id').defaultRandom().primaryKey(),
  slideNumber: integer('slide_number').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'title', 'problem', 'solution', 'features', etc.
  label: varchar('label', { length: 100 }),
  title: varchar('title', { length: 200 }),
  titleGradient: varchar('title_gradient', { length: 200 }),
  titleHighlight: varchar('title_highlight', { length: 200 }),
  subtitle: text('subtitle'),
  content: jsonb('content'), // Flexible JSON for complex slide data (items, stats, features, etc.)
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('presentation_slides_number_idx').on(table.slideNumber),
  index('presentation_slides_type_idx').on(table.type),
  index('presentation_slides_active_idx').on(table.active),
]);
