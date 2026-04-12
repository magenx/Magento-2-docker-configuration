# syntax = docker/dockerfile:labs
# Build using secure lockfile
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
# Install osv-scanner
RUN <<EOF
  set -e
  apk add osv-scanner
  # Scan and capture output
  osv-scanner scan source \
    -L package-lock.json
EOF
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# Final Stage - Production image
FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY --from=builder /app/dist ./dist
USER node
EXPOSE 3001
CMD ["node", "dist/index.js"]
