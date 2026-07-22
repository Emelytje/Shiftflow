# GDPR — hoe ShiftFlow dit technisch invult

| GDPR-recht/eis | Artikel | Implementatie in ShiftFlow |
|---|---|---|
| Recht op inzage | 15 | `GET /api/gdpr/export` — volledige JSON-export (UI: Account → Privacy) |
| Dataportabiliteit | 20 | Zelfde export in machineleesbaar JSON |
| Recht op vergetelheid | 17 | `DELETE /api/gdpr/erase/:userId` — anonimiseert de gebruiker |
| Recht op correctie | 16 | Profiel-/stamdatabeheer |
| Beveiliging van verwerking | 32 | bcrypt, 2FA, AES-256-GCM, RBAC, rate limiting, auditlogs |
| Verantwoordingsplicht | 5(2) | Auditlogs + verwerkingsregister |
| Melding datalek | 33/34 | Auditlogs ondersteunen detectie; meldprocedure in securityplan |
| Privacy by design/default | 25 | Least-privilege, data-minimalisatie, tenant-isolatie |

## Belangrijke keuzes

- **Anonimiseren i.p.v. hard verwijderen**: bij "vergeet mij" worden
  identificerende velden gewist, maar blijven geaggregeerde roosters/uren
  intact (zonder persoon te identificeren). Zo blijft de administratie
  kloppen én is de betrokkene niet meer herleidbaar.
- **AI zonder externe doorgifte**: de ingebouwde AI-planner is regelgebaseerd
  en verwerkt gegevens **lokaal** — er gaan geen persoonsgegevens naar externe
  AI-diensten. Een externe AI (bv. OpenAI/Anthropic) is optioneel en vereist
  dan een aparte DPA + data-minimalisatie.

## Aandachtspunten (organisatorisch, buiten de code)

- Privacyverklaring, DPA en verwerkingsregister invullen (zie `legal/`).
- Bewaartermijnen concreet vastleggen per gegevenscategorie.
- Sub-verwerkers-DPA's afsluiten (hosting, e-mail, evt. AI).
- Datalek-meldprocedure operationeel maken.
