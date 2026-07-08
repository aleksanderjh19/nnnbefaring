## SF6 Gassrunde – nytt verktøy under Stasjon

Nytt verktøy `/sf6-runde` som lar montør registrere SF6-gassnivå på brytere per stasjon og spenningsnivå, og lagre runden med dato + innlogget montør.

### Brukerflyt

1. **Stasjon → SF6 gassrunde** åpner listevisning:
   - Knapp «Ny runde» + kort for hver stasjon (kun **Nedre Røssåga** i første omgang).
   - Under: Historikk over lagrede runder (dato, stasjon, montør). Trykk for å se i fremvisningsmodus.
2. **Trykk på stasjonskort** → oppretter ny runde med:
   - Måned/år forhåndsutfylt (dagens måned, redigerbart tekstfelt f.eks. "Januar 2026").
   - Temperatur-felt (°C, én gang for hele runden, obligatorisk).
   - Montør = innlogget bruker (auto, vises).
3. **Spenningsnivå-oversikt**: Ett kort per nivå (420 / 300 / 220 / 132 kV). Kort viser antall brytere og status (0/8 utført). Fullført nivå får grønn hake + grønn ramme.
4. **Trykk på nivå-kort** → skjema med alle brytere for det nivået:
   - Standard: tre inputfelt (L1, L2, L3) i **MPa** per bryter, bryternavn til venstre.
   - **Enfase-brytere** (T9E og T7E på 132 kV): kun ett inputfelt (samlet verdi), ingen L1/L2/L3-splitt.
   - «Fullfør steg» nederst → tilbake til nivå-oversikt.
5. Når alle nivåer er grønne → knapp **«Fullfør runde»** blir aktiv → lagres i DB → åpner **fremvisningsmodus** (read-only oversikt: alle nivåer/brytere/verdier + temperatur + montør + dato). Runden kan ikke redigeres etter fullføring.

### Data / brytere (Nedre Røssåga)

- **420 kV** (3-fase): T10AE, T13AE, Ra1AE, Tu1AE, Tu1BE, Ra1BE, T13BE, T10BE
- **300 kV** (3-fase): T10AE, T11AE, Kb1AE, T7AE, Ma1AE, T9AE, T9BE, Ma1BE, T7BE, Kb1BE, T11BE, T10BE
- **220 kV** (3-fase): Aj1E
- **132 kV**: T9E *(enfase)*, T7E *(enfase)*

Enhet: **MPa** (kan endres senere hvis noen brytere bruker annen benevnelse).

Ingen automatisk grenseverdi-vurdering – kun registrering.

### Teknisk

**Ny fil `src/data/sf6Stations.ts`** – statisk template:
```ts
{ id: "nedre-rossaga", name: "Nedre Røssåga",
  levels: [
    { kV: "420", breakers: [ { name: "T10AE", singlePhase: false }, ... ] },
    { kV: "132", breakers: [ { name: "T9E", singlePhase: true }, { name: "T7E", singlePhase: true } ] },
  ] }
```

**Ny tabell `sf6_rounds`** (migration):
- `station_id` text, `station_name` text
- `month_label` text (fri tekst, f.eks. "Januar 2026")
- `temperature` numeric
- `technician_name` text, `user_id` uuid (auth.uid())
- `measurements` jsonb – 3-fase: `{ L1, L2, L3 }`, enfase: `{ value }`. Struktur: `{ "132": { "T9E": { value: 0.5 }, ... }, "420": { "T10AE": { L1, L2, L3 }, ... } }`
- `unit` text default `'MPa'`
- `created_at`, `updated_at`
- RLS: authenticated kan SELECT alt, INSERT/UPDATE/DELETE egne rader (via user_id). Standard GRANTs.

**Nye sider**:
- `src/pages/Sf6Round.tsx` – liste + wizard (stasjonsvalg → nivåkort → per-nivå skjema → fullfør), samme mønster som `VoltageRound.tsx`.
- `src/pages/Sf6RoundView.tsx` – fremvisningsmodus (read-only), også brukt fra historikk.

**Ruter** i `src/App.tsx`: `/sf6-runde`, `/sf6-runde/:id`.

**Stasjon.tsx**: nytt `ToolCard` «SF6 gassrunde» (ikon: `Gauge`), path `/sf6-runde`, `wip: true`.

### Åpne punkter (kan avklares senere)

- Om andre brytere har annen enhet enn MPa.
- Ekstra stasjoner – legges til i `sf6Stations.ts` etterhvert.
