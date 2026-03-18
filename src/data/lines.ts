export interface LineData {
  id: string;
  name: string;
  mastStart: number;
  mastEnd: number;
}

export const lines: LineData[] = [
  { id: "L0199", name: "L0199", mastStart: 2, mastEnd: 160 },
  { id: "L0550", name: "L0550", mastStart: 1, mastEnd: 105 },
  { id: "L0552", name: "L0552", mastStart: 1, mastEnd: 105 },
  { id: "L0554", name: "L0554", mastStart: 1, mastEnd: 179 },
  { id: "L0555", name: "L0555", mastStart: 1, mastEnd: 101 },
  { id: "L0559", name: "L0559", mastStart: 1, mastEnd: 109 },
  { id: "L0801", name: "L0801", mastStart: 1, mastEnd: 123 },
  { id: "L0803", name: "L0803", mastStart: 1, mastEnd: 191 },
  { id: "L0805", name: "L0805", mastStart: 1, mastEnd: 307 },
  { id: "L0861", name: "L0861", mastStart: 1, mastEnd: 449 },
  { id: "L0901", name: "L0901", mastStart: 1, mastEnd: 96 },
  { id: "L0902", name: "L0902", mastStart: 1, mastEnd: 7 },
];

export function getMastNumbers(line: LineData): number[] {
  const masts: number[] = [];
  for (let i = line.mastStart; i <= line.mastEnd; i++) {
    masts.push(i);
  }
  return masts;
}
