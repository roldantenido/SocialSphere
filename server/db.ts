
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import { isSetupComplete } from './setup';

let pool: Pool | null = null;
let db: any = null;

export async function initializeDatabase() {
  // Check if we're in development mode (Option 1)
  if (process.env.NODE_ENV === 'development' && process.env.DATABASE_URL) {
    console.log('🟢 Using development database (Replit PostgreSQL)');
    if (!pool) {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false
      });
      db = drizzle(pool, { schema });
    }
    return { pool, db };
  }

  // For production deployment, check if setup is complete (Option 2)
  if (!(await isSetupComplete())) {
    return { pool: null, db: null };
  }

  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    });
    db = drizzle(pool, { schema });
  }

  return { pool, db };
}

export async function getDatabase() {
  // Check if we're in development mode (Option 1)
  if (process.env.NODE_ENV === 'development' && process.env.DATABASE_URL) {
    if (!pool) {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false
      });
      db = drizzle(pool, { schema });
    }
    return { pool, db };
  }

  // For production deployment, check if setup is complete (Option 2)
  if (!(await isSetupComplete())) {
    throw new Error('Setup not completed');
  }

  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    });
    db = drizzle(pool, { schema });
  }

  return { pool, db };
}

export { pool, db };
