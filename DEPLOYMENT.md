# Docker Deployment Guide

This guide explains how to deploy the social media application on your own VPS using Docker.

## Prerequisites

1. **VPS with Docker installed**
   ```bash
   # Install Docker on Ubuntu/Debian
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **Domain name** (optional, for SSL)

## Quick Deployment

1. **Clone/Upload your code to the VPS**
   ```bash
   # Upload your project files to /var/www/social-media/
   scp -r . user@your-vps:/var/www/social-media/
   ```

2. **Configure environment**
   ```bash
   cd /var/www/social-media/
   cp .env.example .env
   nano .env  # Edit with your settings
   ```

3. **Run deployment script**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

## Manual Deployment Steps

### 1. Environment Configuration

Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

Edit the `.env` file with your settings:
- Change `POSTGRES_PASSWORD` to a secure password
- Update `DATABASE_URL` with the same password
- Set your domain in `nginx.conf`

### 2. SSL Setup (Optional but Recommended)

For HTTPS, place your SSL certificates in the `ssl/` directory:
```bash
mkdir ssl
# Copy your SSL certificate files:
# ssl/cert.pem (certificate)
# ssl/key.pem (private key)
```

To get free SSL certificates with Let's Encrypt:
```bash
# Install certbot
sudo apt install certbot

# Get certificate (stop nginx first)
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/key.pem
sudo chown $(whoami):$(whoami) ssl/*
```

### 3. Deploy

Start the application:
```bash
# Build and start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f app
```

### 4. Database Migration

The application will automatically run migrations when it starts. If you need to run them manually:
```bash
# Access the app container
docker-compose exec app sh

# Run migrations
npm run db:push
```

## Service Management

### Start/Stop Services
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart a specific service
docker-compose restart app

# View logs
docker-compose logs -f app
docker-compose logs -f postgres
```

### Updates and Maintenance

To update the application:
```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose build --no-cache app
docker-compose up -d
```

### Backup Database
```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres social_media > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres social_media < backup.sql
```

## Architecture

The deployment includes:

- **App Container**: Node.js application (port 5000)
- **PostgreSQL**: Database with persistent volume
- **Nginx**: Reverse proxy with SSL termination (ports 80/443)

## Security Features

- Non-root user in containers
- Rate limiting on API endpoints
- SSL/TLS encryption
- Security headers
- Firewall-friendly setup

## Monitoring

### Health Checks
```bash
# Check container health
docker-compose ps

# Application health
curl http://localhost:5000/api/auth/me
```

### Logs
```bash
# View real-time logs
docker-compose logs -f

# View specific service logs
docker-compose logs app
docker-compose logs postgres
docker-compose logs nginx
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Check what's using the port
   sudo netstat -tulpn | grep :5000
   
   # Kill the process or change port in docker-compose.yml
   ```

2. **Database connection errors**
   ```bash
   # Check if postgres is running
   docker-compose ps postgres
   
   # Check database logs
   docker-compose logs postgres
   ```

3. **File upload issues**
   ```bash
   # Ensure uploads directory exists and has correct permissions
   mkdir -p uploads
   chmod 755 uploads
   ```

### Performance Tuning

For production use, consider:
- Adding Redis for session storage
- Setting up log rotation
- Configuring database connection pooling
- Adding monitoring with Prometheus/Grafana

## Firewall Configuration

Open required ports:
```bash
# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Optional: Allow direct app access
sudo ufw allow 5000
```

## Domain Setup

Point your domain to your VPS IP:
```
A record: your-domain.com → YOUR_VPS_IP
A record: www.your-domain.com → YOUR_VPS_IP
```

The application will be available at:
- HTTP: http://your-domain.com
- HTTPS: https://your-domain.com (if SSL configured)