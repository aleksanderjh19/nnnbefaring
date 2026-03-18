import { useState, useCallback, useEffect, createContext, useContext, ReactNode } from "react";
import { LineData } from "@/data/lines";
import { lines as defaultLines, lineGroups as defaultGroups } from "@/data/lines";

const LINES_STORAGE_KEY = "mast-lines-2026";
const GROUPS_STORAGE_KEY = "mast-groups-2026";

export interface LineGroup {
  name: string;
  label: string;
}

interface LinesContextType {
  lines: LineData[];
  lineGroups: LineGroup[];
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  addLine: (line: LineData) => void;
  removeLine: (id: string) => void;
  updateLine: (id: string, updates: Partial<LineData>) => void;
  addGroup: (group: LineGroup) => void;
  removeGroup: (name: string) => void;
  addMasts: (lineId: string, mastNumbers: number[]) => void;
  removeMasts: (lineId: string, mastNumbers: number[]) => void;
}

const LinesContext = createContext<LinesContextType | null>(null);

// Migration: convert old mastStart/mastEnd format to masts array
function migrateLineData(line: any): LineData {
  if (line.masts && Array.isArray(line.masts)) return line as LineData;
  // Old format with mastStart/mastEnd
  const masts: number[] = [];
  for (let i = line.mastStart ?? 1; i <= (line.mastEnd ?? 1); i++) masts.push(i);
  return { id: line.id, name: line.name, description: line.description, group: line.group, masts };
}

export function LinesProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<LineData[]>(() => {
    try {
      const saved = localStorage.getItem(LINES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map(migrateLineData);
      }
      return defaultLines;
    } catch {
      return defaultLines;
    }
  });

  const [lineGroups, setLineGroups] = useState<LineGroup[]>(() => {
    try {
      const saved = localStorage.getItem(GROUPS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : defaultGroups;
    } catch {
      return defaultGroups;
    }
  });

  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    localStorage.setItem(LINES_STORAGE_KEY, JSON.stringify(lines));
  }, [lines]);

  useEffect(() => {
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(lineGroups));
  }, [lineGroups]);

  const addLine = useCallback((line: LineData) => {
    setLines((prev) => [...prev, line]);
  }, []);

  const removeLine = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const updateLine = useCallback((id: string, updates: Partial<LineData>) => {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
    );
  }, []);

  const addGroup = useCallback((group: LineGroup) => {
    setLineGroups((prev) => [...prev, group]);
  }, []);

  const removeGroup = useCallback((name: string) => {
    setLineGroups((prev) => prev.filter((g) => g.name !== name));
  }, []);

  const addMasts = useCallback((lineId: string, mastNumbers: number[]) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== lineId) return l;
        const existing = new Set(l.masts);
        const newMasts = mastNumbers.filter((m) => !existing.has(m));
        if (newMasts.length === 0) return l;
        return { ...l, masts: [...l.masts, ...newMasts].sort((a, b) => a - b) };
      })
    );
  }, []);

  const removeMasts = useCallback((lineId: string, mastNumbers: number[]) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== lineId) return l;
        const toRemove = new Set(mastNumbers);
        return { ...l, masts: l.masts.filter((m) => !toRemove.has(m)) };
      })
    );
  }, []);

  return (
    <LinesContext.Provider
      value={{
        lines,
        lineGroups,
        editMode,
        setEditMode,
        addLine,
        removeLine,
        updateLine,
        addGroup,
        removeGroup,
        addMasts,
        removeMasts,
      }}
    >
      {children}
    </LinesContext.Provider>
  );
}

export function useLines() {
  const ctx = useContext(LinesContext);
  if (!ctx) throw new Error("useLines must be used within LinesProvider");
  return ctx;
}
