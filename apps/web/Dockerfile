# ── ShiftFlow Web (Next.js) ─────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
# In productie: "" zodat de frontend same-origin /api aanroept (via de proxy).
ARG NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY apps/web/package.json ./
RUN npm install
COPY apps/web ./
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
EXPOSE 3000
CMD ["npm", "run", "start"]
