
-- Social Media App Database Initialization
-- This script runs automatically when the PostgreSQL container starts for the first time

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable additional extensions that might be useful
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schema if needed (optional)
-- CREATE SCHEMA IF NOT EXISTS social_media;

-- The application will create tables using Drizzle ORM
-- This file can be extended with:
-- - Initial data
-- - Additional database configuration
-- - Custom functions or triggers

-- Example: Create a simple health check function
CREATE OR REPLACE FUNCTION health_check()
RETURNS TEXT AS $$
BEGIN
    RETURN 'Database is healthy at ' || NOW();
END;
$$ LANGUAGE plpgsql;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'Social Media App database initialized successfully';
END $$;
