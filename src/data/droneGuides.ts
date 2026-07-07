export type GuideStep = {
  title: string;
  description?: string;
  bullets?: string[];
};

export type GuideChapter = {
  title: string;
  intro?: string;
  steps: GuideStep[];
};

export type ExternalGuide = {
  id: string;
  title: string;
  tagline: string;
  overview: string;
  chapters: GuideChapter[];
  sources: { label: string; url: string }[];
};

export const airdataGuide: ExternalGuide = {
  id: "airdata",
  title: "Airdata UAV",
  tagline: "Flyloggføring, batterihelse og flåtestyring for droneoperatører.",
  overview:
    "Airdata UAV brukes for automatisk synkronisering av flylogger, oppfølging av batterier og vedlikehold, samt rapporter til oppdragsgiver. Under er de viktigste funksjonene du bruker i felt og på kontoret.",
  chapters: [
    {
      title: "Kom i gang",
      steps: [
        {
          title: "Opprett konto og synk",
          bullets: [
            "Registrer konto på app.airdata.com",
            "Koble til DJI-konto (DJI Sync) for automatisk opplasting fra fjernkontrollen",
            "Installer Airdata-appen på mobil for manuell opplasting fra SD-kort",
          ],
        },
        {
          title: "Legg til droner og batterier",
          bullets: [
            "Registrer hver drone under 'Aircraft' med serienummer",
            "Registrer hvert batteri under 'Batteries' med serienummer",
            "Airdata knytter automatisk flygninger til riktig drone/batteri via serienummer",
          ],
        },
      ],
    },
    {
      title: "Flight Logs (flylogger)",
      intro: "Kjernefunksjonen – alle flygninger lagres automatisk.",
      steps: [
        {
          title: "Se detaljer per flygning",
          bullets: [
            "Kart med flyspor, høyde, hastighet og batterinivå",
            "Advarsler og hendelser (signal-tap, vindkast, geofence)",
            "Play back-modus for gjennomgang av flygningen",
          ],
        },
        {
          title: "Merking og notater",
          bullets: [
            "Legg til pilot, oppdrag og notater per flygning",
            "Bruk tags (f.eks. 'Statnett-linjeinspeksjon') for enkel filtrering",
          ],
        },
      ],
    },
    {
      title: "Battery Health",
      intro: "Følg helsen til hvert enkelt batteri over tid.",
      steps: [
        {
          title: "Battery Details",
          bullets: [
            "Se antall sykluser, kapasitet og indre motstand",
            "Rødt/gult varsel når celler avviker",
            "Historisk graf viser degradering",
          ],
        },
        {
          title: "Vedlikeholdsrutiner",
          bullets: [
            "Airdata anbefaler kalibrering hver 50. syklus",
            "Merk batterier som pensjonert når kapasitet < 80 %",
          ],
        },
      ],
    },
    {
      title: "Maintenance",
      steps: [
        {
          title: "Vedlikeholdsplan",
          bullets: [
            "Sett opp intervaller (per flytimer, per antall flygninger eller kalendertid)",
            "Airdata varsler når vedlikehold forfaller",
            "Logg utført vedlikehold med notater og bilder",
          ],
        },
      ],
    },
    {
      title: "Fleet & piloter",
      steps: [
        {
          title: "Flåteoversikt",
          bullets: [
            "Se alle droner, batterier og piloter i én oversikt",
            "Total flytid, antall flygninger og siste aktivitet",
          ],
        },
        {
          title: "Piloter og roller",
          bullets: [
            "Legg til piloter og tildel roller (viewer, pilot, admin)",
            "Pilotens flytimer summeres automatisk",
          ],
        },
      ],
    },
    {
      title: "Rapporter og eksport",
      steps: [
        {
          title: "Flight Reports",
          bullets: [
            "PDF-rapport per flygning med kart, data og notater",
            "Kan sendes direkte til oppdragsgiver",
          ],
        },
        {
          title: "CSV-eksport",
          bullets: [
            "Eksporter rådata for videre analyse",
            "Nyttig for KPI-rapportering til Statnett",
          ],
        },
      ],
    },
    {
      title: "Streaming (live)",
      steps: [
        {
          title: "Live Stream",
          bullets: [
            "Del pågående flygning med kollega eller kunde via lenke",
            "Viser posisjon, høyde, batteri og kamera-preview i sanntid",
          ],
        },
      ],
    },
  ],
  sources: [
    { label: "Airdata UAV – dokumentasjon", url: "https://app.airdata.com/wiki" },
  ],
};

