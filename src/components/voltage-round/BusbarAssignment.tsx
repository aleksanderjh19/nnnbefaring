import { ArrowUp, ArrowDown, Lock, Zap, ChevronDown, Calendar, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TransformerField } from "./types";
import { FieldDefinition } from "@/data/stationTemplates";
import { VoltageRoundData, InstrumentInfo } from "./types";
import { useState } from "react";

interface Props {
  data: VoltageRoundData;
  templateFields: FieldDefinition[];
  onChange: (data: Partial<VoltageRoundData>) => void;
}

export default function BusbarAssignment({ data, templateFields, onChange }: Props) {
  const [instrumentsOpen, setInstrumentsOpen] = useState(false);

  const toggleBusbar = (fieldId: string) => {
    const updated = data.transformers.map((t) =>
      t.id === fieldId ? { ...t, busbar: t.busbar === "A" ? "B" as const : "A" as const } : t
    );
    onChange({ transformers: updated });
  };

  const isFixed = (fieldId: string) => {
    const def = templateFields.find((f) => f.id === fieldId);
    return !!def?.fixedBusbar;
  };

  const busbarA = data.transformers.filter((t) => t.busbar === "A");
  const busbarB = data.transformers.filter((t) => t.busbar === "B");

  return (
    <div className="space-y-5">
      {/* Date + Sign compact row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs flex items-center gap-1.5 mb-1">
            <Calendar className="h-3 w-3" /> Dato
          </Label>
          <Input
            type="date"
            value={data.date}
            onChange={(e) => onChange({ date: e.target.value })}
            className="h-9 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs flex items-center gap-1.5 mb-1">
            <User className="h-3 w-3" /> Utførende
          </Label>
          <Input
            value={data.signNames}
            onChange={(e) => onChange({ signNames: e.target.value })}
            placeholder="Navn"
            className="h-9 text-sm"
          />
        </div>
      </div>

      {/* Instruments (collapsible) */}
      <Collapsible open={instrumentsOpen} onOpenChange={setInstrumentsOpen}>
        <CollapsibleTrigger className="w-full flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-secondary/50 transition-colors">
          <span className="flex-1 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Instrumenter
          </span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${instrumentsOpen ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <InstrumentCard
              title="Referanseinstrument"
              instrument={data.refInstrument}
              onChange={(inst) => onChange({ refInstrument: inst })}
            />
            <InstrumentCard
              title="Måleinstrument"
              instrument={data.measInstrument}
              onChange={(inst) => onChange({ measInstrument: inst })}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Busbar visualization */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-center">
          Samleskinne-kobling
        </h3>

        <BusbarSection
          label="Samleskinne A"
          busbar="A"
          transformers={busbarA}
          templateFields={templateFields}
          colorClass="from-blue-500 to-blue-600"
          dotColor="bg-blue-500"
          onToggle={toggleBusbar}
          isFixed={isFixed}
          moveDirection="down"
        />

        <BusbarSection
          label="Samleskinne B"
          busbar="B"
          transformers={busbarB}
          templateFields={templateFields}
          colorClass="from-amber-500 to-amber-600"
          dotColor="bg-amber-500"
          onToggle={toggleBusbar}
          isFixed={isFixed}
          moveDirection="up"
        />
      </div>
    </div>
  );
}

function BusbarSection({
  label,
  busbar,
  transformers,
  templateFields,
  colorClass,
  dotColor,
  onToggle,
  isFixed,
  moveDirection,
}: {
  label: string;
  busbar: "A" | "B";
  transformers: TransformerField[];
  templateFields: FieldDefinition[];
  colorClass: string;
  dotColor: string;
  onToggle: (id: string) => void;
  isFixed: (id: string) => boolean;
  moveDirection: "up" | "down";
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Busbar header */}
      <div className={`bg-gradient-to-r ${colorClass} px-4 py-2.5 flex items-center gap-2`}>
        <Zap className="h-4 w-4 text-white" />
        <span className="text-sm font-bold text-white">{label}</span>
        <span className="ml-auto text-[10px] text-white/70 font-medium">
          {transformers.length} felt
        </span>
      </div>

      {/* Busbar rail */}
      <div className="px-4 pt-3">
        <div className={`h-1.5 rounded-full ${dotColor} opacity-25`} />
      </div>

      {/* Field cards */}
      <div className="p-3 space-y-2 min-h-[60px]">
        {transformers.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3 italic">
            Ingen felt koblet til denne skinnen
          </p>
        ) : (
          transformers.map((t) => {
            const def = templateFields.find((f) => f.id === t.id);
            const fixed = isFixed(t.id);
            return (
              <div
                key={t.id}
                className={`group flex items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-all ${
                  fixed
                    ? "border-border/50 bg-background"
                    : "border-border bg-background hover:border-primary/30 hover:shadow-sm cursor-pointer"
                }`}
                onClick={() => !fixed && onToggle(t.id)}
              >
                {/* Connection dot */}
                <div className="relative flex flex-col items-center">
                  <div className={`h-2.5 w-2.5 rounded-full ${dotColor} ring-2 ring-background`} />
                  <div className={`w-0.5 h-3 ${dotColor} opacity-20 -mt-0.5`} />
                </div>

                {/* Field info */}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">{t.name}</p>
                  {def?.drawingRef && (
                    <p className="text-[10px] text-muted-foreground truncate">{def.drawingRef}</p>
                  )}
                </div>

                {/* Action */}
                {fixed ? (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                ) : (
                  <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] text-muted-foreground font-medium">
                      Flytt til {busbar === "A" ? "B" : "A"}
                    </span>
                    {moveDirection === "down" ? (
                      <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ArrowUp className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function InstrumentCard({
  title,
  instrument,
  onChange,
}: {
  title: string;
  instrument: InstrumentInfo;
  onChange: (inst: InstrumentInfo) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-3 pb-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px]">Fabrikat</Label>
            <Input className="h-7 text-xs" value={instrument.brand} onChange={(e) => onChange({ ...instrument, brand: e.target.value })} />
          </div>
          <div>
            <Label className="text-[10px]">Type</Label>
            <Input className="h-7 text-xs" value={instrument.type} onChange={(e) => onChange({ ...instrument, type: e.target.value })} />
          </div>
          <div>
            <Label className="text-[10px]">Serienr.</Label>
            <Input className="h-7 text-xs" value={instrument.serial} onChange={(e) => onChange({ ...instrument, serial: e.target.value })} />
          </div>
          <div>
            <Label className="text-[10px]">Kal.dato</Label>
            <Input className="h-7 text-xs" type="date" value={instrument.calibrationDate} onChange={(e) => onChange({ ...instrument, calibrationDate: e.target.value })} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
