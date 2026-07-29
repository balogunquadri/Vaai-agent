FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages/types ./packages/types
COPY packages/shared ./packages/shared
COPY services/leadgen ./services/leadgen
RUN npm ci
RUN npm run build -w packages/types
RUN npm run build -w packages/shared
WORKDIR /app/services/leadgen
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/services/leadgen/dist ./dist
COPY --from=builder /app/services/leadgen/package*.json ./
RUN npm ci --omit=dev
EXPOSE 4000
CMD ["node", "dist/server.js"]
