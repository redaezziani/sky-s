# -------------------------------
# Stage 1: Build
# -------------------------------
FROM node:22-alpine AS builder

# Build tools + canvas dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat \
    cairo-dev \
    pango-dev \
    giflib-dev \
    jpeg-dev \
    libpng-dev \
    musl-dev \
    bash \
    git

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --unsafe-perm

# Copy source
COPY . .

# Generate Prisma client silently
RUN npx prisma generate --silent

# Build project
RUN npm run build

# -------------------------------
# Stage 2: Production
# -------------------------------
FROM node:22-alpine

# Runtime dependencies for canvas
RUN apk add --no-cache \
    libc6-compat \
    cairo \
    pango \
    giflib \
    jpeg \
    libpng \
    bash

WORKDIR /app

# Copy only what's needed
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "dist/main.js"]
