FROM node:24-alpine

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build arguments
ARG VITE_BACKEND_URL=http://localhost:3002
ARG BACKEND_WSS=ws://localhost:3002/ws/auto
ARG NODE_ENV=production

# Set environment variables for build
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_WS_URL=$BACKEND_WSS
ENV NODE_ENV=$NODE_ENV

# Build the application
RUN pnpm run build -- --no-typeCheck

# Install serve globally for serving static files
RUN npm install -g serve

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Serve the built application
CMD ["serve", "-s", "dist", "-l", "3000"]