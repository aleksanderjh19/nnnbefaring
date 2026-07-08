## SF6 Gassrunde – pågående runder & delvis fullførte steg

### 1. Ny statuskolonne + auto-lagring ved start

**Migration** – legg til kolonne `status` i `sf6_rounds`:
- `status text NOT NULL DEFAULT 'in_progress'` (verdier: `in_progress`, `completed`).
- Fjern `NOT NULL` på `temperature` (default `0`) så runder kan lagres før temperatur er fylt inn.

Nå-runden opprettes i DB umiddelbart når brukeren trykker «Ny runde» på et stasjonskort, med tomme målinger og status `in_progress`. Runde-id lagres i state (`activeRoundId`), og alle videre endringer oppdaterer samme rad.

### 2. Auto-lagring mens man jobber

Endringer synkroniseres tilbake til DB på disse punktene:
- Månedslabel / temperatur mister fokus (`onBlur`).
- Bruker trykker «Fullfør steg» i et nivå-skjema (lagrer målingene før man går tilbake).
- Bruker trykker tilbake-pil fra nivå-skjema eller runde-oversikt (lagre, deretter naviger).
- «Fullfør runde» setter status = `completed` og går til fremvisning.

Ingen kompleks debouncing – én lagring per hendelse er nok.

### 3. RLS – tillat alle å oppdatere/slette pågående runder

Utvid policyene på `sf6_rounds`:
- `UPDATE`: alle authenticated kan oppdatere en rad **hvis** `status = 'in_progress'`. Egne fullførte runder kan fortsatt oppdateres av eier (i praksis ikke brukt, men beholdes for konsistens).
- `DELETE`: alle authenticated kan slette – med bekreftelses-dialog i UI (`AlertDialog` med tekst «Er du helt sikker på at du vil slette denne runden? Dette kan ikke angres.»). Gjelder både pågående og fullførte runder.
- `SELECT`: uendret (alle ser alle).

### 4. Fullfør steg – tillat delvis utfylte nivåer

`isLevelComplete` beholdes, i tillegg ny helper `getLevelStatus(level, m)`:
- `complete`: alle celler fylt inn.
- `partial`: minst én celle fylt inn, men ikke alle.
- `empty`: ingen celler fylt inn.

I nivå-oversikt-kortene:
- `complete` → grønn ramme + grønn hake (som i dag).
- `partial` → oransj ramme + oransj «Delvis utført»-etikett.
- `empty` → nøytralt (som i dag).

«Fullfør steg» kan alltid trykkes (også uten noen felt fylt inn) – den bare lagrer + går tilbake.

### 5. Fullfør runde – tillat delvis

Knappen «Fullfør runde» er alltid aktiv når temperatur + måned er fylt inn (ikke lenger avhengig av at alle nivåer er komplette). Tomme felter vises som `—` i fremvisningen (allerede tilfelle).

### 6. Historikk-visning

Historikklisten viser status-badge per rad:
- **Pågående** – oransj pill, trykk på rad = gjenoppta runden (åpner samme redigerbare visning som ny runde, med `activeRoundId` satt).
- **Fullført** – grønn pill, trykk = fremvisningsmodus (som i dag).

Slette-knapp: alltid synlig, alltid åpner AlertDialog med bekreftelse før DELETE utføres.

Sorteringsrekkefølge: pågående øverst (nyeste først), deretter fullførte (nyeste først).

### 7. Filer som endres

- `supabase/migrations/…` – ny migration for `status` + `temperature` nullbar.
- `src/pages/Sf6Round.tsx`:
  - `startRound` blir async: INSERT i DB → sett `activeRoundId` → naviger til round-view.
  - `resumeRound(SavedRound)` – laster tilbake state fra rad, setter `activeRoundId`.
  - `saveProgress()` helper som gjør UPDATE på `activeRoundId`.
  - `finishRound` blir UPDATE med `status='completed'` i stedet for INSERT.
  - Nivå-status via `getLevelStatus` styrer farge på kortene.
  - AlertDialog for sletting.
- `src/data/sf6Stations.ts` – legg til `getLevelStatus` helper.
