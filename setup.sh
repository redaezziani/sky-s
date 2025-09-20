#!/bin/bash

# Sky-S Development Setup Script (VPS-ready)
echo "🚀 Setting up Sky-S development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# --- Check Docker ---
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Install Docker first."
    exit 1
fi

# --- Check Docker Compose ---
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not installed. Install Docker Compose first."
    exit 1
fi

# --- Build backend Docker image ---
print_status "Building backend Docker image..."
docker build -t sky-s-backend ./backend && print_success "Backend Docker image built!" || { print_error "Failed to build backend Docker image"; exit 1; }

# --- Start Docker Compose ---
print_status "Starting Docker services..."
docker compose up -d 2>/dev/null || docker-compose up -d
print_success "Docker services started!"

# --- Wait for PostgreSQL readiness ---
print_status "Waiting for PostgreSQL..."
until docker exec -it sky-s-postgres pg_isready -U postgres -d sky_s_db >/dev/null 2>&1; do
    sleep 2
done
print_success "PostgreSQL is ready!"

# --- Backend local setup ---
if [ ! -d "backend" ]; then
    print_error "Backend directory not found!"
    exit 1
fi

cd backend

# --- Create .env if missing ---
if [ ! -f ".env" ]; then
    print_status "Creating .env from .env.example..."
    cp .env.example .env
    print_success ".env file created!"
else
    print_status ".env file exists, skipping..."
fi

# --- Install Node.js dependencies locally ---
if [ ! -d "node_modules" ]; then
    print_status "Installing Node.js dependencies..."
    npm install && print_success "Dependencies installed!" || { print_error "Failed to install dependencies"; exit 1; }
else
    print_status "Dependencies already installed, skipping..."
fi

# --- Generate Prisma client ---
print_status "Generating Prisma client..."
npx prisma generate && print_success "Prisma client generated!" || { print_error "Failed to generate Prisma client"; exit 1; }

# --- Push Prisma schema to database ---
print_status "Pushing Prisma schema to database..."
npx prisma db push && print_success "Schema pushed!" || print_warning "Schema push failed"

# --- Seed database ---
SEED_FILE="src/database/seed.ts"

if [ -f "$SEED_FILE" ]; then
    print_status "Seeding database from $SEED_FILE..."
    npx ts-node "$SEED_FILE" && print_success "Database seeded successfully!" || print_warning "Seeding failed or data may already exist"
else
    print_warning "No seed file found at $SEED_FILE, skipping seeding..."
fi

echo ""
echo "🎉 Setup completed!"
echo "🚀 To start NestJS server locally: cd backend && npm run start:dev"
echo "🗄️ PostgreSQL: localhost:5433 (postgres / postgres123)"
echo "🚀 Backend Docker container: docker run -d -p 8080:8080 --name sky-s-backend sky-s-backend"
