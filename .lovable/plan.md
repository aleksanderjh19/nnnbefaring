## Plan for å rydde opp Excel-outputten

1. **Bytte fra navne-match til fast mal-mapping**
   - Lage en eksplisitt mapping per Excel-mal (`marka-300`, `marka-132`, `rana-132`, `trofors-300`, `namsskogan-300`).
   - Mappingen skal bruke interne felt-IDer og faste Excel-posisjoner, ikke tekst i overskrifter. Dette hindrer at målinger havner feil når navn/tekster avviker litt fra malen.

2. **Riktig plassering av målinger**
   - Referansefelt/samleskinne: brukerens målte referanseverdi skal inn i `Ref. instr.`-kolonnen.
   - Vanlige felt: `refValue` skal inn i `Ref. instr.`, og `measValue` skal inn i `Måleinstr.`.
   - Field-reference-stasjoner som Namsskogan skal håndteres riktig: valgt referansefelt behandles som referanse, ikke som vanlig felt.
   - Rana/Svabo-omregning beholdes, men legges på faste celler i malen slik at omregnede felter fylles likt hver gang.

3. **Fylle rekkeklemmer og headerdata konsekvent**
   - Eksporten skal også skrive oppdaterte rekkeklemmenummer fra appen inn i malen der brukeren har endret/lagt inn noe.
   - Sekundærspenning skal ikke være hardkodet til `110`; den skal beregnes ut fra valgt Uf slik at `57,7 / 63,5 / 115,5 / 127` gir riktig malverdi.

4. **Fikse formelutførelse og diagramgrunnlag**
   - Beholde eksisterende Excel-formler, format og diagrammer.
   - Oppdatere/rydde formel-cache slik at avvik i Volt vises direkte ved åpning.
   - Sette workbook-kalkulering til automatisk/full rekalkulering.
   - Fjerne `calcChain` korrekt fra pakken, inkludert relaterte referanser, så Excel ikke åpner med stale/ødelagt kalkuleringsstatus.
   - Beregne og skrive cached verdier for de enkle avviksformlene, mens selve formlene fortsatt beholdes dynamiske i Excel.

5. **Legge inn eksportvalidering**
   - Etter endring tester jeg med syntetiske målinger for hver mal og sjekker XLSX-innholdet direkte: riktig celle får riktig ref/mål-verdi, formler ligger igjen, og formelcache/diagramkilde-rader er oppdatert.
   - For minst én mal med busbar, én med field-reference og Rana med omregning verifiseres mappingen særskilt.