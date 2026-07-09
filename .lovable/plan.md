## Mål
Skjulte kort skal fortsatt vises for vanlige brukere — men grået ut og ikke-klikkbare, uten admin-toggleknappen. I dag filtreres de helt bort.

## Endringer

### 1. `src/hooks/useFeatureFlags.ts`
- Behold `isVisible` og `loaded`.
- Fjerne behovet for `isVisibleForUser` (eller la den bli, men ikke bruk den til filtrering). Kall-stedene skal ikke lenger filtrere bort skjulte kort for brukere.

### 2. `src/components/ToolCardList.tsx`
- Ikke filtrer `tools` basert på synlighet — vis alle.
- For ikke-admin: hvis `loaded` og kortet er skjult (`!isVisible(tool.id)`), render kortet som disabled + grået ut (samme `opacity-60` som admin ser) og gjør det ikke-klikkbart (`disabled`, ingen navigasjon, ingen hover-effekt, chevron skjult).
- Admin-toggleknappen på venstre side vises kun for admin (uendret).
- For å unngå "flash" før `loaded`: mens `!loaded` og ikke-admin, render kortene som skeleton/dimmet (eller vent med å vise til lastet). Enkleste: render dimmet-disabled til `loaded === true`, deretter vis normal tilstand for synlige kort.

### 3. `src/pages/Dashboard.tsx`
- Samme oppførsel som `ToolCardList` (Dashboard har egen inline-rendering). Fjern `isVisibleForUser`-filteret. Render alle `tools`. For ikke-admin: skjulte kort blir disabled + `opacity-60`, ingen navigasjon.

### 4. `src/pages/TrainingHome.tsx`
- Samme mønster: ikke filtrer bort skjulte kort for brukere; vis dem grået ut og ikke-klikkbare.

## Sikkerhet
Route-nivå beskyttelse: siden brukeren fortsatt kan skrive URL-en manuelt, legger vi til en enkel guard som blokkerer direkte navigasjon til skjulte verktøy. To alternativer:
- **A (enkel):** stole på UI-disabled. Bruker med URL kan fortsatt nå siden.
- **B (robust):** legge til en `RequireVisibleCard`-wrapper som sjekker `feature_flags` for gitt `card:scope:id` og redirecter til forrige side hvis skjult (admin får alltid tilgang).

Anbefaler **B** — brukeren skrev eksplisitt "Det skal ikke gå an å gå inn på dem uten at de er aktive". Wrapperen legges rundt de aktuelle rutene i `src/App.tsx` (Stasjon/Ledning/Drone/Dokumentert opplæring-underruter + hovedkategorier på Dashboard).

## Verifisering
- Som admin: skjul et kort → kortet forblir synlig hos admin med amber "Skjult"-badge og fungerende toggle.
- Som bruker (via DevAdminToggle): samme kort vises grået ut, ingen chevron, ingen admin-knapp, klikk gjør ingenting, direkte URL redirecter tilbake.
- Ingen "flash" ved sideinnlasting.
