# Architectuur

## Overzicht

```
┌─────────────┐      HTTPS       ┌──────────────────┐
│  Next.js    │ ───────────────▶ │   NestJS API     │
│  (web/app)  │ ◀─────────────── │  REST + OpenAPI  │
└─────────────┘   JWT Bearer     └────────┬─────────┘
      │                                    │
      │ (later: Socket.IO realtime)        │ Prisma
      ▼                                    ▼
┌─────────────┐                   ┌──────────────────┐
│  Mobiele    │                   │   PostgreSQL 16  │
│  apps (v2)  │                   └──────────────────┘
└─────────────┘                            │
                                   ┌────────┴─────────┐
                                   │   Redis (cache,  │
                                   │  queues, pub/sub)│
                                   └──────────────────┘
```

## Lagen (backend)

- **Controller** — HTTP-routes, validatie (class-validator), OpenAPI-annotaties.
- **Service** — bedrijfslogica, tenant-isolatie, transacties.
- **Prisma** — data-access, type-safe queries, migraties.
- **Guards** — `JwtAuthGuard` (auth), `RolesGuard` (RBAC), `ThrottlerGuard` (rate limit).
- **Cross-cutting** — Helmet, CORS, globale validatiepipe, audit-logging (later als interceptor).

## Multi-tenancy

Elke rij hangt via `companyId` aan een `Company`. Services filteren altijd op
het `companyId` uit de JWT-payload, zodat tenants elkaars data nooit zien.
Super Admin is de enige rol die tenant-overschrijdend werkt.

## Auth-flow

1. `POST /auth/login` → access token (kort, 15 min) + refresh token (14 dagen,
   gehasht opgeslagen).
2. Client stuurt `Authorization: Bearer <access>` mee.
3. Bij verlopen access → `POST /auth/refresh` roteert het refresh token.
4. `POST /auth/logout` trekt het refresh token in.

## Uitbreidingspunten (volgende fases)

- **Realtime**: Socket.IO-gateway met Redis-adapter voor planner-updates.
- **Queues**: BullMQ (Redis) voor notificaties, exports, AI-berekeningen.
- **AI-engine**: aparte module met regelgebaseerde fallback + LLM/ML-voorspellingen.
- **Storage**: S3-compatible voor documenten.
- **Observability**: gestructureerde logging, metrics, health/readiness probes.
