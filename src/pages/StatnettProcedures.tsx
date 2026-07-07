import { useEffect, useMemo, useState } from "react";
import { FileText, Search, ExternalLink, Loader2 } from "lucide-react";
import CategoryHeader from "@/components/CategoryHeader";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  statnettProcedures,
  THEME_LABELS,
  type ProcedureTheme,
  type StatnettProcedure,
} from "@/data/statnettProcedures";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const THEME_ORDER: ProcedureTheme[] = [
  "manual",
  "sop",
  "normale",
  "beredskap",
  "nod",
  "vedlikehold",
  "sora-bvlos",
  "roller",
  "gdpr",
  "miljo",
  "sjekkliste",
];

const StatnettProcedures = () => {
  useEffect(() => {
    document.title = "Statnett-prosedyrer – Drone";
  }, []);

  const [query, setQuery] = useState("");
  const [activeTheme, setActiveTheme] = useState<ProcedureTheme | "all">("all");
  const [loadingPdf, setLoadingPdf] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return statnettProcedures.filter((p) => {
      if (activeTheme !== "all" && !p.themes.includes(activeTheme)) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.sdokId.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.keyPoints.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [query, activeTheme]);

  const grouped = useMemo(() => {
    const map = new Map<ProcedureTheme, StatnettProcedure[]>();
    for (const theme of THEME_ORDER) map.set(theme, []);
    for (const p of filtered) {
      // Assign each procedure to its primary theme (first in list)
      const primary = p.themes[0] ?? "manual";
      const bucket = map.get(primary) ?? [];
      bucket.push(p);
      map.set(primary, bucket);
    }
    return Array.from(map.entries()).filter(([, arr]) => arr.length > 0);
  }, [filtered]);

  const openPdf = async (p: StatnettProcedure) => {
    setLoadingPdf(p.sdokId);
    try {
      // Last ned som blob og åpne via blob:-URL. Dette unngår at sporingsvern/
      // annonseblokkere i nettleseren blokkerer direkte signerte Supabase-URL-er.
      const { data, error } = await supabase.storage
        .from("statnett-drone-docs")
        .download(p.pdfPath);
      if (error || !data) throw error ?? new Error("Kunne ikke hente PDF");
      const blob = new Blob([data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank", "noopener,noreferrer");
      if (!win) {
        // Popup blokkert – tving nedlasting i stedet
        const a = document.createElement("a");
        a.href = url;
        a.download = `${p.sdokId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      // Rydd opp blob-URL etter litt tid
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      toast.error("Kunne ikke åpne PDF", {
        description: e instanceof Error ? e.message : "Ukjent feil",
      });
    } finally {
      setLoadingPdf(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <CategoryHeader
        title="Statnett-prosedyrer"
        subtitle="Interne prosedyrer og instrukser for droneoperasjoner i Statnett"
        backTo="/drone/regler"
      />
      <main className="mx-auto max-w-2xl px-5 py-6 space-y-5">
        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Søk i prosedyrer, SDOK-ID eller innhold…"
            className="pl-9"
          />
        </div>

        {/* Theme chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTheme("all")}
            className={`rounded-full border px-3 py-1 font-display text-xs font-bold transition-colors ${
              activeTheme === "all"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-secondary"
            }`}
          >
            Alle ({statnettProcedures.length})
          </button>
          {THEME_ORDER.map((t) => {
            const count = statnettProcedures.filter((p) => p.themes.includes(t)).length;
            if (count === 0) return null;
            return (
              <button
                key={t}
                onClick={() => setActiveTheme(t)}
                className={`rounded-full border px-3 py-1 font-display text-xs font-bold transition-colors ${
                  activeTheme === t
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-secondary"
                }`}
              >
                {THEME_LABELS[t]} ({count})
              </button>
            );
          })}
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-5 py-8 text-center">
            <p className="font-body text-sm text-muted-foreground">
              Ingen prosedyrer matchet søket.
            </p>
          </div>
        ) : (
          grouped.map(([theme, procs]) => (
            <section key={theme}>
              <h2 className="mb-3 font-display text-xs font-bold uppercase tracking-widest text-statnett">
                {THEME_LABELS[theme]}
              </h2>
              <Accordion type="multiple" className="space-y-2">
                {procs.map((p) => (
                  <AccordionItem
                    key={p.sdokId}
                    value={p.sdokId}
                    className="overflow-hidden rounded-xl border border-border bg-card"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 shrink-0 text-primary" />
                          <span className="font-display text-sm font-bold text-foreground">
                            {p.title}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-6 font-body text-[11px] text-muted-foreground">
                          <span>{p.sdokId}</span>
                          <span>Rev. {p.revision}</span>
                          {p.approvedDate && <span>Godkjent {p.approvedDate}</span>}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <p className="mb-3 font-body text-sm text-foreground">{p.summary}</p>
                      {p.keyPoints.length > 0 && (
                        <ul className="mb-3 space-y-2">
                          {p.keyPoints.map((k, i) => (
                            <li key={i} className="flex gap-2 font-body text-sm text-foreground">
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                              <span>{k}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {p.themes.length > 1 && (
                        <div className="mb-3 flex flex-wrap gap-1.5">
                          {p.themes.map((t) => (
                            <Badge key={t} variant="secondary" className="font-body text-[10px]">
                              {THEME_LABELS[t]}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => openPdf(p)}
                        disabled={loadingPdf === p.sdokId}
                        className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 font-display text-xs font-bold text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
                      >
                        {loadingPdf === p.sdokId ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ExternalLink className="h-3.5 w-3.5" />
                        )}
                        Åpne PDF
                      </button>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))
        )}

        <div className="rounded-xl border border-border bg-card/50 px-4 py-3">
          <p className="font-body text-xs text-muted-foreground">
            Kilde: Statnett interne styrende dokumenter (SDOK). Ved tvil skal originaldokumentet fra
            Statnetts styrende dokumentsystem legges til grunn.
          </p>
        </div>
      </main>
    </div>
  );
};

export default StatnettProcedures;
