# The build output is static files, the same for every CPU: build once on the builder's own
# platform, then copy it into an nginx image for each target platform (amd64 for the server).
FROM --platform=$BUILDPLATFORM node:22-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx ng build

FROM nginxinc/nginx-unprivileged:1.27-alpine

COPY --from=builder /app/dist/homelab-ui/browser /usr/share/nginx/html
COPY devops/docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
