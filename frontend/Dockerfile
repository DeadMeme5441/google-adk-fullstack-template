# Dev-friendly Dockerfile using Bun for the SPA
FROM oven/bun:1 as base

WORKDIR /app

# Install deps separately for better caching
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source
COPY . .

EXPOSE 3000

# Start dev server with HMR
CMD ["bun", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]

