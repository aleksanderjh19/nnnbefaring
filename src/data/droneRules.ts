export type RuleSection = {
  title: string;
  items: string[];
};

export type RuleImage = {
  src: string; // public path, e.g. /drone/a2-30m-5m.png
  caption: string;
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
  /** Kort forklaring av 1:1-regel eller andre avstandsregler som skal fremheves. */
  distanceRule?: string;
  images?: RuleImage[];
  sections: RuleSection[];
  sources: { label: string; url: string }[];
};

export const droneRules: DroneRule[] = [
  {
    id: "a1",
    code: "A1",
    title: "A1 – Fly nær mennesker",
    shortDescription:
      "Lette droner. Kan fly nær enkeltpersoner. Overflyging skal minimeres, og aldri over folkemengder.",
    category: "Åpen kategori",
    weightClass: "< 250 g (C0 eller privatbygd) · < 900 g og < 80 J (C1)",
    minDistance: "Ingen fast minsteavstand til enkeltpersoner – overflyging skal minimeres",
    pilotRequirement:
      "C0 / privatbygd < 250 g: ingen eksamen. C1: A1/A3 nettkurs + eksamen hos Luftfartstilsynet",
    images: [
      { src: "/drone/a1-avstand.png", caption: "A1 – nær enkeltpersoner, aldri over folkemengder" },
      { src: "/drone/maks-hoyde-120m.png", caption: "Maks 120 m over nærmeste punkt på terrenget" },
    ],
    sections: [
      {
        title: "Hva du kan gjøre",
        items: [
          "Fly C0 eller privatbygd drone under 250 g også nær og over enkeltpersoner",
          "Fly C1-drone (< 900 g, < 80 J) nær mennesker – planlagt overflyging skal minimeres",
          "Maks flyhøyde 120 m over nærmeste punkt på jordoverflaten (terrengfølging)",
          "Alltid innenfor synsrekkevidde (VLOS)",
        ],
      },
      {
        title: "Krav og forbud",
        items: [
          "Aldri fly over ansamlinger av mennesker (konsert, demonstrasjon, kø, publikum)",
          "C1 krever bestått A1/A3 nettkurs og eksamen",
          "Operatør må registreres på flydrone.no dersom dronen har kamera (også < 250 g)",
          "Operatør-ID (e-ID) skal stå synlig på dronen",
          "C1 skal ha Direct Remote ID og geo-awareness aktivert",
          "Følg NOTAM og respekter restriksjons- og forbudsområder",
        ],
      },
      {
        title: "Aldersgrense",
        items: [
          "Fjernpilot skal være minst 16 år (kan senkes til 12 år ved organisert klubb/skole)",
          "Ingen aldersgrense for C0 / privatbygd < 250 g uten kamera i lekekategori",
        ],
      },
    ],
    sources: [
      { label: "Luftfartstilsynet – Åpen kategori", url: "https://luftfartstilsynet.no/droner/regelverk/apen-kategori/" },
      { label: "flydrone.no – registrering", url: "https://flydrone.no" },
    ],
  },
  {
    id: "a2",
    code: "A2",
    title: "A2 – Fly nær mennesker med tyngre drone",
    shortDescription:
      "Mellomtunge droner. Krever ekstra teoriprøve og gir trygg avstand til folk.",
    category: "Åpen kategori",
    weightClass: "< 4 kg (C2)",
    minDistance:
      "30 m horisontalt til uinvolverte – kan reduseres til 5 m med aktiv lavhastighetsmodus (≤ 3 m/s)",
    pilotRequirement:
      "A1/A3 nettkurs + A2 tilleggseksamen ved godkjent testsenter + egenerklæring om praktisk selvtrening",
    distanceRule:
      "5 m-avstanden gjelder KUN når dronens innebygde lavhastighetsmodus er aktivert (maks 3 m/s). Uten lavhastighetsmodus: 30 m horisontalt.",
    images: [
      { src: "/drone/a2-30m-5m.png", caption: "A2 – 30 m horisontalt, 5 m i lavhastighetsmodus" },
      { src: "/drone/maks-hoyde-120m.png", caption: "Maks 120 m over nærmeste punkt på terrenget" },
    ],
    sections: [
      {
        title: "Hva du kan gjøre",
        items: [
          "Fly C2-drone (opp til 4 kg) nær mennesker med minst 30 m horisontal avstand",
          "Redusere avstanden til 5 m ved bruk av lavhastighetsmodus (maks 3 m/s)",
          "Fly opp til 120 m over nærmeste punkt på terrenget",
        ],
      },
      {
        title: "Krav",
        items: [
          "Bestått A1/A3 nettkurs og A2 tilleggseksamen ved godkjent testsenter",
          "Kompetansebevis (A2) skal medbringes under flyging",
          "Operatørregistrering på flydrone.no, operatør-ID på dronen",
          "Egenerklæring om praktisk selvtrening",
          "C2 skal ha Direct Remote ID, geo-awareness og lavhastighetsmodus",
          "Fjernpilot minst 16 år",
        ],
      },
      {
        title: "Forbud",
        items: [
          "Aldri over ansamlinger av mennesker",
          "Aldri planlagt over uinvolverte personer",
          "Ikke i restriksjons-/forbudsområder uten tillatelse",
        ],
      },
    ],
    sources: [
      { label: "Luftfartstilsynet – Åpen kategori", url: "https://luftfartstilsynet.no/droner/regelverk/apen-kategori/" },
    ],
  },
  {
    id: "a3",
    code: "A3",
    title: "A3 – Fly langt fra mennesker",
    shortDescription:
      "Tyngre droner. Krever god avstand til folk, bygninger og infrastruktur. 1:1-regelen gjelder.",
    category: "Åpen kategori",
    weightClass: "< 25 kg (C3, C4 eller privatbygd)",
    minDistance:
      "Ingen uinvolverte i området · minst 150 m horisontalt til bolig-, forretnings-, industri- og rekreasjonsområder",
    pilotRequirement: "A1/A3 nettkurs + eksamen hos Luftfartstilsynet",
    distanceRule:
      "1:1-regelen: horisontal avstand til uinvolverte personer skal minst tilsvare dronens flyhøyde over bakken. Flyr du 60 m høyt, skal du være minst 60 m horisontalt unna.",
    images: [
      { src: "/drone/a3-150m.png", caption: "A3 – minst 150 m til bolig-, industri- og rekreasjonsområder" },
      { src: "/drone/regel-1til1.png", caption: "1:1-regelen – horisontal avstand ≥ flyhøyde" },
      { src: "/drone/maks-hoyde-120m.png", caption: "Maks 120 m over nærmeste punkt på terrenget" },
    ],
    sections: [
      {
        title: "Hva du kan gjøre",
        items: [
          "Fly droner opp til 25 kg langt unna mennesker",
          "Fly i områder hvor det er rimelig å anta at ingen uinvolverte oppholder seg",
          "Maks 120 m over nærmeste punkt på terrenget",
        ],
      },
      {
        title: "Krav og avstand",
        items: [
          "Minst 150 m horisontalt til bolig-, forretnings-, industri- og rekreasjonsområder",
          "1:1-regel: horisontal avstand til uinvolverte ≥ dronens høyde over bakken",
          "Bestått A1/A3 nettkurs og eksamen",
          "Operatørregistrering og operatør-ID synlig på dronen",
          "C3/C5/C6 skal ha Direct Remote ID og geo-awareness",
          "Fjernpilot minst 16 år",
        ],
      },
      {
        title: "Typisk bruk (Statnett)",
        items: [
          "Inspeksjon av linjer og master i grisgrendte strøk",
          "Kartlegging av utmark og skogtraseer",
          "Termografering av utstyr i friluft",
        ],
      },
    ],
    sources: [
      { label: "Luftfartstilsynet – Åpen kategori", url: "https://luftfartstilsynet.no/droner/regelverk/apen-kategori/" },
    ],
  },
  {
    id: "sts",
    code: "STS / Spesifikk",
    title: "Spesifikk kategori (STS-01 / STS-02 / SORA)",
    shortDescription:
      "Operasjoner utover Åpen kategori – BVLOS, over mennesker med tung drone, over 120 m eller i restriksjonsområder.",
    category: "Spesifikk kategori",
    pilotRequirement:
      "Operatørens driftshåndbok + fjernpilotens teori- og praksisprøve for aktuelt STS",
    images: [
      { src: "/drone/klasser-c0-c6.png", caption: "STS-01 bruker C5, STS-02 bruker C6" },
    ],
    sections: [
      {
        title: "Når du må inn i Spesifikk kategori",
        items: [
          "Flyging utenfor synsrekkevidde (BVLOS) uten luftromsobservatør iht. STS-02",
          "Drone over 25 kg",
          "Flyging over 120 m over terreng",
          "Operasjoner nær eller over mennesker som ikke er tillatt i Åpen kategori",
          "Slipp av gods, transport av farlig gods",
        ],
      },
      {
        title: "Standardscenarier (STS) – gjeldende fra 1. januar 2024",
        items: [
          "STS-01: VLOS over kontrollert bakkeområde i befolket miljø – krever drone i klasse C5",
          "STS-02: BVLOS med luftromsobservatører i tynt befolket område – krever drone i klasse C6",
          "Krever forhåndsdeklarasjon til Luftfartstilsynet før første flyging",
          "Nasjonale scenarier RO1/RO2/RO3 er utfaset",
        ],
      },
      {
        title: "SORA / operativ tillatelse",
        items: [
          "For operasjoner som ikke passer inn i STS: SORA-risikovurdering (Specific Operations Risk Assessment)",
          "Søknad om operativ tillatelse hos Luftfartstilsynet",
          "Krever operatørens driftshåndbok, prosedyrer og risikoreduserende tiltak",
          "Alternativt: LUC (Light UAS Operator Certificate) som gir operatør egen godkjenning",
        ],
      },
      {
        title: "Krav til pilot",
        items: [
          "Teoretisk prøve for aktuelt STS ved godkjent enhet",
          "Praktisk trening iht. scenarioet, dokumentert av operatør",
          "Kompetansebevis for fjernpilot i spesifikk kategori",
        ],
      },
    ],
    sources: [
      { label: "Luftfartstilsynet – Spesifikk kategori", url: "https://luftfartstilsynet.no/droner/regelverk/spesifikk-kategori/" },
      { label: "EASA – Civil drones", url: "https://www.easa.europa.eu/en/domains/civil-drones" },
    ],
  },
];

export const getDroneRuleById = (id: string) =>
  droneRules.find((r) => r.id === id);
