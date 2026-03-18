export interface LineData {
  id: string;
  name: string;
  description: string;
  group: string;
  mastStart: number;
  mastEnd: number;
}

export const lineGroups = [
  { name: "NNN 220KV", label: "Ledningsanlegg 220KV" },
  { name: "NNN 300KV", label: "Ledningsanlegg 300KV" },
  { name: "NNN 420KV", label: "Ledningsanlegg 420KV" },
];

export const lines: LineData[] = [
  { id: "L0198", name: "L0198", description: "Nedre Røssåga - Varntresk", group: "NNN 220KV", mastStart: 2, mastEnd: 160 },
  { id: "L0199", name: "L0199", description: "Nedre Røssåga - Ajaure (Landegrense)", group: "NNN 220KV", mastStart: 2, mastEnd: 160 },
  { id: "L0550", name: "L0550", description: "Namsskogan - Tunnsjødal", group: "NNN 300KV", mastStart: 1, mastEnd: 105 },
  { id: "L0552", name: "L0552", description: "Marka - Trofors", group: "NNN 300KV", mastStart: 1, mastEnd: 105 },
  { id: "L0554", name: "L0554", description: "Trofors - Namsskogan", group: "NNN 300KV", mastStart: 1, mastEnd: 179 },
  { id: "L0555", name: "L0555", description: "Kolsvik - Namsskogan", group: "NNN 300KV", mastStart: 1, mastEnd: 101 },
  { id: "L0559", name: "L0559", description: "Marka - Nedre Røssåga", group: "NNN 300KV", mastStart: 1, mastEnd: 109 },
  { id: "L0801", name: "L0801", description: "Rana - Nedre Røssåga", group: "NNN 420KV", mastStart: 1, mastEnd: 123 },
  { id: "L0803", name: "L0803", description: "Svartisen - Rana", group: "NNN 420KV", mastStart: 1, mastEnd: 191 },
  { id: "L0805", name: "L0805", description: "Salten - Svartisen", group: "NNN 420KV", mastStart: 1, mastEnd: 307 },
  { id: "L0861", name: "L0861", description: "Nedre Røssåga - Tunnsjødal", group: "NNN 420KV", mastStart: 1, mastEnd: 449 },
  { id: "L0901", name: "L0901", description: "Kobbvatnet - Salten", group: "NNN 420KV", mastStart: 1, mastEnd: 96 },
  { id: "L0902", name: "L0902", description: "Kobbelv - Kobbvatnet", group: "NNN 420KV", mastStart: 1, mastEnd: 7 },
];

export function getMastNumbers(line: LineData): number[] {
  const masts: number[] = [];
  for (let i = line.mastStart; i <= line.mastEnd; i++) {
    masts.push(i);
  }
  return masts;
}
