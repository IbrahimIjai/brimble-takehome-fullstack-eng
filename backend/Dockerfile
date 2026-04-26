FROM node:20-slim AS builder

WORKDIR /app
COPY package*.json ./
RUN bun ci --include=dev

COPY tsconfig.json ./
COPY src ./src
RUN bun run build

FROM node:20-slim AS runner

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    unzip \
    tar \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://railpack.com/install.sh | sh -s -- --bin-dir /usr/local/bin

ENV PATH="/usr/local/bin:/root/.local/bin:${PATH}"

RUN curl -fsSL https://get.docker.com | sh

WORKDIR /app
COPY package*.json ./
RUN bun ci --omit=dev
COPY --from=builder /app/dist ./dist
RUN mkdir -p /data /tmp/uploads /tmp/builds
EXPOSE 3001
CMD ["node", "dist/index.js"]
