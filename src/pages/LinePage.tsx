import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Search, ChevronDown, ArrowLeft, Plus, Trash2, X, Pencil, Check } from "lucide-react";
import { getMastNumbers } from "@/data/lines";
import { useInspectionState } from "@/hooks/useInspectionState";
import { useLines } from "@/hooks/useLines.tsx";
import { MastRow } from "@/components/MastRow";
import { ProgressBar } from "@/components/ProgressBar";

type FilterMode = "alle" | "utfort" | "ikke-utfort";

const LinePage = () => {
  const { lineId } = useParams<{ lineId: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("alle");
  const { isChecked, toggle, bulkSet, getLineStats, isViewingPrevious } = useInspectionState();
  const { lines, editMode, addMasts, removeMasts, updateLine } = useLines();

  // Pending selection state (two-step confirm)
  const [pendingSelection, setPendingSelection] = useState<Set<number>>(new Set());
  const pendingAction = useRef<"check" | "uncheck">("check");

  // Edit mode state
  const [addInput, setAddInput] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedForRemoval, setSelectedForRemoval] = useState<Set<number>>(new Set());
  const [renamingField, setRenamingField] = useState<"name" | "description" | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const currentLine = lines.find((l) => l.id === lineId);
  const safeLineId = currentLine?.id ?? "";

  useEffect(() => {
    document.title = currentLine ? `${currentLine.name} – Befaring` : "Linje – Befaring";
  }, [currentLine]);

  const isDragging = useRef(false);
  const dragTargetValue = useRef<boolean>(true);
  const draggedMasts = useRef<Set<number>>(new Set());

  // Touch hold-to-drag: distinguish scroll from select
  const touchHoldTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchActivated = useRef(false); // true once hold threshold passed

  const mastNumbers = useMemo(() => (currentLine ? getMastNumbers(currentLine) : []), [currentLine]);
  const lineStats = getLineStats(safeLineId, mastNumbers.length);

  const filteredMasts = useMemo(() => {
    let result = mastNumbers;
    if (search.trim()) {
      result = result.filter((m) => String(m).includes(search.trim()));
    }
    if (filter === "utfort") {
      result = result.filter((m) => isChecked(safeLineId, m));
    } else if (filter === "ikke-utfort") {
      result = result.filter((m) => !isChecked(safeLineId, m));
    }
    return result;
  }, [mastNumbers, search, filter, isChecked, safeLineId]);

  const getMastFromPoint = useCallback((x: number, y: number): number | null => {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    const row = el.closest("[data-mast]");
    if (!row) return null;
    return Number(row.getAttribute("data-mast"));
  }, []);

  const scrollAnimationRef = useRef<number | null>(null);
  const lastDragPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const autoScrollLoop = useCallback(() => {
    if (!isDragging.current) return;
    const y = lastDragPos.current.y;
    const edgeZone = 180;
    const maxSpeed = 24;
    const vh = window.innerHeight;

    let speed = 0;
    if (y > vh - edgeZone) {
      speed = maxSpeed * Math.min(1, (y - (vh - edgeZone)) / edgeZone);
    } else if (y < edgeZone) {
      speed = -maxSpeed * Math.min(1, (edgeZone - y) / edgeZone);
    }

    if (speed !== 0) {
      window.scrollBy(0, speed);
      const mast = getMastFromPoint(lastDragPos.current.x, lastDragPos.current.y);
      if (mast !== null && !draggedMasts.current.has(mast)) {
        draggedMasts.current.add(mast);
        if (dragTargetValue.current) {
          setPendingSelection(prev => new Set(prev).add(mast));
        } else {
          setPendingSelection(prev => { const next = new Set(prev); next.delete(mast); return next; });
        }
      }
    }

    scrollAnimationRef.current = requestAnimationFrame(autoScrollLoop);
  }, [getMastFromPoint]);

  const handleDragStart = useCallback(
    (mastNumber: number) => {
      if (editMode || isViewingPrevious) return;
      isDragging.current = true;
      const currentlyChecked = isChecked(safeLineId, mastNumber);
      const isPending = pendingSelection.has(mastNumber);
      
      if (isPending) {
        dragTargetValue.current = false;
        draggedMasts.current = new Set([mastNumber]);
        setPendingSelection(prev => { const next = new Set(prev); next.delete(mastNumber); return next; });
      } else {
        dragTargetValue.current = true;
        pendingAction.current = currentlyChecked ? "uncheck" : "check";
        draggedMasts.current = new Set([mastNumber]);
        setPendingSelection(prev => new Set(prev).add(mastNumber));
      }
      if (scrollAnimationRef.current) cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = requestAnimationFrame(autoScrollLoop);
    },
    [isChecked, safeLineId, editMode, isViewingPrevious, pendingSelection, autoScrollLoop]
  );

  const handleDragMove = useCallback(
    (x: number, y: number) => {
      if (!isDragging.current) return;
      lastDragPos.current = { x, y };
      const mast = getMastFromPoint(x, y);
      if (mast === null || draggedMasts.current.has(mast)) return;
      draggedMasts.current.add(mast);
      if (dragTargetValue.current) {
        setPendingSelection(prev => new Set(prev).add(mast));
      } else {
        setPendingSelection(prev => { const next = new Set(prev); next.delete(mast); return next; });
      }
    },
    [getMastFromPoint]
  );

  const handleDragEnd = useCallback(() => {
    isDragging.current = false;
    draggedMasts.current.clear();
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }
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

  // Touch handling with non-passive listeners for proper preventDefault
  const dragContainerRef = useRef<HTMLDivElement>(null);

  const touchStartHandler = useCallback(
    (e: TouchEvent) => {
      if (editMode || isViewingPrevious) return;
      const touch = e.touches[0];
      touchStartPos.current = { x: touch.clientX, y: touch.clientY };
      touchActivated.current = false;
      const mast = getMastFromPoint(touch.clientX, touch.clientY);
      if (mast === null) return;
      if (touchHoldTimer.current) clearTimeout(touchHoldTimer.current);
      touchHoldTimer.current = setTimeout(() => {
        touchActivated.current = true;
        handleDragStart(mast);
      }, 120);
    },
    [getMastFromPoint, handleDragStart, editMode, isViewingPrevious]
  );

  const touchMoveHandler = useCallback(
    (e: TouchEvent) => {
      const touch = e.touches[0];
      const dx = touch.clientX - touchStartPos.current.x;
      const dy = touch.clientY - touchStartPos.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (!touchActivated.current) {
        if (dist > 8) {
          if (touchHoldTimer.current) {
            clearTimeout(touchHoldTimer.current);
            touchHoldTimer.current = null;
          }
        }
        return;
      }

      // Prevent native scroll when drag-selecting
      e.preventDefault();
      handleDragMove(touch.clientX, touch.clientY);
    },
    [handleDragMove]
  );

  const touchEndHandler = useCallback(() => {
    if (touchHoldTimer.current) {
      clearTimeout(touchHoldTimer.current);
      touchHoldTimer.current = null;
    }
    if (touchActivated.current) {
      handleDragEnd();
    }
    touchActivated.current = false;
  }, [handleDragEnd]);

  // Attach non-passive touch listeners so preventDefault works on mobile
  useEffect(() => {
    const el = dragContainerRef.current;
    if (!el || editMode) return;

    el.addEventListener("touchstart", touchStartHandler, { passive: true });
    el.addEventListener("touchmove", touchMoveHandler, { passive: false });
    el.addEventListener("touchend", touchEndHandler, { passive: true });
    el.addEventListener("touchcancel", touchEndHandler, { passive: true });

    return () => {
      el.removeEventListener("touchstart", touchStartHandler);
      el.removeEventListener("touchmove", touchMoveHandler);
      el.removeEventListener("touchend", touchEndHandler);
      el.removeEventListener("touchcancel", touchEndHandler);
    };
  }, [editMode, touchStartHandler, touchMoveHandler, touchEndHandler]);

  // Parse range input like "1-5, 8, 10-12"
  const parseRangeInput = (input: string): number[] => {
    const result: number[] = [];
    const parts = input.split(",").map((s) => s.trim()).filter(Boolean);
    for (const part of parts) {
      if (part.includes("-")) {
        const [startStr, endStr] = part.split("-").map((s) => s.trim());
        const start = parseInt(startStr);
        const end = parseInt(endStr);
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) result.push(i);
        }
      } else {
        const num = parseInt(part);
        if (!isNaN(num)) result.push(num);
      }
    }
    return result;
  };

  const handleAddMasts = () => {
    if (!addInput.trim() || !currentLine) return;
    const newMasts = parseRangeInput(addInput);
    if (newMasts.length > 0) {
      addMasts(currentLine.id, newMasts);
      setAddInput("");
      setShowAddForm(false);
    }
  };

  const toggleRemovalSelection = (mastNumber: number) => {
    setSelectedForRemoval((prev) => {
      const next = new Set(prev);
      if (next.has(mastNumber)) {
        next.delete(mastNumber);
      } else {
        next.add(mastNumber);
      }
      return next;
    });
  };

  const handleRemoveSelected = () => {
    if (!currentLine || selectedForRemoval.size === 0) return;
    removeMasts(currentLine.id, Array.from(selectedForRemoval));
    setSelectedForRemoval(new Set());
  };

  if (!currentLine) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Linje ikke funnet.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => navigate("/ledningsbefaring")}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <div className="min-w-0 flex-1">
              {renamingField === "name" ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => {
                    if (renameValue.trim()) updateLine(currentLine.id, { name: renameValue.trim() });
                    setRenamingField(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { if (renameValue.trim()) updateLine(currentLine.id, { name: renameValue.trim() }); setRenamingField(null); }
                    if (e.key === "Escape") setRenamingField(null);
                  }}
                  className="w-full rounded border border-input bg-background px-2 py-1 font-display text-base font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring lg:text-lg"
                />
              ) : (
                <div className="flex items-center gap-1.5">
                  <h2 className="font-display text-base font-bold text-foreground lg:text-lg">
                    {currentLine.name}
                  </h2>
                  {editMode && (
                    <button
                      onClick={() => { setRenamingField("name"); setRenameValue(currentLine.name); }}
                      className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}
              {renamingField === "description" ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => {
                    if (renameValue.trim()) updateLine(currentLine.id, { description: renameValue.trim() });
                    setRenamingField(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { if (renameValue.trim()) updateLine(currentLine.id, { description: renameValue.trim() }); setRenamingField(null); }
                    if (e.key === "Escape") setRenamingField(null);
                  }}
                  className="w-full rounded border border-input bg-background px-2 py-0.5 font-body text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              ) : (
                <div className="flex items-center gap-1.5">
                  <p className="font-body text-xs text-muted-foreground">
                    {currentLine.description} · {lineStats.done}/{lineStats.total} utført
                  </p>
                  {editMode && (
                    <button
                      onClick={() => { setRenamingField("description"); setRenameValue(currentLine.description); }}
                      className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Edit mode toolbar */}
          {editMode && (
            <div className="mx-4 mb-2 space-y-2">
              <div className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-2">
                <p className="font-body text-xs font-medium text-accent">
                  Redigeringsmodus — velg master for å fjerne, eller legg til nye.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 font-body text-xs font-medium text-primary hover:bg-primary/5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Legg til master
                </button>
                {selectedForRemoval.size > 0 && (
                  <button
                    onClick={handleRemoveSelected}
                    className="flex h-9 items-center gap-1.5 rounded-lg bg-destructive px-3 font-body text-xs font-medium text-destructive-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Fjern {selectedForRemoval.size} valgte
                  </button>
                )}
                {selectedForRemoval.size > 0 && (
                  <button
                    onClick={() => setSelectedForRemoval(new Set())}
                    className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 font-body text-xs text-muted-foreground hover:bg-secondary"
                  >
                    <X className="h-3.5 w-3.5" />
                    Avbryt
                  </button>
                )}
              </div>
              {showAddForm && (
                <div className="rounded-lg border border-border bg-card p-3">
                  <label className="mb-1 block font-body text-xs text-muted-foreground">
                    Skriv mastnummer (f.eks. «5» eller «1-5, 8, 10-12»)
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={addInput}
                      onChange={(e) => setAddInput(e.target.value)}
                      placeholder="1-5, 8, 10-12"
                      onKeyDown={(e) => e.key === "Enter" && handleAddMasts()}
                      className="h-10 flex-1 rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                      onClick={handleAddMasts}
                      disabled={!addInput.trim()}
                      className="h-10 rounded-lg bg-primary px-4 font-body text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      Legg til
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

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

      {/* Pending confirmation bar - fixed at bottom */}
      {pendingSelection.size > 0 && !editMode && (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-border bg-card/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3 mb-10 sm:mb-0">
            <p className="font-body text-sm text-muted-foreground">
              {pendingSelection.size} mast{pendingSelection.size > 1 ? "er" : ""} valgt
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPendingSelection(new Set())}
                className="flex h-10 items-center gap-1.5 rounded-lg border border-border bg-card px-4 font-body text-sm text-muted-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" />
                Avbryt
              </button>
              <button
                onClick={() => {
                  const mastsArr = Array.from(pendingSelection);
                  const firstMast = mastsArr[0];
                  const shouldCheck = !isChecked(safeLineId, firstMast);
                  bulkSet(safeLineId, mastsArr, shouldCheck);
                  setPendingSelection(new Set());
                }}
                className="flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 font-body text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Check className="h-4 w-4" />
                Bekreft
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        ref={dragContainerRef}
        className={`flex-1 select-none px-4 py-3 ${pendingSelection.size > 0 && !editMode ? "pb-24" : "pb-3"}`}
        onMouseDown={editMode ? undefined : onMouseDown}
        onMouseMove={editMode ? undefined : onMouseMove}
        onMouseUp={editMode ? undefined : handleDragEnd}
        onMouseLeave={editMode ? undefined : handleDragEnd}
      >
        <div className="mx-auto flex max-w-lg flex-col gap-1.5">
          {filteredMasts.map((mastNumber) => (
            editMode ? (
              <EditMastRow
                key={mastNumber}
                mastNumber={mastNumber}
                selected={selectedForRemoval.has(mastNumber)}
                onToggle={() => toggleRemovalSelection(mastNumber)}
              />
            ) : (
              <MastRow
                key={mastNumber}
                mastNumber={mastNumber}
                checked={isChecked(currentLine.id, mastNumber)}
                pending={pendingSelection.has(mastNumber)}
                onToggle={() => toggle(currentLine.id, mastNumber)}
              />
            )
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

function EditMastRow({ mastNumber, selected, onToggle }: { mastNumber: number; selected: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      data-mast={mastNumber}
      className={`tap-highlight-none flex w-full items-center justify-between rounded-lg border px-4 py-3 transition-colors duration-100 ${
        selected
          ? "border-destructive/40 bg-destructive/10"
          : "border-border bg-card hover:bg-secondary"
      }`}
    >
      <span className="pointer-events-none font-display text-sm font-semibold tracking-tight text-foreground">
        MAST {mastNumber}
      </span>
      <div
        className={`pointer-events-none flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-all duration-100 ${
          selected
            ? "bg-destructive"
            : "border-2 border-muted bg-card"
        }`}
      >
        {selected && <Trash2 className="h-4 w-4 text-destructive-foreground" />}
      </div>
    </button>
  );
}


export default LinePage;
