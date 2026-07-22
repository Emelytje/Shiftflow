# Verwerkersovereenkomst (DPA) — sjabloon

> ⚠️ Sjabloon voor de overeenkomst tussen ShiftFlow (verwerker) en jouw zakelijke
> klant (verwerkingsverantwoordelijke). Laat nakijken door een jurist.

Tussen **[KLANT]** ("Verwerkingsverantwoordelijke") en **[BEDRIJFSNAAM]**
("Verwerker"), samen de "Partijen".

## 1. Onderwerp

Deze overeenkomst regelt de verwerking van persoonsgegevens door de Verwerker in
het kader van de levering van het ShiftFlow-platform (personeelsplanning,
urenregistratie, verlofbeheer).

## 2. Aard en doel van de verwerking

Hosting en verwerking van personeelsgegevens ten behoeve van planning, uren,
verlof, communicatie en rapportage, uitsluitend in opdracht en volgens de
instructies van de Verwerkingsverantwoordelijke.

## 3. Categorieën betrokkenen en gegevens

- **Betrokkenen**: werknemers, managers en overige medewerkers van de klant.
- **Gegevens**: identificatie, arbeids- en roostergegevens, klok-/verlofgegevens,
  technische logs. Geen bijzondere categorieën, tenzij afzonderlijk overeengekomen.

## 4. Verplichtingen van de Verwerker

De Verwerker:
- verwerkt enkel op gedocumenteerde instructie van de Verantwoordelijke;
- waarborgt vertrouwelijkheid van personen die toegang hebben;
- neemt passende technische en organisatorische maatregelen (zie Bijlage A);
- schakelt sub-verwerkers enkel in met algemene toestemming en gelijkwaardige
  verplichtingen (zie Bijlage B);
- assisteert bij verzoeken van betrokkenen en bij DPIA's;
- meldt datalekken zonder onredelijke vertraging (streefdoel < 48u);
- verwijdert of retourneert gegevens na einde overeenkomst.

## 5. Sub-verwerkers (Bijlage B)

| Sub-verwerker | Doel | Locatie |
|---|---|---|
| [HOSTINGPROVIDER] | Hosting/infrastructuur | [EU-REGIO] |
| [E-MAILPROVIDER] | Transactionele e-mail | [REGIO] |
| [AI-PROVIDER] (optioneel) | AI-functies | [REGIO] |

## 6. Doorgifte buiten de EER

Enkel met passende waarborgen (SCC's / adequaatheidsbesluit).

## 7. Beveiliging (Bijlage A)

Zie `../securityplan.md`. Kern: versleuteling in transit + gevoelige velden at
rest, 2FA, RBAC, rate limiting, auditlogs, back-ups, gescheiden tenants.

## 8. Duur en beëindiging

Deze overeenkomst geldt zolang de Verwerker gegevens verwerkt voor de
Verantwoordelijke. Bij beëindiging worden gegevens verwijderd of teruggegeven
binnen [X dagen].
