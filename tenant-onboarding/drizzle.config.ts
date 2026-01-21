import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './db/schema/index.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.CONTENT_DB_HOST || 'localhost',
    port: parseInt(process.env.CONTENT_DB_PORT || '5432'),
    user: process.env.CONTENT_DB_USER || 'postgres',
    password: process.env.CONTENT_DB_PASSWORD || '',
    database: process.env.CONTENT_DB_NAME || 'onboarding_content_db',
    ssl: process.env.CONTENT_DB_SSLMODE === 'require' ? { rejectUnauthorized: false } : false,
  },
  verbose: true,
  strict: true,
});
