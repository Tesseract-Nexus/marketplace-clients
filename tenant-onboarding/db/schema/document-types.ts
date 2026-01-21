import { pgTable, uuid, varchar, text, integer, boolean, index } from 'drizzle-orm/pg-core';

export const businessDocumentTypes = pgTable('business_document_types', {
  id: uuid('id').defaultRandom().primaryKey(),
  countryCode: varchar('country_code', { length: 2 }).notNull(),
  documentType: varchar('document_type', { length: 100 }).notNull(),
  displayName: varchar('display_name', { length: 200 }).notNull(),
  description: text('description'),
  required: boolean('required').default(false),
  sortOrder: integer('sort_order').default(0),
  active: boolean('active').default(true),
}, (table) => [
  index('business_document_types_country_idx').on(table.countryCode),
  index('business_document_types_active_idx').on(table.active),
]);

export const addressProofTypes = pgTable('address_proof_types', {
  id: uuid('id').defaultRandom().primaryKey(),
  countryCode: varchar('country_code', { length: 2 }).notNull(),
  proofType: varchar('proof_type', { length: 100 }).notNull(),
  displayName: varchar('display_name', { length: 200 }).notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').default(0),
  active: boolean('active').default(true),
}, (table) => [
  index('address_proof_types_country_idx').on(table.countryCode),
  index('address_proof_types_active_idx').on(table.active),
]);
