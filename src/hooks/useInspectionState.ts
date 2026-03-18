import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

type InspectionState = Record<string, Record<number, boolean>>;

function getCurrentYear(): number {
  return new Date().getFullYear();
}

export function useInspectionState() {
  const [activeYear] = useState(getCurrentYear);
  const [viewingYear, setViewingYear] = useState(getCurrentYear);
  const [state, setState] = useState<InspectionState>({});
  const [loading, setLoading] = useState(true);
  const isViewingPrevious = viewingYear < activeYear;
  const suppressRefetch = useRef(false);

  // Load data from DB
  const fetchData = useCallback(async (year: number) => {
    setLoading(true);
    const { data } = await supabase
      .from("inspection_checks")
      .select("line_id, mast_number")
      .eq("year", year)
      .eq("checked", true);

    const newState: InspectionState = {};
    if (data) {
      for (const row of data) {
        if (!newState[row.line_id]) newState[row.line_id] = {};
        newState[row.line_id][row.mast_number] = true;
      }
    }
    setState(newState);
    setLoading(false);
  }, []);

  // Fetch on year change
  useEffect(() => {
    fetchData(viewingYear);
  }, [viewingYear, fetchData]);

  // Realtime subscription so all users see updates
  useEffect(() => {
    const channel = supabase
      .channel("inspection-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inspection_checks" },
        () => {
          if (!suppressRefetch.current) {
            fetchData(viewingYear);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [viewingYear, fetchData]);

  const isChecked = useCallback(
    (lineId: string, mastNumber: number) => state[lineId]?.[mastNumber] ?? false,
    [state]
  );

  const toggle = useCallback(async (lineId: string, mastNumber: number) => {
    if (isViewingPrevious) return;
    const currentlyChecked = state[lineId]?.[mastNumber] ?? false;

    // Optimistic update
    setState((prev) => {
      const lineState = prev[lineId] ?? {};
      const next = { ...prev, [lineId]: { ...lineState, [mastNumber]: !currentlyChecked } };
      if (currentlyChecked) delete next[lineId][mastNumber];
      return next;
    });

    suppressRefetch.current = true;
    if (currentlyChecked) {
      await supabase
        .from("inspection_checks")
        .delete()
        .eq("line_id", lineId)
        .eq("mast_number", mastNumber)
        .eq("year", viewingYear);
    } else {
      await supabase
        .from("inspection_checks")
        .upsert({ line_id: lineId, mast_number: mastNumber, year: viewingYear, checked: true });
    }
    suppressRefetch.current = false;
  }, [state, viewingYear, isViewingPrevious]);

  const bulkSet = useCallback(async (lineId: string, mastNumbers: number[], value: boolean) => {
    if (isViewingPrevious) return;

    // Optimistic update
    setState((prev) => {
      const lineState = { ...(prev[lineId] ?? {}) };
      for (const m of mastNumbers) {
        if (value) lineState[m] = true;
        else delete lineState[m];
      }
      return { ...prev, [lineId]: lineState };
    });

    suppressRefetch.current = true;
    if (value) {
      const rows = mastNumbers.map((m) => ({
        line_id: lineId,
        mast_number: m,
        year: viewingYear,
        checked: true,
      }));
      await supabase.from("inspection_checks").upsert(rows);
    } else {
      for (const m of mastNumbers) {
        await supabase
          .from("inspection_checks")
          .delete()
          .eq("line_id", lineId)
          .eq("mast_number", m)
          .eq("year", viewingYear);
      }
    }
    suppressRefetch.current = false;
  }, [viewingYear, isViewingPrevious]);

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
    // No-op or just change viewing year for now
    window.location.reload();
  }, []);

  const hasPreviousYear = useCallback(() => {
    return viewingYear > 2025; // simple check
  }, [viewingYear]);

  const viewPreviousYear = useCallback(() => {
    setViewingYear(activeYear - 1);
  }, [activeYear]);

  const viewCurrentYear = useCallback(() => {
    setViewingYear(activeYear);
  }, [activeYear]);

  return {
    isChecked, toggle, bulkSet, getLineStats, getTotalStats,
    year: viewingYear, activeYear, isViewingPrevious, loading,
    advanceYear, hasPreviousYear, viewPreviousYear, viewCurrentYear,
  };
}
