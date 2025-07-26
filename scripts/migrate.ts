#!/usr/bin/env tsx

/**
 * Database Migration Script
 * 
 * This script handles database migrations and schema updates safely.
 * It can be run during deployment or development to ensure the database
 * schema is up to date while preserving existing data.
 */

import { runMigrationCLI } from '../server/migrations';

// Run migrations
runMigrationCLI();