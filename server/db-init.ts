import { DatabaseMigrator, runDatabaseMigrations } from './migrations';
import { DatabaseStorage } from './storage';
import { isAppConfigured, getAppConfig } from './setup';

/**
 * Initialize database on application startup
 * This handles both configured and unconfigured states
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Check if app is configured
    if (!isAppConfigured()) {
      console.log('🔧 App not configured, skipping database initialization');
      return;
    }

    // Get database configuration
    let databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      const config = getAppConfig();
      if (config?.database) {
        databaseUrl = `postgresql://${config.database.user}:${config.database.password}@${config.database.host}:${config.database.port}/${config.database.name}`;
        process.env.DATABASE_URL = databaseUrl;
      }
    }

    if (!databaseUrl) {
      console.log('⚠️ No database configuration found');
      return;
    }

    console.log('🚀 Initializing database...');
    
    // Run migrations and setup
    await runDatabaseMigrations(databaseUrl);
    
    // Initialize sample data
    const storage = new DatabaseStorage();
    await storage.initializeSampleData();
    
    console.log('✅ Database initialization completed');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    // Don't throw error to prevent app crash
  }
}

/**
 * Setup database with provided configuration
 */
export async function setupDatabaseWithConfig(config: {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}): Promise<void> {
  const migrator = new DatabaseMigrator(config);
  
  try {
    // Ensure database exists
    await migrator.ensureDatabaseExists(config);
    
    // Set environment variable
    const databaseUrl = `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`;
    process.env.DATABASE_URL = databaseUrl;
    
    // Run migrations
    await migrator.safeSchemaUpdate();
    
    // Initialize sample data
    const storage = new DatabaseStorage();
    await storage.initializeSampleData();
    
    console.log('✅ Database setup completed successfully');
    
  } finally {
    await migrator.close();
  }
}