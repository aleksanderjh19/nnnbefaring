import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";

export interface UtlansData {
  laantakerNavn: string;
  ansattnr: string;
  utlaantGjenstand: string;
  regnr: string;
  datoFra: string;
  datoTil: string;
  datoSted: string;
  signaturLaantaker: string | null; // data URL PNG
  signaturStatnett: string | null;
  innlevertDato?: string;
  innlevertKvittering?: string;
  signaturInnlevering?: string | null;
}

const A4 = { w: 595.28, h: 841.89 };
const M = { left: 56, right: 56, top: 56, bottom: 56 };
const contentW = A4.w - M.left - M.right;

function wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (font.widthOfTextAtSize(test, size) > maxW) {
      if (cur) lines.push(cur);
      cur = w;
    } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

async function embedSig(pdf: PDFDocument, dataUrl: string | null | undefined) {
  if (!dataUrl) return null;
  const b64 = dataUrl.split(",")[1];
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return pdf.embedPng(bytes);
}

export async function generateUtlansPdf(d: UtlansData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);

  const sigL = await embedSig(pdf, d.signaturLaantaker);
  const sigS = await embedSig(pdf, d.signaturStatnett);
  const sigI = await embedSig(pdf, d.signaturInnlevering);

  const black = rgb(0, 0, 0);

  let page = pdf.addPage([A4.w, A4.h]);
  let y = A4.h - M.top;

  const drawFooter = (p: PDFPage) => {
    p.drawText("Oppdatert 27.04.2026", {
      x: M.left, y: M.bottom - 20, size: 9, font: italic, color: black,
    });
  };

  const newPage = () => {
    drawFooter(page);
    page = pdf.addPage([A4.w, A4.h]);
    y = A4.h - M.top;
  };

  const ensure = (h: number) => { if (y - h < M.bottom + 20) newPage(); };

  const drawText = (t: string, size: number, f: PDFFont = font, gap = 4) => {
    const lines = wrap(t, f, size, contentW);
    for (const ln of lines) {
      ensure(size + gap);
      page.drawText(ln, { x: M.left, y: y - size, size, font: f, color: black });
      y -= size + gap;
    }
  };

  const gap = (h: number) => { y -= h; };

  // Title
  drawText("Avtale om utlån av utstyr tilhørende Statnett SF", 16, bold, 6);
  gap(6);
  drawText("Avtale mellom Statnett SF", 11, font, 3);
  drawText("og", 11, font, 6);

  // Låntaker line
  ensure(30);
  const lineY = y - 14;
  page.drawLine({ start: { x: M.left, y: lineY }, end: { x: M.left + contentW, y: lineY }, thickness: 0.6, color: black });
  if (d.laantakerNavn || d.ansattnr) {
    const val = [d.laantakerNavn, d.ansattnr].filter(Boolean).join(" – ");
    page.drawText(val, { x: M.left + 4, y: lineY + 3, size: 11, font, color: black });
  }
  y -= 20;
  drawText("(låntakers navn og ansattnr., heretter kalt Låntaker)", 9, italic, 4);
  gap(4);
  drawText("om lån av utstyr tilhørende Statnett SF", 11, font, 6);
  gap(8);

  drawText("Retningslinjer", 13, bold, 6);
  drawText("Policy for utlån:", 11, bold, 4);
  drawText(
    "Ansatte i Statnett, som har nødvendig dokumentert opplæring/autorisasjon for bruken, kan også i begrenset omfang låne dette til eget privat bruk. Utstyret skal ikke benyttes til (betalt eller ubetalt) tjenesteyting til andre. Ethvert utlån skal følge gjeldende retningslinjer.",
    10, font, 3,
  );
  gap(4);
  drawText(
    "Typisk utstyr for utlån vil være tilhengere, håndverktøy, betongblander, lift, traktor/hjullaster etc. Kjøretøy som f.eks biler er regulert i egen avtale og reguleres ikke av retningslinjer for utlån av utstyr.",
    10, font, 3,
  );
  gap(4);
  drawText("ATV/UTV og snøscooter lånes ikke ut.", 10, font, 3);
  gap(4);
  drawText("Ved lån av utstyr gjelder følgende retningslinjer:", 10, font, 3);
  gap(6);

  const rules: [string, string][] = [
    ["1. UTLÅN AV UTSTYR",
      "Det etableres en utlånsbok/-register hvor avtaler for utlån dokumenteres ved underskrift av denne avtalen. Lån av lift, traktor/hjullaster kan ikke skje uten at nærmeste leder har gitt tillatelse om lån. Dokumentasjon av søknad/tillatelse gjøres pr. e-post."],
    ["2. TILSYN OG BRUK AV UTSTYRET",
      "Lånetakeren er ansvarlig for bruken av utstyret. Utstyret kan kun brukes av lånetaker. Lånetaker skal ha dokumentert opplæring og nødvendige kompetanse/sertifisering til å bruke utstyret. Utstyret skal kun brukes til slike arbeidsoppgaver og under slike arbeidsforhold det er beregnet for. Lånetaker plikter å følge instruksjonen vedrørende utstyrets bruk, med bruk av tilhørende verneutstyr, slik at han unngår å utsette seg selv eller andre for fare eller skade. Utstyrets angitte kapasiteter må ikke overskrides, samtidig som utstyret ikke må utsettes for miljømessige belastninger. Lånetakeren er forpliktet til å følge gjeldende vedlikeholds- og bruksforskrifter samt å besørge og bekoste nødvendig tilsyn, vanlig driftsmessig vedlikehold, utskifting av deler og forbruksmateriell så som drivstoff, smøremidler og annet som skal brukes og byttes ut under drift. Lånetakeren må kun bruke de driftsmidler og hjelpestoffer som er foreskrevet. Lånetaker må ikke foreta endringer eller modifikasjoner av utstyret. Når leiet utstyr ikke er i bruk og under tilsyn skal utstyr med egen fremdriftsmotor være låst med tenningslås og eventuell førerkabin låst. Alle nødvendige forholdsregler må være tatt med hensyn til lagring av leid utstyr for å unngå unødig verditap og/eller skade på utstyret forårsaket av for eksempel tyveri, hærverk, etc. Alt annet utstyr skal være innelåst. Utstyr med tilhengerdrag skal være låst med egen draglås."],
    ["3. FREMLEIE",
      "Lånetaker kan ikke fremleie/låne ut utstyret eller overlate sine rettigheter eller bruken av utstyret til andre."],
    ["4. INNLEVERING AV LÅNT UTSTYR",
      "Utstyret skal returneres til avtalt tid og i samme stand som utlånt, rengjort og klar til bruk. Eventuelle skader på utstyret skal varsles umiddelbart. Materiell som ikke tilbakeleveres, belastes lånetaker med gjenanskaffelseskostnaden."],
    ["5. ANSVAR, SKADER OG FORSIKRING",
      "Lånetakers driftssted bærer det fulle ansvaret for eventuelle skader på utstyret. Statnett sitt forsikringsprogram forutsetter at tingskade egenandelen på NOK 500.000,- bæres av det driftssted som \"eier\" eller disponerer den skadede interessen, hvorav følger at skader under disse egenandelene også bæres i sin helhet av det relevante driftssted med tilhørende ansvarskoder i IFS systemet. Lånetaker kan bli holdt ansvarlig for skader på utstyret samt følgeskader ved bruk av utstyret dersom dette skyldes skader som inntreffer forsettlig eller grovt uaktsomt, eller ved feil bruk, feilaktig vedlikehold, forurenset drivstoff eller smøremidler uavhengig av skyld, feil driftsspenning og liknende. Lånetaker svarer selv for kostnader som påløper i forbindelse med driftsavbrudd, følgeskader, uavhengig av om slike tap/skader kan tilskrives feil på utstyret."],
  ];
  for (const [h, body] of rules) {
    drawText(h, 10, bold, 3);
    drawText(body, 10, font, 3);
    gap(6);
  }

  // Fields section — always start on fresh block, keep together
  const fieldsBlockH = 220;
  if (y - fieldsBlockH < M.bottom + 20) newPage();
  gap(10);

  const drawField = (label: string, value: string, colX: number, colW: number) => {
    const labelSize = 10;
    page.drawText(label, { x: colX, y: y - labelSize, size: labelSize, font: bold, color: black });
    const lw = bold.widthOfTextAtSize(label, labelSize);
    const lineStart = colX + lw + 4;
    const lineEnd = colX + colW;
    page.drawLine({ start: { x: lineStart, y: y - labelSize - 1 }, end: { x: lineEnd, y: y - labelSize - 1 }, thickness: 0.6, color: black });
    if (value) {
      page.drawText(value, { x: lineStart + 3, y: y - labelSize + 2, size: 10, font, color: black });
    }
  };

  const halfW = contentW / 2 - 8;
  drawField("Utlånt gjenstand:", d.utlaantGjenstand, M.left, halfW);
  drawField("Reg.nr/serienr.:", d.regnr, M.left + halfW + 16, halfW);
  y -= 22;

  drawField("Dato for utlån  Fra:", d.datoFra, M.left, halfW);
  drawField("Til:", d.datoTil, M.left + halfW + 16, halfW);
  y -= 22;

  drawField("Dato/Sted:", d.datoSted, M.left, contentW);
  y -= 30;

  // Signatures
  const sigBoxW = halfW;
  const sigBoxH = 60;
  const sigYTop = y;
  // draw lines
  page.drawLine({ start: { x: M.left, y: sigYTop - sigBoxH }, end: { x: M.left + sigBoxW, y: sigYTop - sigBoxH }, thickness: 0.6, color: black });
  page.drawLine({ start: { x: M.left + sigBoxW + 16, y: sigYTop - sigBoxH }, end: { x: M.left + contentW, y: sigYTop - sigBoxH }, thickness: 0.6, color: black });
  if (sigS) {
    const dims = sigS.scaleToFit(sigBoxW - 8, sigBoxH - 6);
    page.drawImage(sigS, { x: M.left + 4, y: sigYTop - sigBoxH + 2, width: dims.width, height: dims.height });
  }
  if (sigL) {
    const dims = sigL.scaleToFit(sigBoxW - 8, sigBoxH - 6);
    page.drawImage(sigL, { x: M.left + sigBoxW + 20, y: sigYTop - sigBoxH + 2, width: dims.width, height: dims.height });
  }
  y = sigYTop - sigBoxH - 14;
  page.drawText("For Statnett SF", { x: M.left, y, size: 10, font, color: black });
  page.drawText("Låntaker", { x: M.left + sigBoxW + 16, y, size: 10, font, color: black });
  y -= 12;
  page.drawText("(Ansvarlig utstyrseier)", { x: M.left, y, size: 9, font: italic, color: black });
  y -= 24;

  // Innlevering
  drawField("Innlevert  Dato:", d.innlevertDato ?? "", M.left, halfW);
  drawField("Kvittering:", d.innlevertKvittering ?? "", M.left + halfW + 16, halfW);
  y -= 40;
  page.drawLine({ start: { x: M.left, y: y + 20 }, end: { x: M.left + sigBoxW, y: y + 20 }, thickness: 0.6, color: black });
  if (sigI) {
    const dims = sigI.scaleToFit(sigBoxW - 8, 50);
    page.drawImage(sigI, { x: M.left + 4, y: y + 22, width: dims.width, height: dims.height });
  }
  page.drawText("Ansvarlig utstyrseier", { x: M.left, y: y + 8, size: 9, font: italic, color: black });

  drawFooter(page);
  return await pdf.save();
}

export function downloadPdf(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
