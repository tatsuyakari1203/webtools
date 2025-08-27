# Multi-stage build để tối ưu kích thước image

# Stage 1: Dependencies
FROM oven/bun:1-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install all dependencies (including devDependencies for build)
RUN bun install --frozen-lockfile

# Stage 2: Builder
FROM oven/bun:1-alpine AS builder
WORKDIR /app

# Copy dependencies từ stage trước
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build ứng dụng
RUN bun run build

# Stage 3: Runner (Production)
FROM oven/bun:1-alpine AS runner
WORKDIR /app

# Tạo user non-root để bảo mật
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy package.json để có thể chạy scripts
COPY --from=builder /app/package.json ./package.json

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 5005

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5005
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["bun", "server.js"]