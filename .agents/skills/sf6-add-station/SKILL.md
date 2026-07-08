---
name: sf6-add-station
description: How to add a new SF6 station (with its own voltage levels and breakers) to the SF6 round feature. All UI, fremvisning, save/print flows carry over automatically.
---

# Legg til ny SF6-stasjon

Alt av UI (stasjonsvelger, runde-oppsett, nivåkort, målings-input, fremvisning med
oransj/grønn-logikk, historikk og lagring til Lovable Cloud) leser fra én sentral
datastruktur. For å legge til en ny stasjon trenger du **kun å redigere én fil**:
`src/data/sf6Stations.ts`.

## Steg-for-steg

Åpne `src/data/sf6Stations.ts` og legg til et nytt objekt i `sf6Stations`-arrayen:

```ts
{
  id: "unik-slug",              // brukes i DB som station_id — ikke endre etter lagring
  name: "Visningsnavn",         // vises i UI
  levels: [
    {
      kV: "420",                // string, sortert slik du vil vise dem
      breakers: [
        { name: "T10AE" },      // 3-fase bryter (default)
        { name: "T7E", singlePhase: true },  // 1-fase: én verdi i stedet for L1/L2/L3
      ],
    },
    {
      kV: "132",
      breakers: [
        { name: "T9E", singlePhase: true },
      ],
    },
  ],
},
```

### Feltforklaring

- **`id`** — stabil nøkkel. Lagres som `station_id` i `sf6_rounds`. Endring bryter
  historikk-kobling. Bruk kebab-case, f.eks. `"ovre-rossaga"`.
- **`name`** — vises i stasjonsliste og som overskrift på runde.
- **`levels[].kV`** — spenningsnivå som streng. Rekkefølgen i arrayen bestemmer
  visningsrekkefølgen.
- **`levels[].breakers[].name`** — bryternavn slik det skal vises og lagres.
- **`levels[].breakers[].singlePhase`** — sett til `true` hvis bryteren måles med
  én verdi. Utelates for 3-fase (L1/L2/L3).

## Spesialtilfeller

### Egendefinert trykk-benevnelse (MPa/Bar)

Standard er `MPa`. Unntak håndteres i `breakerUnit(kV, breakerName)` i
`src/pages/Sf6Round.tsx` (linje ~59). Legg til ny `if`-gren for din bryter:

```ts
function breakerUnit(kV: string, breakerName: string): string {
  if (kV === "132" && breakerName === "T7E") return "Bar";
  // legg til flere unntak her
  return "MPa";
}
```

## Det du IKKE trenger å gjøre

- Ingen endringer i `Sf6Round.tsx` for nye stasjoner/nivåer/brytere (bortsett fra
  benevnelse-unntak over).
- Ingen DB-migrasjon. `sf6_rounds.measurements` er `jsonb` og lagrer strukturen
  som er.
- Ingen endring i print/eksport — det leser fra samme data.
- Ingen ruter, ingen nye komponenter.

## Verifisering

1. Åpne `/sf6-runde` i preview.
2. Ny stasjon skal dukke opp i lista.
3. Start ny runde → alle nivåer skal vises som kort.
4. Åpne et nivå → alle brytere skal ligge der med riktig antall fase-input.
5. Lagre → sjekk at runden dukker opp i historikk.
