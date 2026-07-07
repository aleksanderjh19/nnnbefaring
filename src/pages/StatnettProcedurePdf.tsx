import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertCircle, Download, ExternalLink, Loader2 } from "lucide-react";
import CategoryHeader from "@/components/CategoryHeader";
import { statnettProcedures } from "@/data/statnettProcedures";
import { supabase } from "@/integrations/supabase/client";

const StatnettProcedurePdf = () => {
  const { sdokId } = useParams<{ sdokId: string }>();
  const decodedSdokId = decodeURIComponent(sdokId ?? "");
  const procedure = useMemo(
    () => statnettProcedures.find((p) => p.sdokId === decodedSdokId),
    [decodedSdokId],
  );
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = procedure ? `${procedure.sdokId} – PDF` : "PDF ikke funnet";
  }, [procedure]);

  useEffect(() => {
    if (!procedure) return;

    let objectUrl: string | null = null;
    let cancelled = false;

    const loadPdf = async () => {
      setError(null);
      setPdfUrl(null);
      const { data, error: storageError } = await supabase.storage
        .from("statnett-drone-docs")
        .download(procedure.pdfPath);

      if (cancelled) return;

      if (storageError || !data) {
        setError(storageError?.message ?? "Kunne ikke hente PDF-dokumentet.");
        return;
      }

      objectUrl = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
      setPdfUrl(objectUrl);
    };

    loadPdf();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [procedure]);

  if (!procedure) {
    return (
      <div className="min-h-screen bg-background">
        <CategoryHeader title="PDF ikke funnet" subtitle="Dokumentet finnes ikke i prosedyrelisten" backTo="/drone/prosedyrer" />
        <main className="mx-auto max-w-2xl px-5 py-6">
          <Link to="/drone/prosedyrer" className="font-display text-sm font-bold text-primary">
            Tilbake til Statnett-prosedyrer
          </Link>
        </main>
      </div>
    );
  }

  const fileName = `${procedure.sdokId}.pdf`;

  return (
    <div className="min-h-screen bg-background">
      <CategoryHeader title={procedure.sdokId} subtitle={procedure.title} backTo="/drone/prosedyrer" />
      <main className="mx-auto max-w-5xl px-3 py-4 sm:px-5 sm:py-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {pdfUrl && (
            <>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 font-display text-xs font-bold text-primary transition-colors hover:bg-primary/10"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Åpne i nettleser
              </a>
              <a
                href={pdfUrl}
                download={fileName}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 font-display text-xs font-bold text-foreground transition-colors hover:bg-secondary"
              >
                <Download className="h-3.5 w-3.5" />
                Last ned
              </a>
            </>
          )}
        </div>

        {error ? (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="font-body text-sm">{error}</p>
          </div>
        ) : pdfUrl ? (
          <iframe
            src={pdfUrl}
            title={procedure.title}
            className="h-[calc(100dvh-190px)] min-h-[520px] w-full rounded-lg border border-border bg-card"
          />
        ) : (
          <div className="flex h-[55vh] min-h-[360px] items-center justify-center rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 font-body text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Laster PDF…
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StatnettProcedurePdf;