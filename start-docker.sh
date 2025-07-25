
#!/bin/bash

# Generate random credentials
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
DB_NAME="social_media_$(date +%s)"

echo "🔐 Generated database credentials:"
echo "Database: $DB_NAME"
echo "User: postgres"
echo "Password: $DB_PASSWORD"

# Create .env file with random credentials
cat > .env << EOF
# Database Configuration
POSTGRES_DB=$DB_NAME
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$DB_PASSWORD
DATABASE_URL=postgresql://postgres:$DB_PASSWORD@postgres:5432/$DB_NAME

# Application Configuration
NODE_ENV=production
PORT=50725
EOF

echo "✅ Created .env file with random credentials"

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down --remove-orphans 2>/dev/null || true

# Build and start the containers
echo "🚀 Building and starting containers..."
docker-compose up --build -d

echo "⏳ Waiting for database to be ready..."
sleep 10

echo "🎉 Application started successfully!"
echo "📡 Access your app at: http://localhost:50725"
echo "🔐 Database credentials saved in .env file"
