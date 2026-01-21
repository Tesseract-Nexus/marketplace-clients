import { pgTable, uuid, varchar, text, integer, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const integrations = pgTable('integrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(), // 'payments', 'shipping', 'marketing'
  description: text('description'),
  logoUrl: varchar('logo_url', { length: 500 }),
  status: varchar('status', { length: 20 }).default('active'), // 'active', 'coming_soon', 'beta'
  sortOrder: integer('sort_order').default(0),
  active: boolean('active').default(true),
}, (table) => [
  index('integrations_category_idx').on(table.category),
  index('integrations_status_idx').on(table.status),
  index('integrations_active_idx').on(table.active),
]);

export const integrationFeatures = pgTable('integration_features', {
  id: uuid('id').defaultRandom().primaryKey(),
  integrationId: uuid('integration_id').notNull().references(() => integrations.id, { onDelete: 'cascade' }),
  feature: text('feature').notNull(),
  sortOrder: integer('sort_order').default(0),
}, (table) => [
  index('integration_features_integration_id_idx').on(table.integrationId),
]);

// Relations
export const integrationsRelations = relations(integrations, ({ many }) => ({
  features: many(integrationFeatures),
}));

export const integrationFeaturesRelations = relations(integrationFeatures, ({ one }) => ({
  integration: one(integrations, {
    fields: [integrationFeatures.integrationId],
    references: [integrations.id],
  }),
}));
