import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';
import * as schema from '@shared/schema';
import fs from 'fs/promises';
import path from 'path';

export interface MigrationConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export class DatabaseMigrator {
  private pool: Pool;
  private db: any;

  constructor(config: MigrationConfig | string) {
    if (typeof config === 'string') {
      // Connection string format
      this.pool = new Pool({
        connectionString: config,
        ssl: false
      });
    } else {
      // Object format
      this.pool = new Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
        ssl: false
      });
    }
    
    this.db = drizzle(this.pool, { schema });
  }

  async ensureDatabaseExists(config: MigrationConfig): Promise<void> {
    // Connect to postgres database to create user and database
    const postgresPool = new Pool({
      host: config.host,
      port: config.port,
      database: 'postgres',
      user: 'postgres',
      password: process.env.POSTGRES_ROOT_PASSWORD || 'postgres',
      ssl: false
    });

    try {
      const client = await postgresPool.connect();
      
      // Create user if not exists
      try {
        await client.query(`CREATE USER "${config.user}" WITH PASSWORD '${config.password}';`);
        console.log('✅ Database user created');
      } catch (error: any) {
        if (error.code === '42710') {
          console.log('ℹ️ Database user already exists');
        } else {
          console.error('Error creating user:', error.message);
        }
      }

      // Create database if not exists
      try {
        await client.query(`CREATE DATABASE "${config.database}" OWNER "${config.user}";`);
        console.log('✅ Database created');
      } catch (error: any) {
        if (error.code === '42P04') {
          console.log('ℹ️ Database already exists');
        } else {
          console.error('Error creating database:', error.message);
        }
      }

      // Grant privileges
      try {
        await client.query(`GRANT ALL PRIVILEGES ON DATABASE "${config.database}" TO "${config.user}";`);
        console.log('✅ Database privileges granted');
      } catch (error: any) {
        console.log('ℹ️ Privileges already granted or error:', error.message);
      }

      client.release();
    } catch (error) {
      console.error('Error ensuring database exists:', error);
      throw error;
    } finally {
      await postgresPool.end();
    }
  }

  async createMigrationsTable(): Promise<void> {
    await this.db.execute(sql`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at timestamp DEFAULT now()
      );
    `);
  }

  async runMigrations(): Promise<void> {
    try {
      console.log('🔄 Creating migrations table...');
      await this.createMigrationsTable();
      
      console.log('🔄 Running database migrations...');
      
      // Check if migrations folder exists
      const migrationsPath = path.join(process.cwd(), 'migrations');
      try {
        await fs.access(migrationsPath);
      } catch {
        console.log('📁 Creating migrations folder...');
        await fs.mkdir(migrationsPath, { recursive: true });
        
        // Generate initial migration
        await this.generateMigration('initial_schema');
      }
      
      // Run migrations
      await migrate(this.db, { migrationsFolder: migrationsPath });
      console.log('✅ Migrations completed successfully');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  async generateMigration(name: string): Promise<void> {
    const { execSync } = await import('child_process');
    try {
      console.log(`🔄 Generating migration: ${name}`);
      execSync(`npx drizzle-kit generate --name ${name}`, { stdio: 'inherit' });
      console.log('✅ Migration generated successfully');
    } catch (error) {
      console.error('❌ Failed to generate migration:', error);
      throw error;
    }
  }

  async pushSchema(): Promise<void> {
    try {
      console.log('🔄 Pushing schema changes...');
      const { execSync } = await import('child_process');
      execSync('npx drizzle-kit push', { stdio: 'inherit' });
      console.log('✅ Schema pushed successfully');
    } catch (error) {
      console.error('❌ Schema push failed:', error);
      throw error;
    }
  }

  async backupDatabase(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `backup_${timestamp}.json`;
    
    try {
      console.log(`🔄 Creating database backup: ${backupFile}`);
      
      // Create a simple JSON backup instead of using pg_dump
      const tables = ['users', 'posts', 'comments', 'likes', 'friendships', 'chat_messages'];
      const backup: any = {};
      
      for (const table of tables) {
        try {
          const result = await this.db.execute(sql`SELECT * FROM ${sql.identifier(table)}`);
          backup[table] = result.rows;
        } catch (error) {
          console.log(`Table ${table} not found, skipping...`);
          backup[table] = [];
        }
      }
      
      await fs.writeFile(backupFile, JSON.stringify(backup, null, 2));
      console.log('✅ Database backup created successfully');
      return backupFile;
    } catch (error) {
      console.error('❌ Database backup failed:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async safeSchemaUpdate(): Promise<void> {
    try {
      console.log('🔄 Starting safe schema update...');
      
      // 1. Test connection
      const connected = await this.testConnection();
      if (!connected) {
        throw new Error('Cannot connect to database');
      }

      // 2. Create backup
      await this.backupDatabase();

      // 3. Run migrations
      await this.runMigrations();

      console.log('✅ Safe schema update completed successfully');
    } catch (error) {
      console.error('❌ Safe schema update failed:', error);
      throw error;
    }
  }
}

// Helper function to run migrations with config
export async function runDatabaseMigrations(config: MigrationConfig | string): Promise<void> {
  const migrator = new DatabaseMigrator(config);
  
  try {
    if (typeof config === 'object') {
      await migrator.ensureDatabaseExists(config);
    }
    await migrator.safeSchemaUpdate();
  } finally {
    await migrator.close();
  }
}

// CLI migration runner
export async function runMigrationCLI(): Promise<void> {
  const config = process.env.DATABASE_URL;
  if (!config) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  try {
    await runDatabaseMigrations(config);
    console.log('✅ All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}