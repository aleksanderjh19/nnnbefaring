import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSmartBack } from "@/hooks/useSmartBack";
import { ArrowLeft, Plus, FileSignature, CheckCircle2, Clock, PackageCheck, Trash2, Download, ShieldAlert } from "lucide-react";
import CategoryHeader from "@/components/CategoryHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { generateUtlansPdf, downloadPdf, type UtlansData } from "@/lib/utlansPdf";

function fromRow(r: any): UtlansData {
  return {
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
  };
}

type Row = {
  id: string;
  laantaker_navn: string;
  utlaant_gjenstand: string;
  dato_fra: string | null;
  dato_til: string | null;
  status: string;
  updated_at: string;
};

const statusMeta: Record<string, { label: string; icon: any; className: string }> = {
  draft:                 { label: "Pågående",             icon: Clock,         className: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100" },
  awaiting_owner_loan:   { label: "Utlånt",               icon: FileSignature, className: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100" },
  active:                { label: "Utlånt",               icon: FileSignature, className: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100" },
  awaiting_owner_return: { label: "Avventer godkjenning", icon: ShieldAlert,   className: "bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-100" },
  returned:              { label: "Innlevert",            icon: PackageCheck,  className: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100" },
};

const UtlansList = () => {
  useEffect(() => { document.title = "Utlånsskjema – NNHH Verktøy"; }, []);
  const navigate = useNavigate();
  const goBack = useSmartBack("/");
  const { isAdmin, isOwner } = useAuth();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("utlans_skjemaer")
      .select("id, laantaker_navn, utlaant_gjenstand, dato_fra, dato_til, status, updated_at")
      .order("updated_at", { ascending: false });
    if (error) toast({ title: "Feil ved henting", description: error.message, variant: "destructive" });
    setRows((data as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleNew = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) return;
      const { data, error } = await supabase
        .from("utlans_skjemaer")
        .insert({ user_id: userRes.user.id })
        .select("id")
        .single();
      if (error || !data) {
        toast({ title: "Feil", description: error?.message ?? "Kunne ikke opprette", variant: "destructive" });
        return;
      }
      navigate(`/utlansskjema/${data.id}`);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("utlans_skjemaer").delete().eq("id", id);
    if (error) {
      toast({ title: "Feil ved sletting", description: error.message, variant: "destructive" });
      return;
    }
    setRows((r) => r.filter((x) => x.id !== id));
    toast({ title: "Slettet" });
  };

  const handleDownload = async (id: string) => {
    setDownloadingId(id);
    try {
      const { data: row, error } = await supabase
        .from("utlans_skjemaer")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error || !row) {
        toast({ title: "Feil", description: error?.message ?? "Fant ikke skjema", variant: "destructive" });
        return;
      }
      const data = fromRow(row);
      const bytes = await generateUtlansPdf(data);
      const safe = (data.laantakerNavn || data.utlaantGjenstand || "utlaan").replace(/[^a-zA-Z0-9-_]/g, "_");
      downloadPdf(bytes, `Utlansskjema_${safe}_${data.datoSted || new Date().toISOString().slice(0, 10)}.pdf`);
      toast({ title: "PDF lastet ned" });
    } catch (e) {
      console.error(e);
      toast({ title: "Feil", description: "Kunne ikke generere PDF.", variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <TooltipProvider>
    <div className="min-h-screen bg-background pb-24">
      <CategoryHeader title="Utlånsskjema" subtitle="Avtale om utlån av utstyr" />
      <main className="mx-auto max-w-2xl space-y-4 px-5 py-6">
        <button onClick={goBack} className="flex items-center gap-1.5 font-body text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Tilbake
        </button>

        <Button onClick={handleNew} disabled={creating} className="w-full gap-2"><Plus className="h-4 w-4" /> Nytt utlånsskjema</Button>

        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Laster…</p>
        ) : rows.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Ingen skjemaer enda. Opprett ett med knappen over.</CardContent></Card>
        ) : (
          (() => {
            const awaiting = rows.filter((r) => r.status === "awaiting_owner_loan" || r.status === "awaiting_owner_return");
            const ongoing = rows.filter((r) => r.status !== "returned" && !awaiting.includes(r));
            const history = rows.filter((r) => r.status === "returned");

            const renderCard = (r: Row) => {
              const meta = statusMeta[r.status] ?? statusMeta.draft;
              const Icon = meta.icon;
              const period = r.dato_fra || r.dato_til
                ? `${r.dato_fra ?? "…"} → ${r.dato_til ?? "…"}`
                : null;
              return (
                <Card key={r.id} className="transition hover:shadow-md">
                  <CardContent className="flex items-start gap-3 p-4">
                    <button className="flex-1 text-left" onClick={() => navigate(`/utlansskjema/${r.id}`)}>
                      <div className="mb-1 flex items-center gap-2">
                        <Badge className={`${meta.className} border-0 gap-1`}><Icon className="h-3 w-3" />{meta.label}</Badge>
                      </div>
                      <div className="font-medium">{r.laantaker_navn || <span className="text-muted-foreground italic">Uten navn</span>}</div>
                      <div className="text-sm text-muted-foreground">{r.utlaant_gjenstand || "—"}</div>
                      {period && <div className="mt-0.5 text-xs text-muted-foreground">{period}</div>}
                    </button>
                    <div className="flex flex-col gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Last ned PDF"
                            disabled={downloadingId === r.id}
                            onClick={() => handleDownload(r.id)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {downloadingId === r.id ? (
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p>Last ned PDF</p>
                        </TooltipContent>
                      </Tooltip>
                      {isAdmin && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Slette skjema?</AlertDialogTitle>
                              <AlertDialogDescription>Dette kan ikke angres.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Avbryt</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(r.id)}>Slett</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            };

            return (
              <div className="space-y-6">
                {isOwner && awaiting.length > 0 && (
                  <section className="space-y-2">
                    <h2 className="px-1 text-sm font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-300">
                      Til signering <span className="ml-1 text-xs font-normal">({awaiting.length})</span>
                    </h2>
                    <div className="space-y-3">{awaiting.map(renderCard)}</div>
                  </section>
                )}

                <section className="space-y-2">
                  <h2 className="px-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Pågående utlån {(ongoing.length + (isOwner ? 0 : awaiting.length)) > 0 && <span className="ml-1 text-xs font-normal">({ongoing.length + (isOwner ? 0 : awaiting.length)})</span>}
                  </h2>
                  {ongoing.length === 0 && (isOwner || awaiting.length === 0) ? (
                    <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Ingen pågående utlån.</CardContent></Card>
                  ) : (
                    <div className="space-y-3">
                      {!isOwner && awaiting.map(renderCard)}
                      {ongoing.map(renderCard)}
                    </div>
                  )}
                </section>

                <section className="space-y-2">
                  <h2 className="px-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Historikk {history.length > 0 && <span className="ml-1 text-xs font-normal">({history.length})</span>}
                  </h2>
                  {history.length === 0 ? (
                    <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Ingen innleverte skjemaer enda.</CardContent></Card>
                  ) : (
                    <div className="space-y-3">{history.map(renderCard)}</div>
                  )}
                </section>
              </div>
            );
          })()

        )}
      </main>
    </div>
    </TooltipProvider>
  );
};

export default UtlansList;
