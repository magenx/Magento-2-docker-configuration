# syntax = docker/dockerfile:labs
# Security Scan and Remediation
FROM node:24-alpine AS security-scan
WORKDIR /app
COPY package*.json ./
# Install osv-scanner
RUN npm install -g @google/osv-scanner@latest
# Scan and fix the lockfile for high-severity, non-dev vulnerabilities
RUN osv-scanner fix \
    --non-interactive \
    --max-depth=3 \
    --min-severity=5 \
    --strategy=in-place \
    -L package-lock.json

# Build using secure lockfile from security-scan
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=security-scan /app/package*.json ./
RUN npm ci --only=production=false --no-audit --no-fund
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
