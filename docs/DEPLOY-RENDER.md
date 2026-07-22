# ShiftFlow online zetten met Render + Neon (gratis)

Gratis manier om ShiftFlow live te zetten: **Neon** voor de database en
**Render** voor de app. Geen server te beheren. ~15 minuten.

> ⚠️ Twee dingen om te weten bij het gratis plan:
> 1. Gratis Render-services **vallen in slaap** na ~15 min → de eerste bezoeker
>    daarna wacht ~30-50 sec. Prima om te testen; voor echte klanten neem je een
>    betaald plan of een VPS.
> 2. Geüploade **documenten blijven niet bewaard** op de gratis Render-schijf
>    (weg bij herstart). Voor echt gebruik: S3 of een betaalde schijf.

---

## Stap 1 — Database (Neon)

1. Ga naar **neon.tech** → maak gratis een account + project.
2. Kopieer de **connection string** (begint met `postgresql://…` en bevat
   `sslmode=require`).

## Stap 2 — Code op GitHub

Zorg dat dit project in een GitHub-repo staat (Render leest je repo).

## Stap 3 — Render Blueprint

1. Ga naar **render.com** → **New → Blueprint**.
2. Kies je repo. Render vindt automatisch `render.yaml` en toont 2 services:
   `shiftflow-api` en `shiftflow-web`.
3. Klik **Apply**. Render maakt beide services aan.
4. Vul bij **shiftflow-api** de env var **`DATABASE_URL`** in met de Neon-string.
   (De secrets JWT/ENCRYPTION genereert Render zelf. De web-service wordt
   automatisch aan de API gekoppeld.)

## Stap 4 — Wachten en openen

De eerste build duurt enkele minuten (migraties draaien automatisch). Open
daarna de URL van **shiftflow-web** (bv. `https://shiftflow-web.onrender.com`)
→ **Gratis starten** → maak je bedrijf aan. Live! 🎉

---

## Hoe het werkt

- De web-service **proxyt** `/api` automatisch naar de API-service
  (via `API_INTERNAL_URL`). De browser blijft dus same-origin → **geen CORS**.
- De API luistert op de poort die Render aangeeft (`PORT`) en draait migraties
  bij elke deploy.

## Upgraden voor echt gebruik

- Zet beide services op een betaald plan (geen slaapstand).
- Voeg S3-opslag toe voor documenten (of een Render Disk).
- Gebruik een eigen domein (Render → Settings → Custom Domain).

Zie ook `DEPLOY.md` voor de VPS-variant (voor dit type app vaak eenvoudiger
en betrouwbaarder zodra je verkoopt).
