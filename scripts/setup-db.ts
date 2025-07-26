#!/usr/bin/env tsx

/**
 * Database Setup Script
 * 
 * This script sets up the database from scratch, creating the database,
 * running migrations, and initializing sample data.
 */

import { DatabaseMigrator, MigrationConfig } from '../server/migrations';
import { DatabaseStorage } from '../server/storage';

async function setupDatabase() {
  console.log('🚀 Starting database setup...');

  // Check for configuration
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is required');
    console.log('Example: DATABASE_URL=postgresql://user:password@localhost:5432/database');
    process.exit(1);
  }

  try {
    // Parse DATABASE_URL
    const url = new URL(databaseUrl);
    const config: MigrationConfig = {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1), // Remove leading slash
      user: url.username,
      password: url.password
    };

    console.log(`📍 Connecting to database: ${config.host}:${config.port}/${config.database}`);

    // Initialize migrator
    const migrator = new DatabaseMigrator(config);

    try {
      // 1. Ensure database exists
      console.log('🔄 Ensuring database exists...');
      await migrator.ensureDatabaseExists(config);

      // 2. Run migrations
      console.log('🔄 Running migrations...');
      await migrator.runMigrations();

      // 3. Initialize sample data
      console.log('🔄 Initializing sample data...');
      const storage = new DatabaseStorage();
      await storage.initializeSampleData();

      console.log('✅ Database setup completed successfully!');
      console.log('🎉 Your social media application is ready to use');

    } finally {
      await migrator.close();
    }

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    console.log('\n💡 Troubleshooting tips:');
    console.log('- Ensure PostgreSQL is running');
    console.log('- Check your DATABASE_URL format');
    console.log('- Verify database credentials');
    console.log('- Ensure the database server is accessible');
    process.exit(1);
  }
}

setupDatabase();