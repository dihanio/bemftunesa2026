FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY frontend/package.json frontend/package.json
RUN bun install --frozen-lockfile

FROM deps AS build
COPY . .
WORKDIR /app/frontend
RUN bun run build

FROM oven/bun:1-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/frontend/.next ./frontend/.next
COPY --from=build /app/frontend/public ./frontend/public
COPY --from=build /app/frontend/package.json ./frontend/package.json
EXPOSE 3000
CMD ["bun", "frontend/node_modules/next/dist/bin/next", "start", "-p", "3000"]
