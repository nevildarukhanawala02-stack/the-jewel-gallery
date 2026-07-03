# The Jewel Gallery — Production Dockerfile
# Multi-stage build for Railway deployment
# Based on github-railway skill best practices

# ─── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files and patches
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches/

# Install ALL dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code (cache-bust: 1783102695)
COPY . .

# Build frontend (Vite) and backend (tsc/esbuild)
RUN pnpm build

# ─── Stage 2: Runner ─────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./

# Copy pre-built node_modules from builder (avoids Alpine recompilation issues)
COPY --from=builder /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist

# Expose port (Railway overrides with $PORT env var)
EXPOSE 3000

ENV NODE_ENV=production

# Start the production server
CMD ["node", "dist/index.js"]
