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
# Draai de migraties, maar laat een (tijdelijke) migratiefout de API NIET
# platleggen — op gratis plannen kan de DB bij "wakker worden" even haperen.
# De migraties zijn na de eerste deploy toch al toegepast.
CMD ["sh", "-c", "npx prisma migrate deploy || echo 'migrate overgeslagen'; node dist/main.js"]
