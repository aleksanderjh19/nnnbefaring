import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Download, Zap, Plus, History, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import StationSetup from "@/components/voltage-round/StationSetup";
import TransformerConfig from "@/components/voltage-round/TransformerConfig";
import MeasurementInput from "@/components/voltage-round/MeasurementInput";
import ResultsView from "@/components/voltage-round/ResultsView";
import {
  VoltageRoundData,
  createEmptyInstrument,
  createEmptyMeasurements,
  calculateDeviations,
} from "@/components/voltage-round/types";

const STEPS = [
  { label: "Stasjon", icon: "1" },
  { label: "Felt", icon: "2" },
  { label: "Målinger", icon: "3" },
  { label: "Resultater", icon: "4" },
];

function createEmptyRound(): VoltageRoundData {
  return {
    stationName: "",
    voltageLevel: "300",
    secondaryVoltage: 63.5,
    date: new Date().toISOString().slice(0, 10),
    signNames: "",
    refInstrument: createEmptyInstrument(),
    measInstrument: createEmptyInstrument(),
    transformers: [],
    measurements: {},
    comments: "",
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
  const [view, setView] = useState<"list" | "wizard">("list");
  const [step, setStep] = useState(0);
  const [data, setData] = useState<VoltageRoundData>(createEmptyRound);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<SavedRound[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    document.title = "Spenningsrunde – NNN Verktøy";
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    const { data: rows } = await supabase
      .from("voltage_rounds")
      .select("id, station_name, voltage_level, date, status, created_at")
      .order("created_at", { ascending: false });
    setHistory((rows as SavedRound[]) ?? []);
    setLoadingHistory(false);
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const updateData = (partial: Partial<VoltageRoundData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  const startNew = () => {
    setData(createEmptyRound());
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
    setData({
      stationName: r.station_name,
      voltageLevel: r.voltage_level,
      secondaryVoltage: Number(r.secondary_voltage),
      date: r.date,
      signNames: r.sign_names ?? "",
      refInstrument: r.ref_instrument ?? createEmptyInstrument(),
      measInstrument: r.meas_instrument ?? createEmptyInstrument(),
      transformers: r.transformers ?? [],
      measurements: r.measurements ?? {},
      comments: r.comments ?? "",
    });
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
    const payload = {
      station_name: data.stationName,
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
      toast({ title: "Lagret", description: status === "completed" ? "Spenningsrunden er fullført." : "Kladd lagret." });
      fetchHistory();
    }
    setSaving(false);
  };

  const canAdvance = () => {
    if (step === 0) return data.stationName.trim().length > 0;
    if (step === 1) return data.transformers.length >= 2;
    return true;
  };

  const next = () => {
    if (step === 1) {
      // Ensure measurements object has entries for all transformers
      const updated = createEmptyMeasurements(data.transformers);
      // Merge existing measurements
      for (const t of data.transformers) {
        if (data.measurements[t.id]) {
          updated[t.id] = data.measurements[t.id];
        }
      }
      setData((prev) => ({ ...prev, measurements: updated }));
    }
    setStep((s) => Math.min(s + 1, 3));
  };

  if (view === "list") {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="mx-auto max-w-2xl px-5 py-4 flex items-center gap-3">
            <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <h1 className="font-display text-lg font-bold">Spenningsrunde</h1>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-5 py-6 space-y-4">
          <Button onClick={startNew} className="w-full">
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
                <Card key={r.id} className="cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => loadRound(r.id)}>
                  <CardContent className="flex items-center gap-3 py-3 px-4">
                    <Zap className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {r.station_name} {r.voltage_level}kV
                      </p>
                      <p className="text-xs text-muted-foreground">{r.date}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      r.status === "completed"
                        ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {r.status === "completed" ? "Fullført" : "Kladd"}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteRound(r.id); }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-2xl px-5 py-4">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => { save(); setView("list"); }}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <h1 className="font-display text-lg font-bold">
                {data.stationName || "Ny spenningsrunde"}
              </h1>
            </div>
          </div>
          {/* Step indicator */}
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
        {step === 0 && <StationSetup data={data} onChange={updateData} />}
        {step === 1 && (
          <TransformerConfig
            transformers={data.transformers}
            onChange={(t) => updateData({ transformers: t })}
          />
        )}
        {step === 2 && (
          <MeasurementInput
            transformers={data.transformers}
            measurements={data.measurements}
            onChange={(m) => updateData({ measurements: m })}
          />
        )}
        {step === 3 && (
          <ResultsView
            transformers={data.transformers}
            measurements={data.measurements}
            secondaryVoltage={data.secondaryVoltage}
            comments={data.comments}
            onCommentsChange={(c) => updateData({ comments: c })}
          />
        )}
      </main>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 inset-x-0 border-t border-border bg-card">
        <div className="mx-auto max-w-2xl px-5 py-3 flex items-center gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)} size="sm">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Tilbake
            </Button>
          )}
          <div className="flex-1" />
          {step < 3 ? (
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
