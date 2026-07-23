import JSZip from "jszip";
import { Phase, VoltageRoundData, PHASES } from "@/components/voltage-round/types";

type CellValue = number | string | null;

interface SlotMapping {
  fieldId: string;
  refCol: string;
  measCol: string;
  headerRow: number;
  valueStartRow: number;
  diffStartRow: number;
  chartCol: string;
  sourceFieldId?: string;
  conversionFactor?: number;
}

interface TemplateMapping {
  slots: SlotMapping[];
}

const PHASE_INDEX: Record<Phase, number> = {
  UL1_ULN: 0,
  UL2_ULN: 1,
  UL3_ULN: 2,
};

const CHART_COLUMNS = ["B", "C", "D", "E", "F", "G", "H", "I", "J", "K"];

const TEMPLATE_MAPPINGS: Record<string, TemplateMapping> = {
  "marka-300": {
    slots: [
      slot("mar300_ssa", "B", 6, 13, "B"),
      slot("mar300_ssb", "D", 6, 13, "C"),
      slot("mar300_nra", "F", 6, 13, "D"),
      slot("mar300_tro", "H", 6, 13, "E"),
    ],
  },
  "marka-132": {
    slots: [
      slot("mar132_ssa", "B", 6, 13, "B"),
      slot("mar132_ssb", "D", 6, 13, "C"),
      slot("mar132_msj1", "F", 6, 13, "D"),
      slot("mar132_msj3", "H", 6, 13, "E"),
      slot("mar132_gry", "J", 6, 13, "F"),
      slot("mar132_oyf", "B", 17, 24, "G"),
      slot("mar132_blk", "D", 17, 24, "H"),
      slot("mar132_t1", "F", 17, 24, "I"),
      slot("mar132_t2", "H", 17, 24, "J"),
    ],
  },
  "rana-132": {
    slots: [
      slot("raa132_ssa", "B", 6, 13, "B"),
      slot("raa132_ssb", "D", 6, 13, "C"),
      slot("raa132_sv2", "F", 6, 13, "D"),
      slot("raa132_sv4", "H", 6, 13, "E"),
      slot("raa132_t5", "J", 6, 13, "F"),
      slot("raa132_sv2_omregnet", "F", 17, 24, "I", {
        sourceFieldId: "raa132_sv2",
        conversionFactor: 132 / 140,
      }),
      slot("raa132_sv4_omregnet", "H", 17, 24, "J", {
        sourceFieldId: "raa132_sv4",
        conversionFactor: 132 / 140,
      }),
    ],
  },
  "trofors-300": {
    slots: [
      slot("tro_ssa", "B", 6, 13, "B"),
      slot("tro_nms", "D", 6, 13, "C"),
      slot("tro_mar", "F", 6, 13, "D"),
    ],
  },
  "namsskogan-300": {
    slots: [
      slot("nms_kol", "B", 6, 13, "B"),
      slot("nms_tun", "D", 6, 13, "C"),
      slot("nms_tro", "F", 6, 13, "D"),
    ],
  },
};

function slot(
  fieldId: string,
  refCol: string,
  headerRow: number,
  valueStartRow: number,
  chartCol: string,
  extra: Partial<SlotMapping> = {}
): SlotMapping {
  return {
    fieldId,
    refCol,
    measCol: nextColumn(refCol),
    headerRow,
    valueStartRow,
    diffStartRow: valueStartRow - 4,
    chartCol,
    ...extra,
  };
}

/**
 * Fill the Statnett voltage-round template with the round's data.
 *
 * We patch the underlying xlsx XML directly (via JSZip) instead of round-tripping
 * through ExcelJS — that library silently drops embedded charts, drawings and
 * other advanced features that the Statnett templates rely on.
 */
