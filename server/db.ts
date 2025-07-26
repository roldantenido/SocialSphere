
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import { isSetupComplete } from './setup';

let pool: Pool | null = null;
let db: any = null;

export async function initializeDatabase() {
  // Check if we're in Replit and have DATABASE_URL
  if (process.env.REPLIT_CLUSTER && process.env.DATABASE_URL) {
    console.log('🟢 Using Replit PostgreSQL database');
    if (!pool) {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: false
      });
      db = drizzle(pool, { schema });
    }
    return { pool, db };
  }

  // Otherwise, check if setup is complete for custom database
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
  // Check if we're in Replit and have DATABASE_URL
  if (process.env.REPLIT_CLUSTER && process.env.DATABASE_URL) {
    if (!pool) {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: false
      });
      db = drizzle(pool, { schema });
    }
    return { pool, db };
  }

  // Otherwise, check if setup is complete
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
