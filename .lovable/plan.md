
# Plan: Smart «Tilbake»-navigasjon i hele appen

## Mål
Når brukeren trykker «Tilbake» (eller pil-tilbake) på en hvilken som helst side eller verktøy, skal man havne på siden man faktisk kom fra – ikke en hardkodet foreldreside. Fungerer for navigasjon på tvers av Dashboard, Stasjon, Ledning, Drone, alle verktøy og undersider.

## Dagens situasjon
- Mange sider bruker `navigate("/dashboard")`, `navigate("/stasjon")` osv. som hardkodede mål på tilbake-knappen.
- Det betyr at hvis man f.eks. går Dashboard → Drone → Statnett-prosedyrer → PDF-viser, så havner man på Drone-siden i stedet for Statnett-prosedyrer når man trykker tilbake fra PDF.
- Noen sider bruker allerede `navigate(-1)`, men inkonsekvent.

## Løsning: `navigate(-1)` med trygg fallback

Bytt alle hardkodede tilbake-navigasjoner ut med en felles hook som:
1. Bruker nettleserens historikk (`navigate(-1)`) når det finnes en forrige side i samme øktet.
2. Faller tilbake til en fornuftig standardrute (f.eks. `/dashboard`) hvis brukeren åpnet siden direkte via URL/refresh (ingen historikk).

### Ny hook: `useSmartBack`
Plassering: `src/hooks/useSmartBack.ts`

```ts
// Returnerer en funksjon som går tilbake i history hvis mulig,
// ellers navigerer til `fallback` (default: "/dashboard").
useSmartBack(fallback?: string) => () => void
```

Implementasjonen sporer om appen har navigert internt (via en enkel teller i `sessionStorage` eller ved å sjekke `location.key !== "default"` fra React Router). Hvis ja → `navigate(-1)`. Hvis nei → `navigate(fallback, { replace: true })`.

### Refactor på tvers
Erstatt alle `onClick={() => navigate("/...")}` på tilbake-knapper i disse sidene med `useSmartBack("<fornuftig-fallback>")`:

- Dashboard-undersider: `Stasjon`, `Ledning`, `Drone`, `Verktoy`
- Stasjon-verktøy: `Sf6Round`, `Sf6History`, `Sf6RoundDetail`, evt. andre
- Ledning-verktøy: `MontasjeList`, `MontasjeDetail`, inspeksjonssider
- Drone-verktøy: `DroneRules`, `DroneRuleDetail`, `DroneClasses`, `DroneClassDetail`, `DroneGuide`, `StatnettProcedures`, `StatnettProcedurePdf`
- Utlånsskjema: `UtlansList`, `UtlansSkjema`
- Andre verktøy/oversikter som har «Tilbake»-pil (opplæring, ansatte, avfall, spenningsrunde m.m.)

Fallback velges ut fra logisk foreldreside for tilfellet der brukeren åpner URL-en direkte (f.eks. StatnettProcedurePdf → fallback `/drone/statnett-prosedyrer`).

### Hardware/browser back
Ingen egen håndtering nødvendig – nettleserens tilbake-knapp og mobilens sveipegest følger allerede history og vil fungere som forventet.

## Teknisk

- Legg til `useSmartBack` (én liten hook).
- Søk-og-erstatt alle steder som har tilbake-knapp/`ArrowLeft`-ikon i `src/pages/**` og relevante komponenter.
- Ingen endringer i routing eller Supabase.
- Ingen visuelle endringer.

## Ut av scope
- Endring av selve tilbake-ikonet eller plasseringen.
- Breadcrumbs.
- Persistering av scroll-posisjon (kan gjøres senere hvis ønskelig).
