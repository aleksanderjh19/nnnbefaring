import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Download, PackageCheck, CheckCircle2 } from "lucide-react";
import CategoryHeader from "@/components/CategoryHeader";
import SignaturePad from "@/components/SignaturePad";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generateUtlansPdf, downloadPdf, type UtlansData } from "@/lib/utlansPdf";

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

type Status = "draft" | "active" | "returned";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card>
    <CardContent className="space-y-4 p-5">
      <h3 className="font-display text-sm font-bold uppercase tracking-widest text-statnett">{title}</h3>
      {children}
    </CardContent>
  </Card>
);

function toRow(d: UtlansData, status?: Status) {
  const row: Record<string, unknown> = {
    laantaker_navn: d.laantakerNavn,
    ansattnr: d.ansattnr,
    utlaant_gjenstand: d.utlaantGjenstand,
    regnr: d.regnr,
    dato_fra: d.datoFra || null,
    dato_til: d.datoTil || null,
    dato_sted: d.datoSted,
    signatur_laantaker: d.signaturLaantaker,
    signatur_statnett: d.signaturStatnett,
    innlevert_dato: d.innlevertDato || null,
    innlevert_kvittering: d.innlevertKvittering ?? "",
    signatur_innlevering: d.signaturInnlevering,
  };
  if (status) row.status = status;
  return row;
}

function fromRow(r: any): { data: UtlansData; status: Status } {
  return {
    data: {
      laantakerNavn: r.laantaker_navn ?? "",
      ansattnr: r.ansattnr ?? "",
      utlaantGjenstand: r.utlaant_gjenstand ?? "",
      regnr: r.regnr ?? "",
      datoFra: r.dato_fra ?? "",
      datoTil: r.dato_til ?? "",
      datoSted: r.dato_sted ?? "",
      signaturLaantaker: r.signatur_laantaker,
      signaturStatnett: r.signatur_statnett,
      innlevertDato: r.innlevert_dato ?? "",
      innlevertKvittering: r.innlevert_kvittering ?? "",
      signaturInnlevering: r.signatur_innlevering,
    },
    status: (r.status as Status) ?? "draft",
  };
}

const statusLabels: Record<Status, string> = {
  draft: "Kladd",
  active: "Utlånt",
  returned: "Innlevert",
};

