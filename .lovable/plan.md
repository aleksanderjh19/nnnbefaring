# Bilder per bryter under SF6-gassrunde

Legge til mulighet for å knytte bilder til hver enkelt bryter — for å dokumentere feil/avvik funnet under runden. Bilder vises på både registrerings- og fremvisningssiden, kan åpnes i storskjerm og lastes ned som JPEG.

## UX

**Registrering (level-siden — der man fyller inn trykk):**
- Til høyre for hver bryter-rad legges en kompakt kamera-knapp (ikon-knapp, `36x36`, avrundet, nøytral border).
- Har bryteren allerede bilder: knappen viser en liten badge med antall (f.eks. `2`) og bytter farge til primær.
- Klikk åpner en dialog "Bilder – {bryternavn}" med:
  - Grid (2–3 kolonner) med thumbnails av eksisterende bilder. Trash-ikon i hjørnet for å slette.
  - To handlinger nederst: **Ta bilde** (mobil-kamera via `capture="environment"`) og **Last opp** (velg fra galleri/filer, flere om gangen).
  - Upload-progress inline. Bildene komprimeres i browser til maks 1600px lengste side / JPEG for å holde bucket-en lett.

**Fremvisning (view-modus + historikk):**
- Ny høyre-kolonne "Bilder" i tabellen. Hvis bryter har bilder: liten thumbnail-stack med badge for antall. Ellers `—`.
- Klikk på raden/thumbnailen åpner samme dialog i lese-modus (grid av bilder, ingen upload/slett).
- Klikk på en enkelt thumbnail åpner fullskjerm-lightbox (samme mønster som referansebilde i Montasje: fyller viewport, pinch-zoom/pan, mouse wheel, dobbelt-tap).
- I lightbox: knapp **Last ned JPEG** (nedlaster som `{stasjon}_{kV}kV_{bryter}_{n}.jpg`), pluss neste/forrige hvis flere bilder.

Klikk på en bryter for å markere gjennomgang (grønn/oransje) fortsetter å funke — kamera-knappen har egen `stopPropagation` så trykk på den ikke endrer status.

## Lagring

**Ny Supabase Storage-bucket:** `sf6-round-photos` (privat).
- Path: `{round_id}/{kV}/{breakerName}/{timestamp}-{rand}.jpg`
- RLS på `storage.objects` for bucket-en: eier (`owner = auth.uid()`) kan `select/insert/update/delete`; admin (`has_role`) kan alt. Signerte URL-er (1 t) brukes for visning og nedlasting.

**Ny tabell** `public.sf6_round_photos`:
```
id uuid pk
round_id uuid fk sf6_rounds(id) on delete cascade
voltage_level text
breaker_name text
storage_path text
created_by uuid
created_at timestamptz default now()
```
- GRANT select/insert/delete til `authenticated`, ALL til `service_role`.
- RLS: eier eller admin kan lese/skrive/slette rader for egne runder; admin ser alt.
- Index på `(round_id, voltage_level, breaker_name)`.

## Kodeendringer

- `src/pages/Sf6Round.tsx`
  - Ny state `photos: Record<string, PhotoRow[]>` nøklet på `"{kV}::{breaker}"`, lastes ved åpning av runde/visning.
  - Kamera-knapp på bryter-rad i `level`-view og bilde-kolonne i `view`-modus.
  - Ny komponent `Sf6BreakerPhotos` (dialog) og `Sf6PhotoLightbox` (fullskjerm-viewer, gjenbruker mønsteret fra `MontasjeDetail`).
- Ny helper `src/lib/imageCompress.ts` (canvas-basert JPEG-komprimering).
- Migrasjon for tabell + policies + grants. Bucket opprettes via storage-tool + separat migrasjon for `storage.objects`-policies.

## Ikke i scope

- Kommentarer/notater per bilde (kan legges til senere).
- Bildekaruseller i historikk-listen.
- Annotering/tegning oppå bilder.
