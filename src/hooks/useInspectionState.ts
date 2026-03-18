import { useState, useCallback, useEffect } from "react";

const YEAR_KEY = "mast-current-year";
const ARCHIVE_KEY_PREFIX = "mast-inspection-";

function getActiveYear(): number {
  try {
    const saved = localStorage.getItem(YEAR_KEY);
    if (saved) {
      const y = parseInt(saved);
      // Reset to 2026 if somehow advanced beyond current real year
      if (y > 2026) {
        localStorage.setItem(YEAR_KEY, "2026");
        return 2026;
      }
      return y;
    }
  } catch {}
  return new Date().getFullYear();
}

function storageKey(year: number) {
  return `${ARCHIVE_KEY_PREFIX}${year}`;
}

function loadState(year: number): InspectionState {
  try {
    const saved = localStorage.getItem(storageKey(year));
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

type InspectionState = Record<string, Record<number, boolean>>;

export function useInspectionState() {
  const [activeYear] = useState(getActiveYear); // the "current" working year
  const [viewingYear, setViewingYear] = useState(getActiveYear);
  const [state, setState] = useState<InspectionState>(() => loadState(getActiveYear()));

  const isViewingPrevious = viewingYear < activeYear;

  // When viewingYear changes, load that year's data
  useEffect(() => {
    setState(loadState(viewingYear));
  }, [viewingYear]);

  // Only persist if viewing the active year
  useEffect(() => {
    if (!isViewingPrevious) {
      localStorage.setItem(storageKey(viewingYear), JSON.stringify(state));
    }
  }, [state, viewingYear, isViewingPrevious]);

  useEffect(() => {
    localStorage.setItem(YEAR_KEY, String(activeYear));
  }, [activeYear]);

  const isChecked = useCallback(
    (lineId: string, mastNumber: number) => {
      return state[lineId]?.[mastNumber] ?? false;
    },
    [state]
  );

  const toggle = useCallback((lineId: string, mastNumber: number) => {
    if (isViewingPrevious) return; // read-only
    setState((prev) => {
      const lineState = prev[lineId] ?? {};
      return {
        ...prev,
        [lineId]: {
          ...lineState,
          [mastNumber]: !lineState[mastNumber],
        },
      };
    });
  }, [isViewingPrevious]);

  const bulkSet = useCallback((lineId: string, mastNumbers: number[], value: boolean) => {
    if (isViewingPrevious) return; // read-only
    setState((prev) => {
      const lineState = { ...(prev[lineId] ?? {}) };
      for (const m of mastNumbers) {
        lineState[m] = value;
      }
      return { ...prev, [lineId]: lineState };
    });
  }, [isViewingPrevious]);

  const getLineStats = useCallback(
    (lineId: string, totalMasts: number) => {
      const lineState = state[lineId] ?? {};
      const done = Object.values(lineState).filter(Boolean).length;
      return { done, total: totalMasts, percent: totalMasts > 0 ? Math.round((done / totalMasts) * 100) : 0 };
    },
    [state]
  );

  const getTotalStats = useCallback(
    (linesData: { id: string; count: number }[]) => {
      let totalDone = 0;
      let totalMasts = 0;
      for (const line of linesData) {
        const lineState = state[line.id] ?? {};
        totalDone += Object.values(lineState).filter(Boolean).length;
        totalMasts += line.count;
      }
      return { done: totalDone, total: totalMasts, percent: totalMasts > 0 ? Math.round((totalDone / totalMasts) * 100) : 0 };
    },
    [state]
  );

  const advanceYear = useCallback(() => {
    const prevPrevYear = activeYear - 1;
    // Delete 2+ years old data (only keep 1 year back)
    try { localStorage.removeItem(storageKey(prevPrevYear)); } catch {}
    // Current data is already saved; advance
    const newYear = activeYear + 1;
    localStorage.setItem(YEAR_KEY, String(newYear));
    // Force reload to pick up new year
    window.location.reload();
  }, [activeYear]);

  const hasPreviousYear = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey(activeYear - 1));
      return saved !== null;
    } catch { return false; }
  }, [activeYear]);

  const viewPreviousYear = useCallback(() => {
    setViewingYear(activeYear - 1);
  }, [activeYear]);

  const viewCurrentYear = useCallback(() => {
    setViewingYear(activeYear);
  }, [activeYear]);

  return {
    isChecked, toggle, bulkSet, getLineStats, getTotalStats,
    year: viewingYear, activeYear, isViewingPrevious,
    advanceYear, hasPreviousYear, viewPreviousYear, viewCurrentYear,
  };
}
