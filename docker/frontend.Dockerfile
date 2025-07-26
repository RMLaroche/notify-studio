# Frontend Dockerfile
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY shared/package*.json ./shared/
COPY platform/frontend/package*.json ./platform/frontend/

# Install dependencies
RUN cd shared && npm ci
RUN cd platform/frontend && npm ci

# Copy source code
COPY shared/ ./shared/
COPY platform/frontend/ ./platform/frontend/

# Build shared types
RUN cd shared && npm run build

# Build frontend
RUN cd platform/frontend && npm run build

# Production stage with nginx
FROM nginx:alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built frontend
COPY --from=builder /app/platform/frontend/build /usr/share/nginx/html

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]