# 🚀 Deployment Guide

## Enterprise Car Rental Management SaaS

This guide will help you deploy the application to production.

---

## 📋 Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Production MySQL database provisioned
- [ ] Redis instance provisioned (optional, for future caching)
- [ ] Domain name configured
- [ ] SSL certificate obtained
- [ ] Environment variables configured
- [ ] Backup strategy in place

### 2. Security Review
- [ ] Strong JWT secrets generated
- [ ] Database credentials secured
- [ ] CORS origins configured
- [ ] Rate limiting configured
- [ ] Security headers verified
- [ ] Audit logging enabled

### 3. Performance Optimization
- [ ] Database indexes verified
- [ ] Connection pooling configured
- [ ] Query optimization reviewed
- [ ] Caching strategy planned

### 4. Monitoring & Logging
- [ ] Error tracking configured (e.g., Sentry)
- [ ] Application monitoring setup (e.g., New Relic, DataDog)
- [ ] Log aggregation configured
- [ ] Uptime monitoring enabled
- [ ] Alert notifications configured

---

## 🔧 Environment Variables

Create a `.env` file in `packages/backend/` with the following:

```env
# Database
DATABASE_URL="mysql://username:password@host:3306/database_name"

# JWT Secrets (Generate strong random strings)
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-32-chars"

# Server
NODE_ENV="production"
PORT=5000

# CORS
CORS_ORIGIN="https://your-frontend-domain.com"

# Optional: Redis (for future caching)
REDIS_URL="redis://username:password@host:6379"

# Optional: File Storage
AWS_S3_BUCKET="your-bucket-name"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"

# Optional: Email Service
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="your-email@example.com"
SMTP_PASSWORD="your-password"
SMTP_FROM="noreply@your-domain.com"

# Optional: SMS Service
TWILIO_ACCOUNT_SID="your-account-sid"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"

# Optional: Error Tracking
SENTRY_DSN="your-sentry-dsn"
```

---

## 🗄️ Database Setup

### 1. Create Production Database

```sql
CREATE DATABASE car_rental_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'car_rental_user'@'%' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON car_rental_prod.* TO 'car_rental_user'@'%';
FLUSH PRIVILEGES;
```

### 2. Run Migrations

```bash
cd packages/backend
npm run prisma:migrate deploy
```

### 3. Verify Database

```bash
npm run prisma:studio
```

---

## 🏗️ Build Process

### 1. Install Dependencies

```bash
npm install --production
```

### 2. Build TypeScript

```bash
cd packages/backend
npm run build
```

### 3. Verify Build

```bash
ls -la dist/
```

---

## 🐳 Docker Deployment

### Option 1: Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: ./packages/backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - CORS_ORIGIN=${CORS_ORIGIN}
    restart: unless-stopped
    depends_on:
      - mysql
      - redis

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: car_rental_prod
      MYSQL_USER: car_rental_user
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  mysql_data:
  redis_data:
```

### Option 2: Dockerfile

Create `packages/backend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/backend ./packages/backend

# Generate Prisma client
WORKDIR /app/packages/backend
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/

# Install production dependencies only
RUN npm ci --production

# Copy built files and Prisma
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/backend/prisma ./packages/backend/prisma
COPY --from=builder /app/packages/backend/node_modules/.prisma ./packages/backend/node_modules/.prisma

WORKDIR /app/packages/backend

EXPOSE 5000

CMD ["node", "dist/index.js"]
```

### Build and Run

```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## ☁️ Cloud Deployment

### AWS Deployment

#### 1. RDS (MySQL)
```bash
# Create RDS MySQL instance
aws rds create-db-instance \
  --db-instance-identifier car-rental-db \
  --db-instance-class db.t3.medium \
  --engine mysql \
  --master-username admin \
  --master-user-password YourPassword \
  --allocated-storage 100
```

#### 2. ElastiCache (Redis)
```bash
# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id car-rental-cache \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1
```

#### 3. Elastic Beanstalk
```bash
# Initialize EB
eb init -p node.js car-rental-api

# Create environment
eb create production

# Deploy
eb deploy
```

### DigitalOcean Deployment

#### 1. Create Droplet
- Choose Ubuntu 22.04 LTS
- Select appropriate size (2GB RAM minimum)
- Add SSH key

