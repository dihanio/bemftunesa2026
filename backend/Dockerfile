FROM oven/bun:1 AS deps
WORKDIR /app

# Copy the entire monorepo to ensure all workspaces and their dependencies are available
COPY . .

# Install dependencies for all workspaces
RUN bun install

FROM deps AS build
WORKDIR /app/backend
RUN bun run build

FROM oven/bun:1-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/package.json ./backend/package.json
EXPOSE 3001
CMD ["bun", "backend/dist/main.js"]
