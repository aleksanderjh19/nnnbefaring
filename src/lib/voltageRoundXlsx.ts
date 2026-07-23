import ExcelJS from "exceljs";
import {
  VoltageRoundData,
  PHASES,
} from "@/components/voltage-round/types";

/**
 * Fill the Statnett voltage-round template with the round's data while preserving
 * all formulas and diagrams. Values are placed by matching field names against
 * the template's slot headers on row 6 and row 17.
 */
export async function generateVoltageRoundXlsx(round: VoltageRoundData) {
  if (!round.templateKey) throw new Error("Missing templateKey");

  const url = `/voltage-templates/${round.templateKey}.xlsx`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Kunne ikke laste mal: ${url}`);
  const buf = await res.arrayBuffer();

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const ws = wb.worksheets.find((s) => s.columnCount > 5) ?? wb.worksheets[0];

  // Slot columns for values: (Ref, Meas) pairs at B/C, D/E, F/G, H/I, J/K
  const SLOTS: Array<{ ref: string; meas: string; header: string }> = [
    { ref: "B", meas: "C", header: "B" },
    { ref: "D", meas: "E", header: "D" },
    { ref: "F", meas: "G", header: "F" },
    { ref: "H", meas: "I", header: "H" },
    { ref: "J", meas: "K", header: "J" },
  ];

  const normalize = (s: unknown) =>
    String(s ?? "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  // Build a map: slotKey (row+col header) → fieldId, by matching cell name to field.name
  const findSlot = (
    rowHeader: number,
    fieldName: string
  ): { valueRow: number; refCol: string; measCol: string } | null => {
    for (const s of SLOTS) {
      const cellVal = ws.getCell(`${s.header}${rowHeader}`).value;
      if (normalize(cellVal) === normalize(fieldName)) {
        // First-row header at row 6 → values at 13/14/15. Second-row header at 17 → 24/25/26
        const baseRow = rowHeader === 6 ? 13 : 24;
        return { valueRow: baseRow, refCol: s.ref, measCol: s.meas };
      }
    }
    return null;
  };

  // ── Header info ──────────────────────────────────────────────
  ws.getCell("B1").value = round.stationName;
  ws.getCell("B2").value = round.date;
  ws.getCell("B3").value = round.signNames;

  // Instruments block at G/H/I/J rows 2/3
  const ri = round.refInstrument;
  const mi = round.measInstrument;
  ws.getCell("G2").value = ri.brand;
  ws.getCell("H2").value = ri.type;
  ws.getCell("I2").value = ri.serial;
  ws.getCell("J2").value = ri.calibrationDate;
  ws.getCell("G3").value = mi.brand;
  ws.getCell("H3").value = mi.type;
  ws.getCell("I3").value = mi.serial;
  ws.getCell("J3").value = mi.calibrationDate;

  // Nominal voltage
  ws.getCell("J4").value = round.transformers.some((t) => t.conversion) ? 110 : 110;

  // ── Field values ─────────────────────────────────────────────
  for (const t of round.transformers) {
    if (t.status === "ute_av_drift") continue;
    // Try first row (header row 6), else second row (header row 17)
    const slot =
      findSlot(6, t.name) ??
      findSlot(17, t.name);
    if (!slot) continue;

    for (let i = 0; i < PHASES.length; i++) {
      const phase = PHASES[i];
      const m = round.measurements[t.id]?.[phase];
      if (!m) continue;
      const row = slot.valueRow + i;
      if (m.refValue != null) ws.getCell(`${slot.refCol}${row}`).value = m.refValue;
      if (m.measValue != null) ws.getCell(`${slot.measCol}${row}`).value = m.measValue;
    }
  }

  // ── Rana-specific "etter omregning" fields ───────────────────
  // For fields with conversion, if the template has "etter omregning" slots in row 17,
  // also populate those with the pre-computed values.
  for (const t of round.transformers) {
    if (!t.conversion || t.status === "ute_av_drift") continue;
    const omregnetName = `${t.name.replace(/\s*\(.*?\)/, "").trim()} etter omregning`;
    const slot = findSlot(17, omregnetName);
    if (!slot) continue;
    for (let i = 0; i < PHASES.length; i++) {
      const phase = PHASES[i];
      const m = round.measurements[t.id]?.[phase];
      if (!m) continue;
      const row = slot.valueRow + i;
      if (m.refValue != null) ws.getCell(`${slot.refCol}${row}`).value = m.refValue * t.conversion.factor;
      if (m.measValue != null) ws.getCell(`${slot.measCol}${row}`).value = m.measValue * t.conversion.factor;
    }
  }

  // ── Trigger recalculation on open ─────────────────────────────
  wb.calcProperties.fullCalcOnLoad = true;

  const out = await wb.xlsx.writeBuffer();
  const blob = new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const link = document.createElement("a");
  const url2 = URL.createObjectURL(blob);
  link.href = url2;
  link.download = `${round.stationName.replace(/\s+/g, "_")}_${round.date}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url2);
}