const UtlansSkjema = () => {
  useEffect(() => { document.title = "Utlånsskjema – NNHH Verktøy"; }, []);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<UtlansData>(emptyData);
  const [status, setStatus] = useState<Status>("draft");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const dirtyRef = useRef(false);
  const saveTimer = useRef<number | null>(null);

  // Load
  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data: row, error } = await supabase
        .from("utlans_skjemaer").select("*").eq("id", id).maybeSingle();
      if (error || !row) {
        toast({ title: "Fant ikke skjema", variant: "destructive" });
        navigate("/utlansskjema");
        return;
      }
      const parsed = fromRow(row);
      setData(parsed.data);
      setStatus(parsed.status);
      setLoading(false);
    })();
  }, [id, navigate]);

  const persist = useCallback(async (nextStatus?: Status) => {
    if (!id) return;
    setSaving(true);
    const payload = toRow(data, nextStatus);
    const { error } = await supabase.from("utlans_skjemaer").update(payload).eq("id", id);
    setSaving(false);
    if (error) {
      toast({ title: "Feil ved lagring", description: error.message, variant: "destructive" });
      return false;
    }
    dirtyRef.current = false;
    if (nextStatus) setStatus(nextStatus);
    return true;
  }, [data, id]);

  // Autosave (debounced) when dirty
  useEffect(() => {
    if (loading) return;
    dirtyRef.current = true;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => { persist(); }, 800);
    return () => { if (saveTimer.current) window.clearTimeout(saveTimer.current); };
  }, [data, loading, persist]);

  const set = <K extends keyof UtlansData>(k: K, v: UtlansData[K]) =>
    setData((p) => ({ ...p, [k]: v }));

  const canGeneratePdf =
    data.laantakerNavn.trim().length > 0 || data.utlaantGjenstand.trim().length > 0;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await persist();
      const bytes = await generateUtlansPdf(data);
      const safe = (data.laantakerNavn || "utlaan").replace(/[^a-zA-Z0-9-_]/g, "_");
      downloadPdf(bytes, `Utlansskjema_${safe}_${data.datoSted || new Date().toISOString().slice(0,10)}.pdf`);
      toast({ title: "PDF generert" });
    } catch (e) {
      console.error(e);
      toast({ title: "Feil", description: "Kunne ikke generere PDF.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkActive = async () => {
    const ok = await persist("active");
    if (ok) toast({ title: "Skjema lagret som utlånt" });
  };

  const handleMarkReturned = async () => {
    const ok = await persist("returned");
    if (ok) toast({ title: "Merket som innlevert" });
  };

  if (loading) {
    return <div className="p-10 text-center text-sm text-muted-foreground">Laster…</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <CategoryHeader title="Utlånsskjema" subtitle="Avtale om utlån av utstyr tilhørende Statnett SF" />

      <main className="mx-auto max-w-2xl space-y-4 px-5 py-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/utlansskjema")}
            className="flex items-center gap-1.5 font-body text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Alle skjemaer
          </button>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{statusLabels[status]}</Badge>
            <span className="text-xs text-muted-foreground">
              {saving ? "Lagrer…" : dirtyRef.current ? "Endringer…" : "Lagret"}
            </span>
          </div>
        </div>

        <Section title="Låntaker">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="navn">Navn</Label>
              <Input id="navn" value={data.laantakerNavn} onChange={(e) => set("laantakerNavn", e.target.value)} placeholder="Fullt navn" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ansattnr">Ansattnr.</Label>
              <Input id="ansattnr" value={data.ansattnr} onChange={(e) => set("ansattnr", e.target.value)} placeholder="F.eks. 12345" />
            </div>
          </div>
        </Section>

        <Section title="Utstyr">
          <div className="space-y-1.5">
            <Label htmlFor="gjenstand">Utlånt gjenstand</Label>
            <Input id="gjenstand" value={data.utlaantGjenstand} onChange={(e) => set("utlaantGjenstand", e.target.value)} placeholder="F.eks. tilhenger, betongblander" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="regnr">Reg.nr / serienr.</Label>
            <Input id="regnr" value={data.regnr} onChange={(e) => set("regnr", e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fra">Dato fra</Label>
              <Input id="fra" type="date" value={data.datoFra} onChange={(e) => set("datoFra", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="til">Dato til</Label>
              <Input id="til" type="date" value={data.datoTil} onChange={(e) => set("datoTil", e.target.value)} />
            </div>
          </div>
        </Section>

        <Section title="Sted & signatur">
          <div className="space-y-1.5">
            <Label htmlFor="stedDato">Dato / Sted</Label>
            <Input id="stedDato" value={data.datoSted} onChange={(e) => set("datoSted", e.target.value)} placeholder="F.eks. 16.07.2026, Mosjøen" />
          </div>
          <div className="space-y-2">
            <Label>Signatur låntaker</Label>
            <SignaturePad value={data.signaturLaantaker} onChange={(v) => set("signaturLaantaker", v)} />
          </div>
          <div className="space-y-2">
            <Label>Signatur — For Statnett SF (ansvarlig utstyrseier)</Label>
            <SignaturePad value={data.signaturStatnett} onChange={(v) => set("signaturStatnett", v)} />
          </div>
        </Section>

        <Section title="Innlevering (fylles ut ved retur)">
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
          {status !== "returned" && (
            <Button variant="secondary" onClick={handleMarkReturned} className="w-full gap-2">
              <PackageCheck className="h-4 w-4" /> Merk som innlevert
            </Button>
          )}
        </Section>

        <div className="grid gap-2 sm:grid-cols-3">
          <Button variant="outline" onClick={() => persist()} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" /> Lagre
          </Button>
          {status === "draft" && (
            <Button variant="secondary" onClick={handleMarkActive} className="gap-2">
              <CheckCircle2 className="h-4 w-4" /> Fullfør utlån
            </Button>
          )}
          <Button
            onClick={handleGenerate}
            disabled={generating || !canGeneratePdf}
            className={`gap-2 ${status === "draft" ? "" : "sm:col-start-3"}`}
          >
            {generating ? "Genererer…" : (<><Download className="h-4 w-4" /> Last ned PDF</>)}
          </Button>
        </div>
        <Button variant="outline" onClick={() => navigate("/utlansskjema")} className="w-full gap-2">
          <ArrowRight className="h-4 w-4" /> Gå videre
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Skjemaet lagres automatisk. Du kan fullføre uten alle felt og fylle inn innlevering senere.
        </p>
      </main>
    </div>
  );
};

export default UtlansSkjema;
