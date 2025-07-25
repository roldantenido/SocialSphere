# Multi-stage Docker build for the social media application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code (excluding node_modules)
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S app -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=app:nodejs /app/dist ./dist
COPY --from=builder --chown=app:nodejs /app/node_modules ./node_modules

# Copy any other necessary files
COPY --chown=app:nodejs ./drizzle.config.ts ./
COPY --chown=app:nodejs ./shared ./shared

# Switch to non-root user
USER app

# Expose port
EXPOSE 50725

# Set environment variables
ENV NODE_ENV=production
ENV PORT=50725

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); http.get('http://localhost:50725/api/auth/me', (res) => { process.exit(res.statusCode === 401 ? 0 : 1); }).on('error', () => process.exit(1));"

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]