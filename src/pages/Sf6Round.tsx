import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Check, Wind, Plus, History, Trash2, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  sf6Stations,
  findSf6Station,
  createEmptyMeasurements,
  isLevelComplete,
  currentMonthLabel,
  type Sf6Station,
  type Sf6Level,
  type Sf6Measurements,
} from "@/data/sf6Stations";

type View = "list" | "round" | "level" | "view";

interface SavedRound {
  id: string;
  station_id: string;
  station_name: string;
  month_label: string;
  temperature: number;
  technician_name: string;
  measurements: Sf6Measurements;
  unit: string;
  user_id: string;
  created_at: string;
}

function nameFromEmail(email?: string): string {
  if (!email) return "";
  const local = email.split("@")[0];
  return local
    .split(/[._-]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export default function Sf6Round() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [view, setView] = useState<View>("list");
  const [history, setHistory] = useState<SavedRound[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [station, setStation] = useState<Sf6Station | null>(null);
  const [monthLabel, setMonthLabel] = useState(currentMonthLabel());
  const [temperature, setTemperature] = useState<string>("");
  const [measurements, setMeasurements] = useState<Sf6Measurements>({});
  const [activeLevel, setActiveLevel] = useState<Sf6Level | null>(null);
  const [viewingRound, setViewingRound] = useState<SavedRound | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = "SF6 gassrunde – Statnett Verktøy";
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    const { data } = await supabase
      .from("sf6_rounds")
      .select("*")
      .order("created_at", { ascending: false });
    setHistory((data as unknown as SavedRound[]) ?? []);
    setLoadingHistory(false);
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const startRound = (s: Sf6Station) => {
    setStation(s);
    setMonthLabel(currentMonthLabel());
    setTemperature("");
    setMeasurements(createEmptyMeasurements(s));
    setView("round");
  };

  const openLevel = (lvl: Sf6Level) => {
    setActiveLevel(lvl);
    setView("level");
  };

  const setPhase = (kV: string, breaker: string, key: "L1" | "L2" | "L3" | "value", raw: string) => {
    const num = raw === "" ? null : Number(raw.replace(",", "."));
    setMeasurements((prev) => ({
      ...prev,
      [kV]: {
        ...prev[kV],
        [breaker]: { ...prev[kV]?.[breaker], [key]: num },
      },
    }));
  };

  const allComplete = station?.levels.every((l) => isLevelComplete(l, measurements)) ?? false;
  const canFinish = allComplete && temperature.trim() !== "" && monthLabel.trim() !== "";

  const finishRound = async () => {
    if (!station || !user) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      station_id: station.id,
      station_name: station.name,
      month_label: monthLabel.trim(),
      temperature: Number(temperature.replace(",", ".")),
      technician_name: nameFromEmail(user.email),
      measurements: measurements as any,
      unit: "MPa",
    };
    const { data, error } = await supabase
      .from("sf6_rounds")
      .insert(payload)
      .select("*")
      .single();
    setSaving(false);
    if (error) {
      toast({ title: "Feil", description: "Kunne ikke lagre runden.", variant: "destructive" });
      return;
    }
    toast({ title: "Lagret", description: "SF6-runden er fullført." });
    setViewingRound(data as unknown as SavedRound);
    setView("view");
    fetchHistory();
  };

  const deleteRound = async (id: string) => {
    await supabase.from("sf6_rounds").delete().eq("id", id);
    fetchHistory();
    toast({ title: "Slettet", description: "Runden er slettet." });
  };

  const openSaved = (r: SavedRound) => {
    setViewingRound(r);
    const s = findSf6Station(r.station_id);
    if (s) setStation(s);
    setView("view");
  };

  // ─── LIST VIEW ──────────────────────────────────────────
  if (view === "list") {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="mx-auto max-w-2xl px-5 py-4 flex items-center gap-3">
            <button onClick={() => navigate("/stasjon")} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Wind className="h-5 w-5 text-primary" />
              <h1 className="font-display text-lg font-bold">SF6 gassrunde</h1>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-5 py-6 space-y-6">
          <div>
            <h2 className="mb-3 font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Velg stasjon – ny runde
            </h2>
            <div className="space-y-2">
              {sf6Stations.map((s) => (
                <button
                  key={s.id}
                  onClick={() => startRound(s)}
                  className="group flex w-full items-center gap-4 rounded-xl border border-border bg-card px-5 py-5 text-left transition-colors hover:bg-secondary"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-bold">{s.name}</p>
                    <p className="font-body text-xs text-muted-foreground">
                      {s.levels.length} spenningsnivå ·{" "}
                      {s.levels.reduce((n, l) => n + l.breakers.length, 0)} brytere
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-display text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <History className="h-3.5 w-3.5" /> Historikk
            </h2>
            {loadingHistory ? (
              <p className="text-sm text-muted-foreground text-center py-8">Laster...</p>
            ) : history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Ingen runder registrert ennå.
              </p>
            ) : (
              <div className="space-y-2">
                {history.map((r) => {
                  const ownRound = r.user_id === user?.id;
                  return (
                    <Card
                      key={r.id}
                      className="cursor-pointer hover:bg-secondary/50 transition-colors"
                      onClick={() => openSaved(r)}
                    >
                      <CardContent className="flex items-center gap-3 py-3 px-4">
                        <Wind className="h-4 w-4 text-primary shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {r.station_name} · {r.month_label}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {r.technician_name} · {new Date(r.created_at).toLocaleDateString("no-NO")} · {r.temperature}°C
                          </p>
                        </div>
                        {ownRound && (
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteRound(r.id); }}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ─── ROUND (level overview) ─────────────────────────────
  if (view === "round" && station) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="border-b border-border bg-card">
          <div className="mx-auto max-w-2xl px-5 py-4 flex items-center gap-3">
            <button onClick={() => setView("list")} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <Wind className="h-5 w-5 text-primary shrink-0" />
              <h1 className="font-display text-lg font-bold truncate">{station.name}</h1>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-2xl px-5 py-6 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="month">Måned</Label>
              <Input id="month" value={monthLabel} onChange={(e) => setMonthLabel(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="temp">Temperatur (°C)</Label>
              <Input
                id="temp"
                type="number"
                inputMode="decimal"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="f.eks. -5"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Montør: <span className="font-medium text-foreground">{nameFromEmail(user?.email)}</span>
          </p>

          <div>
            <h2 className="mb-3 font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Spenningsnivå
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {station.levels.map((lvl) => {
                const done = isLevelComplete(lvl, measurements);
                return (
                  <button
                    key={lvl.kV}
                    onClick={() => openLevel(lvl)}
                    className={`rounded-xl border-2 px-4 py-5 text-left transition-colors ${
                      done
                        ? "border-green-600 bg-green-50 dark:bg-green-950/30"
                        : "border-border bg-card hover:bg-secondary"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-display text-xl font-bold">{lvl.kV} kV</span>
                      {done && (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {lvl.breakers.length} brytere {done && "· Fullført"}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </main>

        <div className="fixed bottom-0 inset-x-0 border-t border-border bg-card">
          <div className="mx-auto max-w-2xl px-5 py-3 flex items-center gap-3">
            <div className="flex-1 text-xs text-muted-foreground">
              {allComplete ? "Alle nivåer fylt inn" : "Fyll inn alle nivåer for å fullføre"}
            </div>
            <Button onClick={finishRound} disabled={!canFinish || saving} size="sm">
              <Check className="mr-1.5 h-4 w-4" /> Fullfør runde
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── LEVEL FORM ─────────────────────────────────────────
  if (view === "level" && station && activeLevel) {
    const done = isLevelComplete(activeLevel, measurements);
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="border-b border-border bg-card">
          <div className="mx-auto max-w-2xl px-5 py-4 flex items-center gap-3">
            <button onClick={() => setView("round")} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <Wind className="h-5 w-5 text-primary shrink-0" />
              <h1 className="font-display text-lg font-bold truncate">
                {station.name} · {activeLevel.kV} kV
              </h1>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-2xl px-5 py-6">
          <p className="text-xs text-muted-foreground mb-3">
            Fyll inn SF6-nivå i MPa per fase (L1, L2, L3) for hver bryter.
          </p>
          <div className="space-y-2">
            {activeLevel.breakers.map((b) => {
              const vals = measurements[activeLevel.kV]?.[b.name] ?? {};
              return (
                <div
                  key={b.name}
                  className="rounded-lg border border-border bg-card p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-display text-sm font-bold">{b.name}</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {b.singlePhase ? "Enfase" : "3-fase"}
                    </span>
                  </div>
                  {b.singlePhase ? (
                    <div>
                      <Label className="text-xs mb-1 block">Trykk</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          value={vals.value ?? ""}
                          onChange={(e) => setPhase(activeLevel.kV, b.name, "value", e.target.value)}
                          placeholder="0.00"
                          className="pr-14"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground/60">
                          MPa
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {(["L1", "L2", "L3"] as const).map((p) => (
                        <div key={p}>
                          <Label className="text-xs mb-1 block">{p}</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              inputMode="decimal"
                              step="0.01"
                              value={vals[p] ?? ""}
                              onChange={(e) => setPhase(activeLevel.kV, b.name, p, e.target.value)}
                              placeholder="0.00"
                              className="pr-12"
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-muted-foreground/60">
                              MPa
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </main>

        <div className="fixed bottom-0 inset-x-0 border-t border-border bg-card">
          <div className="mx-auto max-w-2xl px-5 py-3 flex items-center gap-3">
            <div className="flex-1 text-xs text-muted-foreground">
              {done ? "Alle brytere er fylt inn" : "Fyll inn alle felt for å markere som fullført"}
            </div>
            <Button onClick={() => setView("round")} size="sm">
              <Check className="mr-1.5 h-4 w-4" /> Fullfør steg
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── VIEW (read-only) ───────────────────────────────────
  if (view === "view" && viewingRound) {
    const r = viewingRound;
    const s = findSf6Station(r.station_id);
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="mx-auto max-w-2xl px-5 py-4 flex items-center gap-3">
            <button
              onClick={() => { setView("list"); setViewingRound(null); }}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <Wind className="h-5 w-5 text-primary shrink-0" />
              <h1 className="font-display text-lg font-bold truncate">
                {r.station_name} · {r.month_label}
              </h1>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-2xl px-5 py-6 space-y-6">
          <Card>
            <CardContent className="py-4 px-4 grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Dato</p>
                <p className="font-medium">{new Date(r.created_at).toLocaleDateString("no-NO")}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Montør</p>
                <p className="font-medium">{r.technician_name}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Temperatur</p>
                <p className="font-medium">{r.temperature}°C</p>
              </div>
            </CardContent>
          </Card>

          {s?.levels.map((lvl) => {
            const allSingle = lvl.breakers.every((b) => b.singlePhase);
            return (
            <div key={lvl.kV}>
              <h2 className="mb-2 font-display text-sm font-bold">{lvl.kV} kV</h2>
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                        Bryter
                      </th>
                      {allSingle ? (
                        <th className="text-center px-3 py-2 font-medium text-xs uppercase tracking-wider text-muted-foreground" colSpan={3}>
                          Felles gasskammer
                        </th>
                      ) : (
                        <>
                          <th className="text-right px-3 py-2 font-medium text-xs uppercase tracking-wider text-muted-foreground">L1</th>
                          <th className="text-right px-3 py-2 font-medium text-xs uppercase tracking-wider text-muted-foreground">L2</th>
                          <th className="text-right px-3 py-2 font-medium text-xs uppercase tracking-wider text-muted-foreground">L3</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {lvl.breakers.map((b) => {
                      const v = r.measurements?.[lvl.kV]?.[b.name] ?? {};
                      if (b.singlePhase) {
                        return (
                          <tr key={b.name} className="border-t border-border">
                            <td className="px-3 py-2 font-medium">{b.name}</td>
                            <td className="px-3 py-2 text-center tabular-nums" colSpan={3}>
                              {v.value ?? "—"} <span className="text-xs text-muted-foreground">MPa</span>
                            </td>
                          </tr>
                        );
                      }
                      return (
                        <tr key={b.name} className="border-t border-border">
                          <td className="px-3 py-2 font-medium">{b.name}</td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {v.L1 ?? "—"} <span className="text-xs text-muted-foreground">MPa</span>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {v.L2 ?? "—"} <span className="text-xs text-muted-foreground">MPa</span>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {v.L3 ?? "—"} <span className="text-xs text-muted-foreground">MPa</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground text-right">Verdier i {r.unit}</p>
            </div>
            );
          })}
        </main>
      </div>
    );
  }

  return null;
}
