
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

// Function to test database connection
async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✅ Database connection test successful');
    return true;
  } catch (error) {
    console.log('ℹ️ Database connection test failed, this is normal during setup:', (error as Error).message);
    return false;
  }
}

// Test database connection only if configured
if (process.env.DATABASE_URL) {
  testDatabaseConnection().catch(() => {
    // Connection failed, which is expected during initial setup
  });
}

// Create pool based on configuration
let poolConfig = dbConfig;
if (process.env.DATABASE_URL) {
  // Use configured DATABASE_URL if available
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: false
  } as any;
}

export const pool = new Pool(poolConfig);
export const db = drizzle(pool, { schema });
