import { pgTable, uuid, varchar, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const guides = pgTable('guides', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 200 }).unique().notNull(),
  description: text('description'),
  iconName: varchar('icon_name', { length: 50 }),
  duration: varchar('duration', { length: 50 }), // e.g., '10 min read'
  featured: boolean('featured').default(false),
  content: text('content'), // Markdown or HTML content
  sortOrder: integer('sort_order').default(0),
  active: boolean('active').default(true),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('guides_slug_idx').on(table.slug),
  index('guides_active_idx').on(table.active),
  index('guides_featured_idx').on(table.featured),
]);

export const guideSteps = pgTable('guide_steps', {
  id: uuid('id').defaultRandom().primaryKey(),
  guideId: uuid('guide_id').notNull().references(() => guides.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  content: text('content'),
  duration: varchar('duration', { length: 50 }),
  sortOrder: integer('sort_order').default(0),
}, (table) => [
  index('guide_steps_guide_id_idx').on(table.guideId),
]);

// Relations
export const guidesRelations = relations(guides, ({ many }) => ({
  steps: many(guideSteps),
}));

export const guideStepsRelations = relations(guideSteps, ({ one }) => ({
  guide: one(guides, {
    fields: [guideSteps.guideId],
    references: [guides.id],
  }),
}));
