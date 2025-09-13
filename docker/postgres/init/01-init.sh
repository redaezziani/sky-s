#!/bin/bash
set -e

# This script runs when the PostgreSQL container starts for the first time
echo "Initializing Sky-S database..."

# Create additional databases if needed (for testing, etc.)
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create test database
    CREATE DATABASE sky_s_test;
    
    -- Grant permissions
    GRANT ALL PRIVILEGES ON DATABASE sky_s_db TO postgres;
    GRANT ALL PRIVILEGES ON DATABASE sky_s_test TO postgres;
    
    -- You can add more initialization SQL here
    -- For example, create extensions:
    -- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EOSQL

echo "Database initialization completed!"
