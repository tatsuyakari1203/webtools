# Dockerfile for Next.js Full-Stack Application with API Routes
# Ultra-optimized multi-stage build for minimal image size

# Stage 1: Builder
FROM node:current-alpine AS builder
WORKDIR /app

# Install dependencies needed for native modules
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies for build
RUN npm ci --no-audit --no-fund

# Copy source code
COPY . .

# Set build-time environment variables
ARG NEXT_PUBLIC_BACKEND_URL=http://localhost:7777
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL

# Build the application with optimizations (standalone includes minimal node_modules)
RUN npm run build && \
    rm -rf .next/cache && \
    rm -rf node_modules && \
    npm ci --only=production --no-audit --no-fund && \
    npm cache clean --force

# Stage 2: Ultra-minimal Runtime
FROM node:current-alpine AS runner
WORKDIR /app

# Install only essential runtime dependencies
RUN apk add --no-cache libc6-compat dumb-init && \
    rm -rf /var/cache/apk/* && \
    rm -rf /usr/share/man && \
    rm -rf /tmp/*

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application from builder stage (standalone includes everything needed)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Switch to non-root user
USER nextjs

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Expose port
EXPOSE 3000

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]