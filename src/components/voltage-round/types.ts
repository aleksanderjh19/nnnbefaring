export interface InstrumentInfo {
  brand: string;
  type: string;
  serial: string;
  calibrationDate: string;
}

export interface TransformerField {
  id: string;
  name: string;
  busbar: "A" | "B";
  drawingRef: string;
}

export type Phase = "UL1_ULN" | "UL2_ULN" | "UL3_ULN";

export const PHASES: Phase[] = ["UL1_ULN", "UL2_ULN", "UL3_ULN"];

export const PHASE_LABELS: Record<Phase, string> = {
  UL1_ULN: "UL₁–ULN",
  UL2_ULN: "UL₂–ULN",
  UL3_ULN: "UL₃–ULN",
};

export interface PhaseMeasurement {
  terminal: string;
  refValue: number | null;
  measValue: number | null;
}

// measurements[transformerId][phase] = PhaseMeasurement
export type MeasurementData = Record<string, Record<Phase, PhaseMeasurement>>;

export interface VoltageRoundData {
  stationName: string;
  voltageLevel: string;
  secondaryVoltage: number;
  date: string;
  signNames: string;
  refInstrument: InstrumentInfo;
  measInstrument: InstrumentInfo;
  transformers: TransformerField[];
  measurements: MeasurementData;
  comments: string;
}

export const VOLTAGE_LEVELS = ["66", "110", "132", "300", "420"];

export const UF_OPTIONS = [
  { label: "57,70 V (100V/√3)", value: 57.7 },
  { label: "63,50 V (110V/√3)", value: 63.5 },
  { label: "115,50 V (200V/√3)", value: 115.5 },
  { label: "127,00 V (220V/√3)", value: 127.0 },
];

export const ACCURACY_CLASS = 0.2;

export function getDeviationLimit(uf: number): number {
  return uf * ACCURACY_CLASS * 2 / 100;
}

export function createEmptyInstrument(): InstrumentInfo {
  return { brand: "", type: "", serial: "", calibrationDate: "" };
}

export function createEmptyMeasurements(
  transformers: TransformerField[]
): MeasurementData {
  const m: MeasurementData = {};
  for (const t of transformers) {
    m[t.id] = {
      UL1_ULN: { terminal: "", refValue: null, measValue: null },
      UL2_ULN: { terminal: "", refValue: null, measValue: null },
      UL3_ULN: { terminal: "", refValue: null, measValue: null },
    };
  }
  return m;
}

export interface DeviationResult {
  phase: Phase;
  busbar: "A" | "B";
  values: { transformerId: string; transformerName: string; refValue: number; measValue: number }[];
  maxDeviation: number;
  limit: number;
  acceptable: boolean;
}

export function calculateDeviations(
  transformers: TransformerField[],
  measurements: MeasurementData,
  uf: number
): DeviationResult[] {
  const limit = getDeviationLimit(uf);
  const results: DeviationResult[] = [];

  for (const busbar of ["A", "B"] as const) {
    const busbarTransformers = transformers.filter((t) => t.busbar === busbar);
    if (busbarTransformers.length < 2) continue;

    for (const phase of PHASES) {
      const values: DeviationResult["values"] = [];
      for (const t of busbarTransformers) {
        const m = measurements[t.id]?.[phase];
        if (m?.refValue != null && m?.measValue != null) {
          values.push({
            transformerId: t.id,
            transformerName: t.name,
            refValue: m.refValue,
            measValue: m.measValue,
          });
        }
      }

      if (values.length < 2) continue;

      // Compare measuring instrument values across transformers on same busbar
      const measValues = values.map((v) => v.measValue);
      const maxDev = Math.max(...measValues) - Math.min(...measValues);

      results.push({
        phase,
        busbar,
        values,
        maxDeviation: maxDev,
        limit,
        acceptable: maxDev <= limit,
      });
    }
  }

  return results;
}
