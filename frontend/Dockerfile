# Stage 1: build
FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies needed to build native modules
RUN apk add --no-cache python3 make g++ libc6-compat cairo-dev pango-dev giflib-dev jpeg-dev libpng-dev musl-dev bash

# Copy package files and install
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the project
RUN npm run build

# Stage 2: runtime
FROM node:22-alpine
WORKDIR /app

# Copy package files and installed dependencies
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copy compiled app
COPY --from=builder /app/dist ./dist

# Copy prisma folder
COPY --from=builder /app/prisma ./prisma

# Copy generated Prisma client
COPY --from=builder /app/generated ./generated

CMD ["node", "dist/main.js"]
