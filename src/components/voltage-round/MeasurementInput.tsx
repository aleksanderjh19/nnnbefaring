import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransformerField, Phase, PHASES, PHASE_LABELS, MeasurementData, PhaseMeasurement } from "./types";

interface Props {
  transformers: TransformerField[];
  measurements: MeasurementData;
  onChange: (measurements: MeasurementData) => void;
}

export default function MeasurementInput({ transformers, measurements, onChange }: Props) {
  const updateMeasurement = (
    transformerId: string,
    phase: Phase,
    field: keyof PhaseMeasurement,
    value: string
  ) => {
    const updated = { ...measurements };
    if (!updated[transformerId]) {
      updated[transformerId] = {
        UL1_ULN: { terminal: "", refValue: null, measValue: null },
        UL2_ULN: { terminal: "", refValue: null, measValue: null },
        UL3_ULN: { terminal: "", refValue: null, measValue: null },
      };
    }
    const current = { ...updated[transformerId][phase] };
    if (field === "terminal") {
      current.terminal = value;
    } else {
      current[field] = value === "" ? null : Number(value);
    }
    updated[transformerId] = { ...updated[transformerId], [phase]: current };
    onChange(updated);
  };

  const busbarA = transformers.filter((t) => t.busbar === "A");
  const busbarB = transformers.filter((t) => t.busbar === "B");

  return (
    <div className="space-y-6">
      {busbarA.length > 0 && (
        <BusbarMeasurements
          label="Samleskinne A"
          color="blue"
          transformers={busbarA}
          measurements={measurements}
          onUpdate={updateMeasurement}
        />
      )}
      {busbarB.length > 0 && (
        <BusbarMeasurements
          label="Samleskinne B"
          color="amber"
          transformers={busbarB}
          measurements={measurements}
          onUpdate={updateMeasurement}
        />
      )}
    </div>
  );
}

function BusbarMeasurements({
  label,
  color,
  transformers,
  measurements,
  onUpdate,
}: {
  label: string;
  color: string;
  transformers: TransformerField[];
  measurements: MeasurementData;
  onUpdate: (tId: string, phase: Phase, field: keyof PhaseMeasurement, value: string) => void;
}) {
  const bgColor = color === "blue" ? "bg-blue-500" : "bg-amber-500";
  const lightBg = color === "blue" ? "bg-blue-50 dark:bg-blue-950/20" : "bg-amber-50 dark:bg-amber-950/20";

  return (
    <div>
      <div className={`${bgColor} text-white px-4 py-2 rounded-t-xl text-sm font-bold`}>
        {label}
      </div>
      <div className={`${lightBg} rounded-b-xl border border-t-0 border-border overflow-x-auto`}>
        {/* Terminal block section */}
        <div className="p-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Rekkeklemmenummer
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-1 px-2 w-20 text-muted-foreground font-medium">Fase</th>
                  {transformers.map((t) => (
                    <th key={t.id} className="text-left py-1 px-2 font-medium min-w-[120px]">
                      {t.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PHASES.map((phase) => (
                  <tr key={phase} className="border-b border-border/50">
                    <td className="py-1.5 px-2 font-medium text-muted-foreground">{PHASE_LABELS[phase]}</td>
                    {transformers.map((t) => (
                      <td key={t.id} className="py-1 px-2">
                        <Input
                          className="h-7 text-xs"
                          placeholder="X2: 1-4"
                          value={measurements[t.id]?.[phase]?.terminal ?? ""}
                          onChange={(e) => onUpdate(t.id, phase, "terminal", e.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Measurement values section */}
        <div className="border-t border-border p-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Måleverdier (V)
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-1 px-2 w-20 text-muted-foreground font-medium">Fase</th>
                  {transformers.map((t) => (
                    <th key={t.id} className="text-center py-1 px-1 font-medium" colSpan={2}>
                      <span className="text-[10px]">{t.name}</span>
                      <div className="flex gap-1 mt-1">
                        <span className="flex-1 text-[9px] text-muted-foreground font-normal">Ref.</span>
                        <span className="flex-1 text-[9px] text-muted-foreground font-normal">Mål.</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PHASES.map((phase) => (
                  <tr key={phase} className="border-b border-border/50">
                    <td className="py-1.5 px-2 font-medium text-muted-foreground">{PHASE_LABELS[phase]}</td>
                    {transformers.map((t) => (
                      <td key={t.id} className="py-1 px-1" colSpan={2}>
                        <div className="flex gap-1">
                          <Input
                            className="h-7 text-xs text-center flex-1"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={measurements[t.id]?.[phase]?.refValue ?? ""}
                            onChange={(e) => onUpdate(t.id, phase, "refValue", e.target.value)}
                          />
                          <Input
                            className="h-7 text-xs text-center flex-1"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={measurements[t.id]?.[phase]?.measValue ?? ""}
                            onChange={(e) => onUpdate(t.id, phase, "measValue", e.target.value)}
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[10px] font-bold text-destructive">NB! HUSK FORTEGN.</p>
        </div>
      </div>
    </div>
  );
}
