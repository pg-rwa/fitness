FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Cache-bust: pass --build-arg CACHEBUST=$(date +%s) to force rebuild
ARG CACHEBUST=1
RUN echo "Build cache bust: $CACHEBUST" && npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

ENV NODE_ENV=production
EXPOSE 3002
CMD ["node", "server.js"]
