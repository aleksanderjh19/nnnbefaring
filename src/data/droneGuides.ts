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
  tagline: "Praktisk bruksanvisning – hvordan gjøre de vanligste oppgavene.",
  overview:
    "Kort oppslagsverk for det du gjør oftest i Airdata: håndtere flights, fikse manglende checklists, samle flights under samme oppdrag, og holde batterier og vedlikehold i orden. Åpnes på app.airdata.com.",
  chapters: [
    {
      title: "Flights – daglig bruk",
      steps: [
        {
          title: "Åpne og se én flight",
          bullets: [
            "Gå til «Flight List» i venstremenyen",
            "Filtrer på pilot, drone eller dato",
            "Klikk på raden for å åpne detaljer (kart, høyde, batteri, hendelser)",
          ],
        },
        {
          title: "Legge til pilot, sted og notat",
          bullets: [
            "Åpne flighten → «Edit Flight» øverst til høyre",
            "Sett Pilot, Location og Notes",
            "Lagre – feltene brukes i rapporter og filtre",
          ],
        },
        {
          title: "Sette riktig flight-type",
          bullets: [
            "I «Edit Flight» velg Type: Mission, Training, Test eller Maintenance",
            "Kun «Mission» teller som oppdrag i rapporter til kunde",
            "Training/Test holdes utenfor kundestatistikk",
          ],
        },
      ],
    },
    {
      title: "Fikse flights uten checklist",
      intro: "Skjer når checklist ikke ble kvittert ut i appen før take-off.",
      steps: [
        {
          title: "Legge til checklist på én flight",
          bullets: [
            "Åpne flighten → scroll til «Checklists»-boksen",
            "Klikk «Add Checklist» → velg riktig mal",
            "Fyll ut punktene i etterkant og lagre",
          ],
        },
        {
          title: "Bulk: fikse mange flights samtidig",
          bullets: [
            "Gå til Flight List → huk av flere flights",
            "Velg «Actions» → «Assign Checklist»",
            "Velg mal og bekreft – legges på alle valgte",
          ],
        },
        {
          title: "Unngå problemet neste gang",
          bullets: [
            "Settings → Checklists → åpne malen",
            "Sett «Auto-assign» til aktuell drone eller pilot",
            "Nye flights får da checklisten automatisk",
          ],
        },
      ],
    },
    {
      title: "Samle flights under samme oppdrag",
      steps: [
        {
          title: "Bruk Missions",
          bullets: [
            "Meny: «Missions» → «New Mission»",
            "Gi navn (f.eks. «Linje 300kV Sylling–Tegneby»), sett dato og kunde",
            "Åpne Mission → «Add Flights» → velg fra liste eller dra inn",
            "Alle flights får felles rapport og statistikk",
          ],
        },
        {
          title: "Bruk Tags som alternativ",
          bullets: [
            "I «Edit Flight» legg til en Tag (samme tekst på alle)",
            "Filtrer Flight List på taggen for å se dem samlet",
            "Raskere enn Mission når du ikke trenger felles rapport",
          ],
        },
        {
          title: "Slå sammen delflygninger",
          bullets: [
            "Marker flightene i listen → «Merge Flights»",
            "Brukes når batteribytte delte opp én sammenhengende jobb",
            "Resultatet vises som én flight med sammenhengende spor",
          ],
        },
      ],
    },
    {
      title: "Checklists – lage og styre maler",
      steps: [
        {
          title: "Lage ny mal",
          bullets: [
            "Settings → Checklists → «New Checklist»",
            "Velg type: Pre-flight, Post-flight eller Maintenance",
            "Legg til punkter (tekst, ja/nei, tall, signatur)",
          ],
        },
        {
          title: "Tildele mal automatisk",
          bullets: [
            "Åpne malen → «Auto-assign to»",
            "Velg drone(r), pilot(er) eller alle",
            "Malen dukker opp på nye flights uten manuell handling",
          ],
        },
      ],
    },
    {
      title: "Batterier",
      steps: [
        {
          title: "Registrere nytt batteri",
          bullets: [
            "Meny: «Batteries» → «Add Battery»",
            "Skriv inn serienummer (står på batteriet / i DJI-appen)",
            "Airdata knytter framtidige flights automatisk via serienummer",
          ],
        },
        {
          title: "Sjekke helse på ett batteri",
          bullets: [
            "Åpne batteriet i listen",
            "Se sykluser, kapasitet (%) og celleavvik",
            "Rød/gul indikator = handling anbefalt",
          ],
        },
        {
          title: "Pensjonere et batteri",
          bullets: [
            "Åpne batteriet → «Edit» → sett Status til «Retired»",
            "Batteriet skjules fra aktiv flåte, men historikk beholdes",
          ],
        },
      ],
    },
    {
      title: "Vedlikehold",
      steps: [
        {
          title: "Sette opp intervall",
          bullets: [
            "Meny: «Maintenance» → «New Service»",
            "Velg drone, sett intervall (flytimer, antall flygninger eller dager)",
            "Airdata varsler når intervallet nærmer seg",
          ],
        },
        {
          title: "Logge utført vedlikehold",
          bullets: [
            "Åpne varselet → «Mark as Done»",
            "Legg til notat og evt. bilder",
            "Neste forfall regnes ut automatisk",
          ],
        },
      ],
    },
    {
      title: "Rapporter og deling",
      steps: [
        {
          title: "PDF-rapport til kunde",
          bullets: [
            "Åpne én flight eller en Mission → «Export» → «PDF Report»",
            "Velg hva som skal med (kart, checklist, notater)",
            "Last ned og send til oppdragsgiver",
          ],
        },
        {
          title: "CSV-eksport av mange flights",
          bullets: [
            "Flight List → filtrer fram det du vil ha",
            "«Export» → «CSV»",
            "Bruk for KPI-oppfølging og timeregnskap",
          ],
        },
        {
          title: "Dele én flight via lenke",
          bullets: [
            "Åpne flighten → «Share» øverst",
            "Velg om kart, data og checklist skal være synlig",
            "Kopier lenken – kan åpnes uten Airdata-konto",
          ],
        },
      ],
    },
    {
      title: "Piloter og flåte",
      steps: [
        {
          title: "Legge til pilot",
          bullets: [
            "Settings → Pilots → «Add Pilot»",
            "Fyll inn navn og e-post, velg rolle (Viewer / Pilot / Admin)",
            "Send invitasjon hvis piloten skal logge inn selv",
          ],
        },
        {
          title: "Se flytimer per pilot",
          bullets: [
            "Meny: «Fleet» → «Pilots»",
            "Kolonner viser totalt antall flygninger og timer",
            "Klikk på pilot for detaljer og siste aktivitet",
          ],
        },
        {
          title: "Flytte flight til riktig pilot",
          bullets: [
            "Åpne flighten → «Edit Flight»",
            "Endre Pilot-feltet og lagre",
            "Statistikk oppdateres på begge piloter",
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

export const externalGuides = [airdataGuide];
export const getExternalGuideById = (id: string) =>
  externalGuides.find((g) => g.id === id);
