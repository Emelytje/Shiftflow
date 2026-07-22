# Fase 2 — Functioneel ontwerp

## 1. Modulestructuur

```
ShiftFlow
├── Auth & Accounts        (login, 2FA, OAuth, sessies, wachtwoordherstel)
├── Tenancy                (bedrijven, locaties, afdelingen, teams)
├── People                 (medewerkers, contracten, kwalificaties, beschikbaarheid)
├── Scheduling             (shifts, roosters, templates, drag&drop, dupliceren)
├── AI Engine              (auto-planning, voorspellingen, aanbevelingen, chat)
├── Leave                  (verlofsoorten, aanvragen, saldi, goedkeuring)
├── Time Tracking          (klokken, kiosk, QR/NFC/GPS, pauzes, overuren)
├── Communication          (chat, aankondigingen, notificaties)
├── Documents              (contracten, attesten, certificaten — S3)
├── Reporting              (uren, kosten, verlof, export PDF/Excel/CSV)
├── Accounting             (loonexport, kostenrapporten, koppelingen)
├── Admin CMS              (branding, rollen, abonnementen, AI-instellingen)
└── Platform               (super-admin, tenants, audit, billing)
```

## 2. Belangrijkste user stories

### Planning
- Als **manager** wil ik shifts slepen naar medewerkers zodat ik snel een week
  kan plannen.
- Als **manager** wil ik een weekrooster dupliceren of een template toepassen
  zodat ik niet elke week opnieuw begin.
- Als **manager** wil ik op één knop AI-planning starten die rekening houdt met
  beschikbaarheid, kwalificaties, kosten en overuren.

### Werknemer
- Als **werknemer** wil ik mijn beschikbaarheid doorgeven zodat ik niet ingepland
  word wanneer ik niet kan.
- Als **werknemer** wil ik verlof aanvragen en de status volgen.
- Als **werknemer** wil ik in-/uitklokken via web of kiosk.

### Verlof
- Als **manager** wil ik verlofaanvragen goedkeuren/afwijzen met zicht op de
  bezetting op die dag.
- Als **HR** wil ik verlofsaldi beheren per verlofsoort.

### Rapporten
- Als **boekhouding** wil ik gewerkte uren en kosten exporteren per periode.

## 3. Kern-flows

**Shift-toewijzing**
1. Manager opent planner (weekweergave).
2. Sleept een open shift naar een medewerker.
3. Systeem valideert: beschikbaarheid, kwalificatie, conflicten, max. uren.
4. Bij conflict → waarschuwing; bij ok → opgeslagen + realtime broadcast + notificatie.

**Verlofaanvraag**
1. Werknemer dient aanvraag in (soort, periode, reden).
2. Systeem reserveert saldo (pending) en checkt overlap met shifts.
3. Manager krijgt notificatie → keurt goed/af.
4. Bij goedkeuring: saldo afgeboekt, betrokken shifts gemarkeerd, agenda bijgewerkt.

**Klokken**
1. Werknemer klokt in (web/kiosk/QR). Optioneel geofence-check.
2. Systeem legt timestamp vast, koppelt aan geplande shift.
3. Bij uitklokken: berekent gewerkte tijd, pauzes, over-/nachturen.
4. Uren gaan naar goedkeuring (teamleider) → rapportage/loonexport.

## 4. Statussen

- **Shift**: `OPEN` → `ASSIGNED` → `CONFIRMED` → `COMPLETED` / `CANCELLED`
- **LeaveRequest**: `PENDING` → `APPROVED` / `REJECTED` / `CANCELLED`
- **TimeEntry**: `CLOCKED_IN` → `CLOCKED_OUT` → `APPROVED` / `DISPUTED`

## 5. Notificatiegebeurtenissen

Nieuwe shift, gewijzigde shift, verlof beslist, ruilverzoek, open shift beschikbaar,
naderende shift-herinnering, klok-vergeten, contract verloopt, certificaat verloopt.

## 6. Rechten-matrix (samenvatting)

| Actie | Owner | Manager | Teamleider | HR | Boekh. | Werknemer |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Planning bewerken | ✅ | ✅ | eigen team | – | – | – |
| Verlof goedkeuren | ✅ | ✅ | ✅ | ✅ | – | – |
| Uren goedkeuren | ✅ | ✅ | ✅ | – | – | – |
| Rapporten/export | ✅ | ✅ | – | ✅ | ✅ | – |
| Loonexport | ✅ | – | – | – | ✅ | – |
| Instellingen/branding | ✅ | – | – | – | – | – |
| Eigen planning zien | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
