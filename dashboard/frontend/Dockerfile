# syntax = docker/dockerfile:labs

FROM node:24-alpine AS security-scan
WORKDIR /app
COPY package*.json ./
# Install osv-scanner
RUN npm install -g @google/osv-scanner
# Scan and fix the lockfile for high-severity, non-dev vulnerabilities
RUN osv-scanner fix \
    --non-interactive \
    --max-depth=3 \
    --min-severity=5 \
    --ignore-dev \
    --strategy=in-place \
    -L package-lock.json

# Build using secure lockfile from security-scan
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=security-scan /app/package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Final Stage - Production Image
FROM nginxinc/nginx-unprivileged:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
