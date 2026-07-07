
## Mål
Gjøre Drone-seksjonen brukbar som **veiledning i arbeid** – 100 % korrekt mot Luftfartstilsynet / EU 2019/947, med visuelle avstandskrav og komplett C-klasse-oversikt.

## 1. Faktasjekk og korrigering av `droneRules.ts`

Feil/uklarheter i dagens data som rettes:

- **A1**: legge til at C1 må ha ≤ 900 g **og** kinetisk energi < 80 J, og at overflyging av enkeltpersoner er *tillatt men skal minimeres* (ikke forbudt). Presisere at privatbygd < 250 g ikke krever kompetansebevis, men operatør må fortsatt registreres hvis dronen har kamera.
- **A2**: minsteavstand er **30 m horisontalt**, kan reduseres til **5 m** i lavhastighetsmodus (≤ 3 m/s). Legge til at C2 må ha lavhastighetsmodus for at 5 m skal gjelde. Aldersgrense fjernpilot 16 år (kan senkes lokalt).
- **A3**: her legges **1:1-regelen** eksplisitt inn: *«Horisontal avstand til uinvolverte personer og til bolig-/forretnings-/industri-/rekreasjonsområder skal minst tilsvare dronens flyhøyde over bakken.»* – dette er EASA/LTs anbefaling for trygg avstand.
- **Alle underkategorier**: Legge til at 120 m er over *nærmeste punkt på jordoverflaten* (terrengfølging), ikke startpunktet. Presisere krav om Remote ID for C1/C2/C3/C5/C6.
- **STS**: Presisere at STS-01/02 gjelder fra 1.1.2024 (overgang ferdig), krever LUC eller deklarasjon, og at nasjonale RO1/RO2/RO3 er utfaset.
- Kildelenker verifiseres og oppdateres til de faktiske sidene på luftfartstilsynet.no.

## 2. Ny 1:1-regel-seksjon

Legge til et eget felt `distanceRule` på A2 og A3 som rendres tydelig (eget kort) på detaljsiden, med kort tekst + henvisning til illustrasjon.

## 3. C-klasser (C0–C6) – detaljerte kort

Ny fil `src/data/droneClasses.ts` med ett objekt per klasse:

| Felt | Innhold |
|---|---|
| `code` | C0, C1, C2, C3, C4, C5, C6 |
| `maxWeight` | MTOM |
| `maxSpeed` | horisontal maks |
| `maxHeight` | (der aktuelt, f.eks. C0 begrenset høyde over startpunkt) |
| `kineticEnergy` | maks (C1: 80 J) |
| `subcategories` | hvilken A/STS klassen kan flys i |
| `requirements` | Remote ID, geo-awareness, lavhastighetsmodus, lydnivå, klassemerking |
| `notes` | fritekst |

Ny side `src/pages/DroneClasses.tsx` som lister alle klassene som kort, og `DroneClassDetail.tsx` for enkeltklassen. Legges som et tredje kort på `/drone` (ved siden av Regler og Guides).

## 4. Illustrasjoner fra Luftfartstilsynet

Du laster ned bildene selv og legger dem i `public/drone/`. Jeg lager `src/data/droneImages.ts` som mapper filnavn → tittel + hvilken regel de tilhører, og viser dem på detaljsiden med `<img>`+figcaption.

Illustrasjonene jeg legger opp for (du henter fra luftfartstilsynet.no):

```text
public/drone/
  a1-avstand.png            (A1 – nær mennesker)
  a2-30m-5m.png             (A2 – 30 m / 5 m lavhastighet)
  a3-150m.png               (A3 – 150 m til bebyggelse)
  regel-1til1.png           (1:1-regelen, høyde = horisontal avstand)
  maks-hoyde-120m.png       (120 m over terreng)
  klasser-c0-c6.png         (klasseoversikt)
```

Hvis en fil mangler, vises kortet uten bilde (ingen krasj). README-note i `public/drone/README.md` med lenker til hvor på luftfartstilsynet.no bildene finnes, så du vet hva som skal lastes ned.

## 5. UI-endringer

- `DroneRuleDetail.tsx`: legge til seksjon «Avstand og 1:1-regel» og «Illustrasjoner» øverst under short description. Behold eksisterende designstil (kort med Statnett-grønn header).
- `Drone.tsx`: tredje kort «Droneklasser (C0–C6)».
- `App.tsx`: nye ruter `/drone/klasser` og `/drone/klasser/:id`.

## Tekniske detaljer
- Ren frontend – ingen DB/edge functions.
- All tekst på norsk, kilder lenkes til luftfartstilsynet.no.
- Bruker kun eksisterende shadcn-komponenter (Card, Badge, Separator) og Statnett-grønn.
- Ingen bilder committes; kun README + kode som forventer filene.

## Etter implementering
Du legger de 6 PNG-ene i `public/drone/` (jeg gir deg direkte URL-referanse i README), så vises alt.
