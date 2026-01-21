import { pgTable, uuid, varchar, text, integer, boolean, index } from 'drizzle-orm/pg-core';

export const contacts = pgTable('contacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: varchar('type', { length: 50 }).notNull(), // 'support', 'sales', 'partnerships', 'feedback'
  label: varchar('label', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  description: text('description'),
  responseTime: varchar('response_time', { length: 100 }),
  sortOrder: integer('sort_order').default(0),
  active: boolean('active').default(true),
}, (table) => [
  index('contacts_type_idx').on(table.type),
  index('contacts_active_idx').on(table.active),
]);

export const socialLinks = pgTable('social_links', {
  id: uuid('id').defaultRandom().primaryKey(),
  platform: varchar('platform', { length: 50 }).notNull(), // 'twitter', 'instagram', 'linkedin'
  url: varchar('url', { length: 500 }).notNull(),
  iconName: varchar('icon_name', { length: 50 }),
  sortOrder: integer('sort_order').default(0),
  active: boolean('active').default(true),
}, (table) => [
  index('social_links_platform_idx').on(table.platform),
  index('social_links_active_idx').on(table.active),
]);

export const companyLocations = pgTable('company_locations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  address: text('address').notNull(),
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 100 }),
  isPrimary: boolean('is_primary').default(false),
  active: boolean('active').default(true),
}, (table) => [
  index('company_locations_active_idx').on(table.active),
]);
