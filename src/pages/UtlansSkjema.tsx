import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSmartBack } from "@/hooks/useSmartBack";
import { ArrowLeft, Download, PackageCheck, Send, ShieldCheck } from "lucide-react";
import CategoryHeader from "@/components/CategoryHeader";
import SignaturePad from "@/components/SignaturePad";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { generateUtlansPdf, downloadPdf, type UtlansData } from "@/lib/utlansPdf";

type Status = "draft" | "awaiting_owner_loan" | "active" | "awaiting_owner_return" | "returned";

interface FormData extends UtlansData {
  signaturInnleveringEier?: string | null;
}

const emptyData: FormData = {
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
  signaturInnleveringEier: null,
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card>
    <CardContent className="space-y-4 p-5">
      <h3 className="font-display text-sm font-bold uppercase tracking-widest text-statnett">{title}</h3>
      {children}
    </CardContent>
  </Card>
);

function toRow(d: FormData, status?: Status) {
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
    signatur_innlevering_eier: d.signaturInnleveringEier ?? null,
  };
  if (status) row.status = status;
  return row;
}

function fromRow(r: any): { data: FormData; status: Status } {
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
      signaturInnleveringEier: r.signatur_innlevering_eier ?? null,
    },
    status: (r.status as Status) ?? "draft",
  };
}

// Vist status til bruker (skjuler "avventer"-skygger)
const displayStatus = (s: Status): { label: string; variant: "outline" | "default" | "secondary" } => {
  switch (s) {
    case "draft": return { label: "Pågående", variant: "outline" };
    case "awaiting_owner_loan": return { label: "Utlånt", variant: "default" };
    case "active": return { label: "Utlånt", variant: "default" };
    case "awaiting_owner_return": return { label: "Avventer godkjenning", variant: "secondary" };
    case "returned": return { label: "Innlevert", variant: "outline" };
  }
};

