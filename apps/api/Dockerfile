# ── ShiftFlow API (NestJS) ──────────────────────────────────
# Standalone build (geen npm-workspace-hoisting): node_modules blijft
# binnen de API zelf, zodat de runner-stage alles vindt.
FROM node:22-alpine AS builder
WORKDIR /app
COPY apps/api/package.json ./
RUN npm install
COPY apps/api/ ./
RUN npx prisma generate && npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY apps/api/package.json ./
EXPOSE 4000
# Draai eerst de database-migraties, start dan de API. Exec-vorm met sh -c
# zodat "&&" betrouwbaar werkt op elk platform (Render, Docker Compose, ...).
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
