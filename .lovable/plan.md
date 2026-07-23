
## Mål

1. Riktig referanse-modell pr. stasjon, med felt-tilhørighet valgbart pr. runde
2. Avviksberegning per felt mot valgt referanse, tydelig varsling
3. Excel-eksport 1:1 med Statnett-mal (fylte verdier + bevarte formler/diagram)
4. Bedre skjermvisning av avvik

## 1. Referanse-modell (tre stasjonstyper)

Vi har tre varianter basert på hvilke måleuttak som finnes:

**Type A — to skinner (SSA + SSB) måles**: Marka 300kV, Marka 132kV, Rana 132kV
- Bruker kobler hvert felt mot SSA / SSB / «ute av drift» pr. runde
- Sammenligning: felts måleverdi vs. valgt skinnes måleverdi

**Type B — én skinne (SSA) måles**: Trofors 300kV
- SSA er alltid referansen for alle øvrige felt
- Bruker kan sette felt til «ute av drift», men ingen skinne-valg
- (Ingen SSB å velge mellom)

**Type C — ingen skinne måles**: Namsskogan 300kV
- Bruker velger ett av feltene som **referansefelt** pr. runde
- Alle andre aktive felt sammenlignes mot referansefeltets måleverdier

Felles felt-status: `active` | `ute_av_drift`. Kun Type C har `isReference`.

## 2. Stasjonsmaler (`src/data/stationTemplates.ts` — full omskrivning)

```
StationTemplate {
  id, name, shortName,
  voltageLevels: [{
    id, kV, nominalVoltage, secondaryVoltage,
    referenceMode: "dual-busbar" | "single-busbar" | "field",
    fields: [{
      id, name, drawingRef, terminals{UL1,UL2,UL3},
      kind: "busbar" | "field",
      busbarLabel?: "A" | "B",
      defaultRefBusbar?: "A" | "B",        // Type A default
      isDefaultReference?: boolean,        // Type C default
      conversion?: { factor: number }      // Rana omsetning
    }]
  }]
}
```

Feltlister fra opplastede maler:
- **Marka 300kV** (dual-busbar) — SSA(+2R1), SSB(+2R1), Nedre Røssåga(+4R1), Trofors(+4R3)
- **Marka 132kV** (dual-busbar) — SSA(Skap 43), SSB(Skap 42), Mosjøen 1/3, Grytåga, Øyfjellet 1, Bleikvasslia, Trafo 1/2 (nybygg)
- **Rana 132kV** (dual-busbar, omsetning) — SSA(+R51), SSB(+R51), Svabo 2(+R41) [conv 0.9429], Svabo 4(+R32) [conv 0.9429], T5
- **Trofors 300kV** (single-busbar) — SSA, Namsskogan, Marka
- **Namsskogan 300kV** (field) — Kolsvik, Tunnsjødal, Trofors (default referansefelt: Kolsvik)

## 3. Runde-datamodell (`src/components/voltage-round/types.ts`)

```
TransformerField {
  id, name, drawingRef, kind, busbarLabel?, conversion?,
  refBusbar?: "A" | "B",        // dual-busbar
  isReference?: boolean,        // field-mode
  status: "active" | "ute_av_drift"
}
```

Ny `calculateDeviations`:
- Grense = Cl.0,2 fra Uf-tabellen (57.7→0.23, 63.5→0.25, 115.5→0.46, 127→0.5)
- **dual-busbar**: for hvert aktivt ikke-busbar felt → sammenlign med `measValue` på valgt SSA/SSB. Ved `conversion`: bruk `felt.measValue × factor` som sammenligningsverdi.
- **single-busbar**: for hvert aktivt felt utenom SSA → sammenlign med SSA.
- **field**: for hvert aktivt ikke-referanse felt → sammenlign med referansefeltets `measValue`.
- Avvik når `|diff| > grense`.

## 4. UI-endringer

**Feltkobling-steget** (erstatter `BusbarAssignment.tsx`)
- **dual-busbar**: SSA og SSB som header-kort. Under hvert øvrig felt: valg «Ligger mot SSA / SSB / Ute av drift». Rana Svabo-felt får info-badge «Omregnes med faktor 0,9429».
- **single-busbar**: SSA som header-kort. Under hvert øvrig felt: toggle «Aktiv / Ute av drift». Skinne-valg skjules.
- **field**: radio-gruppe «Velg referansefelt for denne runden» øverst. Under: for hvert felt toggle «Aktiv / Ute av drift».

**MeasurementInput.tsx**
- «Ute av drift»-felt skjules
- Referansefelt (Type C) og SSA (Type B) markeres tydelig med badge
- Rana: hjelpetekst «Omregnet: X V» under måle-feltet på Svabo

**ResultsView.tsx** — tydeligere avviksvisning:
- dual-busbar: én seksjon pr. skinne, viser hvert tilkoblet felts fase-tabell (Måle / Referanse / Avvik / Grense / Status)
- single-busbar: én seksjon «Referanse: Samleskinne A», tilsvarende tabell
- field: én seksjon «Referanse: {feltnavn}», tilsvarende tabell
- Røde bakgrunner + varselbanner på avvik
- «Last ned Excel» + «Last ned PDF»-knapp øverst

## 5. Excel-eksport (`src/lib/voltageRoundXlsx.ts`)

- Bundle 5 malfiler under `public/voltage-templates/` (marka-300, marka-132, namsskogan-300, rana-132, trofors-300)
- `bun add exceljs` — lazy-imported kun i export-funksjonen
- Mapping (samme celleoppsett i alle malene):
  - `B1` stasjon+kV, `B2` dato, `B3` sign
  - `G2..J2` Ref-instrument, `G3..J3` Måle-instrument, `J4` nominell sekundær
  - Rad 6/17 kol B/D/F/H/J = feltnavn (fra vår felt-rekkefølge)
  - Rad 7/18 = tegn.ref
  - Rad 9–11 og 20–22: rekkeklemme (odde kol) + diff-formler (allerede i malen)
  - Rad 13–15 og 24–26: Ref-verdi (venstre) og Måle-verdi (høyre) pr. fase
  - Rana: kolonne L/M for omregnede verdier
- Vi rører **ikke** diagram-referansene i rad 39–42
- Filnavn: `Spenningsrunde_{stasjon}_{kV}kV_{YYYY-MM-DD}.xlsx`

## 6. Migrasjon av lagrede runder

`voltage_rounds.data` er JSONB — hjelpefunksjon konverterer gamle runder ved innlasting:
- Gamle `busbar: "A"|"B"` → `refBusbar` + `kind="field"`, `status="active"`
- Type C-stasjoner: første felt får `isReference=true` hvis ingen har det

Ingen DB-schema-endring nødvendig.

## Rekkefølge på implementering

1. Kopier malfiler til `public/voltage-templates/`
2. Skriv om `stationTemplates.ts` med `referenceMode`, `kind`, `conversion`, `isDefaultReference`
3. Utvid `types.ts` + ny `calculateDeviations`
4. Bygg om feltkobling-komponenten (tre varianter)
5. Små justeringer i `MeasurementInput.tsx`
6. Bygg om `ResultsView.tsx` + Excel-knapp
7. `bun add exceljs` + `voltageRoundXlsx.ts`
8. Migrasjonshjelper i `VoltageRound.tsx`
9. Bygg + verifisere med Playwright pr. stasjon
