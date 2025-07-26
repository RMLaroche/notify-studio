# Discord Module Dockerfile
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY shared/package*.json ./shared/
COPY modules/discord/package*.json ./modules/discord/

# Install dependencies
RUN cd shared && npm ci --only=production
RUN cd modules/discord && npm ci --only=production

# Copy source code
COPY shared/ ./shared/
COPY modules/discord/ ./modules/discord/

# Build shared types
RUN cd shared && npm run build

# Build discord module
RUN cd modules/discord && npm run build

# Production stage
FROM node:18-alpine AS production

# Create app directory
WORKDIR /app

# Copy built application
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package*.json ./shared/
COPY --from=builder /app/modules/discord/dist ./modules/discord/dist
COPY --from=builder /app/modules/discord/package*.json ./modules/discord/
COPY --from=builder /app/modules/discord/node_modules ./modules/discord/node_modules
COPY --from=builder /app/shared/node_modules ./shared/node_modules

# Set environment variables
ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S discord -u 1001
RUN chown -R discord:nodejs /app
USER discord

# Start the application
CMD ["node", "modules/discord/dist/index.js"]