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

### Alles via Docker

```bash
docker compose up -d --build
```

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

## 🔐 Beveiliging (fundering)

JWT access + roterende refresh tokens · bcrypt-hashing · Helmet ·
rate limiting · rollen-guards (RBAC) · tenant-isolatie · audit-logmodel.
Volledig securityplan en GDPR-documentatie volgen in latere fases.

## 📄 Licentie

Proprietary — © ShiftFlow.
