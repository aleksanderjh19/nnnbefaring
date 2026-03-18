import { useNavigate } from "react-router-dom";
import { ChevronRight, Zap } from "lucide-react";
import { lines, lineGroups, getMastNumbers } from "@/data/lines";
import { useInspectionState } from "@/hooks/useInspectionState";
import { ProgressBar } from "@/components/ProgressBar";
import { useMemo } from "react";

const Home = () => {
  const navigate = useNavigate();
  const { getLineStats, getTotalStats } = useInspectionState();

  const linesWithCounts = useMemo(
    () => lines.map((l) => ({ id: l.id, count: getMastNumbers(l).length })),
    []
  );
  const totalStats = getTotalStats(linesWithCounts);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-2xl px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-xl font-extrabold tracking-tight text-foreground">
                Ledningsbefaringer
              </h1>
              <p className="font-body text-xs text-muted-foreground">NNN · 2026</p>
            </div>
          </div>
          <div className="mt-4">
            <ProgressBar done={totalStats.done} total={totalStats.total} percent={totalStats.percent} />
          </div>
        </div>
      </header>

      {/* Line groups */}
      <main className="mx-auto max-w-2xl px-5 py-5">
        <p className="mb-5 font-body text-sm text-muted-foreground">
          Velg en linje for å starte befaring.
        </p>

        <div className="space-y-6">
          {lineGroups.map((group) => {
            const groupLines = lines.filter((l) => l.group === group.name);
            if (groupLines.length === 0) return null;

            return (
              <section key={group.name}>
                <h2 className="mb-2 font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {group.label}
                </h2>
                <div className="space-y-2">
                  {groupLines.map((line) => {
                    const masts = getMastNumbers(line);
                    const stats = getLineStats(line.id, masts.length);

                    return (
                      <button
                        key={line.id}
                        onClick={() => navigate(`/linje/${line.id}`)}
                        className="tap-highlight-none flex w-full items-center gap-4 rounded-xl border border-border bg-card px-4 py-4 text-left transition-colors hover:bg-secondary active:scale-[0.99]"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-sm font-bold text-foreground">
                            {line.name}
                          </p>
                          <p className="font-body text-xs text-muted-foreground">
                            {line.description}
                          </p>
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-[11px] font-body text-muted-foreground">
                              <span>{stats.done}/{stats.total} master</span>
                              <span className="font-semibold text-foreground">{stats.percent}%</span>
                            </div>
                            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary transition-all duration-300"
                                style={{ width: `${stats.percent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Home;
