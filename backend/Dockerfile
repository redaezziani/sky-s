# -------------------------------
# Stage 1: Build
# -------------------------------
FROM node:22-bullseye AS builder

# Build tools + canvas dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libcairo2-dev \
    libpango1.0-dev \
    libgif-dev \
    libjpeg-dev \
    libpng-dev \
    bash \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --unsafe-perm

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build project
RUN npm run build

# -------------------------------
# Stage 2: Production
# -------------------------------
FROM node:22-bullseye

# Runtime dependencies for canvas
RUN apt-get update && apt-get install -y \
    libcairo2 \
    libpango1.0-0 \
    libgif7 \
    libjpeg62-turbo \
    libpng16-16 \
    bash \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only what's needed
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma/generated/prisma ./prisma/generated/prisma

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "dist/main.js"]
