import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  TransformerField, MeasurementData, PHASES, PHASE_LABELS,
  calculateDeviations, getDeviationLimit, DeviationResult,
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
}

export default function ResultsView({ transformers, measurements, secondaryVoltage, comments, onCommentsChange }: Props) {
  const deviations = calculateDeviations(transformers, measurements, secondaryVoltage);
  const limit = getDeviationLimit(secondaryVoltage);
  const hasIssues = deviations.some((d) => !d.acceptable);

  return (
    <div className="space-y-6">
      {/* Overall status */}
      <Card className={hasIssues ? "border-destructive" : "border-green-500"}>
        <CardContent className="flex items-center gap-3 py-4">
          {hasIssues ? (
            <>
              <AlertTriangle className="h-6 w-6 text-destructive shrink-0" />
              <div>
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

      {/* Acceptable deviation table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Akseptabelt avvik (Kl. 0,2)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">Uf (nominell):</span>
              <span className="font-medium">{secondaryVoltage.toFixed(2)} V</span>
              <span className="text-muted-foreground">Akseptabelt avvik:</span>
              <span className="font-medium">{limit.toFixed(2)} V</span>
            </div>
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
              <CardTitle className="text-sm">
                Samleskinne {busbar} – Avviksanalyse
              </CardTitle>
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
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-1 px-2 font-medium text-muted-foreground">Fase</th>
            {deviations[0]?.values.map((v) => (
              <th key={v.transformerId} className="text-center py-1 px-2 font-medium text-[10px]">
                {v.transformerName}
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
                <td key={v.transformerId} className="text-center py-1.5 px-2">
                  {v.measValue.toFixed(2)}
                </td>
              ))}
              <td className={`text-center py-1.5 px-2 font-bold ${d.acceptable ? "" : "text-destructive"}`}>
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

  // Build chart data: one entry per transformer, with deviation per phase
  const transformerNames = deviations[0].values.map((v) => v.transformerName);
  const baselineIndex = 0; // Use first transformer as reference

  const chartData = transformerNames.map((name, tIdx) => {
    const point: Record<string, number | string> = { name };
    for (const d of deviations) {
      const baseValue = d.values[baselineIndex].measValue;
      const thisValue = d.values[tIdx].measValue;
      point[d.phase] = Number((thisValue - baseValue).toFixed(3));
    }
    return point;
  });

  const colors = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"];

  return (
    <div>
      <p className="text-[10px] text-muted-foreground mb-2">
        Differanse relativt til {transformerNames[0]} (V)
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="name" tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 9 }} domain={[-limit * 3, limit * 3]} />
          <Tooltip contentStyle={{ fontSize: 11 }} />
          <ReferenceLine y={limit} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: `+${limit.toFixed(2)}`, fontSize: 9 }} />
          <ReferenceLine y={-limit} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: `-${limit.toFixed(2)}`, fontSize: 9 }} />
          <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeWidth={1} />
          {PHASES.map((phase, i) => (
            <Line
              key={phase}
              type="monotone"
              dataKey={phase}
              name={PHASE_LABELS[phase]}
              stroke={colors[i]}
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          ))}
          <Legend wrapperStyle={{ fontSize: 10 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
