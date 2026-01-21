import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Singleton pattern for connection pool
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.CONTENT_DB_HOST || 'localhost',
      port: parseInt(process.env.CONTENT_DB_PORT || '5432'),
      user: process.env.CONTENT_DB_USER || 'postgres',
      password: process.env.CONTENT_DB_PASSWORD || '',
      database: process.env.CONTENT_DB_NAME || 'onboarding_content_db',
      ssl: process.env.CONTENT_DB_SSLMODE === 'require'
        ? { rejectUnauthorized: false }
        : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  return pool;
}

export const db = drizzle(getPool(), { schema });
export { schema };
export type Database = typeof db;
