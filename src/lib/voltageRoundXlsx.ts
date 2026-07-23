import JSZip from "jszip";
import { VoltageRoundData, PHASES } from "@/components/voltage-round/types";

/**
 * Fill the Statnett voltage-round template with the round's data.
 *
 * We patch the underlying xlsx XML directly (via JSZip) instead of round-tripping
 * through ExcelJS — that library silently drops embedded charts, drawings and
 * other advanced features that the Statnett templates rely on.
 */
export async function generateVoltageRoundXlsx(round: VoltageRoundData) {
  if (!round.templateKey) throw new Error("Missing templateKey");

  const url = `/voltage-templates/${round.templateKey}.xlsx`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Kunne ikke laste mal: ${url}`);
  const buf = await res.arrayBuffer();

  const zip = await JSZip.loadAsync(buf);

  // ── Shared strings ──────────────────────────────────────────
  const ssFile = zip.file("xl/sharedStrings.xml");
  let ssXml =
    (await ssFile?.async("string")) ??
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="0" uniqueCount="0"></sst>`;

  const sharedStrings: string[] = [];
  const siRegex = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
  let sm: RegExpExecArray | null;
  while ((sm = siRegex.exec(ssXml))) {
    const inner = sm[1];
    const text = Array.from(inner.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g))
      .map((x) => decodeXml(x[1]))
      .join("");
    sharedStrings.push(text);
  }

  const newStrings: string[] = [];
  const addString = (s: string): number => {
    const str = s ?? "";
    let idx = sharedStrings.indexOf(str);
    if (idx === -1) {
      idx = sharedStrings.length;
      sharedStrings.push(str);
      newStrings.push(str);
    }
    return idx;
  };

  // ── Sheet ──────────────────────────────────────────────────
  // Templates contain multiple sheets — the intro/info sheet and the actual
  // measurement sheet. Pick the sheet that actually contains the data grid
  // (header cell A1 = "Stasjon:" shared string).
  const sheetPaths = Object.keys(zip.files)
    .filter((p) => /^xl\/worksheets\/sheet\d+\.xml$/.test(p))
    .sort();
  let sheetPath = sheetPaths[0] ?? "xl/worksheets/sheet1.xml";
  let sheetXml = "";
  for (const p of sheetPaths) {
    const xml = await zip.file(p)!.async("string");
    // The data sheet has a cell at B6/D6/F6/H6 (field header row).
    if (/<c r="B6"[^>]*t="s"/.test(xml) && /<c r="D6"[^>]*t="s"/.test(xml)) {
      sheetPath = p;
      sheetXml = xml;
      break;
    }
  }
  if (!sheetXml) sheetXml = await zip.file(sheetPath)!.async("string");

  // Helpers to patch individual cells while preserving style attributes.
  const cellPattern = (ref: string) =>
    new RegExp(`<c r="${ref}"([^>]*?)(/>|>[\\s\\S]*?</c>)`);

  const upsertCell = (ref: string, inner: string, extraAttrs = "") => {
    const re = cellPattern(ref);
    const m = sheetXml.match(re);
    if (m) {
      // Preserve style s="..", strip any existing t="..".
      const attrs = m[1].replace(/\s*t="[^"]*"/, "");
      sheetXml = sheetXml.replace(
        re,
        `<c r="${ref}"${attrs}${extraAttrs}>${inner}</c>`
      );
      return;
    }
    // Insert into <row r="N">...</row>
    const rowNum = ref.match(/\d+/)?.[0];
    if (!rowNum) return;
    const rowOpenRe = new RegExp(`<row r="${rowNum}"[^>]*>`);
    if (sheetXml.match(rowOpenRe)) {
      sheetXml = sheetXml.replace(
        rowOpenRe,
        (mm) => `${mm}<c r="${ref}"${extraAttrs}>${inner}</c>`
      );
    }
  };

  const setNumber = (ref: string, value: number) => {
    if (!isFinite(value)) return;
    upsertCell(ref, `<v>${value}</v>`);
  };

  const setString = (ref: string, value: string) => {
    if (!value) return;
    const idx = addString(value);
    upsertCell(ref, `<v>${idx}</v>`, ' t="s"');
  };

  // ── Header lookup: find slot columns by matching field name ──
  const SLOTS = [
    { ref: "B", meas: "C", header: "B" },
    { ref: "D", meas: "E", header: "D" },
    { ref: "F", meas: "G", header: "F" },
    { ref: "H", meas: "I", header: "H" },
    { ref: "J", meas: "K", header: "J" },
  ];

  const normalize = (s: string) =>
    s.toLowerCase().replace(/\s+/g, " ").trim();

  const readCellString = (ref: string): string => {
    const re = cellPattern(ref);
    const m = sheetXml.match(re);
    if (!m) return "";
    const attrs = m[1];
    const body = m[2].startsWith(">") ? m[2].slice(1, -4) : "";
    // t="s" → shared string index; t="inlineStr" → <is><t>..</t></is>
    if (/\st="s"/.test(attrs)) {
      const v = body.match(/<v>([^<]*)<\/v>/)?.[1];
      if (v == null) return "";
      return sharedStrings[Number(v)] ?? "";
    }
    if (/\st="(inlineStr|str)"/.test(attrs)) {
      const t = body.match(/<t\b[^>]*>([\s\S]*?)<\/t>/)?.[1];
      return t ? decodeXml(t) : "";
    }
    return "";
  };

  const findSlot = (
    headerRow: number,
    fieldName: string
  ): { valueRow: number; refCol: string; measCol: string } | null => {
    for (const s of SLOTS) {
      const val = readCellString(`${s.header}${headerRow}`);
      if (!val) continue;
      if (normalize(val) === normalize(fieldName)) {
        const baseRow = headerRow === 6 ? 13 : 24;
        return { valueRow: baseRow, refCol: s.ref, measCol: s.meas };
      }
    }
    return null;
  };

  // ── Header info ──────────────────────────────────────────────
  setString("B1", round.stationName);
  setString("B2", round.date);
  setString("B3", round.signNames);

  const ri = round.refInstrument;
  const mi = round.measInstrument;
  setString("G2", ri.brand);
  setString("H2", ri.type);
  setString("I2", ri.serial);
  setString("J2", ri.calibrationDate);
  setString("G3", mi.brand);
  setString("H3", mi.type);
  setString("I3", mi.serial);
  setString("J3", mi.calibrationDate);

  setNumber("J4", 110);

  // ── Field values ─────────────────────────────────────────────
  for (const t of round.transformers) {
    if (t.status === "ute_av_drift") continue;
    const slot = findSlot(6, t.name) ?? findSlot(17, t.name);
    if (!slot) continue;

    for (let i = 0; i < PHASES.length; i++) {
      const phase = PHASES[i];
      if (t.availablePhases && !t.availablePhases.includes(phase)) continue;
      const m = round.measurements[t.id]?.[phase];
      if (!m) continue;
      const row = slot.valueRow + i;
      if (t.kind === "busbar") {
        // Busbar is the reference — the single value the user enters is the
        // reference-instrument reading. Write it into the "Ref. instr." column.
        const val = m.refValue ?? m.measValue;
        if (val != null) setNumber(`${slot.refCol}${row}`, val);
      } else {
        if (m.refValue != null) setNumber(`${slot.refCol}${row}`, m.refValue);
        if (m.measValue != null) setNumber(`${slot.measCol}${row}`, m.measValue);
      }
    }
  }

  // Rana-specific "etter omregning" slots
  for (const t of round.transformers) {
    if (!t.conversion || t.status === "ute_av_drift") continue;
    const omregnetName = `${t.name.replace(/\s*\(.*?\)/, "").trim()} etter omregning`;
    const slot = findSlot(17, omregnetName);
    if (!slot) continue;
    for (let i = 0; i < PHASES.length; i++) {
      const phase = PHASES[i];
      const m = round.measurements[t.id]?.[phase];
      if (!m) continue;
    for (let i = 0; i < PHASES.length; i++) {
      const phase = PHASES[i];
      const m = round.measurements[t.id]?.[phase];
      if (!m) continue;
      const row = slot.valueRow + i;
      if (m.refValue != null)
        setNumber(`${slot.refCol}${row}`, m.refValue * t.conversion.factor);
      if (m.measValue != null)
        setNumber(`${slot.measCol}${row}`, m.measValue * t.conversion.factor);
    }
  }

  // ── Force recalculation on open ──────────────────────────────
  // Drop the pre-computed calcChain so Excel rebuilds it.
  zip.remove("xl/calcChain.xml");

  // ── Persist patched xml ──────────────────────────────────────
  if (newStrings.length > 0) {
    const additions = newStrings
      .map((s) => `<si><t xml:space="preserve">${encodeXml(s)}</t></si>`)
      .join("");
    if (/<\/sst>/.test(ssXml)) {
      ssXml = ssXml.replace(/<\/sst>\s*$/, `${additions}</sst>`);
    } else {
      ssXml += additions;
    }
    ssXml = ssXml.replace(/count="\d+"/, `count="${sharedStrings.length}"`);
    ssXml = ssXml.replace(
      /uniqueCount="\d+"/,
      `uniqueCount="${sharedStrings.length}"`
    );
    zip.file("xl/sharedStrings.xml", ssXml);
  } else if (ssFile) {
    zip.file("xl/sharedStrings.xml", ssXml);
  }
  zip.file(sheetPath, sheetXml);

  const blob = await zip.generateAsync({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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

function encodeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function decodeXml(s: string) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}
