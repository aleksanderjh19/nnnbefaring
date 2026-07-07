export type RuleSection = {
  title: string;
  items: string[];
};

export type DroneRule = {
  id: string;
  code: string;
  title: string;
  shortDescription: string;
  category: "Åpen kategori" | "Spesifikk kategori";
  weightClass?: string;
  minDistance?: string;
  pilotRequirement?: string;
  sections: RuleSection[];
  sources: { label: string; url: string }[];
};

export const droneRules: DroneRule[] = [
  {
    id: "a1",
    code: "A1",
    title: "A1 – Fly over mennesker (ikke folkemengder)",
    shortDescription:
      "Lette droner. Kan fly nær og over enkeltpersoner, men aldri over folkemengder.",
    category: "Åpen kategori",
    weightClass: "< 250 g (C0) eller < 900 g (C1)",
    minDistance: "Ingen fast minsteavstand til enkeltpersoner",
    pilotRequirement: "A1/A3 nettkurs + eksamen (for C1)",
    sections: [
      {
        title: "Hva du kan gjøre",
        items: [
          "Fly droner under 250 g (C0 / privatbygde) også over enkeltpersoner",
          "Fly C1-droner (< 900 g) nær mennesker, men unngå planlagt overflyging",
          "Maks flyhøyde 120 meter over bakken/terrenget",
          "Alltid innenfor synsrekkevidde (VLOS)",
        ],
      },
      {
        title: "Krav og forbud",
        items: [
          "Aldri fly over folkemengder (f.eks. konserter, demonstrasjoner, køer)",
          "C1-droner krever bestått A1/A3 nettkurs hos Luftfartstilsynet",
          "Registrer deg som operatør på flydrone.no",
          "Operatørnummer må stå på dronen",
          "Følg NOTAM og respekter restriksjonsområder",
        ],
      },
    ],
    sources: [
      { label: "Luftfartstilsynet – Åpen kategori A1", url: "https://luftfartstilsynet.no/droner/apen-kategori/" },
      { label: "flydrone.no", url: "https://flydrone.no" },
    ],
  },
  {
    id: "a2",
    code: "A2",
    title: "A2 – Fly nær mennesker",
    shortDescription:
      "Mellomtunge droner. Krever ekstra teoriprøve og gir trygg avstand til folk.",
    category: "Åpen kategori",
    weightClass: "< 4 kg (C2)",
    minDistance: "30 m horisontalt til uinvolverte (5 m i lavhastighetsmodus)",
    pilotRequirement: "A1/A3 nettkurs + A2 tilleggseksamen + egenerklæring om praktisk trening",
    sections: [
      {
        title: "Hva du kan gjøre",
        items: [
          "Fly C2-droner (opp til 4 kg) nær mennesker med minst 30 m horisontal avstand",
          "Redusere avstanden til 5 m ved bruk av lavhastighetsmodus (maks 3 m/s)",
          "Fly opp til 120 m over bakken",
        ],
      },
      {
        title: "Krav",
        items: [
          "Bestått A2 tilleggseksamen ved godkjent testsenter",
          "Kompetansebevis må medbringes",
          "Operatørregistrering på flydrone.no",
          "Egenerklæring om praktisk selvtrening",
        ],
      },
      {
        title: "Forbud",
        items: [
          "Aldri over folkemengder",
          "Aldri over uinvolverte personer",
          "Ikke i restriksjonsområder uten tillatelse",
        ],
      },
    ],
    sources: [
      { label: "Luftfartstilsynet – A2 underkategori", url: "https://luftfartstilsynet.no/droner/apen-kategori/" },
    ],
  },
  {
    id: "a3",
    code: "A3",
    title: "A3 – Fly langt fra mennesker",
    shortDescription:
      "Tyngre droner. Krever god avstand til folk, bygninger og infrastruktur.",
    category: "Åpen kategori",
    weightClass: "< 25 kg (C3/C4 eller privatbygd)",
    minDistance: "150 m til bolig-, industri-, forretnings- og rekreasjonsområder",
    pilotRequirement: "A1/A3 nettkurs + eksamen",
    sections: [
      {
        title: "Hva du kan gjøre",
        items: [
          "Fly droner opp til 25 kg langt unna mennesker",
          "Fly i områder hvor det er rimelig å anta at ingen uinvolverte oppholder seg",
          "Maks 120 m høyde",
        ],
      },
      {
        title: "Krav",
        items: [
          "Minst 150 m til bolig-, forretnings-, industri- og rekreasjonsområder",
          "Bestått A1/A3 nettkurs og eksamen",
          "Operatørregistrering og operatørnummer på dronen",
        ],
      },
      {
        title: "Typisk bruk",
        items: [
          "Inspeksjon av linjer og master i grisgrendte strøk",
          "Kartlegging av utmark",
          "Landbruk og skog",
        ],
      },
    ],
    sources: [
      { label: "Luftfartstilsynet – A3 underkategori", url: "https://luftfartstilsynet.no/droner/apen-kategori/" },
    ],
  },
  {
    id: "sts",
    code: "STS / Spesifikk",
    title: "Spesifikk kategori (STS-01 / STS-02 / SORA)",
    shortDescription:
      "For operasjoner som går utover Åpen kategori – f.eks. BVLOS, over mennesker med tung drone eller i restriksjonsområder.",
    category: "Spesifikk kategori",
    pilotRequirement: "Operatørens driftshåndbok + fjernpilotens teori- og praksisprøve for STS",
    sections: [
      {
        title: "Når du må inn i Spesifikk kategori",
        items: [
          "Flyging utenfor synsrekkevidde (BVLOS)",
          "Drone over 25 kg",
          "Flyging over 120 m",
          "Operasjoner nær eller over mennesker som ikke tillates i Åpen",
          "Slipp av gods, transport av farlig gods",
        ],
      },
      {
        title: "Standardscenarier (STS)",
        items: [
          "STS-01: VLOS over kontrollert bakkeområde i befolket miljø (drone C5)",
          "STS-02: BVLOS med luftromsobservatører i tynt befolket område (drone C6)",
          "Krever forhåndsdeklarasjon til Luftfartstilsynet",
        ],
      },
      {
        title: "SORA / operativ tillatelse",
        items: [
          "For operasjoner som ikke passer inn i STS: SORA-risikovurdering",
          "Søknad om operativ tillatelse hos Luftfartstilsynet",
          "Krever operatørens driftshåndbok, prosedyrer og risikotiltak",
        ],
      },
      {
        title: "Krav til pilot",
        items: [
          "Teoretisk prøve for STS ved godkjent enhet",
          "Praktisk trening iht. scenarioet",
          "Kompetansebevis for fjernpilot i spesifikk kategori",
        ],
      },
    ],
    sources: [
      { label: "Luftfartstilsynet – Spesifikk kategori", url: "https://luftfartstilsynet.no/droner/spesifikk-kategori/" },
      { label: "EASA – STS", url: "https://www.easa.europa.eu/en/domains/civil-drones" },
    ],
  },
];

export const getDroneRuleById = (id: string) =>
  droneRules.find((r) => r.id === id);
