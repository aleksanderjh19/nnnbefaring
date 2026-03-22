export interface FieldDefinition {
  id: string;
  name: string;
  drawingRef: string;
  terminals: { UL1_ULN: string; UL2_ULN: string; UL3_ULN: string };
  fixedBusbar?: "A" | "B";
  isPlaceholder?: boolean;
}

export interface VoltageLevelConfig {
  id: string;
  kV: string;
  nominalVoltage: number;
  secondaryVoltage: number;
  fields: FieldDefinition[];
}

export interface StationTemplate {
  id: string;
  name: string;
  shortName: string;
  voltageLevels: VoltageLevelConfig[];
}

export const STATIONS: StationTemplate[] = [
  {
    id: "marka",
    name: "Marka",
    shortName: "MAR",
    voltageLevels: [
      {
        id: "mar_300",
        kV: "300",
        nominalVoltage: 110,
        secondaryVoltage: 63.51,
        fields: [
          {
            id: "mar300_ssa",
            name: "Samleskinne A (+2R1)",
            drawingRef: "",
            terminals: { UL1_ULN: "", UL2_ULN: "X2: 1-6", UL3_ULN: "" },
            fixedBusbar: "A",
          },
          {
            id: "mar300_ssb",
            name: "Samleskinne B (+2R1)",
            drawingRef: "",
            terminals: { UL1_ULN: "", UL2_ULN: "X2: 61-66", UL3_ULN: "" },
            fixedBusbar: "B",
          },
          {
            id: "mar300_nra",
            name: "Nedre Røssåga (+4R1)",
            drawingRef: "",
            terminals: { UL1_ULN: "X2: 1-4", UL2_ULN: "X2: 2-4", UL3_ULN: "X2: 3-4" },
          },
          {
            id: "mar300_tro",
            name: "Trofors (+4R3)",
            drawingRef: "",
            terminals: { UL1_ULN: "X2: 1-4", UL2_ULN: "X2: 2-4", UL3_ULN: "X2: 3-4" },
          },
        ],
      },
      {
        id: "mar_132",
        kV: "132",
        nominalVoltage: 110,
        secondaryVoltage: 63.51,
        fields: [
          {
            id: "mar132_ssa",
            name: "Samleskinne A (Skap 43)",
            drawingRef: '"N4355-128-2.4": bl.2A',
            terminals: { UL1_ULN: "L243A: 1-16", UL2_ULN: "L243A: 6-16", UL3_ULN: "L243A: 11-16" },
            fixedBusbar: "A",
          },
          {
            id: "mar132_ssb",
            name: "Samleskinne B (Skap 42)",
            drawingRef: '"N4355-128-2.4": bl.2B',
            terminals: { UL1_ULN: "L242: 1-16", UL2_ULN: "L242: 6-16", UL3_ULN: "L242: 11-16" },
            fixedBusbar: "B",
          },
          {
            id: "mar132_msj1",
            name: "Mosjøen 1 (Skap 29)",
            drawingRef: '"N4355-122-1.4": bl.5',
            terminals: { UL1_ULN: "L229: 10-24", UL2_ULN: "L229: 15-24", UL3_ULN: "L229: 20-24" },
          },
          {
            id: "mar132_msj3",
            name: "Mosjøen 3 (Skap 35)",
            drawingRef: '"N4355-141-1.4": bl.5',
            terminals: { UL1_ULN: "L235: 13-24", UL2_ULN: "L235: 15-24", UL3_ULN: "L235: 20-24" },
          },
          {
            id: "mar132_gry",
            name: "Grytåga (Skap 31)",
            drawingRef: '"N4355-124-1.4": bl.5',
            terminals: { UL1_ULN: "L231: 10-24", UL2_ULN: "L231: 15-24", UL3_ULN: "L231: 20-24" },
          },
          {
            id: "mar132_oyf",
            name: "Øyfjellet 1 (Skap 32)",
            drawingRef: "",
            terminals: { UL1_ULN: "X2: 2-11", UL2_ULN: "X2: 5-11", UL3_ULN: "X2: 8-11" },
          },
          {
            id: "mar132_blk",
            name: "Bleikvasslia (Skap 41)",
            drawingRef: '"N4355-125-1.4": bl.5',
            terminals: { UL1_ULN: "L241: 10-24", UL2_ULN: "L241: 15-24", UL3_ULN: "L241: 20-24" },
          },
          {
            id: "mar132_t1",
            name: "Transformator 1 (nybygg)",
            drawingRef: '"PTD-8517-K133": bl.353',
            terminals: { UL1_ULN: "X2: 1-4", UL2_ULN: "X2: 2-4", UL3_ULN: "X2: 3-4" },
          },
          {
            id: "mar132_t2",
            name: "Transformator 2 (nybygg)",
            drawingRef: '"PTD-8517-K137": bl.353',
            terminals: { UL1_ULN: "X2: 1-4", UL2_ULN: "X2: 2-4", UL3_ULN: "X2: 3-4" },
          },
        ],
      },
    ],
  },
  {
    id: "rana",
    name: "Rana",
    shortName: "RAA",
    voltageLevels: [
      {
        id: "raa_132",
        kV: "132",
        nominalVoltage: 110,
        secondaryVoltage: 63.51,
        fields: [
          {
            id: "raa132_ssa",
            name: "Samleskinne A (+R51)",
            drawingRef: '"210.6345 K130": bl. 11',
            terminals: { UL1_ULN: "X1: 1-25", UL2_ULN: "X1: 11-25", UL3_ULN: "X1: 21-25" },
            fixedBusbar: "A",
          },
          {
            id: "raa132_ssb",
            name: "Samleskinne B (+R51)",
            drawingRef: '"210-6345 K130": bl.21',
            terminals: { UL1_ULN: "X1: 51-75", UL2_ULN: "X1: 61-75", UL3_ULN: "X1: 71-75" },
            fixedBusbar: "B",
          },
          {
            id: "raa132_sv2",
            name: "Svabo 2 (+R41)",
            drawingRef: '"210-6345 K138": bl. 11',
            terminals: { UL1_ULN: "X1: 21-38", UL2_ULN: "X1: 27-38", UL3_ULN: "X1: 33-38" },
          },
          {
            id: "raa132_sv4",
            name: "Svabo 4 (+R32)",
            drawingRef: '"210-6345 K132": bl. 11',
            terminals: { UL1_ULN: "X1: 21-38", UL2_ULN: "X1: 27-38", UL3_ULN: "X1: 33-38" },
          },
          {
            id: "raa132_t5",
            name: "Transformator T5",
            drawingRef: '"210-6345 K136": bl. 11',
            terminals: { UL1_ULN: "X1: 14-28", UL2_ULN: "X1: 19-28", UL3_ULN: "X1: 24-28" },
          },
          {
            id: "raa132_sv2o",
            name: "Svabo 2 etter omregning",
            drawingRef: "Referanse 132SSB",
            terminals: { UL1_ULN: "", UL2_ULN: "", UL3_ULN: "" },
          },
        ],
      },
    ],
  },
  {
    id: "namsskogan",
    name: "Namsskogan",
    shortName: "NMS",
    voltageLevels: [
      {
        id: "nms_66",
        kV: "300",
        nominalVoltage: 110,
        secondaryVoltage: 63.51,
        fields: [
          {
            id: "nms_kol",
            name: "Kolsvik",
            drawingRef: '"N6225-101-3": bl. 6',
            terminals: { UL1_ULN: "X2: 1-13", UL2_ULN: "X2: 5-13", UL3_ULN: "X2: 9-13" },
          },
          {
            id: "nms_tun",
            name: "Tunnsjødal",
            drawingRef: '"N6225-102-3": bl. 6',
            terminals: { UL1_ULN: "X3: 1-13", UL2_ULN: "X3: 5-13", UL3_ULN: "X3: 9-13" },
          },
          {
            id: "nms_tro",
            name: "Trofors",
            drawingRef: '"N6225-103-3": bl.6',
            terminals: { UL1_ULN: "X4: 1-13", UL2_ULN: "X4: 5-13", UL3_ULN: "X4: 9-13" },
          },
          { id: "nms_d", name: "Linje D", drawingRef: "", terminals: { UL1_ULN: "", UL2_ULN: "", UL3_ULN: "" }, isPlaceholder: true },
          { id: "nms_e", name: "Linje E", drawingRef: "", terminals: { UL1_ULN: "", UL2_ULN: "", UL3_ULN: "" }, isPlaceholder: true },
          { id: "nms_f", name: "Linje F", drawingRef: "", terminals: { UL1_ULN: "", UL2_ULN: "", UL3_ULN: "" }, isPlaceholder: true },
          { id: "nms_g", name: "Linje G", drawingRef: "", terminals: { UL1_ULN: "", UL2_ULN: "", UL3_ULN: "" }, isPlaceholder: true },
          { id: "nms_h", name: "Linje H", drawingRef: "", terminals: { UL1_ULN: "", UL2_ULN: "", UL3_ULN: "" }, isPlaceholder: true },
          { id: "nms_i", name: "Linje I", drawingRef: "", terminals: { UL1_ULN: "", UL2_ULN: "", UL3_ULN: "" }, isPlaceholder: true },
          { id: "nms_j", name: "Linje J", drawingRef: "", terminals: { UL1_ULN: "", UL2_ULN: "", UL3_ULN: "" }, isPlaceholder: true },
        ],
      },
    ],
  },
  {
    id: "trofors",
    name: "Trofors",
    shortName: "TRO",
    voltageLevels: [
      {
        id: "tro_66",
        kV: "66",
        nominalVoltage: 110,
        secondaryVoltage: 63.51,
        fields: [
          {
            id: "tro_ssa",
            name: "Samleskinne A",
            drawingRef: '"9BET 014251-EDA": bl. 153',
            terminals: { UL1_ULN: "A1-X1: 101-108", UL2_ULN: "A1-X1: 102-108", UL3_ULN: "A1-X1: 107-108" },
            fixedBusbar: "A",
          },
          {
            id: "tro_nms",
            name: "Namsskogan",
            drawingRef: '"9BET 014251-EDC": bl. 155',
            terminals: { UL1_ULN: "A1-X1: 110-122", UL2_ULN: "A1-X1: 114-122", UL3_ULN: "A1-X1: 118-122" },
          },
          {
            id: "tro_mar",
            name: "Marka",
            drawingRef: '"9BET 014251-EDD": bl. 155',
            terminals: { UL1_ULN: "A1-X1: 110-122", UL2_ULN: "A1-X1: 114-122", UL3_ULN: "A1-X1: 118-122" },
          },
          { id: "tro_d", name: "Linje D", drawingRef: "", terminals: { UL1_ULN: "", UL2_ULN: "", UL3_ULN: "" }, isPlaceholder: true },
          { id: "tro_e", name: "Linje E", drawingRef: "", terminals: { UL1_ULN: "", UL2_ULN: "", UL3_ULN: "" }, isPlaceholder: true },
          { id: "tro_f", name: "Linje F", drawingRef: "", terminals: { UL1_ULN: "", UL2_ULN: "", UL3_ULN: "" }, isPlaceholder: true },
          { id: "tro_g", name: "Linje G", drawingRef: "", terminals: { UL1_ULN: "", UL2_ULN: "", UL3_ULN: "" }, isPlaceholder: true },
          { id: "tro_h", name: "Linje H", drawingRef: "", terminals: { UL1_ULN: "", UL2_ULN: "", UL3_ULN: "" }, isPlaceholder: true },
          { id: "tro_i", name: "Linje I", drawingRef: "", terminals: { UL1_ULN: "", UL2_ULN: "", UL3_ULN: "" }, isPlaceholder: true },
          { id: "tro_j", name: "Linje J", drawingRef: "", terminals: { UL1_ULN: "", UL2_ULN: "", UL3_ULN: "" }, isPlaceholder: true },
        ],
      },
    ],
  },
];

export function findStation(stationName: string): StationTemplate | undefined {
  return STATIONS.find(
    (s) => stationName.toLowerCase().startsWith(s.name.toLowerCase())
  );
}

export function findVoltageLevel(
  station: StationTemplate,
  kV: string
): VoltageLevelConfig | undefined {
  return station.voltageLevels.find((vl) => vl.kV === kV);
}
