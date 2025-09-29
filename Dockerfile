# Use Bun Alpine image as the base image
FROM oven/bun:1-alpine AS base

# Stage 1: Install dependencies
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install all dependencies (including dev dependencies for build)
RUN bun install --frozen-lockfile

# Stage 2: Build the application
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Stage 3: Ultra-minimal Production runtime
FROM oven/bun:1-alpine AS runner
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the built application from the builder stage
COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
# Standalone mode đã bao gồm tất cả dependencies cần thiết
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Change to the non-root user
USER nextjs

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the application using Bun
# Sử dụng bun để chạy server.js từ standalone build
CMD ["bun", "server.js"]