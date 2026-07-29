FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages/types ./packages/types
COPY packages/shared ./packages/shared
COPY services/messaging-service ./services/messaging-service
RUN npm ci
RUN npm run build -w packages/types
RUN npm run build -w packages/shared
WORKDIR /app/services/messaging-service
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/services/messaging-service/dist ./dist
COPY --from=builder /app/services/messaging-service/package*.json ./
RUN npm ci --omit=dev
EXPOSE 3005
CMD ["node", "dist/server.js"]
