# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Ensure public directory exists and has content
RUN mkdir -p public
RUN if [ ! -f public/index.html ]; then \
        echo '<!DOCTYPE html><html><head><title>Lyst Backend</title></head><body><h1>Lyst Backend</h1><p>Public files not found</p></body></html>' > public/index.html; \
    fi

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install curl for health checks
RUN apk --no-cache add curl

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Copy public directory for static files
COPY --from=builder --chown=nestjs:nodejs /app/public ./public

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "dist/main"] 