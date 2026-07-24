## Fix i `src/pages/UtlansList.tsx`

Endre segmenteringen slik at `awaiting_owner_return` behandles som innlevert i den synlige flyten:

- `awaiting` (for eierens "Til signering"-seksjon): uendret — inkluderer `awaiting_owner_loan` og `awaiting_owner_return`.
- `ongoing`: kun rader som ikke er `returned` **og ikke** `awaiting_owner_return`.
- `history`: `returned` **eller** `awaiting_owner_return`.

I `statusMeta` endres `awaiting_owner_return` til samme label/ikon/styling som `returned` ("Innlevert", grønn), slik at kortet ser innlevert ut i historikk. Eier ser fortsatt raden separat i "Til signering" (der bruker vi allerede en egen visuell kontekst — badge blir "Innlevert", men seksjonens overskrift markerer at det avventer signering).

Ingen andre endringer.
