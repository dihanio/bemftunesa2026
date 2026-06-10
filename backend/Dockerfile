FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY backend/package.json backend/package.json
RUN bun install --frozen-lockfile

FROM deps AS build
COPY . .
WORKDIR /app/backend
RUN bun run build

FROM oven/bun:1-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/package.json ./backend/package.json
EXPOSE 3001
CMD ["bun", "backend/dist/main.js"]
