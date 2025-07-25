
-- Setup script for local PostgreSQL database
-- Run this with: psql -U postgres -f setup-db.sql

-- Create the database user
CREATE USER social_user WITH PASSWORD 'social_pass_2024';

-- Create the database
CREATE DATABASE social_media_app OWNER social_user;

-- Grant all privileges to the user
GRANT ALL PRIVILEGES ON DATABASE social_media_app TO social_user;

-- Connect to the new database and grant schema privileges
\c social_media_app;
GRANT ALL ON SCHEMA public TO social_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO social_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO social_user;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\echo 'Database setup completed successfully!'