export async function generateVoltageRoundXlsx(round: VoltageRoundData) {
  if (!round.templateKey) throw new Error("Missing templateKey");
  const mapping = TEMPLATE_MAPPINGS[round.templateKey];
  if (!mapping) throw new Error(`Mangler Excel-mapping for ${round.templateKey}`);

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
    const file = zip.file(p);
    if (!file) continue;
    const xml = await file.async("string");
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

  const upsertCell = (
    ref: string,
    inner: string,
    extraAttrs = "",
    options: { stripType?: boolean } = { stripType: true }
  ) => {
    const re = cellPattern(ref);
    const m = sheetXml.match(re);
    if (m) {
      // Preserve style s="..". Strip t=".." only when writing raw numbers.
      const attrs = options.stripType ? m[1].replace(/\s*t="[^"]*"/, "") : m[1];
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

  const setFormulaNumber = (ref: string, formula: string, value: number | null) => {
    const cached = value == null || !isFinite(value) ? "" : String(value);
    upsertCell(
      ref,
      `<f>${encodeXml(formula)}</f><v>${cached}</v>`,
      ' t="str"',
      { stripType: true }
    );
  };

  const setFormulaString = (ref: string, formula: string, value: string) => {
    upsertCell(
      ref,
      `<f>${encodeXml(formula)}</f><v>${encodeXml(value)}</v>`,
      ' t="str"',
      { stripType: true }
    );
  };

  const clearCell = (ref: string) => {
    const re = cellPattern(ref);
    const m = sheetXml.match(re);
    if (!m) return;
    const attrs = m[1].replace(/\s*t="[^"]*"/, "");
    sheetXml = sheetXml.replace(re, `<c r="${ref}"${attrs}/>`);
  };

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

  setNumber("J4", getLineVoltage(round.secondaryVoltage));
  setFormulaNumber("K4", "J4/SQRT(3)", round.secondaryVoltage);

  // ── Field values ─────────────────────────────────────────────
  const chartLabels: Record<string, string> = {};
  const chartValues: Record<Phase, Record<string, number>> = {
    UL1_ULN: {},
    UL2_ULN: {},
    UL3_ULN: {},
  };

  for (const s of mapping.slots) {
    const sourceId = s.sourceFieldId ?? s.fieldId;
    const t = round.transformers.find((field) => field.id === sourceId);
    const label = readCellString(`${s.refCol}${s.headerRow}`) || t?.name || "";
    chartLabels[s.chartCol] = label;
    setFormulaString(`${s.chartCol}39`, `${s.refCol}${s.headerRow}`, label);

    if (!t || t.status === "ute_av_drift") {
      clearSlotValues(s);
      continue;
    }

    const isReference = isReferenceSlot(round, t);
    for (const phase of PHASES) {
      const idx = PHASE_INDEX[phase];
      const terminalRow = s.diffStartRow + idx;
      const valueRow = s.valueStartRow + idx;
      const diffRow = s.diffStartRow + idx;
      const chartRow = 40 + idx;
      const chartCell = `${s.chartCol}${chartRow}`;
      const diffCell = `${s.measCol}${diffRow}`;

      if (t.availablePhases && !t.availablePhases.includes(phase)) {
        clearCell(`${s.refCol}${valueRow}`);
        clearCell(`${s.measCol}${valueRow}`);
        clearCell(diffCell);
        setNumber(chartCell, 0);
        chartValues[phase][s.chartCol] = 0;
        continue;
      }

      const measurement = round.measurements[sourceId]?.[phase];
      if (measurement?.terminal) setString(`${s.refCol}${terminalRow}`, measurement.terminal);

      const factor = s.conversionFactor ?? 1;
      const refValue = multiplyNullable(measurement?.refValue, factor);
      const measValue = multiplyNullable(measurement?.measValue, factor);

      if (isReference) {
        const value = multiplyNullable(measurement?.measValue ?? measurement?.refValue, factor);
        if (value != null) setNumber(`${s.refCol}${valueRow}`, value);
        clearCell(`${s.measCol}${valueRow}`);
        clearCell(diffCell);
        setNumber(chartCell, 0);
        chartValues[phase][s.chartCol] = 0;
        continue;
      }

      if (refValue != null) setNumber(`${s.refCol}${valueRow}`, refValue);
      if (measValue != null) setNumber(`${s.measCol}${valueRow}`, measValue);

      const deviation = refValue != null && measValue != null ? measValue - refValue : null;
      setFormulaNumber(
        diffCell,
        `IF(${s.refCol}${valueRow}<>"",(${s.measCol}${valueRow}-${s.refCol}${valueRow}),"")`,
        deviation
      );
      setFormulaNumber(chartCell, diffCell, deviation ?? 0);
      chartValues[phase][s.chartCol] = deviation ?? 0;
    }
  }

  function clearSlotValues(s: SlotMapping) {
    for (const phase of PHASES) {
      const idx = PHASE_INDEX[phase];
      clearCell(`${s.refCol}${s.valueStartRow + idx}`);
      clearCell(`${s.measCol}${s.valueStartRow + idx}`);
      clearCell(`${s.measCol}${s.diffStartRow + idx}`);
      setNumber(`${s.chartCol}${40 + idx}`, 0);
      chartValues[phase][s.chartCol] = 0;
    }
  }

  // ── Force recalculation on open ──────────────────────────────
  // 1. Drop the pre-computed calcChain so Excel rebuilds it.
  zip.remove("xl/calcChain.xml");
  removeCalcChainReferences(zip);
  updateChartCaches(zip, chartLabels, chartValues);

  // 2. Tell Excel to do a full recalc on open. We still write fresh cached
  // values for the deviation/chart cells so the result is visible immediately.
  const wbPath = "xl/workbook.xml";
  const wbFile = zip.file(wbPath);
  if (wbFile) {
    let wbXml = await wbFile.async("string");
    if (/<calcPr\b[^/]*\/>/.test(wbXml)) {
      wbXml = wbXml.replace(/<calcPr\b([^/]*)\/>/, (_full, attrs) => {
        const nextAttrs = withXmlAttrs(attrs, {
          calcMode: "auto",
          fullCalcOnLoad: "1",
          forceFullCalc: "1",
        });
        return `<calcPr${nextAttrs}/>`;
      });
    } else if (/<calcPr\b/.test(wbXml)) {
      wbXml = wbXml.replace(/<calcPr\b([^>]*)>/, (_full, attrs) => {
        const nextAttrs = withXmlAttrs(attrs, {
          calcMode: "auto",
          fullCalcOnLoad: "1",
          forceFullCalc: "1",
        });
        return `<calcPr${nextAttrs}>`;
      });
    } else {
      wbXml = wbXml.replace(
        /<\/workbook>/,
        `<calcPr calcMode="auto" fullCalcOnLoad="1" forceFullCalc="1"/></workbook>`
      );
    }
    zip.file(wbPath, wbXml);
  }

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

function nextColumn(col: string) {
  return String.fromCharCode(col.charCodeAt(0) + 1);
}

function multiplyNullable(value: number | null | undefined, factor: number) {
  return value == null ? null : value * factor;
}

function isReferenceSlot(round: VoltageRoundData, field: VoltageRoundData["transformers"][number]) {
  if (round.referenceMode === "field") return field.isReference === true;
  return field.kind === "busbar";
}

function getLineVoltage(phaseToNeutralVoltage: number) {
  const known: Record<string, number> = {
    "57.7": 100,
    "63.5": 110,
    "115.5": 200,
    "127": 220,
  };
  const key = String(phaseToNeutralVoltage);
  return known[key] ?? Number((phaseToNeutralVoltage * Math.sqrt(3)).toFixed(6));
}

function removeCalcChainReferences(zip: JSZip) {
  const contentTypes = zip.file("[Content_Types].xml");
  if (contentTypes) {
    contentTypes.async("string").then((xml) => {
      const next = xml.replace(
        /<Override\s+PartName="\/xl\/calcChain\.xml"\s+ContentType="application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.calcChain\+xml"\s*\/>/g,
        ""
      );
      zip.file("[Content_Types].xml", next);
    });
  }

  const rels = zip.file("xl/_rels/workbook.xml.rels");
  if (rels) {
    rels.async("string").then((xml) => {
      const next = xml.replace(
        /<Relationship\b[^>]*Target="calcChain\.xml"[^>]*\/>/g,
        ""
      );
      zip.file("xl/_rels/workbook.xml.rels", next);
    });
  }
}

function updateChartCaches(
  zip: JSZip,
  labelsByColumn: Record<string, string>,
  valuesByPhase: Record<Phase, Record<string, number>>
) {
  const labels = CHART_COLUMNS.map((col) => labelsByColumn[col] ?? "");
  for (const path of Object.keys(zip.files).filter((p) => /^xl\/charts\/chart\d+\.xml$/.test(p))) {
    const file = zip.file(path);
    if (!file) continue;
    file.async("string").then((xml) => {
      let next = xml;
      PHASES.forEach((phase, idx) => {
        const row = 40 + idx;
        const values = CHART_COLUMNS.map((col) => valuesByPhase[phase][col] ?? 0);
        const cache = buildNumCache(values);
        const re = new RegExp(
          `(<c:f>[^<]*\\$B\\$${row}:\\$K\\$${row}<\\/c:f>\\s*)<c:numCache>[\\s\\S]*?<\\/c:numCache>`,
          "g"
        );
        next = next.replace(re, `$1${cache}`);
      });
      next = next.replace(
        /<c:strCache>\s*<c:ptCount val="10"\/>[\s\S]*?<\/c:strCache>/g,
        buildStrCache(labels)
      );
      zip.file(path, next);
    });
  }
}

function buildNumCache(values: number[]) {
  const points = values
    .map((value, idx) => `<c:pt idx="${idx}"><c:v>${Number(value.toFixed(6))}</c:v></c:pt>`)
    .join("");
  return `<c:numCache><c:formatCode>0.00&quot; &quot;\\V</c:formatCode><c:ptCount val="${values.length}"/>${points}</c:numCache>`;
}

function buildStrCache(values: string[]) {
  const points = values
    .map((value, idx) => `<c:pt idx="${idx}"><c:v>${encodeXml(value)}</c:v></c:pt>`)
    .join("");
  return `<c:strCache><c:ptCount val="${values.length}"/>${points}</c:strCache>`;
}

function withXmlAttrs(attrs: string, values: Record<string, string>) {
  let next = attrs;
  for (const [key, value] of Object.entries(values)) {
    const re = new RegExp(`\\s${key}="[^"]*"`);
    if (re.test(next)) next = next.replace(re, ` ${key}="${value}"`);
    else next += ` ${key}="${value}"`;
  }
  return next;
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
