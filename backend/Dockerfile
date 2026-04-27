FROM oven/bun:1-slim

WORKDIR /app

# Install dependencies for building and running
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    unzip \
    tar \
    curl \
    ca-certificates \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install Railpack if needed (as per previous Dockerfile)
RUN curl -fsSL https://railpack.com/install.sh | sh -s -- --bin-dir /usr/local/bin
ENV PATH="/usr/local/bin:/root/.local/bin:${PATH}"

# Install Docker CLI
RUN curl -fsSL https://get.docker.com | sh

# Copy dependency files
COPY package.json bun.lock ./
RUN bun install --production

# Copy source code
COPY . .

RUN mkdir -p /data /tmp/uploads /tmp/builds

EXPOSE 3001

CMD ["bun", "src/index.ts"]
