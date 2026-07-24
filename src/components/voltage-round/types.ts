export interface InstrumentInfo {
  brand: string;
  type: string;
  serial: string;
  calibrationDate: string;
}

export type FieldKind = "busbar" | "field";
export type FieldStatus = "active" | "ute_av_drift";
export type ReferenceMode = "dual-busbar" | "single-busbar" | "field";

export interface TransformerField {
  id: string;
  name: string;
  drawingRef: string;
  kind: FieldKind;
  /** For kind="busbar": which busbar this is */
  busbarLabel?: "A" | "B";
  /** For dual-busbar mode: which busbar this field is currently connected to */
  refBusbar?: "A" | "B";
  /** For field-mode station: is this the reference field for this round */
  isReference?: boolean;
  status: FieldStatus;
  /** For fields whose measurement must be converted before comparison (Rana omsetning) */
  conversion?: { factor: number };
  /** Phases that actually have a measurement point. Defaults to all three. */
  availablePhases?: Phase[];
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

// measurements[fieldId][phase] = PhaseMeasurement
export type MeasurementData = Record<string, Record<Phase, PhaseMeasurement>>;

export interface VoltageRoundData {
  stationName: string;
  voltageLevel: string;
  secondaryVoltage: number;
  date: string;
  signNames: string;
  refInstrument: InstrumentInfo;
  measInstrument: InstrumentInfo;
  referenceMode: ReferenceMode;
  transformers: TransformerField[];
  measurements: MeasurementData;
  comments: string;
  /** Template id used for xlsx export mapping (e.g. "marka-132") */
  templateKey?: string;
}

export const VOLTAGE_LEVELS = ["66", "110", "132", "300", "420"];

export const UF_OPTIONS = [
  { label: "57,70 V (100V/√3)", value: 57.7 },
  { label: "63,50 V (110V/√3)", value: 63.5 },
  { label: "115,50 V (200V/√3)", value: 115.5 },
  { label: "127,00 V (220V/√3)", value: 127.0 },
];

export const ACCURACY_CLASS = 0.2;

/** Deviation limit from the Cl. 0,2 table in the Statnett template. */
export function getDeviationLimit(uf: number): number {
  const table: Record<string, number> = {
    "57.7": 0.23,
    "63.5": 0.25,
    "115.5": 0.46,
    "127": 0.5,
  };
  const key = String(uf);
  if (table[key] != null) return table[key];
  // Fallback: closest match
  const entries = Object.entries(table).map(([k, v]) => ({ uf: Number(k), limit: v }));
  entries.sort((a, b) => Math.abs(a.uf - uf) - Math.abs(b.uf - uf));
  return entries[0].limit;
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

// ─── Deviation calculation ───────────────────────────────────────────────

export interface FieldPhaseDeviation {
  phase: Phase;
  fieldMeasValue: number;
  /** Field's measured value after applying conversion factor (if any) */
  effectiveFieldValue: number;
  referenceMeasValue: number;
  deviation: number; // effectiveFieldValue − referenceMeasValue
  limit: number;
  acceptable: boolean;
}

export interface FieldDeviationGroup {
  fieldId: string;
  fieldName: string;
  referenceLabel: string;   // "Samleskinne A" | field name
  referenceId: string;       // busbar field id or reference field id
  hasConversion: boolean;
  conversionFactor?: number;
  phases: FieldPhaseDeviation[];
  hasIssue: boolean;
}

export interface ReferenceSection {
  key: string;                // "busbar-A" | "busbar-B" | "field-<id>"
  label: string;              // "Samleskinne A" | "Referansefelt: Kolsvik"
  referenceId: string;
  groups: FieldDeviationGroup[];
}

/**
 * Calculate per-field deviations grouped by reference (busbar A, busbar B, or reference field).
 */
export function calculateReferenceSections(
  transformers: TransformerField[],
  measurements: MeasurementData,
  referenceMode: ReferenceMode,
  secondaryVoltage: number
): ReferenceSection[] {
  const limit = getDeviationLimit(secondaryVoltage);
  const sections: ReferenceSection[] = [];

  const active = transformers.filter((t) => t.status !== "ute_av_drift");

  const buildGroup = (
    field: TransformerField,
    reference: TransformerField,
    referenceLabel: string
  ): FieldDeviationGroup => {
    const phases: FieldPhaseDeviation[] = [];
    for (const phase of PHASES) {
      const fm = measurements[field.id]?.[phase]?.measValue;
      const rm = measurements[field.id]?.[phase]?.refValue;
      if (fm == null || rm == null) continue;
      const factor = field.conversion?.factor ?? 1;
      const effective = fm * factor;
      const dev = effective - rm;
      phases.push({
        phase,
        fieldMeasValue: fm,
        effectiveFieldValue: effective,
        referenceMeasValue: rm,
        deviation: dev,
        limit,
        acceptable: Math.abs(dev) <= limit,
      });
    }
    return {
      fieldId: field.id,
      fieldName: field.name,
      referenceLabel,
      referenceId: reference.id,
      hasConversion: !!field.conversion,
      conversionFactor: field.conversion?.factor,
      phases,
      hasIssue: phases.some((p) => !p.acceptable),
    };
  };

  if (referenceMode === "dual-busbar" || referenceMode === "single-busbar") {
    const ssa = active.find((t) => t.kind === "busbar" && t.busbarLabel === "A");
    const ssb = active.find((t) => t.kind === "busbar" && t.busbarLabel === "B");

    for (const busbar of ["A", "B"] as const) {
      const ref = busbar === "A" ? ssa : ssb;
      if (!ref) continue;
      const fields = active.filter(
        (t) => t.kind === "field" && (t.refBusbar ?? "A") === busbar
      );
      if (fields.length === 0) continue;
      sections.push({
        key: `busbar-${busbar}`,
        label: `Samleskinne ${busbar}`,
        referenceId: ref.id,
        groups: fields.map((f) => buildGroup(f, ref, `Samleskinne ${busbar}`)),
      });
    }
  } else {
    // field-mode: one field acts as reference
    const ref = active.find((t) => t.isReference) ?? active[0];
    if (!ref) return sections;
    const fields = active.filter((t) => t.id !== ref.id);
    sections.push({
      key: `field-${ref.id}`,
      label: `Referansefelt: ${ref.name}`,
      referenceId: ref.id,
      groups: fields.map((f) => buildGroup(f, ref, ref.name)),
    });
  }

  return sections;
}

export function hasAnyIssue(sections: ReferenceSection[]): boolean {
  return sections.some((s) => s.groups.some((g) => g.hasIssue));
}

// ─── Legacy migration ─────────────────────────────────────────────────────

/**
 * Old rounds stored `busbar: "A"|"B"` on each transformer with no kind/status.
 * Convert them into the new model so history keeps working.
 */
export function migrateTransformers(
  transformers: any[],
  referenceMode: ReferenceMode
): TransformerField[] {
  return transformers.map((t) => {
    if (t.kind) return t as TransformerField; // already new format
    const legacyBusbar = t.busbar as "A" | "B" | undefined;
    // Legacy "SSA/SSB" fields were named literally; detect by name
    const nameLower = String(t.name ?? "").toLowerCase();
    const isBusbar =
      nameLower.startsWith("samleskinne a") ||
      nameLower.startsWith("samleskinne b") ||
      nameLower.startsWith("ssa") ||
      nameLower.startsWith("ssb");
    const busbarLabel: "A" | "B" | undefined = isBusbar
      ? nameLower.includes("b")
        ? "B"
        : "A"
      : undefined;
    return {
      id: t.id,
      name: t.name,
      drawingRef: t.drawingRef ?? "",
      kind: isBusbar ? "busbar" : "field",
      busbarLabel,
      refBusbar: !isBusbar ? legacyBusbar ?? "A" : undefined,
      status: "active" as FieldStatus,
    };
  });
}
