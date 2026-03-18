import { useState, useCallback, useEffect } from "react";

const YEAR_KEY = "mast-current-year";
const ARCHIVE_KEY_PREFIX = "mast-inspection-";

function getCurrentYear(): number {
  try {
    const saved = localStorage.getItem(YEAR_KEY);
    if (saved) return parseInt(saved);
  } catch {}
  return new Date().getFullYear();
}

function storageKey(year: number) {
  return `${ARCHIVE_KEY_PREFIX}${year}`;
}

type InspectionState = Record<string, Record<number, boolean>>;

export function useInspectionState() {
  const [year, setYear] = useState(getCurrentYear);
  const [state, setState] = useState<InspectionState>(() => {
    try {
      const saved = localStorage.getItem(storageKey(getCurrentYear()));
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey(year), JSON.stringify(state));
  }, [state, year]);

  useEffect(() => {
    localStorage.setItem(YEAR_KEY, String(year));
  }, [year]);

  const isChecked = useCallback(
    (lineId: string, mastNumber: number) => {
      return state[lineId]?.[mastNumber] ?? false;
    },
    [state]
  );

  const toggle = useCallback((lineId: string, mastNumber: number) => {
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
  }, []);

  const bulkSet = useCallback((lineId: string, mastNumbers: number[], value: boolean) => {
    setState((prev) => {
      const lineState = { ...(prev[lineId] ?? {}) };
      for (const m of mastNumbers) {
        lineState[m] = value;
      }
      return { ...prev, [lineId]: lineState };
    });
  }, []);

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
    const prevYear = year - 1;
    // Delete year before previous (only keep 1 year back)
    try { localStorage.removeItem(storageKey(prevYear)); } catch {}
    // Current data is already saved; advance year and reset
    const newYear = year + 1;
    setYear(newYear);
    setState({});
  }, [year]);

  const getPreviousYearStats = useCallback(() => {
    const prevYear = year - 1;
    try {
      const saved = localStorage.getItem(storageKey(prevYear));
      if (saved) return { year: prevYear, data: JSON.parse(saved) as InspectionState };
    } catch {}
    return null;
  }, [year]);

  return { isChecked, toggle, bulkSet, getLineStats, getTotalStats, year, advanceYear, getPreviousYearStats };
}
