# Backend Dockerfile
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY shared/package*.json ./shared/
COPY platform/backend/package*.json ./platform/backend/

# Install dependencies
RUN cd shared && npm ci --only=production
RUN cd platform/backend && npm ci --only=production

# Copy source code
COPY shared/ ./shared/
COPY platform/backend/ ./platform/backend/

# Build shared types
RUN cd shared && npm run build

# Build backend
RUN cd platform/backend && npm run build

# Production stage
FROM node:18-alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Create app directory
WORKDIR /app

# Copy built application
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package*.json ./shared/
COPY --from=builder /app/platform/backend/dist ./platform/backend/dist
COPY --from=builder /app/platform/backend/package*.json ./platform/backend/
COPY --from=builder /app/platform/backend/node_modules ./platform/backend/node_modules
COPY --from=builder /app/shared/node_modules ./shared/node_modules

# Copy database schema
COPY platform/backend/src/database/schema.sql ./platform/backend/src/database/

# Create data directory for SQLite
RUN mkdir -p /app/data

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose port
EXPOSE 3001

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001
RUN chown -R backend:nodejs /app
USER backend

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["node", "platform/backend/dist/index.js"]