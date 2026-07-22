# ShiftFlow online zetten — stap voor stap

Deze gids brengt ShiftFlow live op je eigen server, met automatische HTTPS.
Je hebt nodig: **een VPS** (bv. Hetzner/DigitalOcean, Ubuntu 24.04) en **een
domeinnaam**. Reken op ~20 minuten.

---

## Stap 1 — DNS instellen (domein → server)

Zoek het IP-adres van je server. Maak bij je domeinregistrar een **A-record**:

| Type | Naam | Waarde |
|------|------|--------|
| A | `shiftflow` (of `@`) | `<IP van je server>` |

Zo wijst bv. `shiftflow.jouwdomein.be` naar je server. (DNS kan tot ~30 min duren.)

---

## Stap 2 — Inloggen op de server

```bash
ssh root@<IP van je server>
```

## Stap 3 — Docker installeren

```bash
curl -fsSL https://get.docker.com | sh
```

Controleer: `docker --version` en `docker compose version`.

## Stap 4 — ShiftFlow op de server zetten

Optie A — via Git (aanbevolen):
```bash
git clone <jouw-repo-url> shiftflow
cd shiftflow
```

Optie B — via de zip: upload de zip met `scp shiftflow.zip root@<IP>:~/`,
dan op de server:
```bash
apt install -y unzip && unzip shiftflow.zip && cd Shiftflow
```

## Stap 5 — Instellingen invullen

```bash
cp .env.prod.example .env
# Genereer 3 sterke secrets:
openssl rand -hex 32   # voor JWT_ACCESS_SECRET
openssl rand -hex 32   # voor JWT_REFRESH_SECRET
openssl rand -hex 32   # voor ENCRYPTION_KEY
nano .env              # vul DOMAIN, wachtwoord en de 3 secrets in
```

Belangrijk in `.env`:
- `DOMAIN` = exact het domein uit stap 1 (bv. `shiftflow.jouwdomein.be`)
- `POSTGRES_PASSWORD` = een sterk wachtwoord
- de 3 secrets = de gegenereerde waarden

## Stap 6 — Starten 🚀

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Dit bouwt en start alles. De database-migraties draaien automatisch. Caddy
haalt automatisch een gratis HTTPS-certificaat op (kan 1 minuut duren).

Volg de logs met:
```bash
docker compose -f docker-compose.prod.yml logs -f
```

## Stap 7 — Klaar!

Ga naar **https://jouwdomein** → klik **Gratis starten** → maak je bedrijf aan.
Dat account is meteen de eigenaar. Je bent live. 🎉

---

## Beheer & onderhoud

**Updaten naar een nieuwe versie:**
```bash
git pull                    # of nieuwe zip uitpakken
docker compose -f docker-compose.prod.yml up -d --build
```

**Back-up van de database (aanrader: dagelijks):**
```bash
docker exec shiftflow-postgres pg_dump -U shiftflow shiftflow > backup-$(date +%F).sql
```

**Terugzetten van een back-up:**
```bash
cat backup-2026-01-01.sql | docker exec -i shiftflow-postgres psql -U shiftflow shiftflow
```

**Stoppen / starten:**
```bash
docker compose -f docker-compose.prod.yml down     # stoppen
docker compose -f docker-compose.prod.yml up -d    # starten
```

---

## Veelvoorkomende problemen

| Probleem | Oplossing |
|---|---|
| Geen HTTPS / certificaatfout | Wijst het DNS A-record echt naar de server? Poorten 80 en 443 open? Wacht 1-2 min. |
| "502 Bad Gateway" | API start nog op. Check `docker compose -f docker-compose.prod.yml logs api`. |
| Geen ruimte meer | `docker system prune -a` om oude images op te ruimen. |
| Wachtwoord vergeten | Nieuwe eigenaar kan via de database, of maak een nieuw bedrijf aan. |

## Beveiligingstips voor productie

- Zet een firewall aan: laat alleen 22 (SSH), 80 en 443 toe (`ufw`).
- Log niet in als root voor dagelijks gebruik; maak een aparte gebruiker.
- Bewaar `.env` veilig en deel de secrets nooit.
- Plan de back-up in met `cron`.
