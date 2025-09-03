# 🚢 Deployment - Production Docker Setup

> **Production-ready deployment configuration with Docker Compose, Nginx load balancing, and automated deployment scripts**

Complete deployment setup for running the Google ADK fullstack template in production with proper scaling, monitoring, and security configurations.

## ✨ Features

### 🐳 **Production Architecture**
- **Multi-Container Setup** - Backend, frontend, MongoDB, MinIO, and Nginx
- **Load Balancing** - Nginx reverse proxy with SSL termination
- **Service Discovery** - Automated container networking
- **Health Monitoring** - Health checks and restart policies
- **Resource Limits** - CPU and memory constraints for stability

### 🔐 **Security & Monitoring**
- **SSL/TLS Support** - Let's Encrypt integration ready
- **Environment Isolation** - Separate production environment variables
- **Log Management** - Centralized logging with rotation
- **Health Checks** - Built-in monitoring and alerting
- **Backup Automation** - Database and file backup scripts

### 🚀 **Deployment Automation**
- **One-Command Deploy** - Automated deployment script
- **Rolling Updates** - Zero-downtime deployments
- **Environment Management** - Development, staging, production profiles
- **Monitoring Dashboard** - Service status and metrics

## 🏗 Architecture

```
Production Environment
├── 🔗 Nginx (Load Balancer)
│   ├── Port 80/443 (HTTP/HTTPS)
│   ├── SSL termination
│   └── Static file serving
│
├── 🚀 Backend Services (Scaled)
│   ├── FastAPI App (Multiple instances)
│   ├── Google ADK Agent
│   └── OpenAPI Tools Framework
│
├── 📱 Frontend (Static Files)
│   ├── TanStack Start SPA
│   ├── Served by Nginx
│   └── CDN-ready assets
│
├── 🗄️ Database Services
│   ├── MongoDB (Sessions)
│   ├── Redis (Optional caching)
│   └── Automated backups
│
└── 📁 Storage Services
    ├── MinIO (S3-compatible)
    ├── File uploads/artifacts
    └── Backup automation
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Domain name (for SSL)
- Basic server (2+ CPU, 4GB+ RAM)

### Production Deployment

```bash
# Clone repository
git clone <your-repo>
cd google-adk-fullstack-template

# Setup production environment
cp deployment/.env.prod.example deployment/.env.prod
# Edit .env.prod with your production values

# Deploy with monitoring
./deployment/deploy.sh prod

# Check status
./deployment/deploy.sh status

# View logs
./deployment/deploy.sh logs
```

## ⚙️ Configuration

### Production Environment Variables

Edit `deployment/.env.prod`:

```bash
# === GENERAL CONFIGURATION ===
ENVIRONMENT=production
DOMAIN=yourdomain.com
SSL_EMAIL=admin@yourdomain.com

# === BACKEND CONFIGURATION ===
# Agent Settings
AGENT_NAME=production_assistant
AGENT_MODEL=gemini-2.0-flash-exp
AGENT_DESCRIPTION="Production AI Assistant"

# Model Provider (Choose one)
MODEL_PROVIDER=gemini
GOOGLE_API_KEY=your_production_google_api_key

# OR use LiteLLM
# MODEL_PROVIDER=litellm
# AGENT_MODEL=openai/gpt-4o
# OPENAI_API_KEY=your_production_openai_key

# Security
JWT_SECRET_KEY=your_super_secret_jwt_key_here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# Server Configuration
DEBUG=false
LOG_LEVEL=WARNING
WORKERS=4

# === DATABASE CONFIGURATION ===
# MongoDB (Sessions)
MONGO_URL=mongodb://mongodb:27017
MONGO_DB_NAME=agent_sessions
MONGO_USERNAME=admin
MONGO_PASSWORD=secure_mongo_password

# Redis (Optional caching)
REDIS_URL=redis://redis:6379/0

# === STORAGE CONFIGURATION ===
# MinIO (S3-compatible)
S3_BUCKET_NAME=agent-artifacts
AWS_ACCESS_KEY_ID=minio_access_key
AWS_SECRET_ACCESS_KEY=minio_secret_key
S3_ENDPOINT_URL=http://minio:9000

# MinIO Admin
MINIO_ROOT_USER=minio_admin
MINIO_ROOT_PASSWORD=secure_minio_password

# === MONITORING & LOGGING ===
# Enable monitoring
ENABLE_MONITORING=true
ENABLE_LOGGING=true

# Log retention (days)
LOG_RETENTION_DAYS=30

# === BACKUP CONFIGURATION ===
BACKUP_ENABLED=true
BACKUP_RETENTION_DAYS=7
BACKUP_SCHEDULE="0 2 * * *"  # Daily at 2 AM
```

### Docker Compose Production

`deployment/docker-compose.prod.yaml` defines the production stack:

```yaml
version: '3.8'

