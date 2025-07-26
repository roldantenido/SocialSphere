import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import { isSetupComplete } from './setup';

// Default configuration - will be overridden after setup
const dbConfig = {
  host: '0.0.0.0',
  port: 5432,
  database: 'social_media_app',
  user: 'social_user',
  password: 'social_pass_2024',
  ssl: false
};

let pool: Pool | null = null;
let db: any = null;

export async function initializeDatabase() {
  if (!(await isSetupComplete())) {
    throw new Error('Setup not completed');
  }

  if (!pool) {
    pool = new Pool(dbConfig);
    db = drizzle(pool, { schema });
  }

  return { pool, db };
}

export { pool, db };