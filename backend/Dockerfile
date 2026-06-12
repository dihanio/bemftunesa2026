FROM oven/bun:1-slim

WORKDIR /app
ENV NODE_ENV=production

# Copy the entire monorepo
COPY . .

# Install all dependencies (including workspaces)
RUN bun install

# Start the backend directly with Bun (resolves monorepo workspace issues automatically)
WORKDIR /app/backend

EXPOSE 3001
CMD ["bun", "run", "src/main.ts"]