services:
  # Nginx Load Balancer
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
    restart: unless-stopped

  # Backend (Scaled)
  backend:
    build:
      context: ../backend
      dockerfile: Dockerfile
    environment:
      - ENVIRONMENT=production
    env_file:
      - .env.prod
    volumes:
      - ../backend/logs:/app/logs
    deploy:
      replicas: 2  # Scale backend
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    restart: unless-stopped
    
  # MongoDB
  mongodb:
    image: mongo:7
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongodb_data:/data/db
      - ./backups:/backups
    restart: unless-stopped

  # MinIO (S3-compatible storage)
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    volumes:
      - minio_data:/data
      - ./backups:/backups
    restart: unless-stopped

  # Redis (Optional)
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  mongodb_data:
  minio_data:
  redis_data:
```

### Nginx Configuration

`deployment/nginx.conf` handles load balancing and SSL:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
        # Add more backend instances for scaling
        # server backend_2:8000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        
        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

        # Frontend (Static files)
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
            
            # Cache static assets
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
            }
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Rate limiting
            limit_req zone=api burst=20 nodelay;
        }

        # Auth endpoints (stricter rate limiting)
        location ~ ^/(auth|login|register) {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            limit_req zone=login burst=5 nodelay;
        }

        # WebSocket support (for real-time features)
        location /ws/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Health check endpoint
        location /health {
            proxy_pass http://backend;
            access_log off;
        }
    }
}
```

## 🚀 Deployment Script

The `deployment/deploy.sh` script automates deployment:

```bash
#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yaml"
ENV_FILE=".env.prod"
PROJECT_NAME="adk-agent"

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    if [[ ! -f "$ENV_FILE" ]]; then
        error "Environment file $ENV_FILE not found. Copy from .env.prod.example and configure."
    fi
    
    log "Prerequisites check passed"
}

# Deploy application
deploy() {
    log "Starting deployment..."
    
    # Build images
    log "Building images..."
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME build --no-cache
    
    # Start services
    log "Starting services..."
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME up -d
    
    # Wait for services to be healthy
    log "Waiting for services to start..."
    sleep 30
    
    # Check health
    if ! docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME ps | grep -q "Up"; then
        error "Some services failed to start"
    fi
    
    log "Deployment completed successfully!"
    log "Access your application at: https://$(grep DOMAIN $ENV_FILE | cut -d'=' -f2)"
}

# Update application
update() {
    log "Updating application..."
    
    # Pull latest code
    git pull origin main
    
    # Rebuild and restart
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME build --no-cache
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME up -d --force-recreate
    
    log "Update completed!"
}

# Show status
status() {
    log "Checking service status..."
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME ps
    
    echo ""
    log "Resource usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
}

# Show logs
logs() {
    local service=${2:-}
    if [[ -n "$service" ]]; then
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME logs -f $service
    else
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME logs -f
    fi
}

# Backup data
backup() {
    log "Creating backup..."
    
    local backup_date=$(date +%Y%m%d_%H%M%S)
    local backup_dir="./backups/$backup_date"
    mkdir -p $backup_dir
    
    # Backup MongoDB
    log "Backing up MongoDB..."
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME exec -T mongodb \
        mongodump --out /backups/mongodb_$backup_date
    
    # Backup MinIO data
    log "Backing up MinIO..."
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME exec -T minio \
        cp -r /data /backups/minio_$backup_date
    
    log "Backup completed: $backup_dir"
}

# Stop services
stop() {
    log "Stopping services..."
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME down
    log "Services stopped"
}

# Clean up
clean() {
    log "Cleaning up..."
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME down --volumes --remove-orphans
    docker system prune -f
    log "Cleanup completed"
}

# Main script
main() {
    cd "$(dirname "$0")"
    
    case "${1:-}" in
        "prod")
            check_prerequisites
            deploy
            ;;
        "dev")
            log "Starting development environment..."
            docker-compose -f ../docker-compose.yaml up --build
            ;;
        "update")
            check_prerequisites
            update
            ;;
        "status")
            status
            ;;
        "logs")
            logs "$@"
            ;;
        "backup")
            backup
            ;;
        "stop")
            stop
            ;;
        "clean")
            clean
            ;;
        *)
            echo "Usage: $0 {prod|dev|update|status|logs [service]|backup|stop|clean}"
            echo ""
            echo "Commands:"
            echo "  prod     - Deploy production environment"
            echo "  dev      - Start development environment"
            echo "  update   - Update production deployment"
            echo "  status   - Show service status and resource usage"
            echo "  logs     - Show service logs (optional: specify service)"
            echo "  backup   - Create backup of data"
            echo "  stop     - Stop all services"
            echo "  clean    - Clean up containers, volumes, and images"
            exit 1
            ;;
    esac
}

main "$@"
```

