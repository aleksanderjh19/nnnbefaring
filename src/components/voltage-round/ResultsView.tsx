import { useState } from "react";
import { AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  TransformerField, MeasurementData, PHASES, PHASE_LABELS,
  calculateDeviations, getDeviationLimit, DeviationResult, Phase,
} from "./types";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from "recharts";

interface Props {
  transformers: TransformerField[];
  measurements: MeasurementData;
  secondaryVoltage: number;
  comments: string;
  onCommentsChange: (c: string) => void;
  onMeasurementsChange?: (m: MeasurementData) => void;
}

export default function ResultsView({ transformers, measurements, secondaryVoltage, comments, onCommentsChange, onMeasurementsChange }: Props) {
  const [showRemeasure, setShowRemeasure] = useState(false);
  const [remeasurements, setRemeasurements] = useState<MeasurementData>({});

  const deviations = calculateDeviations(transformers, measurements, secondaryVoltage);
  const limit = getDeviationLimit(secondaryVoltage);
  const hasIssues = deviations.some((d) => !d.acceptable);

  const hasRemeasurements = Object.keys(remeasurements).length > 0 &&
    Object.values(remeasurements).some(phases =>
      Object.values(phases).some(p => p.measValue !== null)
    );

  const remeasDeviations = hasRemeasurements
    ? calculateDeviations(transformers, remeasurements, secondaryVoltage)
    : [];
  const remeasHasIssues = remeasDeviations.length > 0 && remeasDeviations.some((d) => !d.acceptable);

  const initRemeasurements = () => {
    const rm: MeasurementData = {};
    for (const t of transformers) {
      const orig = measurements[t.id];
      if (!orig) continue;
      rm[t.id] = {
        UL1_ULN: { terminal: orig.UL1_ULN.terminal, refValue: orig.UL1_ULN.refValue, measValue: null },
        UL2_ULN: { terminal: orig.UL2_ULN.terminal, refValue: orig.UL2_ULN.refValue, measValue: null },
        UL3_ULN: { terminal: orig.UL3_ULN.terminal, refValue: orig.UL3_ULN.refValue, measValue: null },
      };
    }
    setRemeasurements(rm);
    setShowRemeasure(true);
  };

  const updateRemeasurement = (tId: string, phase: Phase, field: "refValue" | "measValue", value: string) => {
    setRemeasurements(prev => {
      const updated = { ...prev };
      if (!updated[tId]) return prev;
      updated[tId] = {
        ...updated[tId],
        [phase]: { ...updated[tId][phase], [field]: value === "" ? null : Number(value) },
      };
      return updated;
    });
  };

  const applyRemeasurements = () => {
    if (!onMeasurementsChange) return;
    const merged = { ...measurements };
    for (const tId of Object.keys(remeasurements)) {
      if (!merged[tId]) continue;
      for (const phase of PHASES) {
        const rm = remeasurements[tId]?.[phase];
        if (!rm) continue;
        const updates: Record<string, unknown> = {};
        if (rm.refValue !== null && rm.refValue !== undefined) updates.refValue = rm.refValue;
        if (rm.measValue !== null && rm.measValue !== undefined) updates.measValue = rm.measValue;
        if (Object.keys(updates).length > 0) {
          merged[tId] = {
            ...merged[tId],
            [phase]: { ...merged[tId][phase], ...updates },
          };
        }
      }
    }
    onMeasurementsChange(merged);
    setShowRemeasure(false);
    setRemeasurements({});
  };

  return (
    <div className="space-y-6">
      {/* Overall status */}
      <Card className={hasIssues ? "border-destructive" : "border-green-500"}>
        <CardContent className="flex items-center gap-3 py-4">
          {hasIssues ? (
            <>
              <AlertTriangle className="h-6 w-6 text-destructive shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-sm text-destructive">Avvik funnet!</p>
                <p className="text-xs text-muted-foreground">
                  Differanser større enn akseptabelt avvik ({limit.toFixed(2)} V) er oppdaget.
                  Utfør målingene på nytt for å utelukke forbigående feilmåling.
                </p>
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
              <div>
                <p className="font-bold text-sm text-green-700 dark:text-green-400">Alle målinger OK</p>
                <p className="text-xs text-muted-foreground">
                  Alle differanser er innenfor akseptabelt avvik ({limit.toFixed(2)} V).
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Re-measure button */}
      {hasIssues && !showRemeasure && (
        <Button variant="outline" className="w-full border-destructive/50 text-destructive hover:bg-destructive/10" onClick={initRemeasurements}>
          <RotateCcw className="mr-2 h-4 w-4" /> Utfør kontrollmåling
        </Button>
      )}

      {/* Acceptable deviation */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Akseptabelt avvik (Kl. 0,2)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Uf (nominell):</span>
            <span className="font-medium">{secondaryVoltage.toFixed(2)} V</span>
            <span className="text-muted-foreground">Akseptabelt avvik:</span>
            <span className="font-medium">{limit.toFixed(2)} V</span>
          </div>
        </CardContent>
      </Card>

      {/* Deviation details per busbar */}
      {["A", "B"].map((busbar) => {
        const busbarDevs = deviations.filter((d) => d.busbar === busbar);
        if (busbarDevs.length === 0) return null;
        return (
          <Card key={busbar}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Samleskinne {busbar} – Avviksanalyse</CardTitle>
            </CardHeader>
            <CardContent>
              <DeviationTable deviations={busbarDevs} limit={limit} />
              <div className="mt-4">
                <DeviationChart deviations={busbarDevs} limit={limit} />
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Re-measurement input */}
      {showRemeasure && (
        <Card className="border-amber-500/50 bg-amber-50/30 dark:bg-amber-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-amber-600" />
              Kontrollmåling
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Fyll inn nye referanse- og måleverdier for å verifisere avviket.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {["A", "B"].map((busbar) => {
              const bt = transformers.filter(t => t.busbar === busbar);
              if (bt.length < 2) return null;
              return (
                <div key={busbar}>
                  <p className="text-xs font-bold mb-2">Samleskinne {busbar}</p>
                  {/* Terminal reference */}
                  <div className="overflow-x-auto mb-2">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-1 px-2 w-20 text-muted-foreground font-medium">Fase</th>
                          {bt.map(t => (
                            <th key={t.id} className="text-center py-1 px-2 font-medium text-[10px]">{t.name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {PHASES.map(phase => (
                          <tr key={phase} className="border-b border-border/50">
                            <td className="py-1 px-2 font-medium text-muted-foreground">{PHASE_LABELS[phase]}</td>
                            {bt.map(t => {
                              const terminal = measurements[t.id]?.[phase]?.terminal ?? "";
                              return (
                                <td key={t.id} className="text-center py-1 px-2">
                                  {terminal ? (
                                    <span className="text-[10px] font-mono bg-muted/50 px-1.5 py-0.5 rounded">{terminal}</span>
                                  ) : (
                                    <span className="text-muted-foreground">–</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Measurement inputs: Ref + Mål */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-1 px-2 w-20 text-muted-foreground font-medium">Fase</th>
                          {bt.map(t => (
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
                        {PHASES.map(phase => (
                          <tr key={phase} className="border-b border-border/50">
                            <td className="py-1.5 px-2 font-medium text-muted-foreground">{PHASE_LABELS[phase]}</td>
                            {bt.map(t => (
                              <td key={t.id} className="py-1 px-1" colSpan={2}>
                                <div className="flex gap-1">
                                  <Input
                                    className="h-7 text-xs text-center flex-1"
                                    type="number"
                                    step="0.01"
                                    placeholder={measurements[t.id]?.[phase]?.refValue?.toFixed(2) ?? "0.00"}
                                    value={remeasurements[t.id]?.[phase]?.refValue ?? ""}
                                    onChange={(e) => updateRemeasurement(t.id, phase, "refValue", e.target.value)}
                                  />
                                  <Input
                                    className="h-7 text-xs text-center flex-1"
                                    type="number"
                                    step="0.01"
                                    placeholder={measurements[t.id]?.[phase]?.measValue?.toFixed(2) ?? "0.00"}
                                    value={remeasurements[t.id]?.[phase]?.measValue ?? ""}
                                    onChange={(e) => updateRemeasurement(t.id, phase, "measValue", e.target.value)}
                                  />
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-1 text-[10px] font-bold text-destructive">NB! HUSK FORTEGN.</p>
                </div>
              );
            })}

            {hasRemeasurements && (
              <div className="space-y-3 pt-2 border-t border-border">
                <p className="text-xs font-bold">Resultat kontrollmåling:</p>
                <Card className={remeasHasIssues ? "border-destructive" : "border-green-500"}>
                  <CardContent className="flex items-center gap-3 py-3">
                    {remeasHasIssues ? (
                      <>
                        <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                        <p className="text-xs font-medium text-destructive">Avvik bekreftet – kontakt driftsleder.</p>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                        <p className="text-xs font-medium text-green-700 dark:text-green-400">Kontrollmåling OK – avviket var forbigående.</p>
                      </>
                    )}
                  </CardContent>
                </Card>

                {remeasDeviations.length > 0 && ["A", "B"].map(busbar => {
                  const devs = remeasDeviations.filter(d => d.busbar === busbar);
                  if (devs.length === 0) return null;
                  return <DeviationTable key={busbar} deviations={devs} limit={limit} />;
                })}

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setShowRemeasure(false); setRemeasurements({}); }}>
                    Avbryt
                  </Button>
                  <Button size="sm" onClick={applyRemeasurements}>
                    Bruk kontrollmåling som gjeldende
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Comments */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Kommentarer</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Legg til kommentarer om målingen..."
            value={comments}
            onChange={(e) => onCommentsChange(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function DeviationTable({ deviations, limit }: { deviations: DeviationResult[]; limit: number }) {
  // Get unique transformer names in order
  const transformerHeaders = deviations[0]?.values.map((v) => ({
    id: v.transformerId,
    name: v.transformerName,
  })) ?? [];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-1 px-2 font-medium text-muted-foreground">Fase</th>
            {transformerHeaders.map((t) => (
              <th key={t.id} className="text-center py-1 px-2 font-medium text-[10px]">
                {t.name}
              </th>
            ))}
            <th className="text-center py-1 px-2 font-medium text-muted-foreground">Avvik</th>
            <th className="text-center py-1 px-2 font-medium text-muted-foreground">Status</th>
          </tr>
        </thead>
        <tbody>
          {deviations.map((d) => (
            <tr key={d.phase} className="border-b border-border/50">
              <td className="py-1.5 px-2 font-medium">{PHASE_LABELS[d.phase]}</td>
              {d.values.map((v) => (
                <td key={v.transformerId} className="text-center py-1.5 px-2 font-mono">
                  {v.measValue.toFixed(2)}
                </td>
              ))}
              <td className={`text-center py-1.5 px-2 font-bold font-mono ${d.acceptable ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                {d.maxDeviation.toFixed(2)}
              </td>
              <td className="text-center py-1.5 px-2">
                {d.acceptable ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-destructive mx-auto" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DeviationChart({ deviations, limit }: { deviations: DeviationResult[]; limit: number }) {
  if (deviations.length === 0) return null;

  // Build bar-chart-like data: one group per phase, bars per transformer
  const chartData = deviations.map((d) => {
    const entry: Record<string, number | string> = { phase: PHASE_LABELS[d.phase] };
    for (const v of d.values) {
      entry[v.transformerName] = Number(v.measValue.toFixed(2));
    }
    return entry;
  });

  const transformerNames = deviations[0].values.map((v) => v.transformerName);
  const colors = [
    "hsl(var(--primary))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  // Calculate Y domain from data
  const allValues = deviations.flatMap(d => d.values.map(v => v.measValue));
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const padding = Math.max((maxVal - minVal) * 0.3, limit * 2);
  const yMin = Math.floor((minVal - padding) * 100) / 100;
  const yMax = Math.ceil((maxVal + padding) * 100) / 100;

  return (
    <div>
      <p className="text-[10px] font-medium text-muted-foreground mb-2">
        Måleverdier per fase (V) — stiplet linje viser ± akseptabelt avvik
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
          <XAxis dataKey="phase" tick={{ fontSize: 11 }} />
          <YAxis
            tick={{ fontSize: 10 }}
            domain={[yMin, yMax]}
            tickFormatter={(v: number) => v.toFixed(1)}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
            formatter={(value: number) => [`${value.toFixed(2)} V`, undefined]}
          />
          {transformerNames.map((name, i) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              name={name}
              stroke={colors[i % colors.length]}
              strokeWidth={2.5}
              dot={{ r: 5, strokeWidth: 2 }}
              activeDot={{ r: 7 }}
            />
          ))}
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
