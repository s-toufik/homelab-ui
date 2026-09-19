FROM node:22-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx ng build

FROM nginxinc/nginx-unprivileged:1.27-alpine

COPY --from=builder /app/dist/homelab-ui/browser /usr/share/nginx/html
COPY devops/docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