## 📊 Monitoring & Logging

### Health Monitoring

The deployment includes health checks for all services:

```yaml
# In docker-compose.prod.yaml
services:
  backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
      
  mongodb:
    healthcheck:
      test: ["CMD", "mongo", "--eval", "db.adminCommand('ismaster')"]
      interval: 30s
      timeout: 10s
      retries: 3
      
  minio:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Log Management

Centralized logging with rotation:

```yaml
# Logging configuration
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        labels: "service=backend"
        
  nginx:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        labels: "service=nginx"
```

### Monitoring Dashboard

Optional monitoring with Grafana and Prometheus:

```bash
# Enable monitoring
echo "ENABLE_MONITORING=true" >> deployment/.env.prod

# Deploy with monitoring
./deployment/deploy.sh prod

# Access Grafana at https://yourdomain.com/monitoring
```

## 🔧 SSL Certificate Setup

### Let's Encrypt Integration

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Manual SSL Certificate

```bash
# Place your certificates in deployment/ssl/
deployment/ssl/
├── cert.pem      # Your SSL certificate
├── key.pem       # Your private key
└── chain.pem     # Certificate chain (optional)

# Update nginx configuration to use your certificates
```

## 🔄 Backup & Recovery

### Automated Backups

The deployment includes automated backup scripts:

```bash
# Create backup
./deployment/deploy.sh backup

# List backups
ls -la deployment/backups/

# Restore from backup
./deployment/restore.sh 20240101_120000
```

### Manual Backup Commands

```bash
# MongoDB backup
docker-compose -f docker-compose.prod.yaml exec mongodb \
  mongodump --db agent_sessions --out /backups/manual_backup

# MinIO backup
docker-compose -f docker-compose.prod.yaml exec minio \
  mc mirror /data /backups/minio_manual_backup
```

## 📈 Scaling

### Horizontal Scaling

Scale backend instances:

```yaml
# In docker-compose.prod.yaml
services:
  backend:
    deploy:
      replicas: 4  # Increase number of backend instances
```

Update Nginx upstream:

```nginx
# In nginx.conf
upstream backend {
    server backend:8000;
    server backend:8000;
    server backend:8000;
    server backend:8000;
}
```

### Vertical Scaling

Adjust resource limits:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'      # Increase CPU
          memory: 2G       # Increase memory
        reservations:
          cpus: '1.0'
          memory: 1G
```

### Database Scaling

For high-traffic applications:

```bash
# MongoDB replica set
# Redis cluster
# Separate read/write instances
```

## 🔍 Troubleshooting

### Common Issues

**Services won't start:**
```bash
# Check logs
./deployment/deploy.sh logs backend

# Check environment variables
docker-compose -f docker-compose.prod.yaml config

# Verify ports
sudo netstat -tulpn | grep :80
```

**SSL certificate issues:**
```bash
# Check certificate validity
openssl x509 -in deployment/ssl/cert.pem -text -noout

# Test SSL connection
openssl s_client -connect yourdomain.com:443
```

**Database connection errors:**
```bash
# Check MongoDB status
docker-compose -f docker-compose.prod.yaml exec mongodb mongo --eval "db.adminCommand('ismaster')"

# Check environment variables
grep MONGO deployment/.env.prod
```

### Performance Optimization

**Backend optimization:**
```bash
# Increase worker processes
WORKERS=8

# Enable async mode
ASYNC_MODE=true

# Optimize memory settings
MAX_MEMORY=2G
```

**Database optimization:**
```bash
# MongoDB indexing
# Connection pooling
# Query optimization
```

**Nginx optimization:**
```nginx
# Enable gzip compression
gzip on;
gzip_types text/css application/javascript;

# Increase worker connections
worker_connections 2048;

# Enable HTTP/2
listen 443 ssl http2;
```

## 📄 License

This deployment configuration is part of the Google ADK Fullstack Template and follows the same MIT License.

## 🙏 Acknowledgments

- **[Docker](https://www.docker.com/)** - Containerization platform
- **[Nginx](https://nginx.org/)** - High-performance web server
- **[Let's Encrypt](https://letsencrypt.org/)** - Free SSL certificates
- **[MongoDB](https://www.mongodb.com/)** - Document database
- **[MinIO](https://min.io/)** - S3-compatible object storage

---

## 🎯 Next Steps

1. **Configure your domain** - Update DNS settings and SSL certificates
2. **Set environment variables** - Copy and configure `.env.prod` file
3. **Deploy to production** - Run `./deployment/deploy.sh prod`
4. **Setup monitoring** - Enable health checks and log monitoring
5. **Configure backups** - Setup automated backup schedule

**Deploy with confidence!** 🚀