FROM oven/bun:1-slim

WORKDIR /app
ENV NODE_ENV=production

# Copy package.json files and lockfile first to leverage Docker layer caching
COPY package.json bun.lock ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY ims/package.json ./ims/
COPY oprec/package.json ./oprec/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages/permissions/package.json ./packages/permissions/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/workflow/package.json ./packages/workflow/

# Install all dependencies (including workspaces)
RUN bun install

# Copy the entire monorepo
COPY . .

# Start the backend directly with Bun (resolves monorepo workspace issues automatically)
WORKDIR /app/backend

EXPOSE 3001
CMD ["bun", "run", "src/main.ts"]
