import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertCircle, Download, Loader2 } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import CategoryHeader from "@/components/CategoryHeader";
import { statnettProcedures } from "@/data/statnettProcedures";
import { supabase } from "@/integrations/supabase/client";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

type PdfPageProps = {
  pdf: PDFDocumentProxy;
  pageNumber: number;
};

const PdfPage = ({ pdf, pageNumber }: PdfPageProps) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rendering, setRendering] = useState(true);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    let cancelled = false;
    let activeTask: RenderTask | null = null;

    const renderPage = async () => {
      try {
        setRendering(true);
        activeTask?.cancel();
        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const cssWidth = Math.max(280, Math.floor(wrapper.clientWidth));
        const scale = cssWidth / baseViewport.width;
        const viewport = page.getViewport({ scale });
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        activeTask = page.render({ canvasContext: context, viewport });
        await activeTask.promise;
        if (!cancelled) setRendering(false);
      } catch (renderError) {
        if (!cancelled && !(renderError instanceof Error && renderError.name === "RenderingCancelledException")) {
          setRendering(false);
        }
      }
    };

    renderPage();
    const resizeObserver = new ResizeObserver(() => renderPage());
    resizeObserver.observe(wrapper);

    return () => {
      cancelled = true;
      activeTask?.cancel();
      resizeObserver.disconnect();
    };
  }, [pageNumber, pdf]);

  return (
    <div ref={wrapperRef} className="relative w-full overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      {rendering && (
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-center py-8 font-body text-xs text-muted-foreground">
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          Laster side {pageNumber}…
        </div>
      )}
      <canvas ref={canvasRef} className="block w-full" />
    </div>
  );
};

const StatnettProcedurePdf = () => {
  const { sdokId } = useParams<{ sdokId: string }>();
  const decodedSdokId = decodeURIComponent(sdokId ?? "");
  const procedure = useMemo(
    () => statnettProcedures.find((p) => p.sdokId === decodedSdokId),
    [decodedSdokId],
  );
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
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
      setPdf(null);
      setPageCount(0);
      const { data, error: storageError } = await supabase.storage
        .from("statnett-drone-docs")
        .download(procedure.pdfPath);

      if (cancelled) return;

      if (storageError || !data) {
        setError(storageError?.message ?? "Kunne ikke hente PDF-dokumentet.");
        return;
      }

      objectUrl = URL.createObjectURL(data);
      setPdfUrl(objectUrl);
      const bytes = await data.arrayBuffer();
      if (cancelled) return;
      const loadedPdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      if (cancelled) {
        loadedPdf.destroy();
        return;
      }
      setPdf(loadedPdf);
      setPageCount(loadedPdf.numPages);
    };

    loadPdf();

    return () => {
      cancelled = true;
      setPdf(null);
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
            <a
              href={pdfUrl}
              download={fileName}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 font-display text-xs font-bold text-foreground transition-colors hover:bg-secondary"
            >
              <Download className="h-3.5 w-3.5" />
              Last ned
            </a>
          )}
        </div>

        {error ? (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="font-body text-sm">{error}</p>
          </div>
        ) : pdf ? (
          <div className="space-y-4">
            {Array.from({ length: pageCount }, (_, index) => (
              <PdfPage key={index + 1} pdf={pdf} pageNumber={index + 1} />
            ))}
          </div>
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