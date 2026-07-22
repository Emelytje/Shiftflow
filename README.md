# ShiftFlow

> **Slim personeelsbeheer, zonder zorgen.**
> Modern, multi-tenant SaaS-platform voor personeelsplanning en werkroosters.

[![Fase](https://img.shields.io/badge/fase-fundering-38BDF8)](docs/roadmap.md)

ShiftFlow is een platform voor werkroosters, urenregistratie, verlof en
AI-gedreven planning — sneller, gebruiksvriendelijker en slimmer dan klassieke
planningssoftware. Geschikt voor horeca, retail, zorg, logistiek, productie,
events en meer.

## 🏗️ Architectuur

Monorepo met npm workspaces:

```
shiftflow/
├── apps/
│   ├── api/          NestJS + Prisma + PostgreSQL (REST API + OpenAPI)
│   └── web/          Next.js 15 + TypeScript + TailwindCSS
├── docs/             Analyse, functioneel ontwerp, ERD, roadmap
├── docker-compose.yml
└── .env.example
```

**Stack:** React · Next.js · TypeScript · TailwindCSS · Node.js · NestJS ·
PostgreSQL · Prisma · Redis · Docker.

## 🚀 Aan de slag

### Vereisten
- Node.js ≥ 20, npm ≥ 10
- Docker (voor PostgreSQL + Redis)

### Installatie

```bash
# 1. Environment klaarzetten
cp .env.example .env

# 2. Dependencies installeren (alle workspaces)
npm install

# 3. Database + Redis starten
docker compose up -d postgres redis

# 4. Databaseschema toepassen + demo-data laden
npm run db:migrate
npm run db:seed

# 5. API + web tegelijk starten (dev)
npm run dev
```

- Web:  http://localhost:3000
- API:  http://localhost:4000/api
- API-docs (OpenAPI/Swagger): http://localhost:4000/api/docs
- Health: http://localhost:4000/api/health

### Alles via Docker (lokaal)

```bash
docker compose up -d --build
```

### 🚀 Online zetten (productie)

Volledige stap-voor-stap gids: **[docs/DEPLOY.md](docs/DEPLOY.md)**. Kort:

```bash
cp .env.prod.example .env   # vul DOMAIN + secrets in (openssl rand -hex 32)
docker compose -f docker-compose.prod.yml up -d --build
```

Caddy regelt automatisch HTTPS, database-migraties draaien vanzelf, en de
frontend praat same-origin met de API (geen CORS-gedoe).

## 👤 Demo-accounts

Alle accounts gebruiken wachtwoord **`Demo1234!`**.

| Rol | E-mail |
|---|---|
| Super Admin | superadmin@demo.shiftflow.app |
| Bedrijfseigenaar | owner@demo.shiftflow.app |
| Manager | manager@demo.shiftflow.app |
| Teamleider | teamlead@demo.shiftflow.app |
| HR | hr@demo.shiftflow.app |
| Boekhouding | accounting@demo.shiftflow.app |
| Werknemer | emma@demo.shiftflow.app |

## 📚 Documentatie

- [Fase 1 — Analyse](docs/01-analyse.md)
- [Fase 2 — Functioneel ontwerp](docs/02-functioneel-ontwerp.md)
- [Fase 3 — Database & ERD](docs/03-database-erd.md)
- [Architectuur](docs/architecture.md)
- [Roadmap & fases](docs/roadmap.md)

## 🔐 Beveiliging & GDPR

JWT access + roterende refresh tokens · bcrypt-hashing · **2FA (TOTP)** met
secret **versleuteld at rest (AES-256-GCM)** · Helmet · rate limiting
(streng op login) · rollen-guards (RBAC) · tenant-isolatie · **audit-logging**
op elke mutatie.

**GDPR** ingebouwd (Account → Privacy): data-export (art. 15/20) en
anonimisering / recht op vergetelheid (art. 17). Zie
[`docs/gdpr.md`](docs/gdpr.md), [`docs/securityplan.md`](docs/securityplan.md)
en de juridische sjablonen in [`docs/legal/`](docs/legal/) (privacyverklaring,
DPA, verwerkingsregister, algemene voorwaarden).

## 📄 Licentie

Proprietary — © ShiftFlow.
