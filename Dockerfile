# Multi-stage build for production efficiency
FROM node:22-alpine AS builder

# Install Python and pip for yt-dlp
RUN apk add --no-cache python3 py3-pip
RUN pip install yt-dlp

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build arguments for frontend environment variables
ARG VITE_STRIPE_PUBLIC_KEY
ARG VITE_API_BASE_URL

# Set environment variables for build
ENV VITE_STRIPE_PUBLIC_KEY=$VITE_STRIPE_PUBLIC_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build the application
RUN npm run build

# Production stage
FROM node:22-alpine AS runtime

# Install curl for healthcheck, and Python/pip for yt-dlp
RUN apk add --no-cache curl python3 py3-pip
RUN pip install yt-dlp

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mediahub -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=mediahub:nodejs /app/dist ./dist

# Set production environment
ENV NODE_ENV=production

# Switch to non-root user
USER mediahub

# Expose port
EXPOSE 5001

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5001/api/charity/stats || exit 1

# Start the application
CMD ["npm", "start"]
