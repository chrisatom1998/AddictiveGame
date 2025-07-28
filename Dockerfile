# Use official Node.js LTS image for stability and security
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S gameuser -u 1001 -G nodejs

# Install http-server globally for serving static files
# Temporarily disable SSL check only for npm install in containerized environment
# This is a common pattern for container builds where certificate chains may vary
RUN npm config set strict-ssl false && \
    npm install -g http-server@14.1.1 && \
    npm config set strict-ssl true

# Create directory for game assets
RUN mkdir -p /app/game && \
    chown -R gameuser:nodejs /app

# Switch to non-root user
USER gameuser

# Copy game assets
COPY --chown=gameuser:nodejs app/src/main/assets/ /app/game/

# Expose port 8080 (http-server default)
EXPOSE 8080

# Health check to ensure the server is running
# Using node to check HTTP with explicit IPv4 address
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:8080/', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start http-server with proper configuration
CMD ["http-server", "/app/game", "-p", "8080", "-a", "0.0.0.0", "--cors", "-c-1"]