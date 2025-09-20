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
    util-linux-dev \
    bash \
    git

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build project
RUN npm run build

# -------------------------------
# Stage 2: Production
# -------------------------------
FROM node:22-alpine

# Runtime dependencies for canvas
RUN apk add --no-cache \
    libc6-compat \
    bash \
    cairo \
    pango \
    giflib \
    jpeg \
    libpng \
    util-linux

WORKDIR /app

# Copy only what's needed
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Prisma schema + migrations
COPY --from=builder /app/prisma ./prisma

# Prisma client
COPY --from=builder /app/prisma/generated/prisma ./prisma/generated/prisma

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "dist/main.js"]