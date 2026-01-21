import { pgTable, uuid, varchar, boolean, index } from 'drizzle-orm/pg-core';

export const countryDefaults = pgTable('country_defaults', {
  id: uuid('id').defaultRandom().primaryKey(),
  countryCode: varchar('country_code', { length: 2 }).unique().notNull(),
  countryName: varchar('country_name', { length: 100 }).notNull(),
  defaultCurrency: varchar('default_currency', { length: 3 }).notNull(),
  defaultTimezone: varchar('default_timezone', { length: 100 }).notNull(),
  defaultLanguage: varchar('default_language', { length: 10 }).default('en'),
  callingCode: varchar('calling_code', { length: 10 }),
  flagEmoji: varchar('flag_emoji', { length: 10 }),
  active: boolean('active').default(true),
}, (table) => [
  index('country_defaults_code_idx').on(table.countryCode),
  index('country_defaults_active_idx').on(table.active),
]);
