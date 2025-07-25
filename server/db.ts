
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Hardcoded database configuration for local PostgreSQL
const dbConfig = {
  host: '0.0.0.0',
  port: 5432,
  database: 'social_media_app',
  user: 'social_user',
  password: 'social_pass_2024',
  ssl: false
};

export const pool = new Pool(dbConfig);
export const db = drizzle(pool, { schema });
