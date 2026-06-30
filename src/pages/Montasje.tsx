import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Search, Wrench } from "lucide-react";
import CategoryHeader from "@/components/CategoryHeader";
import { montasjeGuides } from "@/data/montasjeGuides";

const Montasje = () => {
  useEffect(() => { document.title = "Montasjeveiledninger – Statnett"; }, []);
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const filtered = montasjeGuides.filter((g) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        g.title.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q)
      );
    });
    return filtered.reduce<Record<string, typeof montasjeGuides>>((acc, g) => {
      (acc[g.category] ??= []).push(g);
      return acc;
    }, {});
  }, [query]);

  const categories = Object.keys(grouped).sort();

  return (
    <div className="min-h-screen bg-background">
      <CategoryHeader
        title="Montasjeveiledninger"
        subtitle="Huskelister og fremgangsmåter for korrekt montering av utstyr"
        backTo="/ledning"
      />
      <main className="mx-auto max-w-2xl px-5 py-6 space-y-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Søk etter veiledning…"
            className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {categories.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 px-5 py-10 text-center">
            <p className="font-body text-sm text-muted-foreground">
              Ingen veiledninger funnet
            </p>
          </div>
        ) : (
          categories.map((cat) => (
            <section key={cat}>
              <h2 className="mb-3 font-display text-xs font-bold uppercase tracking-widest text-statnett">
                {cat}
              </h2>
              <div className="space-y-3">
                {grouped[cat].map((guide) => (
                  <button
                    key={guide.id}
                    onClick={() => navigate(`/ledning/montasje/${guide.id}`)}
                    className="group flex w-full items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 text-left transition-colors hover:bg-secondary"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                      <Wrench className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-sm font-bold text-foreground">
                        {guide.title}
                      </p>
                      <p className="font-body text-xs text-muted-foreground">
                        {guide.description}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
};

export default Montasje;
