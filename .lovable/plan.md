## Mål

Erstatte dagens Airdata UAV-seksjon (som er mer "hva kan du gjøre") med en kort, praktisk bruksanvisning: **"hvordan gjør jeg X"** for de mest brukte funksjonene i felt og på kontoret.

Ingen UI-endringer — kun innhold i `airdataGuide` i `src/data/droneGuides.ts`. Eksisterende `DroneGuide.tsx` rendrer kapitler, steg og bullets uendret.

## Ny struktur (kapitler → korte "hvordan"-oppskrifter)

Hvert steg = én konkret oppgave, 3–6 bullets med klikk-for-klikk.

**1. Flights – daglig bruk**
- Åpne og se en enkelt flight (Flight List → filter på pilot/drone/dato)
- Legge til pilot, drone, sted og notat på en flight
- Endre flight-type (mission / training / test) og hvorfor det matters for rapporter

**2. Fikse flights som mangler checklist**
- Hvorfor det skjer (checklist ikke fylt ut i app før take-off)
- Åpne flight → "Edit" → knytt til riktig checklist-mal
- Bulk: velg flere flights i listen → "Assign checklist" → velg mal
- Sette default checklist per drone så nye flights får den automatisk

**3. Samle flere flights under samme checklist / oppdrag**
- Bruk **Missions**: opprett Mission → dra flights inn / velg fra liste
- Alternativ: felles **Tag** (f.eks. "Statnett-linje 300kV Sylling–Tegneby") og filtrer på tag
- Slå sammen delflygninger fra samme dag/sted til én rapport

**4. Checklists**
- Lage egen checklist-mal (Settings → Checklists → New)
- Sette pre-flight / post-flight / maintenance-type
- Tildele checklist til drone eller pilot som default

**5. Batterier**
- Registrere nytt batteri (Battery → Add, serienummer fra DJI)
- Se helse på ett batteri (sykluser, kapasitet, celleavvik)
- Merke batteri som pensjonert / bytte status

**6. Vedlikehold**
- Sette opp vedlikeholdsintervall per drone (timer / flygninger / dager)
- Logge utført vedlikehold med notat
- Kvittere ut varsel når jobb er gjort

**7. Rapporter og deling**
- Generere PDF-flightrapport til oppdragsgiver
- Eksportere CSV for flere flights (filter → Export)
- Dele én flight via lenke (public link, med/uten kart)

**8. Piloter og flåte**
- Legge til pilot og tildele rolle
- Se flytimer per pilot
- Overføre en flight til riktig pilot hvis feil ble registrert

Kilder: beholder lenke til Airdata Wiki.

## Teknisk

- Kun `airdataGuide`-objektet i `src/data/droneGuides.ts` endres.
- `ninoxGuide`, `externalGuides`, typer og `DroneGuide.tsx` er urørt.
- Hvert steg holdes til 3–6 korte bullets på norsk.
