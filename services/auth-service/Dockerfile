FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package*.json ./
COPY packages/types ./packages/types
COPY packages/shared ./packages/shared
COPY services/auth-service ./services/auth-service

# Install dependencies
RUN npm ci

# Build packages
RUN npm run build -w packages/types
RUN npm run build -w packages/shared

# Build auth service
WORKDIR /app/services/auth-service
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/services/auth-service/dist ./dist
COPY --from=builder /app/services/auth-service/package*.json ./

RUN npm ci --omit=dev

EXPOSE 3001

CMD ["node", "dist/server.js"]
