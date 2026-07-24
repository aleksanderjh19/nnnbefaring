import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import templateAsset from "@/assets/utlansskjema-mal.pdf.asset.json";

export interface UtlansData {
  laantakerNavn: string;
  ansattnr: string;
  utlaantGjenstand: string;
  regnr: string;
  datoFra: string;
  datoTil: string;
  datoSted: string;
  signaturLaantaker: string | null;
  signaturStatnett: string | null;
  innlevertDato?: string;
  innlevertKvittering?: string;
  signaturInnlevering?: string | null;
}

// Field coordinates (PDF points, origin bottom-left) measured on the original template
// Page height = 842pt
const H = 842.04;
const COORDS = {
  // Page 1 — låntaker line
  laantakerLine: { x: 155, y: H - 191, w: 245 },
  // Page 2 — fields
  utlaantGjenstand: { x: 170, y: H - 505, w: 200 },
  regnr:            { x: 370, y: H - 505, w: 195 },
  datoFra:          { x: 170, y: H - 540, w: 130 },
  datoTil:          { x: 330, y: H - 540, w: 200 },
  datoSted:         { x: 150, y: H - 589, w: 400 },
  sigStatnett:      { x: 85,  y: H - 643, w: 175, h: 40 },
  sigLaantaker:     { x: 285, y: H - 643, w: 220, h: 40 },
  innlevertDato:    { x: 185, y: H - 727, w: 90 },
  sigInnlevering:   { x: 335, y: H - 738, w: 200, h: 32 },

};

async function embedSig(pdf: PDFDocument, dataUrl?: string | null) {
  if (!dataUrl) return null;
  const b64 = dataUrl.split(",")[1];
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return pdf.embedPng(bytes);
}

function formatDate(iso: string): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso;
}

export async function generateUtlansPdf(d: UtlansData): Promise<Uint8Array> {
  // Load template
  const res = await fetch(templateAsset.url);
  if (!res.ok) throw new Error("Kunne ikke laste PDF-mal");
  const templateBytes = new Uint8Array(await res.arrayBuffer());
  const pdf = await PDFDocument.load(templateBytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const black = rgb(0, 0, 0);

  const [p1, p2] = pdf.getPages();

  const drawText = (page: typeof p1, text: string, box: { x: number; y: number; w: number }, size = 11) => {
    if (!text) return;
    let s = size;
    while (font.widthOfTextAtSize(text, s) > box.w && s > 7) s -= 0.5;
    page.drawText(text, { x: box.x, y: box.y, size: s, font, color: black });
  };

  const drawSig = (page: typeof p1, img: any, box: { x: number; y: number; w: number; h: number }) => {
    if (!img) return;
    const dims = img.scaleToFit(box.w, box.h);
    page.drawImage(img, { x: box.x + (box.w - dims.width) / 2, y: box.y, width: dims.width, height: dims.height });
  };

  const sigL = await embedSig(pdf, d.signaturLaantaker);
  const sigS = await embedSig(pdf, d.signaturStatnett);
  const sigI = await embedSig(pdf, d.signaturInnlevering);

  // Page 1: låntaker (navn – ansattnr)
  const laantakerText = [d.laantakerNavn, d.ansattnr].filter(Boolean).join(" – ");
  drawText(p1, laantakerText, COORDS.laantakerLine);

  // Page 2 fields
  drawText(p2, d.utlaantGjenstand, COORDS.utlaantGjenstand);
  drawText(p2, d.regnr, COORDS.regnr);
  drawText(p2, formatDate(d.datoFra), COORDS.datoFra);
  drawText(p2, formatDate(d.datoTil), COORDS.datoTil);
  drawText(p2, d.datoSted, COORDS.datoSted);
  drawSig(p2, sigS, COORDS.sigStatnett);
  drawSig(p2, sigL, COORDS.sigLaantaker);
  drawText(p2, formatDate(d.innlevertDato ?? ""), COORDS.innlevertDato);

  drawSig(p2, sigI, COORDS.sigInnlevering);

  return await pdf.save();
}

export function downloadPdf(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
