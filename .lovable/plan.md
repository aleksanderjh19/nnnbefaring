## Problem

Et skjema sendt til signering (`awaiting_owner_loan`) er usynlig i "Pågående utlån" når innlogget bruker også er eier (Aleksander er både lånetaker og eier på testraden). Da havner raden kun i "Til signering", ikke i "Pågående utlån". Dette bryter med regelen: *awaiting-skjemaer skal vises som utlånt for alle*.

Samme problem gjelder `awaiting_owner_return` (skal fortsatt telle som pågående til det faktisk er innlevert).

## Fix i `src/pages/UtlansList.tsx`

Endre segmenteringen slik at awaiting-rader alltid inngår i "Pågående utlån", uavhengig av rolle. "Til signering" er en ekstra visning for eier — ikke en erstatning.

Ny logikk:

```ts
const awaiting = visibleRows.filter(r =>
  r.status === "awaiting_owner_loan" || r.status === "awaiting_owner_return"
);
const ongoing  = visibleRows.filter(r => r.status !== "returned");   // inkluderer awaiting
const history  = visibleRows.filter(r => r.status === "returned");
```

Render:
- "Til signering" (kun eier, kun awaiting) — uendret.
- "Pågående utlån" viser hele `ongoing` for alle brukere (inkl. awaiting). Fjern grenene `!isOwner && awaiting.map(...)` og den betingede telleren.
- Historikk uendret.

## Ryddighet samtidig

- Rett tellerne slik at "Pågående utlån" alltid viser `ongoing.length`.
- Behold guarden mot dobbelt-oppretting og filteret som skjuler tomme drafts.

Ingen DB- eller schema-endringer.
