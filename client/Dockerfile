# ===================================================================
# Production Multi-Stage Dockerfile — React 19 Frontend + Nginx
# ===================================================================

# ─── Stage 1: Build SPA Bundle ──────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json vite.config.ts index.html ./
COPY src ./src/
COPY public ./public/

RUN npm run build

# ─── Stage 2: Nginx Web Server ──────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Remove default Nginx welcome site
RUN rm -rf /usr/share/nginx/html/*

# Copy built SPA static assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx virtual host configuration
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