const UtlansSkjema = () => {
  useEffect(() => { document.title = "Utlånsskjema – NNHH Verktøy"; }, []);
  const navigate = useNavigate();
  const goBack = useSmartBack("/utlansskjema");
  const { id } = useParams<{ id: string }>();
  const { isOwner } = useAuth();

  const [data, setData] = useState<FormData>(emptyData);
  const [status, setStatus] = useState<Status>("draft");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const dirtyRef = useRef(false);
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data: row, error } = await supabase
        .from("utlans_skjemaer" as any).select("*").eq("id", id).maybeSingle();
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

  const persist = useCallback(async (nextStatus?: Status, overrideData?: FormData) => {
    if (!id) return false;
    setSaving(true);
    const payload = toRow(overrideData ?? data, nextStatus);
    const { error } = await supabase.from("utlans_skjemaer" as any).update(payload).eq("id", id);
    setSaving(false);
    if (error) {
      toast({ title: "Feil ved lagring", description: error.message, variant: "destructive" });
      return false;
    }
    dirtyRef.current = false;
    if (nextStatus) setStatus(nextStatus);
    return true;
  }, [data, id]);

  // Autosave (debounced) — men ikke overskriv status
  useEffect(() => {
    if (loading) return;
    dirtyRef.current = true;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => { persist(); }, 800);
    return () => { if (saveTimer.current) window.clearTimeout(saveTimer.current); };
  }, [data, loading, persist]);

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setData((p) => ({ ...p, [k]: v }));

  const notifyOwner = async (type: "loan" | "return") => {
    try {
      await supabase.functions.invoke("notify-utlans-signering", {
        body: {
          skjemaId: id,
          type,
          laantakerNavn: data.laantakerNavn,
          utlaantGjenstand: data.utlaantGjenstand,
        },
      });
    } catch (e) {
      console.error("notify failed", e);
    }
  };

  // Actions
  const canSendForLoanSignature =
    status === "draft" &&
    data.laantakerNavn.trim().length > 0 &&
    data.utlaantGjenstand.trim().length > 0 &&
    !!data.signaturLaantaker;

  const handleSendForLoanSignature = async () => {
    if (!canSendForLoanSignature) {
      toast({ title: "Fyll ut navn, utstyr og signer som låntaker først", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const ok = await persist("awaiting_owner_loan");
    if (ok) {
      notifyOwner("loan");
      toast({ title: "Sendt til ansvarlig utstyrseier for signering" });
      navigate("/utlansskjema");
    }
    setSubmitting(false);
  };

  const handleOwnerSignLoan = async () => {
    if (!data.signaturStatnett) {
      toast({ title: "Signer først som ansvarlig utstyrseier", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const ok = await persist("active");
    if (ok) {
      toast({ title: "Utlån godkjent og aktivt" });
      navigate("/utlansskjema");
    }
    setSubmitting(false);
  };

  const canSendForReturnSignature =
    status === "active" && !!data.signaturInnlevering;

  const handleSendForReturnSignature = async () => {
    if (!canSendForReturnSignature) {
      toast({ title: "Signer innlevering som låntaker først", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const nextData = { ...data, innlevertDato: data.innlevertDato || new Date().toISOString().slice(0, 10) };
    setData(nextData);
    const ok = await persist("awaiting_owner_return", nextData);
    if (ok) {
      notifyOwner("return");
      toast({ title: "Sendt til eier for godkjenning av innlevering" });
      navigate("/utlansskjema");
    }
    setSubmitting(false);
  };

  const handleOwnerSignReturn = async () => {
    if (!data.signaturInnleveringEier) {
      toast({ title: "Signer først som ansvarlig utstyrseier", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const ok = await persist("returned");
    if (ok) {
      toast({ title: "Innlevering bekreftet" });
      navigate("/utlansskjema");
    }
    setSubmitting(false);
  };

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

  if (loading) {
    return <div className="p-10 text-center text-sm text-muted-foreground">Laster…</div>;
  }

  const meta = displayStatus(status);
  const awaitingLoan = status === "awaiting_owner_loan";
  const awaitingReturn = status === "awaiting_owner_return";
  const isLocked = awaitingLoan || awaitingReturn || status === "active" || status === "returned";

  return (
    <div className="min-h-screen bg-background pb-32">
      <CategoryHeader title="Utlånsskjema" subtitle="Avtale om utlån av utstyr tilhørende Statnett SF" />

      <main className="mx-auto max-w-2xl space-y-4 px-5 py-6">
        <div className="flex items-center justify-between">
          <button
            onClick={goBack}
            className="flex items-center gap-1.5 font-body text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Alle skjemaer
          </button>
          <div className="flex items-center gap-2">
            <Badge variant={meta.variant}>{meta.label}</Badge>
            <span className="text-xs text-muted-foreground">
              {saving ? "Lagrer…" : dirtyRef.current ? "Endringer…" : "Lagret"}
            </span>
          </div>
        </div>

        {awaitingLoan && (
          <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
            <CardContent className="p-4 text-sm">
              {isOwner
                ? "Dette skjemaet venter på din signatur som ansvarlig utstyrseier. Signer nederst for å godkjenne utlånet."
                : "Utlånet er registrert. Venter på bekreftelse fra ansvarlig utstyrseier."}
            </CardContent>
          </Card>
        )}
        {awaitingReturn && (
          <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
            <CardContent className="p-4 text-sm">
              {isOwner
                ? "Låntaker har signert innlevering. Bekreft ved å signere nederst."
                : "Innlevering er sendt til ansvarlig utstyrseier for godkjenning."}
            </CardContent>
          </Card>
        )}

        <Section title="Låntaker">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="navn">Navn</Label>
              <Input id="navn" value={data.laantakerNavn} onChange={(e) => set("laantakerNavn", e.target.value)} placeholder="Fullt navn" disabled={isLocked && !isOwner} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ansattnr">Ansattnr.</Label>
              <Input id="ansattnr" value={data.ansattnr} onChange={(e) => set("ansattnr", e.target.value)} placeholder="F.eks. 12345" disabled={isLocked && !isOwner} />
            </div>
          </div>
        </Section>

        <Section title="Utstyr">
          <div className="space-y-1.5">
            <Label htmlFor="gjenstand">Utlånt gjenstand</Label>
            <Input id="gjenstand" value={data.utlaantGjenstand} onChange={(e) => set("utlaantGjenstand", e.target.value)} placeholder="F.eks. tilhenger, betongblander" disabled={isLocked && !isOwner} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="regnr">Reg.nr / serienr.</Label>
            <Input id="regnr" value={data.regnr} onChange={(e) => set("regnr", e.target.value)} disabled={isLocked && !isOwner} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fra">Dato fra</Label>
              <Input id="fra" type="date" value={data.datoFra} onChange={(e) => set("datoFra", e.target.value)} disabled={isLocked && !isOwner} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="til">Dato til</Label>
              <Input id="til" type="date" value={data.datoTil} onChange={(e) => set("datoTil", e.target.value)} disabled={isLocked && !isOwner} />
            </div>
          </div>
        </Section>

        <Section title="Sted & signatur">
          <div className="space-y-1.5">
            <Label htmlFor="stedDato">Dato / Sted</Label>
            <Input id="stedDato" value={data.datoSted} onChange={(e) => set("datoSted", e.target.value)} placeholder="F.eks. 16.07.2026, Mosjøen" disabled={isLocked && !isOwner} />
          </div>
          <div className="space-y-2">
            <Label>Signatur låntaker</Label>
            {status === "draft" ? (
              <SignaturePad value={data.signaturLaantaker} onChange={(v) => set("signaturLaantaker", v)} />
            ) : data.signaturLaantaker ? (
              <img src={data.signaturLaantaker} alt="Låntaker-signatur" className="max-h-24 rounded-md border bg-white p-2" />
            ) : (
              <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">Ingen signatur</div>
            )}
          </div>

          {status !== "draft" && (
            <div className="space-y-2">
              <Label>Signatur — For Statnett SF (ansvarlig utstyrseier)</Label>
              {isOwner && awaitingLoan ? (
                <SignaturePad value={data.signaturStatnett} onChange={(v) => set("signaturStatnett", v)} />
              ) : data.signaturStatnett ? (
                <img src={data.signaturStatnett} alt="Eier-signatur" className="max-h-24 rounded-md border bg-white p-2" />
              ) : (
                <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                  Venter på eiers signatur.
                </div>
              )}
            </div>
          )}

          {status === "draft" && (
            <Button onClick={handleSendForLoanSignature} disabled={!canSendForLoanSignature || submitting} className="w-full gap-2">
              <Send className="h-4 w-4" /> Send til eier for signering
            </Button>
          )}
          {awaitingLoan && isOwner && (
            <Button onClick={handleOwnerSignLoan} disabled={!data.signaturStatnett || submitting} className="w-full gap-2">
              <ShieldCheck className="h-4 w-4" /> Godkjenn utlån
            </Button>
          )}
        </Section>

        {(status === "active" || status === "awaiting_owner_return" || status === "returned") && (
          <Section title="Innlevering">
            <div className="space-y-1.5">
              <Label htmlFor="innDato">Dato innlevert</Label>
              <Input id="innDato" type="date" value={data.innlevertDato ?? ""} onChange={(e) => set("innlevertDato", e.target.value)} disabled={status === "returned"} />
            </div>

            <div className="space-y-2">
              <Label>Signatur låntaker (ved innlevering)</Label>
              <SignaturePad value={data.signaturInnlevering ?? null} onChange={(v) => set("signaturInnlevering", v)} />
            </div>

            {status === "active" && (
              <Button onClick={handleSendForReturnSignature} disabled={!canSendForReturnSignature || submitting} variant="secondary" className="w-full gap-2">
                <Send className="h-4 w-4" /> Send innlevering til eier for godkjenning
              </Button>
            )}

            {(awaitingReturn || status === "returned") && (
              <div className="space-y-2">
                <Label>Signatur ansvarlig utstyrseier (bekreftelse på tilbakelevering)</Label>
                {isOwner && awaitingReturn ? (
                  <SignaturePad value={data.signaturInnleveringEier ?? null} onChange={(v) => set("signaturInnleveringEier", v)} />
                ) : data.signaturInnleveringEier ? (
                  <img src={data.signaturInnleveringEier} alt="Eier-signatur" className="max-h-24 rounded-md border bg-white p-2" />
                ) : (
                  <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                    Venter på eiers bekreftelse.
                  </div>
                )}

                {awaitingReturn && isOwner && (
                  <Button onClick={handleOwnerSignReturn} disabled={!data.signaturInnleveringEier || submitting} className="w-full gap-2">
                    <PackageCheck className="h-4 w-4" /> Bekreft innlevering
                  </Button>
                )}
              </div>
            )}
          </Section>
        )}

        <Button
          onClick={handleGenerate}
          disabled={generating || !canGeneratePdf}
          variant="outline"
          className="w-full gap-2"
        >
          {generating ? "Genererer…" : (<><Download className="h-4 w-4" /> Last ned PDF</>)}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Skjemaet lagres automatisk.
        </p>
      </main>
    </div>
  );
};

export default UtlansSkjema;
