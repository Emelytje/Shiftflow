# Fase 1 — Analyse

## 1. Visie

**ShiftFlow** — _Slim personeelsbeheer, zonder zorgen._

Een modern, multi-tenant SaaS-platform voor personeelsplanning en werkroosters
dat sneller, gebruiksvriendelijker en slimmer is dan klassieke planningssoftware
(Shiftbase, Planday, When I Work, …). Kern-differentiator: **AI-gedreven
planning** en een strak, snel glassmorphism-design.

## 2. Doelmarkten

Sectoren met wisselende diensten en variabele bezetting:

| Sector | Belangrijkste behoefte |
|---|---|
| Horeca | Snelle weekplanning, no-shows opvangen, piekmomenten |
| Retail / Supermarkten | Bezetting per kassa/afdeling, deeltijdcontracten |
| Magazijnen / Transport | Ploegen, nachturen, wettelijke rusttijden |
| Zorg | Kwalificatie-eisen, 24/7 bezetting, verlofdruk |
| Kantoor / Productie / Events / Schoonmaak | Projectplanning, meerdere locaties |

## 3. Rollen (RBAC)

| Rol | Kernrechten |
|---|---|
| **Super Admin** | Platformbeheer, alle tenants, abonnementen, systeeminstellingen |
| **Bedrijfseigenaar** | Volledige toegang binnen eigen bedrijf, facturatie, instellingen |
| **Manager** | Planning + goedkeuringen voor toegewezen locaties |
| **Teamleider** | Planning + basis-goedkeuringen voor eigen afdeling/team |
| **HR** | Contracten, documenten, verlofsaldi, rapporten |
| **Boekhouding** | Loonexport, kostenrapporten, facturen |
| **Werknemer** | Eigen planning, beschikbaarheid, verlof, klokken, chat |

Principe: _least privilege_ — elke gebruiker ziet enkel waar hij recht op heeft.

## 4. Kernfunctionaliteiten (MoSCoW)

**Must have**
- Multi-tenant architectuur (bedrijf → locaties → afdelingen)
- Rollen & rechten (RBAC), veilige auth (JWT + refresh, 2FA)
- Planner (dag/week/maand/tijdlijn, drag & drop, templates, dupliceren)
- Werknemersportaal (planning, beschikbaarheid, verlof, ziekmelding)
- Verlofsysteem met saldi en goedkeuringsflow
- Urenregistratie / klokken (web + kiosk)
- Dashboard met KPI's en grafieken
- Notificaties (in-app + e-mail)
- Audit logs, GDPR (data-export & verwijdering)

**Should have**
- AI-planning & voorspellingen (tekorten, drukte, kostenoptimalisatie)
- Realtime updates (Socket.IO)
- Documentenbeheer (S3), rapporten (PDF/Excel/CSV)
- QR/NFC/GPS-klokken, geofencing
- Chat & aankondigingen
- OAuth (Google/Microsoft/Apple)

**Could have**
- Loonexport & boekhoudkoppelingen
- SMS-notificaties, push notificaties
- Native mobiele apps (Android/iOS)
- Publieke REST API + webhooks + OpenAPI

**Won't have (v1)**
- Volledige salarisverwerking (wel export naar payroll)
- Ingebouwde facturatie aan klanten (wel abonnementsbeheer)

## 5. Niet-functionele eisen

- **Performance**: p95 API < 200 ms; planner rendert 500+ shifts vlot.
- **Schaalbaarheid**: horizontaal schaalbare stateless API, Redis voor cache/queues.
- **Beveiliging**: encryptie in transit + at rest, 2FA, rate limiting, audit trail.
- **Beschikbaarheid**: 99.9% doel; health checks, graceful shutdown.
- **Privacy**: GDPR-conform, dataretentie-beleid, recht op inzage/verwijdering.
- **Toegankelijkheid**: WCAG 2.1 AA, toetsenbordbediening, contrast.
- **i18n**: NL eerst, structuur klaar voor EN/FR.

## 6. Aannames & risico's

- Aanname: bedrijven beheren zelf hun stamdata (medewerkers, contracten).
- Risico: complexe arbeidswetgeving per land → regels configureerbaar houden.
- Risico: AI-planning vereist voldoende historische data → cold-start fallback op
  regelgebaseerde heuristiek.
