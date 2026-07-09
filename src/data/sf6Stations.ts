export interface Sf6Breaker {
  name: string;
  singlePhase?: boolean;
}

export interface Sf6Level {
  kV: string;
  breakers: Sf6Breaker[];
}

export interface Sf6Station {
  id: string;
  name: string;
  levels: Sf6Level[];
}

export const sf6Stations: Sf6Station[] = [
  {
    id: "nedre-rossaga",
    name: "Nedre Røssåga",
    levels: [
      {
        kV: "420",
        breakers: [
          { name: "T10AE" },
          { name: "T13AE" },
          { name: "Ra1AE" },
          { name: "Tu1AE" },
          { name: "Tu1BE" },
          { name: "Ra1BE" },
          { name: "T13BE" },
          { name: "T10BE" },
        ],
      },
      {
        kV: "300",
        breakers: [
          { name: "T10AE" },
          { name: "T11AE" },
          { name: "Kb1AE" },
          { name: "T7AE" },
          { name: "Ma1AE" },
          { name: "T9AE" },
          { name: "T9BE" },
          { name: "Ma1BE" },
          { name: "T7BE" },
          { name: "Kb2BE" },
          { name: "T11BE" },
          { name: "T10BE" },
        ],
      },
      {
        kV: "220",
        breakers: [{ name: "Aj1E" }],
      },
      {
        kV: "132",
        breakers: [
          { name: "T9E", singlePhase: true },
          { name: "T7E", singlePhase: true },
        ],
      },
    ],
  },
  {
    id: "kolsvik",
    name: "Kolsvik",
    levels: [
      {
        kV: "300",
        breakers: [
          { name: "NS1BE" },
          { name: "RT3BE" },
          { name: "RT3AE" },
          { name: "NS1AE" },
        ],
      },
      {
        kV: "132",
        breakers: [
          { name: "L1E", singlePhase: true },
          { name: "Å1E", singlePhase: true },
          { name: "P1RT3", singlePhase: true },
          { name: "RT3", singlePhase: true },
        ],
      },
    ],
  },
  {
    id: "trofors",
    name: "Trofors",
    levels: [
      {
        kV: "300",
        breakers: [
          { name: "Ma1E" },
          { name: "T1E" },
          { name: "NS1E" },
        ],
      },
    ],
  },
];

export function findSf6Station(id: string): Sf6Station | undefined {
  return sf6Stations.find((s) => s.id === id);
}

export type PhaseValues = {
  L1?: number | null;
  L2?: number | null;
  L3?: number | null;
  value?: number | null;
};

// measurements[kV][breakerName] = PhaseValues
export type Sf6Measurements = Record<string, Record<string, PhaseValues>>;

export function createEmptyMeasurements(station: Sf6Station): Sf6Measurements {
  const m: Sf6Measurements = {};
  for (const lvl of station.levels) {
    m[lvl.kV] = {};
    for (const b of lvl.breakers) {
      m[lvl.kV][b.name] = b.singlePhase
        ? { value: null }
        : { L1: null, L2: null, L3: null };
    }
  }
  return m;
}

export function isLevelComplete(level: Sf6Level, m: Sf6Measurements): boolean {
  const lvl = m[level.kV];
  if (!lvl) return false;
  return level.breakers.every((b) => {
    const v = lvl[b.name];
    if (!v) return false;
    if (b.singlePhase) return v.value != null && !Number.isNaN(v.value);
    return (
      v.L1 != null && !Number.isNaN(v.L1) &&
      v.L2 != null && !Number.isNaN(v.L2) &&
      v.L3 != null && !Number.isNaN(v.L3)
    );
  });
}

export type LevelStatus = "empty" | "partial" | "complete";

export function getLevelStatus(level: Sf6Level, m: Sf6Measurements): LevelStatus {
  const lvl = m[level.kV];
  if (!lvl) return "empty";
  let filled = 0;
  let total = 0;
  for (const b of level.breakers) {
    const v = lvl[b.name];
    if (b.singlePhase) {
      total += 1;
      if (v?.value != null && !Number.isNaN(v.value)) filled += 1;
    } else {
      total += 3;
      for (const p of ["L1", "L2", "L3"] as const) {
        if (v?.[p] != null && !Number.isNaN(v[p] as number)) filled += 1;
      }
    }
  }
  if (filled === 0) return "empty";
  if (filled === total) return "complete";
  return "partial";
}

export function currentMonthLabel(date = new Date()): string {
  const months = [
    "Januar", "Februar", "Mars", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Desember",
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}
