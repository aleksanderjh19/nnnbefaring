## Gjennomgang av kategorisering

Jeg gikk gjennom alle 43 prosedyrene mot temaene (Operasjonsmanual, SOP, Normale, Beredskap, Nød, Vedlikehold, GDPR, Miljø, SORA/BVLOS, Roller & kompetanse, Sjekklister). Ca. 38 er riktig kategorisert. Under er de jeg mener bør justeres, med begrunnelse.

### Foreslåtte endringer

**1. Vedlegg 241 – Reduksjon av luftrisiko (SDOK-839-66)**
- Nå: `normale`, `sora-bvlos`
- Foreslått: `sop`, `sora-bvlos`
- Hvorfor: Dokumentet handler om koordinering med lufttrafikktjeneste, NINOX og NOTAM — det er en standard operasjonell prosedyre, ikke en "normal flyprosedyre" (som er Vedlegg 211).

**2. Vedlegg 356 – Teknisk info DJI Dock 2 + Matrice 3(T)D (SDOK-839-99)**
- Nå: `manual`
- Foreslått: `sora-bvlos`, `vedlikehold`
- Hvorfor: Dette er en teknisk spesifikasjon for et dock-system, ikke en del av Operasjonsmanualen. Hører hjemme sammen med øvrig dock-/BVLOS-materiell og teknisk vedlikeholdsinformasjon.

**3. Sjekkliste DJI Dock 3 + Matrice 4D (SDOK-839-88)**
- Nå: `sjekkliste`
- Foreslått: `sjekkliste`, `sora-bvlos`
- Hvorfor: Selv om det er en sjekkliste, gjelder den utelukkende dock-BVLOS-operasjoner og bør dukke opp når man filtrerer på SORA/BVLOS.

**4. Vedlegg 260 – Løfteoperasjoner FlyCart (SDOK-839-112)**
- Nå: `sop`
- Foreslått: `sop`, `roller`
- Hvorfor: Prosedyren innfører en ny rolle (lasteansvarlig/signalgiver) med egne kompetansekrav, så den er relevant også under Roller & kompetanse.

**5. Vedlegg 800 – Selskapets kvalitetssystem (SDOK-839-55)**
- Nå: `manual`
- Foreslått: `manual`, `roller`
- Hvorfor: ISO-sertifisering, PDCA og HMS/ansvar hører også naturlig hjemme under organisasjons-/rolle-relatert innhold, ikke bare under Operasjonsmanual.

### Ikke endret (bevisst)
- Vedlegg 201 SOP har både `sop` og `normale` — beholdes fordi den faktisk inneholder normale flyprosedyre-elementer.
- Vedlegg 803 UAS støttesystemer har både `vedlikehold` og `manual` — beholdes, dekker flåtestyring og er referert fra Operasjonsmanualen.
- Vedlegg 881 Definisjoner under `manual` — beholdes, er integrert del av manualen.

### Teknisk

Kun endring av `themes`-arrayet på 5 objekter i `src/data/statnettProcedures.ts`. Ingen andre filer berøres — UI, filtre og relasjoner leser dette feltet direkte.
