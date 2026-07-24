
## Mål

1. Når et skjema er sendt til eier for signering, skal det vises som **Utlånt** for alle (både badge og filtrering) — selv om eier ikke har signert enda.
2. Eier skal fortsatt tydelig se hva som venter på signatur, i egen «Til signering»-seksjon.
3. Under opprettelse (draft) skal låntaker **aldri** se eier-signaturfeltet — skjemaet sendes jo videre til eier.
4. Rydde opp i redigeringstilganger og små inkonsekvenser.

## Statusmodell (uendret i DB)

Vi beholder de fem interne statusene i databasen:
`draft → awaiting_owner_loan → active → awaiting_owner_return → returned`.
Endringene er kun på visning/etikett og redigeringsregler.

### Vist status (badge og tekst)

```text
draft                  → "Pågående"           (grå/gul)
awaiting_owner_loan    → "Utlånt"             (samme badge som active)   ← ENDRES
active                 → "Utlånt"
awaiting_owner_return  → "Avventer godkjenning" (fortsatt i Pågående)
returned               → "Innlevert"
```

Så snart låntaker har signert og skjema er sendt til eier, er utstyret ute. Alle skal se det som utlånt; eier bekrefter i etterkant.

## Endringer

### `src/pages/UtlansList.tsx`
- `statusMeta.awaiting_owner_loan` får samme label/ikon/styling som `active` («Utlånt»).
- Eier ser fortsatt egen seksjon **«Til signering»** øverst (uendret filter på `awaiting_owner_loan`/`awaiting_owner_return`).
- Alle andre brukere: `awaiting_owner_loan` teller/vises som «Pågående utlån» med badge «Utlånt».
- `handleNew`: dropp auto-utfylling av `dato_sted` med ISO-dato (matcher ikke formatet «16.07.2026, Mosjøen») — la feltet stå tomt.

### `src/pages/UtlansSkjema.tsx`

**Eier-signatur (Statnett) — når vises den:**
- **Draft (låntaker oppretter):** aldri synlig — hverken pad, tekst eller «signeres av eier senere»-melding. Fjernes helt fra UI. Skjemaet sendes videre, så låntaker skal ikke se dette feltet i det hele tatt.
- **awaiting_owner_loan:**
  - Eier: signaturpad, redigerbar.
  - Andre: skjult eller diskret «Venter på eiers signatur»-linje (holdes minimal).
- **active / awaiting_owner_return / returned:** vises som signaturbilde (ikke pad) for alle.

**Innlevering (retur-signatur):**
- Redigerbar kun i `active` (låntaker signerer innlevering) og for eier i `awaiting_owner_return`.
- `innlevertDato` og `signaturInnlevering` låses fra og med `awaiting_owner_return`.

**Låntaker-signatur:**
- Låses så snart status forlater `draft` (i dag utilsiktet redigerbar for eier).

**Badge / infokort:**
- `displayStatus("awaiting_owner_loan")` → `{ label: "Utlånt", variant: "default" }`.
- Infokort for `awaitingLoan`:
  - Eier: uendret melding om at signatur mangler.
  - Andre: kort nøytral tekst, f.eks. «Utlånet er registrert. Venter på bekreftelse fra ansvarlig utstyrseier.»

### Ingen endringer
- DB-skjema, edge function (`notify-utlans-signering`), PDF-generering (`utlansPdf.ts`), sletteregler (admin), auto-lagring.

## Teknisk sammendrag

- Kun frontend-endringer i to filer: `UtlansList.tsx` og `UtlansSkjema.tsx`.
- Ingen migrasjon, ingen endring i typer, RLS eller edge functions.
