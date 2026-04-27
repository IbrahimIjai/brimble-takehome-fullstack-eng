FROM node:20-slim AS builder

RUN npm install -g bun

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install

COPY . .
RUN npx react-router build

FROM caddy:2-alpine AS runner

COPY --from=builder /app/build/client /srv
RUN printf '%s\n' \
  ':80 {' \
  '  root * /srv' \
  '  try_files {path} /index.html' \
  '  file_server' \
  '}' > /etc/caddy/Caddyfile

EXPOSE 80
