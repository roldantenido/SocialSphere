
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import { isSetupComplete } from './setup';

let pool: Pool | null = null;
let db: any = null;

export async function initializeDatabase() {
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
