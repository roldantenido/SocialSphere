# aapanel Deployment Guide

Deploy your social media application on a VPS with aapanel control panel.

## 🎯 Prerequisites

1. **VPS with aapanel installed**
   - Ubuntu 18.04+ or CentOS 7+
   - At least 2GB RAM, 20GB disk space
   - aapanel installed and running

2. **Domain name** (optional but recommended)
   - Pointed to your VPS IP address
   - DNS propagated

## 🚀 Quick Installation

### Method 1: One-Command Installation

```bash
# Download and run the aapanel deployment script
wget https://raw.githubusercontent.com/yourusername/social-media-app/main/aapanel-deploy.sh
chmod +x aapanel-deploy.sh
sudo ./aapanel-deploy.sh
```

### Method 2: Manual Step-by-Step

1. **Access your aapanel**
   ```
   https://your-vps-ip:8888
   ```

2. **Install Docker via aapanel**
   - Go to **App Store** → **Runtime Environment**
   - Install **Docker** and **Docker Compose**

3. **Create application directory**
   ```bash
   mkdir -p /www/wwwroot/social-media-app
   cd /www/wwwroot/social-media-app
   ```

4. **Download deployment files**
   ```bash
   wget https://raw.githubusercontent.com/yourusername/social-media-app/main/docker-compose.yml
   wget https://raw.githubusercontent.com/yourusername/social-media-app/main/.env.example
   cp .env.example .env
   nano .env  # Edit with your settings
   ```

5. **Deploy the application**
   ```bash
   docker-compose up -d
   ```

## 🔧 aapanel Configuration

### 1. Website Management

1. **Create a new website in aapanel:**
   - Go to **Website** → **Add Site**
   - Domain: `your-domain.com`
   - Root Directory: `/www/wwwroot/social-media-app`
   - PHP Version: Not needed (Node.js app)

2. **Configure reverse proxy:**
   - Click **Settings** next to your domain
   - Go to **Reverse Proxy**
   - Add proxy: `http://127.0.0.1:5000`

### 2. SSL Certificate (Recommended)

1. **In aapanel Website settings:**
   - Go to **SSL** tab
   - Choose **Let's Encrypt** for free SSL
   - Enable **Force HTTPS**

### 3. Database Management

1. **Monitor PostgreSQL:**
   - Go to **Database** section
   - View Docker containers in **Docker** section
   - Check container logs and status

### 4. File Management

1. **Access application files:**
   - Use aapanel **File Manager**
   - Navigate to `/www/wwwroot/social-media-app`
   - Edit configuration files as needed

## 📊 Monitoring and Management

### Through aapanel Interface

1. **Docker Management:**
   - **App Store** → **Docker** → **Container Management**
   - View, start, stop, restart containers
   - Check logs and resource usage

2. **System Monitoring:**
   - **System** → **System Status**
   - Monitor CPU, RAM, disk usage
   - View running processes

3. **Log Management:**
   - **Logs** section for system logs
   - Docker container logs via Docker management

### Command Line

```bash
# Navigate to app directory
cd /www/wwwroot/social-media-app

# View running containers
docker-compose ps

# View logs
docker-compose logs -f app
docker-compose logs -f postgres

# Restart services
docker-compose restart

# Update application
docker-compose pull app
docker-compose up -d

# Stop services
docker-compose down
```

## 🔒 Security Configuration

### 1. Firewall Settings

In aapanel **Security** section:
- Allow port 80 (HTTP)
- Allow port 443 (HTTPS)
- Allow port 5000 (direct app access, optional)
- Block unnecessary ports

### 2. SSL and HTTPS

1. **Enable SSL in aapanel:**
   - Website Settings → SSL
   - Use Let's Encrypt or upload custom certificate
   - Enable "Force HTTPS redirect"

2. **Security headers (automatic with aapanel SSL)**

### 3. Database Security

- PostgreSQL runs in isolated Docker network
- Database password stored in .env file
- No external database access by default

## 📈 Performance Optimization

### 1. aapanel Settings

1. **PHP/Nginx Optimization:**
   - Even though this is a Node.js app, optimize Nginx as reverse proxy
   - **Website** → **Settings** → **Performance**
   - Enable Gzip compression
   - Set appropriate cache headers

2. **System Resources:**
   - **System** → **Performance Tuning**
   - Adjust for Docker containers

### 2. Docker Resource Limits

Edit `docker-compose.yml` to add resource limits:

```yaml
services:
  app:
    # ... other settings
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
  
  postgres:
    # ... other settings
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.25'
```

## 🔄 Backup and Maintenance

### 1. Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres social_media > backup_$(date +%Y%m%d).sql

# Restore backup
docker-compose exec -T postgres psql -U postgres social_media < backup_20250120.sql
```

### 2. File Backup

Use aapanel's **Backup** feature:
- Schedule backups of `/www/wwwroot/social-media-app`
- Include database dumps
- Store backups on external storage

### 3. Updates

```bash
# Update application
cd /www/wwwroot/social-media-app
docker-compose pull app
docker-compose up -d

# Update system via aapanel
# Go to System → Update to update aapanel and system packages
```

## 🚨 Troubleshooting

### Common Issues

1. **aapanel not accessible:**
   ```bash
   # Check aapanel status
   sudo systemctl status bt
   
   # Restart aapanel
   sudo systemctl restart bt
   ```

2. **Docker containers not starting:**
   ```bash
   # Check Docker service
   sudo systemctl status docker
   
   # View container logs
   docker-compose logs
   ```

3. **Database connection errors:**
   ```bash
   # Check PostgreSQL container
   docker-compose ps postgres
   
   # Check database logs
   docker-compose logs postgres
   ```

4. **Port conflicts:**
   - Check aapanel website bindings
   - Ensure no other services use port 5000
   - Use aapanel **System** → **Process** to check

### aapanel Specific Issues

1. **Reverse proxy not working:**
   - Check proxy configuration in Website settings
   - Verify target URL: `http://127.0.0.1:5000`
   - Test direct access: `curl http://localhost:5000`

2. **SSL certificate issues:**
   - Use aapanel SSL management
   - Check domain DNS records
   - Verify certificate paths

## 🎯 Best Practices

1. **Security:**
   - Use strong passwords for database and aapanel
   - Keep aapanel updated
   - Enable fail2ban if available
   - Regular security scans

2. **Performance:**
   - Monitor resource usage in aapanel
   - Set up log rotation
   - Use CDN for static assets
   - Regular database maintenance

3. **Backup:**
   - Automated daily backups
   - Test restore procedures
   - Multiple backup locations

4. **Monitoring:**
   - Set up aapanel alerts
   - Monitor application logs
   - Track performance metrics

Your social media application will be accessible at:
- **Domain**: `https://your-domain.com` (with SSL)
- **Direct IP**: `http://your-vps-ip:5000`

The aapanel interface provides easy management of all aspects of your deployment!