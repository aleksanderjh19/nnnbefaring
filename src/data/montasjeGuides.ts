import isolatorAakImage from "@/assets/isolator-aak-2s21.jpeg.asset.json";

export type ChecklistItem = {
  text: string;
  warning?: string;
};

export type GuideSection = {
  title: string;
  items: ChecklistItem[];
};

export type MontasjeGuide = {
  id: string;
  title: string;
  description: string;
  category: string;
  estimatedTime?: string;
  image?: { url: string; caption?: string };
  sections: GuideSection[];
};

export const montasjeGuides: MontasjeGuide[] = [
  {
    id: "isolator-skifte-aak",
    title: "Montasje – Isolator skifte åk",
    description:
      "Skifte av isolatorkjede 2S21 med dobbelt åkplater og lask – bruk av skifteverktøy (eks. DP 18).",
    category: "Isolator",
    estimatedTime: "ca. 2–4 timer",
    image: {
      url: isolatorAakImage.url,
      caption:
        "Statnett-tegning: 2S21 mod dobbelt åkplater og med lask. Eksempel på bruk av skifteverktøyet på kjede 2S21 DP 18.",
    },
    sections: [
      {
        title: "Forberedelse",
        items: [
          { text: "Bekreft riktig kjedetype (2S21) og verktøyspesifikasjon (f.eks. DP 18) mot Statnett spesifikasjon" },
          { text: "Kontroller at ledning er frakoblet, utladet og jordet på begge sider" },
          { text: "Gjennomgå SJA med hele laget og avklar roller" },
          {
            text: "Sjekk værmelding og vindgrenser før klatring",
            warning: "Stopp arbeidet ved tordenvær innen 20 km",
          },
          { text: "Verifiser at alt løfte- og skifteverktøy er sertifisert og innen kontrollfrist" },
        ],
      },
      {
        title: "Demontering av koronaring",
        items: [
          {
            text: "Demonter koronaring FØR skifteverktøyet settes på kjedet",
            warning: "Koronaring må alltid av først – ellers kan verktøyet ikke settes korrekt på kjedet",
          },
          { text: "Sikre koronaring med line og senk kontrollert ned" },
        ],
      },
      {
        title: "Montering av skifteverktøy (pos. 1, 2, 3)",
        items: [
          { text: "Sett øvre åkplate (pos. 3) på toppfestet over isolatorkjedet" },
          { text: "Monter nedre åkplate (pos. 1) på bunnfestet under kjedet" },
          { text: "Koble inn lask (pos. 2) mellom åkplatene slik tegningen viser" },
          { text: "Kontroller at alle bolter, splinter og sjakler er i riktig posisjon og WLL" },
          { text: "Koble til kjettingtalje / strekkverktøy mellom åkplatene" },
        ],
      },
      {
        title: "Avlastning og skifte av isolator",
        items: [
          { text: "Stram opp skifteverktøyet gradvis til lasten er tatt av isolatorkjedet" },
          { text: "Bekreft visuelt at kjedet er helt avlastet før splint/bolt løsnes" },
          { text: "Fjern låsesplint og demonter gammel isolatorstreng" },
          { text: "Inspiser åk, lask og festepunkter for slitasje eller skader" },
          { text: "Heng opp ny isolatorstreng iht. spesifikasjon og sett ny låsesplint" },
          { text: "Trekk til iht. tiltrekkingsmoment fra datablad" },
        ],
      },
      {
        title: "Tilbakeføring og avslutning",
        items: [
          { text: "Slipp lasten gradvis tilbake på ny isolatorstreng via skifteverktøyet" },
          { text: "Demonter skifteverktøy (lask, åkplater) i motsatt rekkefølge" },
          { text: "Monter koronaring tilbake på kjedet" },
          { text: "Visuell sluttkontroll fra bakken med kikkert" },
          { text: "Rydd alt utstyr og emballasje fra mastefot" },
          { text: "Fyll ut arbeidsrapport og logg serienummer på ny isolator" },
        ],
      },
    ],
  },
];

export const getGuideById = (id: string) =>
  montasjeGuides.find((g) => g.id === id);
