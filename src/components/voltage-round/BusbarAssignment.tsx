import { useState } from "react";
import { ChevronDown, Calendar, User, Zap, Power, PowerOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { TransformerField, VoltageRoundData, InstrumentInfo } from "./types";
import { FieldDefinition } from "@/data/stationTemplates";

interface Props {
  data: VoltageRoundData;
  templateFields: FieldDefinition[];
  onChange: (data: Partial<VoltageRoundData>) => void;
}

/**
 * Field setup step: for each field the operator confirms:
 *  - status (i drift / ute av drift)
 *  - and, in dual-busbar mode, which busbar it is connected to (A or B)
 *  - and, in field mode, which field is the reference
 */
export default function BusbarAssignment({ data, templateFields, onChange }: Props) {
  const [instrumentsOpen, setInstrumentsOpen] = useState(false);

  const updateField = (id: string, patch: Partial<TransformerField>) => {
    onChange({
      transformers: data.transformers.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    });
  };

  const setReference = (id: string) => {
    onChange({
      transformers: data.transformers.map((t) => ({ ...t, isReference: t.id === id })),
    });
  };

  const busbars = data.transformers.filter((t) => t.kind === "busbar");
  const fields = data.transformers.filter((t) => t.kind === "field");

  return (
    <div className="space-y-5">
      {/* Date + Sign */}
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

      {/* Instruments collapsed */}
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

      {/* Reference mode explanation */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
        <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5" />
          {data.referenceMode === "dual-busbar" && "Dobbel samleskinne (A/B)"}
          {data.referenceMode === "single-busbar" && "Enkel samleskinne"}
          {data.referenceMode === "field" && "Ingen samleskinnemåling – velg referansefelt"}
        </p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {data.referenceMode === "dual-busbar" &&
            "Hvert felt sammenlignes mot samleskinnen det er koblet til. Endre kobling under om et felt er flyttet."}
          {data.referenceMode === "single-busbar" &&
            "Alle felt sammenlignes mot samleskinne A."}
          {data.referenceMode === "field" &&
            "Denne stasjonen har ikke måling på samleskinne. Velg hvilket felt som skal brukes som referanse for hele runden."}
        </p>
      </div>

      {/* Busbars (info only) */}
      {busbars.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
              Samleskinne{busbars.length > 1 ? "r" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {busbars.map((b) => (
              <FieldRow
                key={b.id}
                field={b}
                templateFields={templateFields}
                referenceMode={data.referenceMode}
                onUpdate={updateField}
                onSetReference={setReference}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Fields */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
            Felt {data.referenceMode === "field" && "– velg referanse"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {fields.map((f) => (
            <FieldRow
              key={f.id}
              field={f}
              templateFields={templateFields}
              referenceMode={data.referenceMode}
              onUpdate={updateField}
              onSetReference={setReference}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function FieldRow({
  field,
  templateFields,
  referenceMode,
  onUpdate,
  onSetReference,
}: {
  field: TransformerField;
  templateFields: FieldDefinition[];
  referenceMode: VoltageRoundData["referenceMode"];
  onUpdate: (id: string, patch: Partial<TransformerField>) => void;
  onSetReference: (id: string) => void;
}) {
  const def = templateFields.find((f) => f.id === field.id);
  const isOut = field.status === "ute_av_drift";
  const isBusbar = field.kind === "busbar";

  return (
    <div
      className={`rounded-lg border px-3 py-2.5 transition-colors ${
        isOut
          ? "border-border/50 bg-muted/30 opacity-60"
          : field.isReference
          ? "border-primary/50 bg-primary/5"
          : "border-border bg-background"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className={`h-2 w-2 rounded-full ${isBusbar ? "bg-primary" : "bg-muted-foreground/40"}`} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold truncate">{field.name}</p>
          {def?.drawingRef && (
            <p className="text-[10px] text-muted-foreground truncate">{def.drawingRef}</p>
          )}
        </div>

        {/* Busbar toggle (dual-busbar mode, fields only) */}
        {referenceMode === "dual-busbar" && !isBusbar && !isOut && (
          <RadioGroup
            value={field.refBusbar ?? "A"}
            onValueChange={(v) => onUpdate(field.id, { refBusbar: v as "A" | "B" })}
            className="flex gap-1"
          >
            {(["A", "B"] as const).map((b) => (
              <label
                key={b}
                className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-bold cursor-pointer transition-colors ${
                  field.refBusbar === b
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value={b} className="sr-only" />
                SS{b}
              </label>
            ))}
          </RadioGroup>
        )}

        {/* Reference selector (field mode) */}
        {referenceMode === "field" && !isBusbar && !isOut && (
          <button
            onClick={() => onSetReference(field.id)}
            className={`text-[10px] font-bold rounded-md border px-2 py-1 transition-colors ${
              field.isReference
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/50"
            }`}
          >
            {field.isReference ? "Referanse" : "Sett som ref."}
          </button>
        )}

        {/* Conversion badge */}
        {field.conversion && !isOut && (
          <span className="text-[9px] font-mono bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.5 rounded">
            ×{field.conversion.factor.toFixed(4)}
          </span>
        )}

        {/* Status */}
        <div className="flex items-center gap-1">
          {isOut ? (
            <PowerOff className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <Power className="h-3.5 w-3.5 text-green-500" />
          )}
          <Switch
            checked={!isOut}
            onCheckedChange={(v) =>
              onUpdate(field.id, { status: v ? "active" : "ute_av_drift" })
            }
          />
        </div>
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