export const ninoxGuide: ExternalGuide = {
  id: "ninox",
  title: "Ninox 2",
  tagline: "Termisk kamera-modul fra Sky-Hero for søk og inspeksjon.",
  overview:
    "Ninox 2 er en profesjonell nattoptikk-/termisk løsning som ofte brukes sammen med droner og bæremoduler. Under er de viktigste funksjonene som brukes i felt.",
  chapters: [
    {
      title: "Klargjøring",
      steps: [
        {
          title: "Sjekk før tur",
          bullets: [
            "Batteri fulladet og reservebatteri med",
            "SD-kort formatert og satt inn",
            "Objektiv rent, uten fingermerker",
            "Firmware oppdatert",
          ],
        },
        {
          title: "Montering",
          bullets: [
            "Fest Ninox 2 sikkert på gimbal eller bæremodul",
            "Kontroller at kabler har strekkavlastning",
            "Balansér drone på nytt hvis vekt endres",
          ],
        },
      ],
    },
    {
      title: "Hovedfunksjoner",
      steps: [
        {
          title: "Bildemodus",
          bullets: [
            "Bytt mellom termisk, dagslys (EO) og fusjonsmodus",
            "Fusjon legger termisk over synlig lys – nyttig for å identifisere varmekilder i kontekst",
          ],
        },
        {
          title: "Palett og fargeskala",
          bullets: [
            "White-hot / Black-hot for søk etter mennesker og dyr",
            "Ironbow / Rainbow for temperaturanalyse",
            "Bruk fast temperaturskala ved sammenligning mellom bilder",
          ],
        },
        {
          title: "Zoom og fokus",
          bullets: [
            "Digital zoom i trinn – unngå maks zoom hvis mulig (kvalitet)",
            "Autofokus for rask bruk, manuell fokus for presisjon",
          ],
        },
      ],
    },
    {
      title: "Måling og analyse",
      steps: [
        {
          title: "Punkt-, område- og linjemåling",
          bullets: [
            "Sett spotmåling for enkeltpunkt (f.eks. skjøt på line)",
            "Områdemåling for max/min/gjennomsnitt i et rektangel",
            "Isotermer for å markere alt over/under en gitt temperatur",
          ],
        },
        {
          title: "Emissivitet og forhold",
          bullets: [
            "Still emissivitet iht. materialet (blank metall vs. malt overflate)",
            "Kompensér for reflektert temperatur, avstand og luftfuktighet",
          ],
        },
      ],
    },
    {
      title: "Opptak",
      steps: [
        {
          title: "Foto og video",
          bullets: [
            "Radiometriske bilder lagrer temperaturdata per piksel",
            "Video kan tas med overlay (palett, spot, tid)",
            "Bruk hurtigtast/knapp for stillbilde uten å avbryte video",
          ],
        },
      ],
    },
    {
      title: "Sikkerhet og drift",
      steps: [
        {
          title: "Under flyvning",
          bullets: [
            "Ikke pek termisk sensor direkte mot sola – kan skade detektoren",
            "Overvåk batteri og signalstyrke kontinuerlig",
            "Ha forhåndsdefinerte returhøyder som klarer terreng og linjer",
          ],
        },
        {
          title: "Etter flyvning",
          bullets: [
            "Tøm SD-kort til sikker lagring",
            "Logg flygning i Airdata UAV",
            "Rengjør og oppbevar Ninox 2 i tørt etui",
          ],
        },
      ],
    },
  ],
  sources: [
    { label: "Sky-Hero – Ninox 2", url: "https://sky-hero.com/" },
  ],
};

export const externalGuides = [airdataGuide, ninoxGuide];
export const getExternalGuideById = (id: string) =>
  externalGuides.find((g) => g.id === id);
