export interface LineData {
  id: string;
  name: string;
  mastStart: number;
  mastEnd: number;
}

export const lines: LineData[] = [
  { id: "linje-1", name: "Linje 1", mastStart: 2, mastEnd: 160 },
  { id: "linje-2", name: "Linje 2", mastStart: 1, mastEnd: 105 },
  { id: "linje-3", name: "Linje 3", mastStart: 1, mastEnd: 105 },
  { id: "linje-4", name: "Linje 4", mastStart: 1, mastEnd: 179 },
  { id: "linje-5", name: "Linje 5", mastStart: 1, mastEnd: 101 },
  { id: "linje-6", name: "Linje 6", mastStart: 1, mastEnd: 109 },
  { id: "linje-7", name: "Linje 7", mastStart: 1, mastEnd: 123 },
  { id: "linje-8", name: "Linje 8", mastStart: 1, mastEnd: 191 },
  { id: "linje-9", name: "Linje 9", mastStart: 1, mastEnd: 307 },
  { id: "linje-10", name: "Linje 10", mastStart: 1, mastEnd: 449 },
  { id: "linje-11", name: "Linje 11", mastStart: 1, mastEnd: 96 },
  { id: "linje-12", name: "Linje 12", mastStart: 1, mastEnd: 7 },
];

export function getMastNumbers(line: LineData): number[] {
  const masts: number[] = [];
  for (let i = line.mastStart; i <= line.mastEnd; i++) {
    masts.push(i);
  }
  return masts;
}
