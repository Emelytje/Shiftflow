# Verwerkingsregister (art. 30 GDPR) — sjabloon

> ⚠️ Vul aan en houd actueel. Verplicht register van verwerkingsactiviteiten.

_Organisatie: [BEDRIJFSNAAM] · Laatst bijgewerkt: [DATUM]_

| # | Verwerking | Doel | Betrokkenen | Categorieën gegevens | Grondslag | Bewaartermijn | Ontvangers |
|---|---|---|---|---|---|---|---|
| 1 | Accountbeheer | Toegang & authenticatie | Gebruikers | Naam, e-mail, wachtwoord (hash), 2FA | Overeenkomst | Duur account + [X] | Hosting |
| 2 | Personeelsplanning | Roosters opstellen | Werknemers | Naam, afdeling, shifts | Overeenkomst / ger. belang | [X jaar] | — |
| 3 | Urenregistratie | Gewerkte uren vastleggen | Werknemers | Klok-events, uren, locatie (opt.) | Wettelijk / overeenkomst | Wettelijke termijn | Boekhouding |
| 4 | Verlofbeheer | Verlof & afwezigheid | Werknemers | Verlofsoort, periode, saldo | Wettelijk / overeenkomst | [X jaar] | HR |
| 5 | Beveiliging (auditlogs) | Fraudepreventie & integriteit | Gebruikers | IP, actie, tijdstip | Ger. belang | [X maanden] | — |
| 6 | Notificaties | Informeren gebruikers | Gebruikers | E-mail, apparaat-token | Overeenkomst | Duur account | E-mailprovider |
| 7 | AI-planning (optioneel) | Roosteroptimalisatie | Werknemers | Beschikbaarheid, uren, kost | Ger. belang | Tijdelijk | (evt.) AI-provider |

## Technische en organisatorische maatregelen

Zie `../securityplan.md`.

## Sub-verwerkers

Zie Bijlage B in `verwerkersovereenkomst-dpa.md`.
