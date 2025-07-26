
import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcrypt';

export interface SetupConfig {
  siteName: string;
  dbHost: string;
  dbPort: number;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  adminUsername: string;
  adminPassword: string;
}

const SETUP_FILE = path.join(process.cwd(), '.setup-complete');

export async function isSetupComplete(): Promise<boolean> {
  try {
    await fs.access(SETUP_FILE);
    return true;
  } catch {
    return false;
  }
}

export async function markSetupComplete(): Promise<void> {
  await fs.writeFile(SETUP_FILE, new Date().toISOString());
}

export async function testDatabaseConnection(config: SetupConfig): Promise<boolean> {
  // If we're in development with Replit PostgreSQL, test the existing connection
  if (process.env.NODE_ENV === 'development' && process.env.DATABASE_URL) {
    const testPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false
    });

    try {
      const client = await testPool.connect();
      client.release();
      await testPool.end();
      return true;
    } catch (error) {
      await testPool.end();
      return false;
    }
  }

  // For custom database configuration
  const testPool = new Pool({
    host: config.dbHost,
    port: config.dbPort,
    database: 'postgres', // Connect to default database first
    user: config.dbUser,
    password: config.dbPassword,
    ssl: false
  });

  try {
    const client = await testPool.connect();
    client.release();
    await testPool.end();
    return true;
  } catch (error) {
    await testPool.end();
    return false;
  }
}

export async function createDatabaseAndUser(config: SetupConfig): Promise<void> {
  // If we're in development with Replit PostgreSQL, skip database creation
  if (process.env.NODE_ENV === 'development' && process.env.DATABASE_URL) {
    return; // Database already exists in Replit
  }

  // Connect to postgres database to create user and database
  const adminPool = new Pool({
    host: config.dbHost,
    port: config.dbPort,
    database: 'postgres',
    user: config.dbUser,
    password: config.dbPassword,
    ssl: false
  });

  try {
    const client = await adminPool.connect();
    
    // Create database if not exists
    try {
      await client.query(`CREATE DATABASE "${config.dbName}";`);
    } catch (error: any) {
      if (error.code !== '42P04') { // Database already exists
        throw error;
      }
    }

    client.release();
  } finally {
    await adminPool.end();
  }
}

export async function initializeDatabase(config: SetupConfig): Promise<void> {
  const { drizzle } = await import('drizzle-orm/node-postgres');
  const schema = await import('@shared/schema');
  
  let pool: Pool;
  
  // Use Replit PostgreSQL if in development
  if (process.env.NODE_ENV === 'development' && process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false
    });
  } else {
    pool = new Pool({
      host: config.dbHost,
      port: config.dbPort,
      database: config.dbName,
      user: config.dbUser,
      password: config.dbPassword,
      ssl: false
    });
  }

  const db = drizzle(pool, { schema });
  
  try {
    // Create admin user
    const hashedPassword = await bcrypt.hash(config.adminPassword, 10);
    
    await db.insert(schema.users).values({
      email: config.adminUsername,
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      isAdmin: true
    });
    
  } finally {
    await pool.end();
  }
}

export function createDatabaseConfig(config: SetupConfig): string {
  return `// Auto-generated database configuration
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const dbConfig = {
  host: '${config.dbHost}',
  port: ${config.dbPort},
  database: '${config.dbName}',
  user: '${config.dbUser}',
  password: '${config.dbPassword}',
  ssl: false
};

export const pool = new Pool(dbConfig);
export const db = drizzle(pool, { schema });
`;
}
