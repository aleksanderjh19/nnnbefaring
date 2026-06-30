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
  sections: GuideSection[];
};

export const montasjeGuides: MontasjeGuide[] = [
  {
    id: "isolator-skifte-aak",
    title: "Montasje – Isolator skifte åk",
    description: "Huskeliste og fremgangsmåte for skifte av isolator i åk",
    category: "Isolator",
    estimatedTime: "ca. 2–4 timer",
    sections: [
      {
        title: "Før arbeidet starter",
        items: [
          { text: "Sjekk at ledningen er frakoblet og jordet" },
          { text: "Kontroller at SJA er gjennomgått med hele laget" },
          { text: "Verifiser værmelding – ikke arbeid i tordenvær", warning: "Stopp arbeidet ved tordenvær innen 20 km" },
          { text: "Sjekk at alt løfteutstyr er sertifisert og innen kontrollfrist" },
        ],
      },
      {
        title: "Utstyr som trengs",
        items: [
          { text: "Ny isolatorstreng med korrekt spesifikasjon" },
          { text: "Løfteline / kjettingtalje (min. 2 tonn)" },
          { text: "Sjakler i riktig WLL" },
          { text: "Splinttang og momentnøkkel" },
          { text: "Sikringsline / fallsele" },
        ],
      },
      {
        title: "Demontering",
        items: [
          { text: "Avlast strengen med kjettingtalje før splint fjernes" },
          { text: "Fjern låsesplint i toppfeste" },
          { text: "Senk gammel isolator kontrollert ned" },
          { text: "Inspiser åkfeste for slitasje eller skader" },
        ],
      },
      {
        title: "Montering av ny isolator",
        items: [
          { text: "Kontroller at isolatoren er ren og uten transportskader" },
          { text: "Heis opp og fest i toppen med ny splint" },
          { text: "Trekk til iht. tiltrekkingsmoment i datablad" },
          { text: "Sett inn ny låsesplint og bøy korrekt" },
          { text: "Slipp lasten gradvis over på ny streng" },
        ],
      },
      {
        title: "Avslutning",
        items: [
          { text: "Visuell kontroll fra bakken med kikkert" },
          { text: "Rydd alt utstyr og emballasje fra mastefot" },
          { text: "Fyll ut arbeidsrapport og logg serienummer" },
        ],
      },
    ],
  },
];

export const getGuideById = (id: string) =>
  montasjeGuides.find((g) => g.id === id);
