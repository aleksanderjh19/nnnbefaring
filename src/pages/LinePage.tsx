import { useState, useMemo, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Search, ChevronDown, ArrowLeft } from "lucide-react";
import { lines, getMastNumbers } from "@/data/lines";
import { useInspectionState } from "@/hooks/useInspectionState";
import { MastRow } from "@/components/MastRow";
import { ProgressBar } from "@/components/ProgressBar";

type FilterMode = "alle" | "utfort" | "ikke-utfort";

const LinePage = () => {
  const { lineId } = useParams<{ lineId: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("alle");
  const { isChecked, toggle, bulkSet, getLineStats } = useInspectionState();

  const currentLine = lines.find((l) => l.id === lineId);

  // Drag-to-select state
  const isDragging = useRef(false);
  const dragTargetValue = useRef<boolean>(true);
  const draggedMasts = useRef<Set<number>>(new Set());

  if (!currentLine) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Linje ikke funnet.</p>
      </div>
    );
  }

  const mastNumbers = getMastNumbers(currentLine);
  const lineStats = getLineStats(currentLine.id, mastNumbers.length);

  const filteredMasts = useMemo(() => {
    let result = mastNumbers;
    if (search.trim()) {
      result = result.filter((m) => String(m).includes(search.trim()));
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
    (e: React.MouseEvent) => handleDragMove(e.clientX, e.clientY),
    [handleDragMove]
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      const mast = getMastFromPoint(touch.clientX, touch.clientY);
      if (mast !== null) handleDragStart(mast);
    },
    [getMastFromPoint, handleDragStart]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
    },
    [handleDragMove]
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => navigate("/")}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-base font-bold text-foreground lg:text-lg">
                {currentLine.name}
              </h2>
              <p className="font-body text-xs text-muted-foreground">
                {currentLine.description} · {lineStats.done}/{lineStats.total} utført
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-border px-4 py-2">
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

          <div className="px-4 pb-3">
            <ProgressBar done={lineStats.done} total={lineStats.total} percent={lineStats.percent} />
          </div>
        </div>
      </header>

      {/* Mast list */}
      <div
        className="flex-1 select-none px-4 py-3"
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
            <p className="font-body text-sm text-muted-foreground">Ingen master funnet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LinePage;
