# syntax = docker/dockerfile:labs
# Security Scan and Remediation
FROM node:24-alpine AS security-scan
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
