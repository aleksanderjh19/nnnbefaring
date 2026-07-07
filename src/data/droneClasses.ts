export type DroneClass = {
  id: string;
  code: string;
  title: string;
  shortDescription: string;
  maxWeight: string;
  maxSpeed?: string;
  maxHeight?: string;
  kineticEnergy?: string;
  subcategories: string[];
  requirements: string[];
  notes?: string[];
  sources: { label: string; url: string }[];
};

export const droneClasses: DroneClass[] = [
  {
    id: "c0",
    code: "C0",
    title: "C0 – Under 250 g",
    shortDescription: "Minste klasse. Kan flys i A1 uten eksamen, også nær mennesker.",
    maxWeight: "< 250 g (MTOM inkl. nyttelast)",
    maxSpeed: "19 m/s (≈ 68 km/t)",
    maxHeight: "120 m over startpunkt (innebygd begrensning)",
    kineticEnergy: "Ikke spesifisert grense (lav pga. vekt)",
    subcategories: ["A1 – kan fly nær og over enkeltpersoner (ikke folkemengder)"],
    requirements: [
      "CE-merket og C0-klassemerket",
      "Elektrisk drift",
      "Maks 3 V spenning ved kontakt (batteri)",
      "Ingen krav om Remote ID for C0",
      "Ingen krav om kompetansebevis for fjernpilot",
      "Operatørregistrering kreves hvis dronen har kamera (unntatt lekekategori)",
    ],
    notes: [
      "Privatbygde droner < 250 g uten kamera regnes som leketøy og faller utenfor operatørregistrering.",
      "Med kamera: registrer operatør på flydrone.no.",
    ],
    sources: [
      { label: "Luftfartstilsynet – Droneklasser", url: "https://luftfartstilsynet.no/droner/regelverk/apen-kategori/" },
    ],
  },
  {
    id: "c1",
    code: "C1",
    title: "C1 – Under 900 g",
    shortDescription: "Lette droner med begrenset energi. A1 – nær mennesker, ikke planlagt overflyging.",
    maxWeight: "< 900 g eller kinetisk energi < 80 J ved kollisjon",
    maxSpeed: "19 m/s (≈ 68 km/t)",
    maxHeight: "120 m over startpunkt",
    kineticEnergy: "< 80 J",
    subcategories: ["A1 – nær mennesker (overflyging skal minimeres)", "A3 – langt fra mennesker"],
    requirements: [
      "CE-merket og C1-klassemerket",
      "Elektrisk drift",
      "Direct Remote ID (kringkaster ID, posisjon og operatør-nr.)",
      "Geo-awareness (kartinformasjon om luftromsbegrensninger)",
      "Unikt serienummer iht. ANSI/CTA-2063",
      "Lydeffekt < 85 dB(A)",
      "Fjernpilot: bestått A1/A3 nettkurs + eksamen",
    ],
    sources: [
      { label: "Luftfartstilsynet – Åpen kategori", url: "https://luftfartstilsynet.no/droner/regelverk/apen-kategori/" },
    ],
  },
  {
    id: "c2",
    code: "C2",
    title: "C2 – Under 4 kg",
    shortDescription: "Mellomklassen. A2 – nær mennesker med 30 m avstand (5 m i lavhastighetsmodus).",
    maxWeight: "< 4 kg",
    maxSpeed: "Ingen fast grense, men lavhastighetsmodus ≤ 3 m/s må finnes",
    maxHeight: "120 m over startpunkt",
    subcategories: ["A2 – nær mennesker (30 m / 5 m)", "A3 – langt fra mennesker"],
    requirements: [
      "CE-merket og C2-klassemerket",
      "Direct Remote ID og geo-awareness",
      "Lavhastighetsmodus (maks 3 m/s) som kan aktiveres av pilot",
      "Unikt serienummer",
      "Snor/festeanordning ved bruk under 50 m (valgfritt tilbehør)",
      "Fjernpilot: A1/A3 nettkurs + A2 tilleggseksamen",
    ],
    sources: [
      { label: "Luftfartstilsynet – Åpen kategori", url: "https://luftfartstilsynet.no/droner/regelverk/apen-kategori/" },
    ],
  },
  {
    id: "c3",
    code: "C3",
    title: "C3 – Under 25 kg",
    shortDescription: "Tyngre profesjonelle droner. A3 – langt fra mennesker og bebyggelse.",
    maxWeight: "< 25 kg MTOM og maks 3 m karakteristisk dimensjon",
    maxHeight: "120 m over startpunkt",
    subcategories: ["A3 – langt fra mennesker (min. 150 m til bebyggelse)"],
    requirements: [
      "CE-merket og C3-klassemerket",
      "Direct Remote ID og geo-awareness",
      "Unikt serienummer",
      "Fjernpilot: A1/A3 nettkurs + eksamen",
    ],
    sources: [
      { label: "Luftfartstilsynet – Åpen kategori", url: "https://luftfartstilsynet.no/droner/regelverk/apen-kategori/" },
    ],
  },
  {
    id: "c4",
    code: "C4",
    title: "C4 – Under 25 kg (uten automatikk)",
    shortDescription: "Modellfly-lignende. Ingen automatiske kontrollmoduser utover stabilisering.",
    maxWeight: "< 25 kg MTOM",
    subcategories: ["A3 – langt fra mennesker"],
    requirements: [
      "CE-merket og C4-klassemerket",
      "Ingen automatiske kontrollmoduser (unntatt flystabilisering)",
      "Ingen krav om Remote ID eller geo-awareness",
      "Fjernpilot: A1/A3 nettkurs + eksamen",
    ],
    notes: ["Beregnet på modellflyging og selvbygde konstruksjoner."],
    sources: [
      { label: "Luftfartstilsynet – Åpen kategori", url: "https://luftfartstilsynet.no/droner/regelverk/apen-kategori/" },
    ],
  },
  {
    id: "c5",
    code: "C5",
    title: "C5 – Standardscenario STS-01",
    shortDescription: "Klasse for STS-01: VLOS over kontrollert bakkeområde i befolket miljø.",
    maxWeight: "< 25 kg MTOM",
    subcategories: ["Spesifikk – STS-01 (VLOS)"],
    requirements: [
      "C5-klassemerket (kan være C3 oppgradert med C5-sett)",
      "Direct Remote ID og geo-awareness",
      "Kraftreduksjon (low-speed mode) tilgjengelig",
      "Terminering av flyging (Flight Termination System)",
      "Fjernpilot: STS-01 teori- og praksisprøve",
      "Operatør: forhåndsdeklarasjon til Luftfartstilsynet",
    ],
    sources: [
      { label: "Luftfartstilsynet – Spesifikk kategori", url: "https://luftfartstilsynet.no/droner/regelverk/spesifikk-kategori/" },
    ],
  },
  {
    id: "c6",
    code: "C6",
    title: "C6 – Standardscenario STS-02",
    shortDescription: "Klasse for STS-02: BVLOS med luftromsobservatører i tynt befolket område.",
    maxWeight: "< 25 kg MTOM",
    subcategories: ["Spesifikk – STS-02 (BVLOS med observatører)"],
    requirements: [
      "C6-klassemerket",
      "Direct Remote ID og geo-awareness",
      "Programmert flyrute og geo-caging (dronen kan ikke fly ut av definert område)",
      "Terminering av flyging (Flight Termination System)",
      "Maks hastighet 50 m/s (kan variere)",
      "Fjernpilot: STS-02 teori- og praksisprøve",
      "Operatør: forhåndsdeklarasjon til Luftfartstilsynet",
    ],
    sources: [
      { label: "Luftfartstilsynet – Spesifikk kategori", url: "https://luftfartstilsynet.no/droner/regelverk/spesifikk-kategori/" },
    ],
  },
];

export const getDroneClassById = (id: string) =>
  droneClasses.find((c) => c.id === id);
