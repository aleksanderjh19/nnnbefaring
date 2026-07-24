import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2 } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  TransformerField, MeasurementData, PHASE_LABELS,
  calculateReferenceSections, getDeviationLimit, hasAnyIssue,
  ReferenceMode, VoltageRoundData,
} from "./types";
import { generateVoltageRoundXlsx } from "@/lib/voltageRoundXlsx";
import { toast } from "@/hooks/use-toast";

interface Props {
  round: VoltageRoundData;
  transformers: TransformerField[];
  measurements: MeasurementData;
  secondaryVoltage: number;
  referenceMode: ReferenceMode;
  comments: string;
  onCommentsChange: (c: string) => void;
}

export default function ResultsView({
  round, transformers, measurements, secondaryVoltage, referenceMode, comments, onCommentsChange,
}: Props) {
  const [exporting, setExporting] = useState(false);
  const sections = calculateReferenceSections(transformers, measurements, referenceMode, secondaryVoltage);
  const limit = getDeviationLimit(secondaryVoltage);
  const issues = hasAnyIssue(sections);

  const handleExport = async () => {
    if (!round.templateKey) {
      toast({ title: "Ingen mal", description: "Denne stasjonen har ingen Excel-mal.", variant: "destructive" });
      return;
    }
    setExporting(true);
    try {
      await generateVoltageRoundXlsx(round);
    } catch (e) {
      console.error(e);
      toast({ title: "Feil", description: "Kunne ikke generere Excel-fil.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall status */}
      <Card className={issues ? "border-destructive" : "border-green-500"}>
        <CardContent className="flex items-center gap-3 py-4">
          {issues ? (
            <>
              <AlertTriangle className="h-6 w-6 text-destructive shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-sm text-destructive">Avvik funnet</p>
                <p className="text-xs text-muted-foreground">
                  Differanser større enn akseptabelt avvik (±{limit.toFixed(2)} V, klasse 0,2) er oppdaget.
                </p>
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
              <div>
                <p className="font-bold text-sm text-green-700 dark:text-green-400">Alle målinger OK</p>
                <p className="text-xs text-muted-foreground">
                  Alle differanser er innenfor akseptabelt avvik (±{limit.toFixed(2)} V).
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Excel export button */}
      <Button onClick={handleExport} disabled={exporting} className="w-full" size="sm" variant="outline">
        {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
        {exporting ? "Genererer..." : "Last ned Statnett Excel-mal"}
      </Button>

      {/* Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Grenseverdier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs grid grid-cols-2 gap-y-1">
            <span className="text-muted-foreground">Uf (nominell):</span>
            <span className="font-medium">{secondaryVoltage.toFixed(2)} V</span>
            <span className="text-muted-foreground">Akseptabelt avvik (kl. 0,2):</span>
            <span className="font-medium">±{limit.toFixed(2)} V</span>
          </div>
        </CardContent>
      </Card>

      {/* Deviation per reference */}
      {sections.map((section) => (
        <Card key={section.key} className={section.groups.some((g) => g.hasIssue) ? "border-destructive/50" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              {section.groups.some((g) => g.hasIssue) ? (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
              Referanse: {section.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {section.groups.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Ingen felt på denne referansen.</p>
            ) : (
              section.groups.map((g) => (
                <div key={g.fieldId} className="border border-border rounded-lg overflow-hidden">
                  <div className={`px-3 py-2 flex items-center gap-2 text-xs font-semibold ${
                    g.hasIssue
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted/50 text-foreground"
                  }`}>
                    {g.hasIssue ? (
                      <AlertTriangle className="h-3.5 w-3.5" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    )}
                    <span>{g.fieldName}</span>
                    {g.hasConversion && (
                      <span className="ml-auto text-[9px] font-mono bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.5 rounded">
                        omregnet ×{g.conversionFactor?.toFixed(4)}
                      </span>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/30 text-[10px] uppercase text-muted-foreground">
                          <th className="text-left py-1.5 px-2 font-medium">Fase</th>
                          <th className="text-center py-1.5 px-2 font-medium">Ref. spenning (avlest v/felt)</th>
                          <th className="text-center py-1.5 px-2 font-medium">
                            Felt {g.hasConversion && "(omregnet)"}
                          </th>
                          <th className="text-center py-1.5 px-2 font-medium">Avvik</th>
                          <th className="text-center py-1.5 px-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.phases.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-2 px-2 text-center text-muted-foreground text-[11px] italic">
                              Ingen målinger fylt inn
                            </td>
                          </tr>
                        ) : (
                          g.phases.map((p) => (
                            <tr key={p.phase} className="border-b border-border/50 last:border-0">
                              <td className="py-1.5 px-2 font-medium">{PHASE_LABELS[p.phase]}</td>
                              <td className="text-center py-1.5 px-2 font-mono">{p.referenceMeasValue.toFixed(2)}</td>
                              <td className="text-center py-1.5 px-2 font-mono">
                                {p.effectiveFieldValue.toFixed(2)}
                                {g.hasConversion && (
                                  <span className="ml-1 text-[9px] text-muted-foreground">
                                    ({p.fieldMeasValue.toFixed(2)})
                                  </span>
                                )}
                              </td>
                              <td className={`text-center py-1.5 px-2 font-bold font-mono ${
                                p.acceptable ? "text-green-600 dark:text-green-400" : "text-destructive"
                              }`}>
                                {p.deviation >= 0 ? "+" : ""}{p.deviation.toFixed(2)}
                              </td>
                              <td className="text-center py-1.5 px-2">
                                {p.acceptable ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 text-destructive mx-auto" />
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ))}

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
