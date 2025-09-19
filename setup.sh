#!/bin/bash

# Sky-S Development Setup Script (VPS-ready)
echo "🚀 Setting up Sky-S development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# --- Helper Functions ---
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

# --- Start Docker Compose ---
print_status "Starting Docker services..."
if docker compose up -d 2>/dev/null || docker-compose up -d; then
    print_success "Docker services started!"
else
    print_error "Failed to start Docker services"
    exit 1
fi

# --- Wait for PostgreSQL readiness ---
print_status "Waiting for PostgreSQL to be ready..."
until docker exec -it sky-s-postgres pg_isready -U postgres -d sky_s_db >/dev/null 2>&1; do
    sleep 2
done
print_success "PostgreSQL is ready!"

# --- Check backend directory ---
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

# --- Install Node.js dependencies ---
if [ ! -d "node_modules" ]; then
    print_status "Installing Node.js dependencies..."
    if npm install; then
        print_success "Dependencies installed!"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
else
    print_status "Dependencies already installed, skipping..."
fi

# --- Generate Prisma client ---
print_status "Generating Prisma client..."
if npx prisma generate; then
    print_success "Prisma client generated!"
else
    print_error "Failed to generate Prisma client"
    exit 1
fi

# --- Run database migrations ---
print_status "Running database migrations..."
if npx prisma migrate deploy; then
    print_success "Migrations applied!"
else
    print_warning "Migrations may already exist or failed"
fi

# --- Seed the database ---
if [ -f "prisma/seed.ts" ] || [ -f "prisma/seed.js" ]; then
    print_status "Seeding database..."
    if npm run seed; then
        print_success "Database seeded!"
    else
        print_warning "Seeding failed or data already exists"
    fi
fi

# --- Completion ---
echo ""
echo "🎉 Setup completed successfully!"
echo "🚀 To start your NestJS server: cd backend && npm run start:dev"
echo "🗄️ PostgreSQL: localhost:5433 (User: postgres / Password: postgres123)"
echo ""
