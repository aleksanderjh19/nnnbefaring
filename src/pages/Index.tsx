import { useState, useMemo, useRef, useCallback } from "react";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { lines, getMastNumbers } from "@/data/lines";
import { useInspectionState } from "@/hooks/useInspectionState";
import { MastRow } from "@/components/MastRow";
import { ProgressBar } from "@/components/ProgressBar";

type FilterMode = "alle" | "utfort" | "ikke-utfort";

const Index = () => {
  const [selectedLine, setSelectedLine] = useState(lines[0].id);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("alle");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isChecked, toggle, bulkSet, getLineStats, getTotalStats } = useInspectionState();

  // Drag-to-select state
  const isDragging = useRef(false);
  const dragTargetValue = useRef<boolean>(true);
  const draggedMasts = useRef<Set<number>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);

  const currentLine = lines.find((l) => l.id === selectedLine)!;
  const mastNumbers = useMemo(() => getMastNumbers(currentLine), [currentLine]);

  const linesWithCounts = useMemo(
    () => lines.map((l) => ({ id: l.id, count: getMastNumbers(l).length })),
    []
  );
  const totalStats = getTotalStats(linesWithCounts);
  const lineStats = getLineStats(currentLine.id, mastNumbers.length);

  const filteredMasts = useMemo(() => {
    let result = mastNumbers;

    if (search.trim()) {
      const q = search.trim();
      result = result.filter((m) => String(m).includes(q));
    }

    if (filter === "utfort") {
      result = result.filter((m) => isChecked(currentLine.id, m));
    } else if (filter === "ikke-utfort") {
      result = result.filter((m) => !isChecked(currentLine.id, m));
    }

    return result;
  }, [mastNumbers, search, filter, isChecked, currentLine.id]);

  const getMastFromPoint = useCallback((x: number, y: number): number | null => {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    const row = el.closest("[data-mast]");
    if (!row) return null;
    return Number(row.getAttribute("data-mast"));
  }, []);

  const handleDragStart = useCallback(
    (mastNumber: number) => {
      isDragging.current = true;
      const currentlyChecked = isChecked(currentLine.id, mastNumber);
      dragTargetValue.current = !currentlyChecked;
      draggedMasts.current = new Set([mastNumber]);
      bulkSet(currentLine.id, [mastNumber], !currentlyChecked);
    },
    [isChecked, currentLine.id, bulkSet]
  );

  const handleDragMove = useCallback(
    (x: number, y: number) => {
      if (!isDragging.current) return;
      const mast = getMastFromPoint(x, y);
      if (mast === null || draggedMasts.current.has(mast)) return;
      draggedMasts.current.add(mast);
      bulkSet(currentLine.id, [mast], dragTargetValue.current);
    },
    [getMastFromPoint, currentLine.id, bulkSet]
  );

  const handleDragEnd = useCallback(() => {
    isDragging.current = false;
    draggedMasts.current.clear();
  }, []);

  // Mouse events
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const mast = getMastFromPoint(e.clientX, e.clientY);
      if (mast !== null) {
        e.preventDefault();
        handleDragStart(mast);
      }
    },
    [getMastFromPoint, handleDragStart]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      handleDragMove(e.clientX, e.clientY);
    },
    [handleDragMove]
  );

  // Touch events
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      const mast = getMastFromPoint(touch.clientX, touch.clientY);
      if (mast !== null) {
        handleDragStart(mast);
      }
    },
    [getMastFromPoint, handleDragStart]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      handleDragMove(touch.clientX, touch.clientY);
    },
    [handleDragMove]
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-foreground/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-border bg-card transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-border px-5 py-4">
            <h1 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              Ledningsbefaringer
            </h1>
            <p className="mt-0.5 font-body text-xs text-muted-foreground">NNN · 2026</p>
          </div>

          <div className="border-b border-border px-5 py-3">
            <ProgressBar done={totalStats.done} total={totalStats.total} percent={totalStats.percent} />
          </div>

          <nav className="flex-1 overflow-y-auto py-2">
            {lines.map((line) => {
              const masts = getMastNumbers(line);
              const stats = getLineStats(line.id, masts.length);
              const isActive = line.id === selectedLine;
              return (
                <button
                  key={line.id}
                  onClick={() => {
                    setSelectedLine(line.id);
                    setSidebarOpen(false);
                  }}
                  className={`tap-highlight-none flex w-full items-center gap-3 px-5 py-3 text-left transition-colors ${
                    isActive
                      ? "bg-primary/10 border-r-2 border-r-primary"
                      : "hover:bg-secondary"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className={`font-display text-sm font-semibold ${isActive ? "text-primary" : "text-foreground"}`}>
                      {line.name}
                    </p>
                    <p className="font-body text-xs text-muted-foreground">
                      {stats.done}/{stats.total} · {stats.percent}%
                    </p>
                  </div>
                  <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${stats.percent}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-sm">
          <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card lg:hidden"
            >
              <ChevronRight className="h-5 w-5 text-foreground" />
            </button>

            <div className="min-w-0 flex-1">
              <h2 className="font-display text-base font-bold text-foreground lg:text-lg">
                {currentLine.name}
              </h2>
              <p className="font-body text-xs text-muted-foreground">
                {lineStats.done} av {lineStats.total} master utført · Dra for å markere flere
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-border px-4 py-2 lg:px-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                inputMode="numeric"
                placeholder="Søk etter mastnr..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterMode)}
                className="h-10 appearance-none rounded-lg border border-input bg-background px-3 pr-8 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="alle">Alle</option>
                <option value="utfort">Utført</option>
                <option value="ikke-utfort">Ikke utført</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div className="px-4 pb-3 lg:px-6">
            <ProgressBar done={lineStats.done} total={lineStats.total} percent={lineStats.percent} />
          </div>
        </header>

        {/* Mast list - single column, vertical */}
        <div
          ref={listRef}
          className="flex-1 select-none px-4 py-3 lg:px-6"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={handleDragEnd}
          onTouchCancel={handleDragEnd}
        >
          <div className="mx-auto flex max-w-lg flex-col gap-1.5">
            {filteredMasts.map((mastNumber) => (
              <MastRow
                key={mastNumber}
                mastNumber={mastNumber}
                checked={isChecked(currentLine.id, mastNumber)}
                onToggle={() => toggle(currentLine.id, mastNumber)}
              />
            ))}
          </div>
          {filteredMasts.length === 0 && (
            <div className="py-16 text-center">
              <p className="font-body text-sm text-muted-foreground">
                Ingen master funnet.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
