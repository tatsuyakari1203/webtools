# Dockerfile for Next.js Full-Stack Application with API Routes
# Optimized multi-stage build for minimal image size

# Stage 1: Dependencies (Base)
FROM oven/bun:1-alpine AS deps
WORKDIR /app

# Copy package files for dependency installation
COPY package.json bun.lock* ./

# Install dependencies with bun for faster builds
RUN bun install --frozen-lockfile

# Stage 2: Builder
FROM oven/bun:1-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set build-time environment variables
ARG NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL

# Build the application with turbopack for faster builds
RUN bun run build

# Stage 3: Runner (Ultra-lightweight)
FROM oven/bun:1-alpine AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only the standalone build (includes all dependencies)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static files
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy public folder if it exists
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Start the application directly with node (standalone includes everything)
CMD ["node", "server.js"]

# Alternative lightweight runner using Alpine
# Uncomment this section and comment the distroless section above if you need shell access
# FROM node:22-alpine AS runner-alpine
# WORKDIR /app
# 
# # Create non-root user
# RUN addgroup --system --gid 1001 nodejs && \
#     adduser --system --uid 1001 nextjs
# 
# # Copy built application
# COPY --from=builder /app/public ./public
# COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# 
# # Copy production dependencies
# COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
# 
# # Set environment variables
# ENV NODE_ENV=production
# ENV PORT=3000
# ENV HOSTNAME="0.0.0.0"
# 
# USER nextjs
# EXPOSE 3000
# 
# CMD ["node", "server.js"]