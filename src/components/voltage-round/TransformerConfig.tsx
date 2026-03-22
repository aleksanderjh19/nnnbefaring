import { useState } from "react";
import { Plus, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransformerField } from "./types";

interface Props {
  transformers: TransformerField[];
  onChange: (transformers: TransformerField[]) => void;
}

export default function TransformerConfig({ transformers, onChange }: Props) {
  const [newName, setNewName] = useState("");
  const [newBusbar, setNewBusbar] = useState<"A" | "B">("A");
  const [newDrawingRef, setNewDrawingRef] = useState("");

  const addTransformer = () => {
    if (!newName.trim()) return;
    const t: TransformerField = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      busbar: newBusbar,
      drawingRef: newDrawingRef.trim(),
    };
    onChange([...transformers, t]);
    setNewName("");
    setNewDrawingRef("");
  };

  const remove = (id: string) => {
    onChange(transformers.filter((t) => t.id !== id));
  };

  const busbarA = transformers.filter((t) => t.busbar === "A");
  const busbarB = transformers.filter((t) => t.busbar === "B");

  return (
    <div className="space-y-6">
      {/* Visual busbar layout */}
      <div className="grid gap-4 sm:grid-cols-2">
        <BusbarVisual label="Samleskinne A" transformers={busbarA} color="bg-blue-500" onRemove={remove} />
        <BusbarVisual label="Samleskinne B" transformers={busbarB} color="bg-amber-500" onRemove={remove} />
      </div>

      {/* Add new transformer */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Legg til transformator / felt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
            <div>
              <Label className="text-xs">Navn</Label>
              <Input
                placeholder="F.eks. Nedre Røssåga (+4R1)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTransformer()}
              />
            </div>
            <div>
              <Label className="text-xs">Skinne</Label>
              <Select value={newBusbar} onValueChange={(v) => setNewBusbar(v as "A" | "B")}>
                <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tegningsref.</Label>
              <Input
                placeholder="Valgfritt"
                value={newDrawingRef}
                onChange={(e) => setNewDrawingRef(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTransformer()}
              />
            </div>
          </div>
          <Button onClick={addTransformer} className="mt-3 w-full" size="sm" disabled={!newName.trim()}>
            <Plus className="mr-1.5 h-4 w-4" />
            Legg til
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function BusbarVisual({
  label,
  transformers,
  color,
  onRemove,
}: {
  label: string;
  transformers: TransformerField[];
  color: string;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className={`${color} px-4 py-2 text-white font-bold text-sm flex items-center gap-2`}>
        <Zap className="h-4 w-4" />
        {label}
      </div>
      {/* Busbar line */}
      <div className="relative px-4 pt-3">
        <div className={`h-1 ${color} rounded-full opacity-30`} />
      </div>
      <div className="p-3 space-y-2 min-h-[80px]">
        {transformers.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Ingen felt lagt til
          </p>
        ) : (
          transformers.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"
            >
              <div className={`h-2 w-2 rounded-full ${color}`} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{t.name}</p>
                {t.drawingRef && (
                  <p className="text-[10px] text-muted-foreground truncate">{t.drawingRef}</p>
                )}
              </div>
              <button onClick={() => onRemove(t.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