#### 2. Setup Server
```bash
# SSH into droplet
ssh root@your-droplet-ip

# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install MySQL
apt install -y mysql-server

# Install PM2
npm install -g pm2

# Clone repository
git clone <your-repo-url>
cd car-rental-management-saas

# Install dependencies
npm install

# Setup database
mysql -u root -p < setup.sql

# Build application
cd packages/backend
npm run build

# Start with PM2
pm2 start dist/index.js --name car-rental-api
pm2 save
pm2 startup
```

### Heroku Deployment

```bash
# Login to Heroku
heroku login

# Create app
heroku create car-rental-api

# Add MySQL addon
heroku addons:create jawsdb:kitefin

# Add Redis addon
heroku addons:create heroku-redis:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret
heroku config:set JWT_REFRESH_SECRET=your-refresh-secret

# Deploy
git push heroku main

# Run migrations
heroku run npm run prisma:migrate deploy
```

---

## 🔒 SSL/TLS Setup

### Using Let's Encrypt (Free)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Obtain certificate
certbot --nginx -d api.your-domain.com

# Auto-renewal
certbot renew --dry-run
```

### Nginx Configuration

Create `/etc/nginx/sites-available/car-rental-api`:

```nginx
server {
    listen 80;
    server_name api.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/car-rental-api /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 📊 Monitoring Setup

### PM2 Monitoring

```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs car-rental-api

# View metrics
pm2 describe car-rental-api
```

### Sentry Error Tracking

```bash
npm install @sentry/node

# Add to index.ts
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
})
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: |
          cd packages/backend
          npm run build

      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/car-rental-api
            git pull origin main
            npm install
            cd packages/backend
            npm run build
            pm2 restart car-rental-api
```

---

## 🔐 Security Hardening

### 1. Firewall Setup

```bash
# UFW (Ubuntu)
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 2. Fail2Ban

```bash
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

### 3. Database Security

```sql
-- Remove anonymous users
DELETE FROM mysql.user WHERE User='';

-- Disallow root login remotely
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');

-- Remove test database
DROP DATABASE IF EXISTS test;

-- Reload privileges
FLUSH PRIVILEGES;
```

---

## 📦 Backup Strategy

### Database Backups

```bash
# Create backup script
cat > /usr/local/bin/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mysql"
mkdir -p $BACKUP_DIR

mysqldump -u root -p$MYSQL_ROOT_PASSWORD car_rental_prod | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
EOF

chmod +x /usr/local/bin/backup-db.sh

# Add to crontab (daily at 2 AM)
echo "0 2 * * * /usr/local/bin/backup-db.sh" | crontab -
```

---

## 🧪 Post-Deployment Testing

### 1. Health Check

```bash
curl https://api.your-domain.com/health
```

### 2. Authentication Test

```bash
curl -X POST https://api.your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

### 3. Load Testing

```bash
# Install Apache Bench
apt install -y apache2-utils

# Run load test
ab -n 1000 -c 10 https://api.your-domain.com/health
```

---

## 📈 Scaling Strategies

### Horizontal Scaling

1. **Load Balancer**: Use Nginx or AWS ELB
2. **Multiple Instances**: Run multiple app instances
3. **Session Management**: Use Redis for session storage
4. **Database Read Replicas**: For read-heavy operations

### Vertical Scaling

1. **Increase Server Resources**: More CPU/RAM
2. **Database Optimization**: Tune MySQL configuration
3. **Connection Pooling**: Optimize Prisma connection pool

---

## 🆘 Troubleshooting

### Common Issues

#### 1. Database Connection Errors
```bash
# Check MySQL status
systemctl status mysql

# Check connection
mysql -u car_rental_user -p -h localhost car_rental_prod
```

#### 2. Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

#### 3. Permission Errors
```bash
# Fix file permissions
chown -R www-data:www-data /var/www/car-rental-api
chmod -R 755 /var/www/car-rental-api
```

---

## 📞 Support

For deployment issues:
- Email: devops@your-company.com
- Slack: #car-rental-deployments
- On-call: +1-XXX-XXX-XXXX

---

**Last Updated**: February 12, 2026  
**Version**: 1.0.0
