# Roadmap & fases

We bouwen ShiftFlow gefaseerd. Na elke fase vragen we jouw akkoord voordat we
verdergaan.

| # | Fase | Status | Belangrijkste opgeleverde onderdelen |
|---|------|:------:|--------------------------------------|
| 1 | Analyse | ✅ | `docs/01-analyse.md` — visie, doelmarkten, rollen, MoSCoW, NFR's |
| 2 | Functioneel ontwerp | ✅ | `docs/02-functioneel-ontwerp.md` — modules, user stories, flows, rechten-matrix |
| 3 | Database | ✅ | `prisma/schema.prisma`, `docs/03-database-erd.md` — volledig datamodel + ERD |
| — | **Fundering (scaffold)** | ✅ | Werkende monorepo: NestJS API (auth/RBAC), Next.js UI (huisstijl), Docker, seed |
| 5a | Backend — Scheduling | ✅ | Shifts CRUD, conflictdetectie, week dupliceren, publiceren |
| 5b | Backend — Verlof | ✅ | Aanvraag → goedkeuring, saldi-afboeking, RBAC |
| 5c | Backend — Uren | ✅ | Klokken in/uit, over-/nacht-/weekenduren (unit-getest), goedkeuring |
| 6a | Frontend — Planner | ✅ | Weekplanner met drag & drop, filters, dupliceren, publiceren |
| 6b | Frontend — Verlof & Uren | ✅ | Verlofpagina + klok-widget + registratie-overzicht |
| 7 | AI — Auto-planning | ✅ | Regelgebaseerde motor vult open shifts (beschikbaarheid, overuren, kosten), knop in planner |
| 9 | Beveiliging & GDPR | ✅ | 2FA (TOTP, secret versleuteld), auth rate limiting, audit-interceptor, GDPR-export & anonimisering, juridische sjablonen |
| 4 | UI/UX (verfijning) | ⏳ | Wireframes → high-fidelity, componentbibliotheek, dag/maand-weergave |
| 5 | Backend (rest) | ⏳ | Documents, reporting, notifications, chat |
| 6 | Frontend (rest) | ⏳ | Portalen per rol, admin CMS, rapporten-UI |
| 7 | AI | ⏳ | Auto-planning, voorspellingen, aanbevelingen, AI-chat voor planners |
| 8 | Testen | ⏳ | Unit-, integratie- en e2e-tests; testplan |
| 9 | Beveiliging | ⏳ | 2FA, encryptie, audit-interceptor, GDPR-tooling, securityplan |
| 10 | Deployment | ⏳ | CI/CD-pipeline, productie-Docker, infra, monitoring |
| 11 | Documentatie | ⏳ | Handleiding, API-docs, installatie-, security- en GDPR-documentatie |

## Wat er nu al werkt

- Multi-tenant datamodel met migraties en demo-seed.
- Registratie + login met JWT (access + roterend refresh), bcrypt, RBAC-guards.
- Rate limiting, Helmet, CORS, globale validatie, OpenAPI-documentatie.
- Landingspagina, login, registratie en een dashboard-shell met **live**
  bedrijfsdata uit de API — in de ShiftFlow-huisstijl (donkerblauw/lichtblauw/wit,
  glassmorphism).
- Docker Compose voor Postgres + Redis + API + web.

## Direct volgende stap (Fase 4–6, na akkoord)

1. Scheduling-module (CRUD shifts + conflictdetectie) + planner-UI (weekweergave, drag&drop).
2. Verlofmodule (aanvraag → goedkeuring, saldi) + UI.
3. Urenregistratie (klokken web/kiosk) + UI.
