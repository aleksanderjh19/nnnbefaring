## Problem

Brukere ser fortsatt kort som er skjult. Sannsynlige årsaker:

1. **Flash før flagg er lastet**: `isVisible()` returnerer `true` som standard mens `feature_flags` fortsatt lastes fra databasen. Ikke-admin brukere ser derfor kortene et kort øyeblikk (eller varig hvis nettverket henger).
2. **Inkonsistent filtrering på Dashboard, Stasjon, Ledning, Drone og Dokumentert opplæring**: Alle bruker samme mønster, men filteret venter ikke på `loaded`-flagget før det avgjør synlighet for brukere.
3. **`realtime` mangler**: Hvis admin skjuler et kort mens en bruker er logget inn, ser brukeren fortsatt kortet til de laster siden på nytt.

## Løsning

### 1. Fiks default-tilstand i `useFeatureFlags`
- Endre `isVisible(cardId)` slik at den returnerer `false` (skjult) for ikke-admin *inntil* flaggene faktisk er lastet, i stedet for å defaulte til synlig.
- Eller: la hooken returnere `loaded`, og la kall-stedene skjule kortene mens `loaded === false` for ikke-admin.

Valgt tilnærming: legg til en `isVisibleForUser(cardId, isAdmin)` helper i hooken som returnerer:
- `true` alltid for admin
- `false` hvis `!loaded` (unngår flash)
- `flags[cardId] !== false` når lastet

### 2. Bruk helperen konsekvent
Oppdater filtreringen i:
- `src/components/ToolCardList.tsx` (Stasjon, Ledning, Drone)
- `src/pages/Dashboard.tsx`
- `src/pages/TrainingHome.tsx` (fire kort: se-min, ansattes, legg-til, katalog)

Slik at brukere aldri ser et kort før vi vet om det er skjult.

### 3. Realtime-oppdatering (valgfritt men anbefalt)
Abonner på `postgres_changes` på `feature_flags`-tabellen i `useFeatureFlags`, slik at brukere som er innlogget når admin skjuler et kort får kortet fjernet umiddelbart uten refresh.

## Verifisering

Etter endring, test med Playwright:
1. Logg inn som admin, skjul et kort på Dashboard.
2. Bytt til bruker-visning via DevAdminToggle → kortet skal være borte umiddelbart.
3. Reload som bruker → kort skal aldri "blinke" synlig før det forsvinner.
