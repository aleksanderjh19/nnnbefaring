import { Input } from "@/components/ui/input";
import {
  TransformerField,
  Phase,
  PHASES,
  PHASE_LABELS,
  MeasurementData,
  PhaseMeasurement,
} from "./types";

interface Props {
  transformers: TransformerField[];
  measurements: MeasurementData;
  onChange: (measurements: MeasurementData) => void;
}

export default function MeasurementInput({ transformers, measurements, onChange }: Props) {
  // Only measure fields that are in drift. Group busbars and active fields together
  // per section (A / B / all) so the operator sees which reference each field maps to.
  const activeAll = transformers.filter((t) => t.status !== "ute_av_drift");

  const busbarA = activeAll.find((t) => t.kind === "busbar" && t.busbarLabel === "A");
  const busbarB = activeAll.find((t) => t.kind === "busbar" && t.busbarLabel === "B");
  const hasAnyBusbar = !!busbarA || !!busbarB;

  const sections: { label: string; color: string; list: TransformerField[]; refId?: string }[] = [];

  if (hasAnyBusbar) {
    if (busbarA) {
      const fields = activeAll.filter(
        (t) => t.kind === "field" && (t.refBusbar ?? "A") === "A"
      );
      sections.push({ label: "Samleskinne A", color: "blue", list: [busbarA, ...fields], refId: busbarA.id });
    }
    if (busbarB) {
      const fields = activeAll.filter(
        (t) => t.kind === "field" && (t.refBusbar ?? "A") === "B"
      );
      sections.push({ label: "Samleskinne B", color: "amber", list: [busbarB, ...fields], refId: busbarB.id });
    }
  } else {
    const ref = activeAll.find((t) => t.isReference);
    const rest = activeAll.filter((t) => t.id !== ref?.id);
    sections.push({
      label: ref ? `Referansefelt: ${ref.name}` : "Felt",
      color: "blue",
      list: ref ? [ref, ...rest] : rest,
      refId: ref?.id,
    });
  }

  const refMap: Record<string, string | undefined> = {};
  for (const s of sections) {
    for (const t of s.list) refMap[t.id] = s.refId;
  }

  const emptyPhase = (): PhaseMeasurement => ({ terminal: "", refValue: null, measValue: null });

  const updateMeasurement = (
    transformerId: string,
    phase: Phase,
    field: keyof PhaseMeasurement,
    value: string
  ) => {
    const updated = { ...measurements };
    const ensure = (id: string) => {
      if (!updated[id]) {
        updated[id] = { UL1_ULN: emptyPhase(), UL2_ULN: emptyPhase(), UL3_ULN: emptyPhase() };
      }
    };
    ensure(transformerId);
    const current = { ...updated[transformerId][phase] };
    if (field === "terminal") {
      current.terminal = value;
    } else {
      current[field] = value === "" ? null : Number(value);
    }
    updated[transformerId] = { ...updated[transformerId], [phase]: current };

    // Auto-propagate: when the section's reference field gets a målespenning,
    // fill it as ref. spenning on all other fields in the same section.
    if (field === "measValue") {
      const sectionRefId = refMap[transformerId];
      if (sectionRefId && sectionRefId === transformerId) {
        const newRef = current.measValue;
        for (const s of sections) {
          if (s.refId !== transformerId) continue;
          for (const t of s.list) {
            if (t.id === transformerId) continue;
            ensure(t.id);
            const p = { ...updated[t.id][phase], refValue: newRef };
            updated[t.id] = { ...updated[t.id], [phase]: p };
          }
        }
      }
    }

    onChange(updated);
  };

  return (
    <div className="space-y-6">
      {sections.map((s, i) => (
        <BusbarMeasurements
          key={i}
          label={s.label}
          color={s.color}
          transformers={s.list}
          measurements={measurements}
          onUpdate={updateMeasurement}
        />
      ))}
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
      <div className={`${lightBg} rounded-b-xl border border-t-0 border-border`}>
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
                    <th key={t.id} className="text-left py-1 px-2 font-medium min-w-[100px]">
                      <span className="text-[10px]">
                        {t.name}
                        {t.kind === "busbar" && <span className="ml-1 text-primary">•</span>}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PHASES.map((phase) => (
                  <tr key={phase} className="border-b border-border/50">
                    <td className="py-1.5 px-2 font-medium text-muted-foreground">{PHASE_LABELS[phase]}</td>
                    {transformers.map((t) => {
                      const terminal = measurements[t.id]?.[phase]?.terminal ?? "";
                      return (
                        <td key={t.id} className="py-1 px-2">
                          {terminal ? (
                            <span className="text-[10px] font-mono bg-muted/50 px-1.5 py-0.5 rounded">
                              {terminal}
                            </span>
                          ) : (
                            <Input
                              className="h-7 text-xs"
                              placeholder="Rekkekl.nr"
                              value=""
                              onChange={(e) => onUpdate(t.id, phase, "terminal", e.target.value)}
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

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
                      <span className="text-[10px]">
                        {t.name}
                        {t.conversion && (
                          <span className="ml-1 text-[9px] text-amber-700 dark:text-amber-400">
                            ×{t.conversion.factor.toFixed(4)}
                          </span>
                        )}
                      </span>
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
