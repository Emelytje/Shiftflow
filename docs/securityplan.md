# Securityplan — ShiftFlow

Overzicht van de technische en organisatorische beveiligingsmaatregelen (TOM's).

## Authenticatie & toegang

- **Wachtwoorden**: gehasht met bcrypt (cost 12). Nooit in klare tekst opgeslagen.
- **JWT**: kortlevende access tokens (15 min) + roterende refresh tokens
  (gehasht opgeslagen, ingetrokken bij logout/refresh).
- **2FA**: TOTP (authenticator-app). Secret **versleuteld at rest** (AES-256-GCM).
- **RBAC**: 7 rollen met least-privilege guards op elke route.
- **Multi-tenant isolatie**: elke query gefilterd op `companyId`.

## Netwerk & transport

- **HTTPS/TLS** voor alle verkeer (in productie via reverse proxy).
- **Helmet**: veilige HTTP-headers.
- **CORS**: enkel toegestane origins.
- **Rate limiting**: globaal (120/min) + streng op login/registratie (5/min)
  tegen brute force.

## Data

- **Validatie**: strikte input-validatie (class-validator), whitelist,
  `forbidNonWhitelisted`.
- **Versleuteling at rest**: gevoelige velden (2FA-secret) via AES-256-GCM;
  schijf-/DB-encryptie op infrastructuurniveau aanbevolen.
- **Audit logs**: elke muterende actie gelogd (wie/wat/wanneer/IP), zonder
  request-inhoud.

## Privacy (GDPR)

- **Data-export** (art. 15/20) en **anonimisering** (art. 17) ingebouwd
  (Account → Privacy).
- Zie `gdpr.md`.

## Back-ups & continuïteit

- Aanbevolen: dagelijkse `pg_dump`, retentie 30 dagen, off-site.
- Health-endpoint (`/api/health`) + graceful shutdown.

## Nog te doen richting productie

- [ ] Encryptie at rest op DB-/schijfniveau afdwingen (infra).
- [ ] Gestructureerde logging + monitoring/alerting.
- [ ] Geautomatiseerde back-up + hersteltest.
- [ ] Penetratietest vóór livegang.
- [ ] WAF / DDoS-bescherming (via cloud/CDN).
- [ ] Secret management (vault i.p.v. .env in productie).
