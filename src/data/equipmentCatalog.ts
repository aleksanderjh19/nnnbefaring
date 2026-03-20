/**
 * Equipment catalog derived from Statnett training documentation.
 * Used for cascading dropdowns in the training form.
 */

export interface EquipmentEntry {
  name: string;
  brands: {
    brand: string;
    types: string[];
  }[];
}

export interface CategoryEntry {
  value: string;
  label: string;
  equipment: EquipmentEntry[];
}

export const EQUIPMENT_CATALOG: CategoryEntry[] = [
  {
    value: "bensinverktoy",
    label: "Bensin-/motorverktøy",
    equipment: [
      {
        name: "Motorsag",
        brands: [
          { brand: "Stihl", types: ["O 23 C", "MS 261", "MS 362"] },
          { brand: "Husqvarna", types: ["45", "450", "550 XP", "572 XP"] },
          { brand: "Jonsered", types: ["CS 2152 W", "CS 2255"] },
        ],
      },
      {
        name: "Ryddesag",
        brands: [
          { brand: "Stihl", types: ["FS 131/R", "FS 560 C", "FS 450K", "FS 460 C"] },
          { brand: "Honda", types: ["435E", "UMK 435"] },
          { brand: "Husqvarna", types: ["165RX E", "535RX"] },
        ],
      },
      {
        name: "Kantklipper",
        brands: [
          { brand: "Stihl", types: ["FSA 56", "FSA 90"] },
          { brand: "Honda", types: ["UMC425E"] },
        ],
      },
      {
        name: "Plenklipper",
        brands: [
          { brand: "Ariens", types: ["200 M 42 CE"] },
          { brand: "John Deere", types: ["LTR 180"] },
          { brand: "Husqvarna", types: ["R 13 C"] },
        ],
      },
    ],
  },
  {
    value: "el_verktoy",
    label: "El.verktøy",
    equipment: [
      {
        name: "Vinkelsliper",
        brands: [
          { brand: "Bosch", types: ["GWS 18V-125C", "GWS 1-125C", "GWS9-125C", "GWS 24-230", "GWS 11-125"] },
          { brand: "Hitachi", types: ["G 23SF2", "G13SW", "G 23 UBY", "G23MRU", "G18 DSL", "G13 SE2", "G13 SB3", "G18 DBBVL"] },
          { brand: "Milwaukee", types: ["AWS 18-125"] },
          { brand: "Metabo", types: ["PAG-GF35"] },
          { brand: "Wurth", types: ["AWS 18-125"] },
        ],
      },
      {
        name: "Muttertrekker",
        brands: [
          { brand: "Milwaukee", types: ["M18 FIW2F12", "M180NEFH1WF23", "M18ONEFI", "M180NEHIWF34"] },
          { brand: "Bosch", types: ["GDS 18V-EC250", "GDX 18V-200", "GDS 18V-LI HT"] },
          { brand: "Hitachi", types: ["WR 18 DL", "WR 18 DBDC", "WR 14 DM", "WR 18 BN", "WR 18 BDL"] },
          { brand: "Makita", types: ["6905 H SA"] },
        ],
      },
      {
        name: "Skrumaskin",
        brands: [
          { brand: "Milwaukee", types: ["M18 ONEDD2"] },
        ],
      },
      {
        name: "Drill",
        brands: [
          { brand: "Bosch", types: ["GSR 18V-EC", "GSB 18V 85C"] },
          { brand: "Hitachi", types: ["DS 14 DSL", "DS18 DSL", "DV 18 DSDL", "DS 18 DL2"] },
          { brand: "Wurth", types: ["ABS 18SD 18"] },
        ],
      },
      {
        name: "Slagbormaskin",
        brands: [
          { brand: "Bosch", types: ["UBH 2/20 RLE", "UH 2/20 SE", "PSB 650 RE", "GBH 8-45 DV", "SDS+ UBH2-20SE", "GBHS-40-DCE450"] },
          { brand: "Hitachi", types: ["DH26 PB", "DH24 PC3", "DH 18 DSL", "DH 36 DAL", "DH2 PC3", "DH24 PB", "DH 40 MRY", "DP28PMY"] },
          { brand: "Wurth", types: ["ABH 18"] },
          { brand: "Metabo", types: ["750113"] },
        ],
      },
      {
        name: "Bajonettsag",
        brands: [
          { brand: "Milwaukee", types: ["M18FHZ"] },
          { brand: "Bosch", types: ["GSA 900", "GSA 18V 180 SL", "GSA18V-32"] },
          { brand: "Hitachi", types: ["CR 18 DSL", "CR"] },
        ],
      },
      {
        name: "Stikksag",
        brands: [
          { brand: "Bosch", types: ["GST 60 PEE", "PST 680", "650 PE", "0601 580033 E"] },
          { brand: "Hitachi", types: ["CJ 18DSL", "CJ110MVA E"] },
          { brand: "Black & Decker", types: ["KS 999"] },
        ],
      },
      {
        name: "Sirkelsag",
        brands: [
          { brand: "Bosch", types: ["GKS 18V-57 G"] },
          { brand: "Hitachi", types: ["C 18DSL"] },
          { brand: "Black & Decker", types: ["DN 56", "KS855"] },
          { brand: "Metabo", types: [] },
        ],
      },
      {
        name: "Kabelkutter",
        brands: [
          { brand: "Milwaukee", types: ["M18 HCC45"] },
          { brand: "Cembre", types: ["B-TC 055", "B-TC O4"] },
        ],
      },
      {
        name: "Multiverktøy",
        brands: [
          { brand: "Bosch", types: ["PMF multi 180", "PMF 250 CES", "GOP18V-28 E"] },
          { brand: "Hikoki", types: ["CV 18DBL"] },
        ],
      },
      {
        name: "Varmluftpistol",
        brands: [
          { brand: "Steinel", types: ["HL 500"] },
          { brand: "Bosch", types: ["PHG 500-2"] },
          { brand: "Black & Decker", types: ["CD701", "HG991"] },
          { brand: "Wurth", types: ["HLG 2000"] },
        ],
      },
      {
        name: "Høvel",
        brands: [
          { brand: "Bosch", types: ["PHO 3100"] },
        ],
      },
      {
        name: "Slipemaskin",
        brands: [
          { brand: "Bosch", types: ["PDS7AE", "PSS2", "PSS 240AE"] },
          { brand: "Skil", types: ["77310"] },
          { brand: "Perles", types: ["SRE 5-8135"] },
        ],
      },
      {
        name: "Pressverktøy",
        brands: [
          { brand: "Cembre", types: ["B135LN-C", "D1350 L-C", "D131L-C", "B1300 L-C"] },
          { brand: "Elpress", types: ["PVL1300"] },
          { brand: "ALFRA", types: ["03200"] },
        ],
      },
      {
        name: "Magnetboremaskin",
        brands: [
          { brand: "Rotabroach", types: ["Commando 40", "CM/405/3"] },
        ],
      },
      {
        name: "Båndsag",
        brands: [
          { brand: "Bosch", types: ["GCB 18V-LI"] },
        ],
      },
      {
        name: "Kapp og gjærsag",
        brands: [
          { brand: "Dewalt", types: ["DW 712 QS", "S DE7025-YJ"] },
        ],
      },
      {
        name: "Elektrisk fil",
        brands: [
          { brand: "GP", types: ["2"] },
        ],
      },
    ],
  },
  {
    value: "kjøretøy",
    label: "Kjøretøy",
    equipment: [
      {
        name: "Snøscooter",
        brands: [
          { brand: "Lynx", types: ["Ranger 600 E-TEC", "59 Yeti 550"] },
          { brand: "Skidoo", types: ["Summit 85", "Tundra 600 HO E-TEC"] },
          { brand: "Polaris", types: ["850 SKS"] },
        ],
      },
    ],
  },
  {
    value: "maskin",
    label: "Maskin",
    equipment: [
      {
        name: "Personløfter",
        brands: [
          { brand: "DINO", types: ["180 XT"] },
          { brand: "Palazzani", types: ["TZX 190"] },
          { brand: "Nifty", types: ["120 T", "150"] },
          { brand: "JLG", types: ["660 SJ"] },
        ],
      },
    ],
  },
  {
    value: "utstyr",
    label: "Utstyr",
    equipment: [
      {
        name: "Sveiseapparat",
        brands: [
          { brand: "Esab", types: ["180"] },
          { brand: "Lincoln", types: ["V 130S", "Handymig 80A"] },
          { brand: "Castolin", types: ["Powermax 304300", "Powermax 1504"] },
          { brand: "Aorweld", types: ["MIG 202"] },
          { brand: "Race", types: ["1403"] },
        ],
      },
      {
        name: "Skjerebrenner",
        brands: [],
      },
      {
        name: "Løftebukk",
        brands: [
          { brand: "Omer", types: ["Vega 120"] },
          { brand: "Tee Lift", types: ["T6 S,ST"] },
        ],
      },
      {
        name: "Benksliper",
        brands: [],
      },
    ],
  },
  {
    value: "maleinstrument",
    label: "Måleinstrument",
    equipment: [],
  },
  {
    value: "annet",
    label: "Annet",
    equipment: [],
  },
];

/** Flat list of all unique equipment names */
export const ALL_EQUIPMENT_NAMES = EQUIPMENT_CATALOG.flatMap((cat) =>
  cat.equipment.map((eq) => eq.name)
);

/** Get equipment entries for a given category */
export const getEquipmentForCategory = (categoryValue: string): EquipmentEntry[] => {
  return EQUIPMENT_CATALOG.find((c) => c.value === categoryValue)?.equipment ?? [];
};

/** Get brands for a given category + equipment name */
export const getBrandsForEquipment = (categoryValue: string, equipmentName: string) => {
  const eq = getEquipmentForCategory(categoryValue).find((e) => e.name === equipmentName);
  return eq?.brands ?? [];
};

/** Get types for a given category + equipment name + brand */
export const getTypesForBrand = (categoryValue: string, equipmentName: string, brand: string) => {
  const brands = getBrandsForEquipment(categoryValue, equipmentName);
  return brands.find((b) => b.brand === brand)?.types ?? [];
};
