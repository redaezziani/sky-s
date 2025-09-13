#!/bin/bash

# Sky-S Development Setup Script
echo "🚀 Setting up Sky-S development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Start Docker services
print_status "Starting Docker services..."
if docker-compose up -d; then
    print_success "Docker services started successfully!"
else
    print_error "Failed to start Docker services"
    exit 1
fi

# Wait for PostgreSQL to be ready
print_status "Waiting for PostgreSQL to be ready..."
sleep 10

# Check if backend directory exists
if [ ! -d "backend" ]; then
    print_error "Backend directory not found!"
    exit 1
fi

cd backend

# Copy environment file if it doesn't exist
if [ ! -f ".env" ]; then
    print_status "Creating .env file from .env.example..."
    cp .env.example .env
    print_success ".env file created!"
else
    print_warning ".env file already exists, skipping..."
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_status "Installing Node.js dependencies..."
    if npm install; then
        print_success "Dependencies installed successfully!"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
else
    print_status "Dependencies already installed, skipping..."
fi

# Generate Prisma client
print_status "Generating Prisma client..."
if npx prisma generate; then
    print_success "Prisma client generated successfully!"
else
    print_error "Failed to generate Prisma client"
    exit 1
fi

# Run database migrations
print_status "Running database migrations..."
if npx prisma migrate dev --name init; then
    print_success "Database migrations completed!"
else
    print_warning "Migrations may have already been applied or failed"
fi

# Seed the database
print_status "Seeding database with initial data..."
if npm run seed; then
    print_success "Database seeded successfully!"
else
    print_warning "Database seeding failed or data already exists"
fi

# Print access information
echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Service Access Information:"
echo "├── PostgreSQL Database: localhost:5432"
echo "├── pgAdmin Web UI: http://localhost:5050"
echo "│   ├── Email: admin@example.com"
echo "│   └── Password: admin123"
echo "├── Redis: localhost:6379"
echo "└── MailHog Web UI: http://localhost:8025"
echo ""
echo "🔑 Default User Accounts:"
echo "├── Admin: admin@example.com / Admin123!"
echo "├── Moderator: moderator@example.com / Moderator123!"
echo "└── User: john.doe@example.com / User123!"
echo ""
echo "🚀 To start the backend server:"
echo "   cd backend && npm run start:dev"
echo ""
echo "📚 For more information, see DOCKER.md"
