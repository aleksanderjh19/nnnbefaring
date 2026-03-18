import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "mast-inspection-2026";

type InspectionState = Record<string, Record<number, boolean>>;

export function useInspectionState() {
  const [state, setState] = useState<InspectionState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

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

  return { isChecked, toggle, getLineStats, getTotalStats };
}
