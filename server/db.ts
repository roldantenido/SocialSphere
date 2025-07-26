
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

// Function to ensure database and user exist
async function ensureDatabaseExists() {
  // First connect to postgres database to create user and database
  const postgresPool = new Pool({
    ...dbConfig,
    database: 'postgres', // Connect to default postgres database
    user: 'postgres',
    password: 'postgres' // Assuming default postgres password
  });

  try {
    const client = await postgresPool.connect();
    
    // Create user if not exists
    try {
      await client.query(`CREATE USER ${dbConfig.user} WITH PASSWORD '${dbConfig.password}';`);
      console.log('✅ Database user created');
    } catch (error: any) {
      if (error.code === '42710') { // User already exists
        console.log('ℹ️ Database user already exists');
      } else {
        console.error('Error creating user:', error.message);
      }
    }

    // Create database if not exists
    try {
      await client.query(`CREATE DATABASE ${dbConfig.database} OWNER ${dbConfig.user};`);
      console.log('✅ Database created');
    } catch (error: any) {
      if (error.code === '42P04') { // Database already exists
        console.log('ℹ️ Database already exists');
      } else {
        console.error('Error creating database:', error.message);
      }
    }

    // Grant privileges
    try {
      await client.query(`GRANT ALL PRIVILEGES ON DATABASE ${dbConfig.database} TO ${dbConfig.user};`);
      console.log('✅ Database privileges granted');
    } catch (error: any) {
      console.log('ℹ️ Privileges already granted or error:', error.message);
    }

    client.release();
  } catch (error) {
    console.error('Error ensuring database exists:', error);
  } finally {
    await postgresPool.end();
  }
}

// Initialize database setup only if configured
if (process.env.DATABASE_URL) {
  ensureDatabaseExists().catch(console.error);
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
