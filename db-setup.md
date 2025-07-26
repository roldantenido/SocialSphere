# Database Migration & Setup Guide

This guide explains how to set up and manage database migrations for the social media application, ensuring data integrity during schema changes.

## 🎯 Quick Setup Commands

### For New Installations
```bash
# Setup database from scratch (creates DB, runs migrations, adds sample data)
npm run db:setup

# Or manually:
tsx scripts/setup-db.ts
```

### For Existing Installations (Schema Updates)
```bash
# Generate new migration after schema changes
npm run db:generate

# Apply migrations safely (with backup)
npm run db:migrate

# Or use push for development (no migration files)
npm run db:push
```

## 🏗️ Database Migration System

### Automatic Migration on Startup
The application automatically:
1. Checks if database is configured
2. Runs pending migrations
3. Initializes sample data if needed
4. Handles connection failures gracefully

### Safe Schema Updates
The migration system includes:
- **Automatic Backups**: Creates timestamped backups before migrations
- **Connection Testing**: Verifies database connectivity before changes  
- **Error Handling**: Graceful failure with rollback options
- **Data Preservation**: Existing data is never lost during schema changes

## 📁 File Structure
```
├── server/
│   ├── migrations.ts        # Migration utilities and safety checks
│   ├── db-init.ts          # Database initialization logic
│   ├── db.ts               # Database connection setup
│   └── storage.ts          # Data access layer
├── scripts/
│   ├── migrate.ts          # CLI migration runner
│   └── setup-db.ts         # Complete database setup
├── migrations/             # Generated migration files (auto-created)
└── shared/
    └── schema.ts           # Database schema definitions
```

## 🔧 Configuration Methods

### Method 1: Environment Variable
```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/database"
```

### Method 2: Setup Wizard
- Access the application for the first time
- Follow the setup wizard to configure database connection
- Configuration is saved to `.app-config.json`

### Method 3: Configuration File
Create `.app-config.json`:
```json
{
  "siteName": "Your Social Media Site",
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "social_media_app",
    "user": "social_user",
    "password": "your_password"
  },
  "isSetup": true
}
```

## 🚀 Deployment Integration

### Git Repository
The database migration system is included in Git, so when you:
1. **Clone the repository** → Run `npm run db:setup`
2. **Pull updates** → Run `npm run db:migrate`
3. **Deploy to production** → Migrations run automatically

### Docker Deployment
Add to your Dockerfile:
```dockerfile
# After npm install
RUN npm run db:generate

# In startup script
CMD ["npm", "run", "db:migrate", "&&", "npm", "start"]
```

### VPS/aapanel Deployment
1. Upload files to server
2. Set `DATABASE_URL` environment variable
3. Run `npm run db:setup` for new installs
4. Run `npm run db:migrate` for updates

## 🛡️ Data Safety Features

### Backup System
- Automatic backups before each migration
- Timestamped backup files: `backup_2025-01-26T10-30-45.sql`
- Manual backup: `npm run db:backup`

### Migration Verification
- Tests database connection before changes
- Validates schema integrity
- Rollback support if migrations fail

### Schema Change Detection
- Automatically detects schema changes in `shared/schema.ts`
- Generates appropriate migration files
- Preserves existing data and relationships

## 🔍 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Test connection manually
psql -h localhost -p 5432 -U your_user -d your_database
```

**Migration Failed**
```bash
# Check migration status
npm run db:migrate

# Manual rollback (restore from backup)
psql -h localhost -p 5432 -U user -d database < backup_file.sql
```

**Schema Out of Sync**
```bash
# Reset and regenerate
npm run db:generate
npm run db:push
```

### Debug Mode
Set environment variable for detailed logging:
```bash
export DEBUG=true
npm run db:migrate
```

## 📝 Best Practices

1. **Always backup before major changes**
2. **Test migrations on staging first**
3. **Keep migration files in version control**
4. **Don't edit migration files manually**
5. **Use the setup wizard for first-time installs**
6. **Run migrations during maintenance windows**

## 🎭 Sample Data

The system automatically creates sample users and content:
- Admin user (configurable via setup)
- Sample posts and interactions
- Test friend relationships
- Demo groups and pages

This can be disabled by setting `SKIP_SAMPLE_DATA=true`