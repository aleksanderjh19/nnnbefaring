## Problem

Hvert felt har en egen `Ref.`-boks fordi referansespenningen på samleskinnen leses samtidig med feltmålingen (spenningen varierer). Innfyllingen i UI er riktig, men **avvikslogikken** bruker samleskinnens egen `målt`-verdi som referanse for alle felt — ikke feltets egen `refValue`. Det gir feil avvik i Resultat-siden (og feil "OK / Avvik"-status), selv om Excel-eksporten allerede regner riktig.

Konkret ligger feilen i `calculateReferenceSections` i `src/components/voltage-round/types.ts`:
```
const rm = measurements[reference.id]?.[phase]?.measValue;  // ← samleskinnens måling
const dev = effective - rm;
```

Skal være feltets egen `refValue` (avlest på samleskinnen samtidig med feltmålingen).

## Endring

**`src/components/voltage-round/types.ts` — `calculateReferenceSections` / `buildGroup`:**
- Bruk `measurements[field.id][phase].refValue` som referanse i stedet for `measurements[reference.id][phase].measValue`.
- `deviation = effectiveFieldValue − field.refValue`.
- Hvis feltets `refValue` mangler, hopp over fasen (som i dag når `measValue` mangler).
- Referansefelt (samleskinne / valgt referansefelt) skal fortsatt ikke få egen avviksrad — filtreres bort som nå.

**`src/components/voltage-round/ResultsView.tsx`:**
- Kolonneoverskriften "Ref. (Samleskinne A)" endres til f.eks. "Ref. spenning (avlest v/felt)" for å reflektere at verdien er per-felt, ikke samleskinnens egen måling.
- Ingen annen logikk.

**Excel-eksport (`src/lib/voltageRoundXlsx.ts`):** ingen endring — bruker allerede `refValue`/`measValue` per felt riktig.

**MeasurementInput:** ingen endring — UI-en er allerede korrekt (to bokser per felt, ref-boks grået ut for referansefeltet selv).

## Ikke-mål

- Ingen endring i datamodell, lagring, mal-mapping eller stasjonsoppsett.
- Ingen auto-utfylling av `refValue` mellom felt.
