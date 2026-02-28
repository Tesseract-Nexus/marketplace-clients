import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { getSecretWithFallback } from '@/lib/gcp-secrets';

// Type for our database instance with schema
type DbType = NodePgDatabase<typeof schema>;

// Singleton pattern for connection pool
let pool: Pool | null = null;
let dbInstance: DbType | null = null;

async function getPassword(): Promise<string> {
  const password = await getSecretWithFallback(
    'CONTENT_DB_PASSWORD_SECRET_NAME',
    'CONTENT_DB_PASSWORD'
  );
  return password || '';
}

async function getPool(): Promise<Pool> {
  if (!pool) {
    const password = await getPassword();

    pool = new Pool({
      host: process.env.CONTENT_DB_HOST || 'localhost',
      port: parseInt(process.env.CONTENT_DB_PORT || '5432'),
      user: process.env.CONTENT_DB_USER || 'postgres',
      password: password,
      database: process.env.CONTENT_DB_NAME || 'onboarding_content_db',
      ssl: process.env.CONTENT_DB_SSLMODE === 'require'
        ? { rejectUnauthorized: process.env.CONTENT_DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
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

// Async function to get database instance
export async function getDb(): Promise<DbType> {
  if (!dbInstance) {
    const poolInstance = await getPool();
    dbInstance = drizzle(poolInstance, { schema });
  }
  return dbInstance;
}

export { schema };
export type Database = DbType;
