import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSmartBack } from "@/hooks/useSmartBack";
import { ArrowLeft, ArrowRight, Check, Zap, Plus, History, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useDeletionRequests } from "@/hooks/useDeletionRequests";
import { DeletionRequestBadge } from "@/components/DeletionRequestBadge";
import StationSelect from "@/components/voltage-round/StationSelect";
import BusbarAssignment from "@/components/voltage-round/BusbarAssignment";
import MeasurementInput from "@/components/voltage-round/MeasurementInput";
import ResultsView from "@/components/voltage-round/ResultsView";
import {
  VoltageRoundData,
  TransformerField,
  createEmptyInstrument,
  createEmptyMeasurements,
  migrateTransformers,
  ReferenceMode,
} from "@/components/voltage-round/types";
import {
  StationTemplate,
  VoltageLevelConfig,
  FieldDefinition,
  findStation,
  findVoltageLevel,
} from "@/data/stationTemplates";

const STEPS = [
  { label: "Kobling", icon: "1" },
  { label: "Målinger", icon: "2" },
  { label: "Resultater", icon: "3" },
];

function nameFromEmail(email?: string): string {
  if (!email) return "";
  const local = email.split("@")[0];
  return local
    .split(/[._-]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function getQuarter(dateStr: string): number {
  const month = new Date(dateStr).getMonth();
  return Math.floor(month / 3) + 1;
}

function isDraftExpired(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  return now - created > 24 * 60 * 60 * 1000;
}

function createRoundFromTemplate(
  station: StationTemplate,
  level: VoltageLevelConfig,
  userName: string
): VoltageRoundData {
  const transformers: TransformerField[] = level.fields.map((f) => ({
    id: f.id,
    name: f.name,
    drawingRef: f.drawingRef,
    kind: f.kind,
    busbarLabel: f.busbarLabel,
    refBusbar: f.kind === "field" ? f.defaultRefBusbar ?? "A" : undefined,
    isReference: f.isDefaultReference ?? false,
    status: "active" as const,
    conversion: f.conversion,
    availablePhases: f.availablePhases,
  }));

  const measurements = createEmptyMeasurements(transformers);
  for (const f of level.fields) {
    if (measurements[f.id]) {
      measurements[f.id].UL1_ULN.terminal = f.terminals.UL1_ULN;
      measurements[f.id].UL2_ULN.terminal = f.terminals.UL2_ULN;
      measurements[f.id].UL3_ULN.terminal = f.terminals.UL3_ULN;
    }
  }

  return {
    stationName: `${station.name.toUpperCase()} ${level.kV}kV`,
    voltageLevel: level.kV,
    secondaryVoltage: level.secondaryVoltage,
    date: new Date().toISOString().slice(0, 10),
    signNames: userName,
    refInstrument: createEmptyInstrument(),
    measInstrument: createEmptyInstrument(),
    referenceMode: level.referenceMode,
    transformers,
    measurements,
    comments: "",
    templateKey: level.templateKey,
  };
}

interface SavedRound {
  id: string;
  station_name: string;
  voltage_level: string;
  date: string;
  status: string;
  created_at: string;
}

export default function VoltageRound() {
  const navigate = useNavigate();
  const goBack = useSmartBack("/");
  const { user, isAdmin } = useAuth();
  const { isRequested, handleDeleteClick } = useDeletionRequests("voltage_rounds");
  const [view, setView] = useState<"list" | "select-station" | "wizard">("list");
  const [step, setStep] = useState(0);
  const [data, setData] = useState<VoltageRoundData>({
    stationName: "",
    voltageLevel: "",
    secondaryVoltage: 63.5,
    date: new Date().toISOString().slice(0, 10),
    signNames: "",
    refInstrument: createEmptyInstrument(),
    measInstrument: createEmptyInstrument(),
    referenceMode: "dual-busbar",
    transformers: [],
    measurements: {},
    comments: "",
  });
  const [templateFields, setTemplateFields] = useState<FieldDefinition[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<SavedRound[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    document.title = "Spenningsrunde – NNHH Verktøy";
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    const { data: rows } = await supabase
      .from("voltage_rounds")
      .select("id, station_name, voltage_level, date, status, created_at")
      .order("created_at", { ascending: false });
    const filtered = ((rows as SavedRound[]) ?? []).filter(
      (r) => r.status === "completed" || !isDraftExpired(r.created_at)
    );
    setHistory(filtered);
    setLoadingHistory(false);
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const updateData = (partial: Partial<VoltageRoundData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  const handleStationSelect = (station: StationTemplate, level: VoltageLevelConfig) => {
    const userName = nameFromEmail(user?.email);
    const roundData = createRoundFromTemplate(station, level, userName);
    setData(roundData);
    setTemplateFields(level.fields);
    setEditingId(null);
    setStep(0);
    setView("wizard");
  };

  const loadRound = async (id: string) => {
    const { data: row } = await supabase
      .from("voltage_rounds")
      .select("*")
      .eq("id", id)
      .single();
    if (!row) return;
    const r = row as any;

    // Try to find station template and migrate legacy transformers if needed
    const station = findStation(r.station_name);
    const level = station ? findVoltageLevel(station, r.voltage_level) : undefined;

    // Determine reference mode from saved data or fallback to template
    const refMode: ReferenceMode =
      (r.reference_mode as ReferenceMode | undefined) ??
      level?.referenceMode ??
      "dual-busbar";

    let transformers: TransformerField[] = [];
    if (Array.isArray(r.transformers) && r.transformers.length > 0) {
      transformers = migrateTransformers(r.transformers, refMode);
    } else if (level) {
      // Old rounds without transformers, seed from template
      transformers = level.fields.map((f) => ({
        id: f.id,
        name: f.name,
        drawingRef: f.drawingRef,
        kind: f.kind,
        busbarLabel: f.busbarLabel,
        refBusbar: f.kind === "field" ? f.defaultRefBusbar ?? "A" : undefined,
        isReference: f.isDefaultReference ?? false,
        status: "active" as const,
        conversion: f.conversion,
        availablePhases: f.availablePhases,
      }));
    }

    // Merge template conversion factors + availablePhases onto migrated legacy transformers
    if (level) {
      transformers = transformers.map((t) => {
        const def = level.fields.find((f) => f.id === t.id);
        const patch: Partial<TransformerField> = {};
        if (def?.conversion && !t.conversion) patch.conversion = def.conversion;
        if (def?.availablePhases && !t.availablePhases) patch.availablePhases = def.availablePhases;
        return Object.keys(patch).length ? { ...t, ...patch } : t;
      });
    }

    const roundData: VoltageRoundData = {
      stationName: r.station_name,
      voltageLevel: r.voltage_level,
      secondaryVoltage: Number(r.secondary_voltage),
      date: r.date,
      signNames: r.sign_names ?? "",
      refInstrument: r.ref_instrument ?? createEmptyInstrument(),
      measInstrument: r.meas_instrument ?? createEmptyInstrument(),
      referenceMode: refMode,
      transformers,
      measurements: r.measurements ?? {},
      comments: r.comments ?? "",
      templateKey: level?.templateKey,
    };
    setData(roundData);
    if (level) setTemplateFields(level.fields);

    setEditingId(id);
    setStep(0);
    setView("wizard");
  };

  const deleteRound = async (id: string) => {
    await supabase.from("voltage_rounds").delete().eq("id", id);
    fetchHistory();
    toast({ title: "Slettet", description: "Spenningsrunden er slettet." });
  };

  const save = async (status: string = "draft") => {
    setSaving(true);

    let stationName = data.stationName;
    if (status === "completed" && !stationName.includes("Kvartal")) {
      const quarter = getQuarter(data.date);
      stationName = `${stationName} Kvartal ${quarter}`;
      setData((prev) => ({ ...prev, stationName }));
    }

    const payload: any = {
      station_name: stationName,
      voltage_level: data.voltageLevel,
      secondary_voltage: data.secondaryVoltage,
      date: data.date,
      sign_names: data.signNames,
      ref_instrument: data.refInstrument as any,
      meas_instrument: data.measInstrument as any,
      transformers: data.transformers as any,
      measurements: data.measurements as any,
      comments: data.comments,
      status,
    };
    // Note: reference_mode column may not exist on the table; skip if not.
    // We rely on template lookup to re-derive on load.

    let error;
    if (editingId) {
      ({ error } = await supabase.from("voltage_rounds").update(payload).eq("id", editingId));
    } else {
      const { data: inserted, error: e } = await supabase
        .from("voltage_rounds")
        .insert(payload)
        .select("id")
        .single();
      error = e;
      if (inserted) setEditingId((inserted as any).id);
    }

    if (error) {
      toast({ title: "Feil", description: "Kunne ikke lagre.", variant: "destructive" });
    } else {
      toast({
        title: "Lagret",
        description: status === "completed" ? "Spenningsrunden er fullført." : "Kladd lagret.",
      });
      fetchHistory();
      if (status === "completed") {
        setView("list");
      }
    }
    setSaving(false);
  };

  const canAdvance = () => {
    if (step === 0) {
      const active = data.transformers.filter((t) => t.status !== "ute_av_drift");
      if (active.length < 2) return false;
      if (data.referenceMode === "field" && !active.some((t) => t.isReference)) return false;
      return true;
    }
    return true;
  };

  const next = () => {
    if (step === 0) {
      const updated = createEmptyMeasurements(data.transformers);
      for (const t of data.transformers) {
        if (data.measurements[t.id]) {
          updated[t.id] = data.measurements[t.id];
        }
      }
      for (const tf of templateFields) {
        if (updated[tf.id]) {
          if (tf.terminals.UL1_ULN) updated[tf.id].UL1_ULN.terminal = tf.terminals.UL1_ULN;
          if (tf.terminals.UL2_ULN) updated[tf.id].UL2_ULN.terminal = tf.terminals.UL2_ULN;
          if (tf.terminals.UL3_ULN) updated[tf.id].UL3_ULN.terminal = tf.terminals.UL3_ULN;
        }
      }
      setData((prev) => ({ ...prev, measurements: updated }));
    }
    setStep((s) => Math.min(s + 1, 2));
  };

  // ─── LIST VIEW ────────────────────────────────────────────
  if (view === "list") {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="mx-auto max-w-2xl px-5 py-4 flex items-center gap-3">
            <button onClick={goBack} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <h1 className="font-display text-lg font-bold">Spenningsrunde</h1>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-5 py-6 space-y-4">
          <Button onClick={() => setView("select-station")} className="w-full">
            <Plus className="mr-2 h-4 w-4" /> Ny spenningsrunde
          </Button>

          <h2 className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <History className="h-3.5 w-3.5" /> Historikk
          </h2>

          {loadingHistory ? (
            <p className="text-sm text-muted-foreground text-center py-8">Laster...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Ingen spenningsrunder registrert ennå.
            </p>
          ) : (
            <div className="space-y-2">
              {history.map((r) => (
                <Card
                  key={r.id}
                  className={`${r.status !== "completed" || isAdmin ? "cursor-pointer hover:bg-secondary/50" : ""} transition-colors`}
                  onClick={() => {
                    if (r.status !== "completed" || isAdmin) loadRound(r.id);
                  }}
                >
                  <CardContent className="flex items-center gap-3 py-3 px-4">
                    <Zap className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {r.station_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{r.date}</p>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        r.status === "completed"
                          ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {r.status === "completed" ? "Fullført" : "Kladd"}
                    </span>
                    {r.status === "completed" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/spenningsrunde/${r.id}/print`);
                        }}
                        className="text-muted-foreground hover:text-primary"
                        title="Last ned PDF"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                    )}
                    {(r.status !== "completed" || isAdmin) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRound(r.id);
                        }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // ─── STATION SELECT VIEW ─────────────────────────────────
  if (view === "select-station") {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="mx-auto max-w-2xl px-5 py-4 flex items-center gap-3">
            <button onClick={() => setView("list")} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <h1 className="font-display text-lg font-bold">Ny spenningsrunde</h1>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-5 py-6">
          <StationSelect onSelect={handleStationSelect} />
        </main>
      </div>
    );
  }

  // ─── WIZARD VIEW ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-2xl px-5 py-4">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => {
                save();
                setView("list");
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Zap className="h-5 w-5 text-primary shrink-0" />
              <h1 className="font-display text-lg font-bold truncate">
                {data.stationName || "Spenningsrunde"}
              </h1>
            </div>
          </div>
          <div className="flex gap-1">
            {STEPS.map((s, i) => (
              <button
                key={i}
                onClick={() => i <= step && setStep(i)}
                className={`flex-1 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors ${
                  i === step
                    ? "bg-primary text-primary-foreground"
                    : i < step
                    ? "bg-primary/10 text-primary cursor-pointer"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-background/20 text-[9px] font-bold">
                  {i < step ? "✓" : s.icon}
                </span>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-6">
        {step === 0 && (
          <BusbarAssignment
            data={data}
            templateFields={templateFields}
            onChange={updateData}
          />
        )}
        {step === 1 && (
          <MeasurementInput
            transformers={data.transformers}
            measurements={data.measurements}
            onChange={(m) => updateData({ measurements: m })}
          />
        )}
        {step === 2 && (
          <ResultsView
            round={data}
            transformers={data.transformers}
            measurements={data.measurements}
            secondaryVoltage={data.secondaryVoltage}
            referenceMode={data.referenceMode}
            comments={data.comments}
            onCommentsChange={(c) => updateData({ comments: c })}
          />
        )}
      </main>

      <div className="fixed bottom-0 inset-x-0 border-t border-border bg-card">
        <div className="mx-auto max-w-2xl px-5 py-3 flex items-center gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)} size="sm">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Tilbake
            </Button>
          )}
          <div className="flex-1" />
          {step < 2 ? (
            <Button onClick={next} disabled={!canAdvance()} size="sm">
              Neste <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => save("draft")} disabled={saving}>
                Lagre kladd
              </Button>
              <Button size="sm" onClick={() => save("completed")} disabled={saving}>
                <Check className="mr-1.5 h-4 w-4" /> Fullfør
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
