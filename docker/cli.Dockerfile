# CLI Client Dockerfile
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY shared/package*.json ./shared/
COPY clients/cli/package*.json ./clients/cli/

# Install dependencies
RUN cd shared && npm ci --only=production
RUN cd clients/cli && npm ci --only=production

# Copy source code
COPY shared/ ./shared/
COPY clients/cli/ ./clients/cli/

# Build shared types
RUN cd shared && npm run build

# Build CLI client
RUN cd clients/cli && npm run build

# Production stage
FROM node:18-alpine AS production

# Create app directory
WORKDIR /app

# Copy built application
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package*.json ./shared/
COPY --from=builder /app/clients/cli/dist ./clients/cli/dist
COPY --from=builder /app/clients/cli/package*.json ./clients/cli/
COPY --from=builder /app/clients/cli/node_modules ./clients/cli/node_modules
COPY --from=builder /app/shared/node_modules ./shared/node_modules

# Set environment variables
ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S cli -u 1001
RUN chown -R cli:nodejs /app
USER cli

# Set up CLI as entrypoint
ENTRYPOINT ["node", "clients/cli/dist/index.js"]