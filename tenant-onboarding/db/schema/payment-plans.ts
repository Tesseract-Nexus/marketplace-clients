import { pgTable, uuid, varchar, decimal, integer, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const paymentPlans = pgTable('payment_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  billingCycle: varchar('billing_cycle', { length: 20 }).notNull(), // 'monthly', 'yearly', 'one_time'
  trialDays: integer('trial_days').default(0),
  description: text('description'),
  tagline: varchar('tagline', { length: 255 }),
  featured: boolean('featured').default(false),
  sortOrder: integer('sort_order').default(0),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('payment_plans_active_idx').on(table.active),
  index('payment_plans_slug_idx').on(table.slug),
]);

export const planFeatures = pgTable('plan_features', {
  id: uuid('id').defaultRandom().primaryKey(),
  planId: uuid('plan_id').notNull().references(() => paymentPlans.id, { onDelete: 'cascade' }),
  feature: text('feature').notNull(),
  sortOrder: integer('sort_order').default(0),
  highlighted: boolean('highlighted').default(false),
}, (table) => [
  index('plan_features_plan_id_idx').on(table.planId),
]);

export const regionalPricing = pgTable('regional_pricing', {
  id: uuid('id').defaultRandom().primaryKey(),
  planId: uuid('plan_id').notNull().references(() => paymentPlans.id, { onDelete: 'cascade' }),
  countryCode: varchar('country_code', { length: 2 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
}, (table) => [
  index('regional_pricing_plan_id_idx').on(table.planId),
  index('regional_pricing_country_idx').on(table.countryCode),
]);

// Relations
export const paymentPlansRelations = relations(paymentPlans, ({ many }) => ({
  features: many(planFeatures),
  regionalPricing: many(regionalPricing),
}));

export const planFeaturesRelations = relations(planFeatures, ({ one }) => ({
  plan: one(paymentPlans, {
    fields: [planFeatures.planId],
    references: [paymentPlans.id],
  }),
}));

export const regionalPricingRelations = relations(regionalPricing, ({ one }) => ({
  plan: one(paymentPlans, {
    fields: [regionalPricing.planId],
    references: [paymentPlans.id],
  }),
}));
