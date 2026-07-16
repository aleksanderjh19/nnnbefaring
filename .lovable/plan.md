# Plan: Utlånsskjema

Nytt verktøykort på dashboard som lar en Statnett-ansatt fylle ut "Avtale om utlån av utstyr" digitalt, signere på skjerm, og laste ned en ferdig utfylt PDF som beholder originalens format 100%.

## Dashboard-integrasjon

- Nytt kort "Utlånsskjema" i `src/pages/Dashboard.tsx` (ikon: `FileSignature` fra lucide), path `/utlansskjema`.
- Rute i `App.tsx` beskyttet av `ProtectedRoute` + `RequireVisibleCard scope="dashboard" cardId="utlansskjema"` (samme skjul/vis-toggle som øvrige kort).

## Skjema-side (`src/pages/UtlansSkjema.tsx`)

Bruker samme `CategoryHeader`/kort-stil som resten av appen. Steg-basert flyt (samme stil som SF6-runde), tilpasset mobil/iPad/PC:

1. **Låntaker**
   - Navn
   - Ansattnr.
2. **Utstyr**
   - Utlånt gjenstand
   - Reg.nr/serienr.
   - Dato fra (date-picker)
   - Dato til (date-picker)
3. **Sted & signatur**
   - Dato/Sted (auto-fylt dagens dato, redigerbar)
   - Signatur låntaker (gjenbruker eksisterende `SignaturePad`)
   - Signatur "For Statnett SF (ansvarlig utstyrseier)"
4. **Innlevering** (valgfritt — kan fylles ut senere)
   - Dato innlevert
   - Kvittering / kommentar
   - Signatur ansvarlig utstyrseier

Alle felt validert før generering (unntatt innleveringsseksjonen). Auto-lagres i `localStorage` som draft slik at brukeren ikke mister data ved navigering.

## PDF-generering

- Bygger PDF på klient med `pdf-lib` (npm) — reproduserer originalens tekst 1:1 fra den parsede PDF-en (all "Retningslinjer"-tekst inkludert), med Helvetica/Times og samme paginering (2 sider, "Oppdatert 27.04.2026"-footer).
- Utfylte verdier tegnes inn på riktig linje der originalen har understreker (Låntaker, Utlånt gjenstand, Reg.nr, datoer, Dato/Sted, Innlevert, Kvittering).
- Signaturbilder (PNG dataURL fra `SignaturePad`) plasseres over signaturlinjene.
- Ferdig PDF lastes ned med filnavn `Utlansskjema_<navn>_<dato>.pdf` via en blob-download-lenke. Ingen server involvert.

## Lagring

Ingen backend-lagring nå (skjemaet er en engangs-PDF). Kun `localStorage` draft. Kan enkelt utvides senere til Supabase-tabell hvis ønsket.

## Filer som opprettes/endres

- `src/pages/UtlansSkjema.tsx` (ny — wizard-UI)
- `src/lib/utlansPdf.ts` (ny — pdf-lib generator)
- `src/pages/Dashboard.tsx` (nytt kort)
- `src/App.tsx` (ny rute)
- `package.json` (legger til `pdf-lib`)

## Teknisk

- Responsivt: samme mobile-first oppsett som SF6/Spenningsrunde (single column, store touch-mål, sticky "Neste"-knapp).
- Signatur fungerer på touch + mus (allerede løst i `SignaturePad`).
- PDF genereres helt i nettleseren — ingen edge function, ingen storage-bucket.
