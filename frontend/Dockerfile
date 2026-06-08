# --- Стадия сборки ---
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Адрес API для прод-сборки: относительный путь, который Nginx проксирует на бэкенд.
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# --- Стадия отдачи статики через Caddy (авто-HTTPS / Let's Encrypt) ---
FROM caddy:2-alpine

COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80 443

# базовый образ caddy сам запускает: caddy run --config /etc/caddy/Caddyfile
