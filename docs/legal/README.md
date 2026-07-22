# Juridische sjablonen — ShiftFlow

> ⚠️ **Belangrijk:** dit zijn **sjablonen** ter voorbereiding, geen kant-en-klaar
> juridisch advies. Laat ze vóór gebruik nakijken door een jurist of DPO en vul
> alle `[PLACEHOLDERS]` in. ShiftFlow/Anthropic is niet aansprakelijk voor het
> gebruik ervan.

## Rolverdeling (belangrijk voor GDPR)

In een SaaS zoals ShiftFlow gelden twee lagen:

| Partij | Rol onder GDPR |
|---|---|
| Het bedrijf dat ShiftFlow gebruikt (jouw klant) | **Verwerkingsverantwoordelijke** van de werknemersgegevens |
| Jij, als aanbieder van ShiftFlow | **Verwerker** (in opdracht van de klant) |
| Externe diensten (hosting, e-mail, evt. AI) | **Sub-verwerkers** |

Daarom heb je twee overeenkomsten nodig:
- Een **verwerkersovereenkomst (DPA)** die JIJ aan je klanten aanbiedt.
- **DPA's die JIJ afsluit** met je eigen sub-verwerkers (hosting, e-mail, enz.).

## Inhoud

| Bestand | Doel |
|---|---|
| `privacyverklaring.md` | Publieke privacyverklaring voor eindgebruikers |
| `verwerkersovereenkomst-dpa.md` | DPA-sjabloon voor jouw zakelijke klanten |
| `verwerkingsregister.md` | Register van verwerkingsactiviteiten (art. 30) |
| `algemene-voorwaarden.md` | Algemene voorwaarden (SaaS-abonnement) |
| `../securityplan.md` | Technische en organisatorische beveiligingsmaatregelen |
| `../gdpr.md` | Hoe ShiftFlow GDPR technisch invult |
