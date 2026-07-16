import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, FileSignature, Trash2 } from "lucide-react";
import CategoryHeader from "@/components/CategoryHeader";
import SignaturePad from "@/components/SignaturePad";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { generateUtlansPdf, downloadPdf, type UtlansData } from "@/lib/utlansPdf";

const STORAGE_KEY = "utlansskjema-draft-v1";

const emptyData: UtlansData = {
  laantakerNavn: "",
  ansattnr: "",
  utlaantGjenstand: "",
  regnr: "",
  datoFra: "",
  datoTil: "",
  datoSted: "",
  signaturLaantaker: null,
  signaturStatnett: null,
  innlevertDato: "",
  innlevertKvittering: "",
  signaturInnlevering: null,
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card>
    <CardContent className="space-y-4 p-5">
      <h3 className="font-display text-sm font-bold uppercase tracking-widest text-statnett">{title}</h3>
      {children}
    </CardContent>
  </Card>
);

const UtlansSkjema = () => {
  useEffect(() => { document.title = "Utlånsskjema – NNHH Verktøy"; }, []);
  const navigate = useNavigate();
  const [data, setData] = useState<UtlansData>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...emptyData, ...JSON.parse(raw) };
    } catch {}
    return { ...emptyData, datoSted: todayIso() };
  });
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
  }, [data]);

  const set = <K extends keyof UtlansData>(k: K, v: UtlansData[K]) =>
    setData((p) => ({ ...p, [k]: v }));

  const requiredOk =
    data.laantakerNavn.trim() &&
    data.ansattnr.trim() &&
    data.utlaantGjenstand.trim() &&
    data.datoFra &&
    data.datoTil &&
    data.datoSted.trim() &&
    data.signaturLaantaker &&
    data.signaturStatnett;

  const handleGenerate = async () => {
    if (!requiredOk) {
      toast({ title: "Mangler felt", description: "Fyll ut alle påkrevde felt og signér før du genererer.", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const bytes = await generateUtlansPdf(data);
      const safe = data.laantakerNavn.replace(/[^a-zA-Z0-9-_]/g, "_");
      downloadPdf(bytes, `Utlansskjema_${safe}_${data.datoSted}.pdf`);
      toast({ title: "PDF generert", description: "Skjemaet er lastet ned." });
    } catch (e) {
      console.error(e);
      toast({ title: "Feil", description: "Kunne ikke generere PDF.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleReset = () => {
    if (!confirm("Nullstille skjema?")) return;
    localStorage.removeItem(STORAGE_KEY);
    setData({ ...emptyData, datoSted: todayIso() });
  };


  return (
    <div className="min-h-screen bg-background pb-32">
      <CategoryHeader title="Utlånsskjema" subtitle="Avtale om utlån av utstyr tilhørende Statnett SF" />

      <main className="mx-auto max-w-2xl space-y-4 px-5 py-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 font-body text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Tilbake
        </button>

        <Section title="Låntaker">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="navn">Navn *</Label>
              <Input id="navn" value={data.laantakerNavn} onChange={(e) => set("laantakerNavn", e.target.value)} placeholder="Fullt navn" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ansattnr">Ansattnr. *</Label>
              <Input id="ansattnr" value={data.ansattnr} onChange={(e) => set("ansattnr", e.target.value)} placeholder="F.eks. 12345" />
            </div>
          </div>
        </Section>

        <Section title="Utstyr">
          <div className="space-y-1.5">
            <Label htmlFor="gjenstand">Utlånt gjenstand *</Label>
            <Input id="gjenstand" value={data.utlaantGjenstand} onChange={(e) => set("utlaantGjenstand", e.target.value)} placeholder="F.eks. tilhenger, betongblander" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="regnr">Reg.nr / serienr.</Label>
            <Input id="regnr" value={data.regnr} onChange={(e) => set("regnr", e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fra">Dato fra *</Label>
              <Input id="fra" type="date" value={data.datoFra} onChange={(e) => set("datoFra", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="til">Dato til *</Label>
              <Input id="til" type="date" value={data.datoTil} onChange={(e) => set("datoTil", e.target.value)} />
            </div>
          </div>
        </Section>

        <Section title="Sted & signatur">
          <div className="space-y-1.5">
            <Label htmlFor="stedDato">Dato / Sted *</Label>
            <Input id="stedDato" value={data.datoSted} onChange={(e) => set("datoSted", e.target.value)} placeholder="F.eks. 16.07.2026, Mosjøen" />
          </div>
          <div className="space-y-2">
            <Label>Signatur låntaker *</Label>
            <SignaturePad value={data.signaturLaantaker} onChange={(v) => set("signaturLaantaker", v)} />
          </div>
          <div className="space-y-2">
            <Label>Signatur — For Statnett SF (ansvarlig utstyrseier) *</Label>
            <SignaturePad value={data.signaturStatnett} onChange={(v) => set("signaturStatnett", v)} />
          </div>
        </Section>

        <Section title="Innlevering (valgfritt — kan fylles ut ved retur)">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="innDato">Dato innlevert</Label>
              <Input id="innDato" type="date" value={data.innlevertDato ?? ""} onChange={(e) => set("innlevertDato", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kvitt">Kvittering / kommentar</Label>
              <Textarea id="kvitt" rows={2} value={data.innlevertKvittering ?? ""} onChange={(e) => set("innlevertKvittering", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Signatur ansvarlig utstyrseier (ved innlevering)</Label>
            <SignaturePad value={data.signaturInnlevering ?? null} onChange={(v) => set("signaturInnlevering", v)} />
          </div>
        </Section>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <Trash2 className="h-4 w-4" /> Nullstill
          </Button>
          <Button onClick={handleGenerate} disabled={generating || !requiredOk} className="gap-2">
            {generating ? "Genererer…" : (<><Download className="h-4 w-4" /> Generer og last ned PDF</>)}
          </Button>
        </div>
      </main>

      <div className="pointer-events-none fixed bottom-4 right-4 hidden opacity-40 sm:block">
        <FileSignature className="h-8 w-8" />
      </div>
    </div>
  );
};

export default UtlansSkjema;
