FROM oven/bun:1-slim

WORKDIR /app
ENV NODE_ENV=production

# Copy the entire monorepo
COPY . .

# Install all dependencies (including workspaces)
RUN bun install

# Build the backend
WORKDIR /app/backend
RUN bun run build

EXPOSE 3001
CMD ["bun", "dist/main.js"]
