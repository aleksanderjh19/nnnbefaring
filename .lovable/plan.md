
## Mål
Bygge en egen underseksjon `/drone/prosedyrer` som samler Statnetts interne droneprosedyrer (44 SDOK-dokumenter totalt), med søk, tema-gruppering, sammendrag og lenke til original-PDF. Kryssreferanser fra A1/A2/A3/STS-kortene til relevante prosedyrer.

## 1. Datamodell (statisk TS-fil, ikke database)

Ny `src/data/statnettProcedures.ts`:

```ts
type ProcedureTheme =
  | "normale" | "nod" | "beredskap" | "vedlikehold"
  | "gdpr" | "miljo" | "sora-bvlos" | "roller" | "sjekkliste" | "sop" | "manual";

type StatnettProcedure = {
  sdokId: string;              // "SDOK-839-63"
  title: string;               // Norsk tittel fra SDOK.csv
  revision: string;            // "9.0"
  approvedDate: string;        // "25.03.2026"
  themes: ProcedureTheme[];    // kan ha flere
  summary: string;             // 1-2 setninger
  keyPoints: string[];         // 3-8 operative kulepunkter
  relatedRuleIds?: string[];   // ["a3","sts"] for kryssref
  pdfUrl?: string;             // Cloud Storage public URL
};
```

Alle 44 dokumenter samles her etter hvert som du sender batcher.

## 2. Opplasting av PDF-er (Lovable Cloud Storage)

- Ny bøtte: `statnett-drone-docs` (public, read-only for authenticated).
- For hver batch parser jeg PDF-ene med `document--parse_document`, laster opp originalen til bøtta med `supabase--storage_upload`, og noterer public URL i `pdfUrl`.
- Migrering trengs kun én gang for å opprette bøtta + RLS-policy (read for authenticated).

## 3. Batching-arbeidsflyt (samle først, bygg til slutt)

Denne runden = **batch 1 (10 filer)**. Fremgangsmåte:

1. Batch 1–4 (10–14 filer per runde): jeg parser hver PDF, skriver et JSON-utkast per dokument til `/tmp/statnett-batch-N.json` og laster opp PDF. Ingen UI-endringer enda, bare framdriftsmelding: "Batch N ferdig, X/44 dokumenter behandlet".
2. Etter siste batch: jeg konsoliderer alt til `src/data/statnettProcedures.ts` og bygger UI.
3. Hvis vi mister sandbox-state mellom meldinger, gjenoppretter jeg fra opplastede PDF-URLer i Storage.

**Ikke unødvendig info:** for hver PDF plukker jeg kun ut:
- Formål/scope
- Operative krav (avstand, høyde, vær, bemanning)
- Kritiske sjekkpunkter / go-no-go
- Referanser til A/STS-kategori og andre SDOK
Alt av signaturlister, revisjonshistorikk, formalia, generisk EASA-tekst utelates.

## 4. UI

**Ny side `/drone/prosedyrer` (`src/pages/StatnettProcedures.tsx`)**

Layout (kombinasjon som avtalt):

```text
┌─────────────────────────────────────────┐
│ Header: "Statnett-prosedyrer"           │
│ Søkefelt (fritekst mot tittel+summary)  │
│ Chips: [Alle] [Normale] [Nød] [SORA]…   │
├─────────────────────────────────────────┤
│ ▾ Normale prosedyrer (3)                │
│   ├─ SDOK-839-15 Normale prosedyrer     │
│   │   rev 10.0 · [Åpne PDF]             │
│   │   Sammendrag…                       │
│   │   • Punkt 1  • Punkt 2  …           │
│   └─ …                                   │
│ ▸ Nødprosedyrer (2)                     │
│ ▸ Beredskap (1)                         │
│ ▸ Sjekklister (5)                       │
│ …                                        │
└─────────────────────────────────────────┘
```

- Accordions bygd på eksisterende shadcn `Accordion`.
- Sjekklister (Vedlegg 142 DJI Dock 3 osv.): rendres som lesbar sjekkliste med tydelige avkryssingsbokser (ikke interaktive), gruppert per fase (pre-flight / under flight / post-flight).
- Alle PDF-lenker åpnes i ny fane fra Storage.

**Kryssref på eksisterende regelkort (`DroneRuleDetail.tsx`)**

Ny seksjon "Relaterte Statnett-prosedyrer" nederst som lister prosedyrer der `relatedRuleIds` inneholder gjeldende regel-id, med hopp til `/drone/prosedyrer#<sdokId>`.

**Drone-forsiden (`Drone.tsx`)**

Nytt kort under eksisterende: "Statnett-prosedyrer – Interne SOP, sjekklister, SORA og nødprosedyrer".

## 5. Denne runden (batch 1)

Jeg behandler de 10 vedlagte filene:

1. `Operasjonsmanual SDOK-839-2 v15.0` (hovedmanual – ekstraher nøkkelkapitler)
2. `Vedlegg 201 SOP` (SDOK-839-63)
3. `Vedlegg 203 UAS luftdyktighet` (SDOK-839-6)
4. `Vedlegg 211 Normale prosedyrer` (SDOK-839-15)
5. `Vedlegg 213 Beredskap` (SDOK-839-17)
6. `Vedlegg 214 Nødprosedyrer` (SDOK-839-18)
7. `Vedlegg 217 GDPR` (SDOK-839-21)
8. `Vedlegg 218 Miljø/sjenanse` (SDOK-839-22)
9. `Vedlegg 142 Sjekkliste DJI Dock 3 / Matrice 4D` (SDOK-839-88)
10. `SDOK.csv` (brukes som fasit for revisjonsnr og full liste over 91 dokumenter – jeg krysser av hvilke 44 du planlegger å laste opp)

Etter denne batchen får du: "Batch 1/~5 ferdig – 10 dokumenter parset og lastet opp. Send neste batch."

## 6. Etter siste batch – build-fase

1. Opprett Storage-bøtte (én migrering).
2. Skriv `src/data/statnettProcedures.ts` med alle 44 innslag.
3. Ny side `StatnettProcedures.tsx` + rute `/drone/prosedyrer`.
4. Kryssref-seksjon i `DroneRuleDetail.tsx`.
5. Nytt kort i `Drone.tsx`.
6. Typecheck.

## Ikke-mål
- Ingen versjonshåndtering av dokumenter (nyeste PDF viser).
- Ingen redigering i appen – rent leseverktøy.
- Ingen godkjenning/signatur-flyt.
- Ikke duplisere Luftfartstilsynets regelverk – kun Statnett-spesifikk info.

## Tekniske detaljer
- Storage-bøtte `statnett-drone-docs`, public read for authenticated (RLS på `storage.objects`).
- PDF-filnavn i bøtta: `<sdok-id>-v<rev>.pdf`.
- Ingen edge functions nødvendig.
- Frontend: eksisterende shadcn (Accordion, Input, Badge, Card).

Bekreft planen, så starter jeg batch 1 så snart mode bytter til build.
