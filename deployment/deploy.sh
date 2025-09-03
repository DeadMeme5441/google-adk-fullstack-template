#!/bin/bash
# ==============================================================================
# Google ADK Template - Deployment Script
# ==============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="docker-compose.yaml"
PROD_COMPOSE_FILE="deployment/docker-compose.prod.yaml"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking requirements..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    log_success "Requirements check passed"
}

build_images() {
    log_info "Building Docker images..."
    cd "$PROJECT_ROOT"
    
    # Build backend image
    docker build -t google-adk-backend:latest ./backend
    
    # Build frontend image if directory exists
    if [ -d "./frontend" ]; then
        docker build -t google-adk-frontend:latest ./frontend
    fi
    
    log_success "Images built successfully"
}

deploy_development() {
    log_info "Deploying development environment..."
    cd "$PROJECT_ROOT"
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            log_warning ".env file not found. Copying from .env.example..."
            cp .env.example .env
            log_warning "Please edit .env file with your configuration before running again."
            exit 1
        else
            log_error ".env file not found. Please create one based on .env.example"
            exit 1
        fi
    fi
    
    # Determine dynamic profiles based on configuration
    set -a
    source ./.env 2>/dev/null || true
    set +a

    PROFILES=()
    SESSION_SERVICE_TYPE=${SESSION_SERVICE_TYPE:-inmemory}
    ARTIFACT_SERVICE_TYPE=${ARTIFACT_SERVICE_TYPE:-inmemory}
    AUTH_STORAGE_TYPE=${AUTH_STORAGE_TYPE:-auto}

    if [ "$SESSION_SERVICE_TYPE" = "mongo" ]; then
        PROFILES+=("session-mongo")
    fi
    if [ "$ARTIFACT_SERVICE_TYPE" = "s3" ]; then
        PROFILES+=("artifacts-minio")
    fi
    if [ "$AUTH_STORAGE_TYPE" = "mongo" ]; then
        # Ensure Mongo is available for auth even if session is not mongo
        PROFILES+=("session-mongo")
    fi

    PROFILE_ARGS=()
    for p in "${PROFILES[@]}"; do
        PROFILE_ARGS+=("--profile" "$p")
    done

    # Start services with computed profiles
    docker-compose ${PROFILE_ARGS[@]} up --build -d
    
    # Wait for services to be healthy
    log_info "Waiting for services to be ready..."
    sleep 10
    
    # Check if backend is healthy
    if curl -f http://localhost:8000/health &> /dev/null; then
        log_success "Backend is healthy"
    else
        log_warning "Backend health check failed"
    fi
    
    log_success "Development environment deployed!"
    log_info "Backend API: http://localhost:8000"
    log_info "Backend Web UI: http://localhost:8000"
    log_info "MinIO Console: http://localhost:9001"
    
    if [ -d "./frontend" ]; then
        log_info "Frontend: http://localhost:3000"
    fi
}

deploy_production() {
    log_info "Deploying production environment..."
    cd "$PROJECT_ROOT"
    
    # Check if production env exists
    if [ ! -f ".env.prod" ]; then
        if [ -f "deployment/.env.prod.example" ]; then
            log_warning "Production .env file not found. Copying from example..."
            cp deployment/.env.prod.example .env.prod
            log_warning "Please edit .env.prod file with your production configuration before running again."
            exit 1
        else
            log_error "Production .env file not found."
            exit 1
        fi
    fi
    
    # Create network if it doesn't exist
    docker network create google-adk-network 2>/dev/null || true
    
    # Deploy production services
    docker-compose -f "$PROD_COMPOSE_FILE" --env-file .env.prod up -d
    
    log_success "Production environment deployed!"
    log_info "API will be available on the configured port"
}

show_logs() {
    cd "$PROJECT_ROOT"
    if [ "$1" = "prod" ]; then
        docker-compose -f "$PROD_COMPOSE_FILE" logs -f
    else
        docker-compose logs -f
    fi
}

stop_services() {
    cd "$PROJECT_ROOT"
    if [ "$1" = "prod" ]; then
        docker-compose -f "$PROD_COMPOSE_FILE" down
    else
        docker-compose down
    fi
    log_success "Services stopped"
}

show_status() {
    cd "$PROJECT_ROOT"
    if [ "$1" = "prod" ]; then
        docker-compose -f "$PROD_COMPOSE_FILE" ps
    else
        docker-compose ps
    fi
}

show_help() {
    cat << EOF
Google ADK Template Deployment Script

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    dev         Deploy development environment
    prod        Deploy production environment
    build       Build Docker images
    logs [env]  Show logs (env: dev|prod)
    stop [env]  Stop services (env: dev|prod)
    status [env] Show service status (env: dev|prod)
    restart [env] Restart services (env: dev|prod)
    clean       Remove containers and volumes
    help        Show this help message

Examples:
    $0 dev              # Deploy development environment
    $0 prod             # Deploy production environment
    $0 logs             # Show development logs
    $0 logs prod        # Show production logs
    $0 stop             # Stop development services
    $0 clean            # Clean up all resources

EOF
}

# Main script logic
case "$1" in
    "dev"|"development")
        check_requirements
        deploy_development
        ;;
    "prod"|"production")
        check_requirements
        build_images
        deploy_production
        ;;
    "build")
        check_requirements
        build_images
        ;;
    "logs")
        show_logs "$2"
        ;;
    "stop")
        stop_services "$2"
        ;;
    "status")
        show_status "$2"
        ;;
    "restart")
        stop_services "$2"
        sleep 2
        if [ "$2" = "prod" ]; then
            deploy_production
        else
            deploy_development
        fi
        ;;
    "clean")
        cd "$PROJECT_ROOT"
        docker-compose down -v --remove-orphans
        docker-compose -f "$PROD_COMPOSE_FILE" down -v --remove-orphans 2>/dev/null || true
        docker system prune -f
        log_success "Cleanup completed"
        ;;
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
