import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Check, Wind, Plus, History, Trash2, ChevronRight, AlertCircle, Camera,
} from "lucide-react";
import Sf6BreakerPhotos, { type Sf6PhotoRow } from "@/components/sf6/Sf6BreakerPhotos";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  sf6Stations,
  findSf6Station,
  createEmptyMeasurements,
  getLevelStatus,
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
  temperature: number | null;
  technician_name: string;
  measurements: Sf6Measurements;
  unit: string;
  user_id: string;
  status: string;
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

function breakerUnit(kV: string, breakerName: string): string {
  if (kV === "132" && breakerName === "T7E") return "Bar";
  return "MPa";
}

export default function Sf6Round() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [view, setView] = useState<View>("list");
  const [history, setHistory] = useState<SavedRound[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [station, setStation] = useState<Sf6Station | null>(null);
  const [activeRoundId, setActiveRoundId] = useState<string | null>(null);
  const [monthLabel, setMonthLabel] = useState(currentMonthLabel());
  const [temperature, setTemperature] = useState<string>("");
  const [tempError, setTempError] = useState<string | null>(null);
  const [measurements, setMeasurements] = useState<Sf6Measurements>({});
  const [activeLevel, setActiveLevel] = useState<Sf6Level | null>(null);
  const [viewingRound, setViewingRound] = useState<SavedRound | null>(null);
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);
  const [greenBreakers, setGreenBreakers] = useState<Set<string>>(new Set());
  const [activeBreaker, setActiveBreaker] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavedRound | null>(null);

  // Photos keyed by "{kV}::{breakerName}"
  const [photos, setPhotos] = useState<Record<string, Sf6PhotoRow[]>>({});
  const [photoDialog, setPhotoDialog] = useState<{ kV: string; breaker: string } | null>(null);

  const photosKey = (kV: string, breaker: string) => `${kV}::${breaker}`;

  const loadPhotos = useCallback(async (roundId: string) => {
    const { data } = await supabase
      .from("sf6_round_photos")
      .select("id, voltage_level, breaker_name, storage_path, created_at")
      .eq("round_id", roundId)
      .order("created_at", { ascending: true });
    const grouped: Record<string, Sf6PhotoRow[]> = {};
    for (const row of (data ?? []) as any[]) {
      const k = photosKey(row.voltage_level, row.breaker_name);
      (grouped[k] ??= []).push({
        id: row.id,
        storage_path: row.storage_path,
        created_at: row.created_at,
      });
    }
    setPhotos(grouped);
  }, []);

  const handleBreakerClick = (key: string) => {
    if (activeBreaker === key) return;
    setGreenBreakers((prev) => {
      const next = new Set(prev);
      if (activeBreaker) next.add(activeBreaker);
      next.delete(key);
      return next;
    });
    setActiveBreaker(key);
  };

  const resetBreakerMarks = () => {
    setGreenBreakers(new Set());
    setActiveBreaker(null);
  };

  useEffect(() => {
    document.title = "SF6 gassrunde – Statnett Verktøy";
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    const { data } = await supabase
      .from("sf6_rounds")
      .select("*")
      .order("created_at", { ascending: false });
    const rows = (data as unknown as SavedRound[]) ?? [];
    // Pågående øverst, deretter fullførte
    rows.sort((a, b) => {
      if (a.status !== b.status) return a.status === "in_progress" ? -1 : 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    setHistory(rows);
    setLoadingHistory(false);
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const startRound = async (s: Sf6Station) => {
    if (!user || starting) return;
    setStarting(true);
    const initialMonth = currentMonthLabel();
    const initialMeas = createEmptyMeasurements(s);
    const { data, error } = await supabase
      .from("sf6_rounds")
      .insert({
        user_id: user.id,
        station_id: s.id,
        station_name: s.name,
        month_label: initialMonth,
        temperature: null,
        technician_name: nameFromEmail(user.email),
        measurements: initialMeas as any,
        unit: "MPa",
        status: "in_progress",
      })
      .select("*")
      .single();
    setStarting(false);
    if (error || !data) {
      toast({ title: "Feil", description: "Kunne ikke starte runden.", variant: "destructive" });
      return;
    }
    setStation(s);
    setActiveRoundId((data as any).id);
    setMonthLabel(initialMonth);
    setTemperature("");
    setTempError(null);
    setMeasurements(initialMeas);
    setPhotos({});
    loadPhotos((data as any).id);
    setView("round");
    fetchHistory();
  };

  const saveProgress = async (extra?: Partial<{ status: string }>) => {
    if (!activeRoundId) return null;
    setSaving(true);
    const payload: any = {
      month_label: monthLabel.trim() || currentMonthLabel(),
      temperature: temperature.trim() === "" ? null : Number(temperature.replace(",", ".")),
      measurements: measurements as any,
      ...(extra ?? {}),
    };
    const { data, error } = await supabase
      .from("sf6_rounds")
      .update(payload)
      .eq("id", activeRoundId)
      .select("*")
      .single();
    setSaving(false);
    if (error) {
      toast({ title: "Feil", description: "Kunne ikke lagre.", variant: "destructive" });
      return null;
    }
    return data as unknown as SavedRound;
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

  const canFinish = monthLabel.trim() !== "";

  const finishRound = async () => {
    if (!station || !user) return;
    if (monthLabel.trim() === "") {
      toast({ title: "Måned mangler", description: "Fyll inn måned for å fullføre.", variant: "destructive" });
      return;
    }
    const tempNum = temperature.trim() === "" ? null : Number(temperature.replace(",", "."));
    if (tempNum === null || Number.isNaN(tempNum)) {
      setTempError("Temperatur er påkrevd. Fyll inn.");
      toast({ title: "Temperatur mangler", description: "Temperatur er påkrevd. Fyll inn.", variant: "destructive" });
      document.getElementById("temp")?.focus();
      return;
    }
    setTempError(null);
    const saved = await saveProgress({ status: "completed" });
    if (!saved) return;
    toast({ title: "Lagret", description: "SF6-runden er fullført." });
    setViewingRound(saved);
    resetBreakerMarks();
    setView("view");
    fetchHistory();
  };

  const requestDelete = (r: SavedRound) => setDeleteTarget(r);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from("sf6_rounds").delete().eq("id", deleteTarget.id);
    setDeleteTarget(null);
    fetchHistory();
    toast({ title: "Slettet", description: "Runden er slettet." });
  };

  const openSaved = (r: SavedRound) => {
    const s = findSf6Station(r.station_id);
    if (!s) return;
    setStation(s);
    resetBreakerMarks();
    if (r.status === "in_progress") {
      // Gjenoppta redigering
      setActiveRoundId(r.id);
      setMonthLabel(r.month_label);
      setTemperature(r.temperature == null ? "" : String(r.temperature));
      setTempError(null);
      // Sørg for at alle brytere finnes i measurements-objektet
      const base = createEmptyMeasurements(s);
      const merged: Sf6Measurements = { ...base };
      for (const kV of Object.keys(base)) {
        merged[kV] = { ...base[kV], ...(r.measurements?.[kV] ?? {}) };
      }
      setMeasurements(merged);
      loadPhotos(r.id);
      setView("round");
    } else {
      setViewingRound(r);
      loadPhotos(r.id);
      setView("view");
    }
  };

  const backFromRound = async () => {
    await saveProgress();
    setActiveRoundId(null);
    setView("list");
  };

  const backFromLevel = async () => {
    await saveProgress();
    setView("round");
  };

  // ─── LIST VIEW ──────────────────────────────────────────
  if (view === "list") {
    return (
      <>
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
                    disabled={starting}
                    className="group flex w-full items-center gap-4 rounded-xl border border-border bg-card px-5 py-5 text-left transition-colors hover:bg-secondary disabled:opacity-60"
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
                    const inProgress = r.status === "in_progress";
                    return (
                      <Card
                        key={r.id}
                        className={`cursor-pointer hover:bg-secondary/50 transition-colors ${
                          inProgress ? "border-amber-500/60" : ""
                        }`}
                        onClick={() => openSaved(r)}
                      >
                        <CardContent className="flex items-center gap-3 py-3 px-4">
                          <Wind className="h-4 w-4 text-primary shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                              {r.station_name} · {r.month_label}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {r.technician_name} · {new Date(r.created_at).toLocaleDateString("no-NO")}
                              {r.temperature != null && ` · ${r.temperature}°C`}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              inProgress
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                : "bg-green-500/15 text-green-700 dark:text-green-400"
                            }`}
                          >
                            {inProgress ? "Pågående" : "Fullført"}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); requestDelete(r); }}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label="Slett runde"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        </div>

        <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Er du helt sikker på at du vil slette runden?</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteTarget && (
                  <>
                    {deleteTarget.station_name} · {deleteTarget.month_label} ({deleteTarget.status === "in_progress" ? "Pågående" : "Fullført"}).
                    Dette kan ikke angres.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Avbryt</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Slett runde
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // ─── ROUND (level overview) ─────────────────────────────
  if (view === "round" && station) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="border-b border-border bg-card">
          <div className="mx-auto max-w-2xl px-5 py-4 flex items-center gap-3">
            <button onClick={backFromRound} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <Wind className="h-5 w-5 text-primary shrink-0" />
              <h1 className="font-display text-lg font-bold truncate">{station.name}</h1>
            </div>
            <span className="ml-auto shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400">
              Pågående
            </span>
          </div>
        </header>

        <main className="mx-auto max-w-2xl px-5 py-6 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="month">Måned</Label>
              <Input
                id="month"
                value={monthLabel}
                onChange={(e) => setMonthLabel(e.target.value)}
                onBlur={() => saveProgress()}
              />
            </div>
            <div>
              <Label htmlFor="temp">Temperatur (°C) <span className="text-destructive">*</span></Label>
              <Input
                id="temp"
                type="number"
                inputMode="decimal"
                step="0.1"
                value={temperature}
                onChange={(e) => { setTemperature(e.target.value); setTempError(null); }}
                onBlur={() => saveProgress()}
                placeholder="f.eks. -5"
                className={tempError ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {tempError && (
                <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {tempError}
                </p>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Montør: <span className="font-medium text-foreground">{nameFromEmail(user?.email)}</span>
            <span className="ml-2 text-muted-foreground/70">
              (Auto-lagres som pågående)
            </span>
          </p>

          <div>
            <h2 className="mb-3 font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Spenningsnivå
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {station.levels.map((lvl) => {
                const status = getLevelStatus(lvl, measurements);
                const styles =
                  status === "complete"
                    ? "border-green-600 bg-green-50 dark:bg-green-950/30"
                    : status === "partial"
                    ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30"
                    : "border-border bg-card hover:bg-secondary";
                return (
                  <button
                    key={lvl.kV}
                    onClick={() => openLevel(lvl)}
                    className={`rounded-xl border-2 px-4 py-5 text-left transition-colors ${styles}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-display text-xl font-bold">{lvl.kV} kV</span>
                      {status === "complete" && (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                      {status === "partial" && (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white">
                          <AlertCircle className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {lvl.breakers.length} brytere
                      {status === "complete" && " · Fullført"}
                      {status === "partial" && " · Delvis utført"}
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
              {temperature.trim() === "" || Number.isNaN(Number(temperature.replace(",", ".")))
                ? "Temperatur er påkrevd."
                : canFinish
                ? "Klar til å fullføre. Delvis utfylte nivåer lagres som de er."
                : "Fyll inn måned for å fullføre"}
            </div>
            <Button onClick={finishRound} disabled={saving} size="sm">
              <Check className="mr-1.5 h-4 w-4" /> Fullfør runde
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── LEVEL FORM ─────────────────────────────────────────
  if (view === "level" && station && activeLevel) {
    const status = getLevelStatus(activeLevel, measurements);
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="border-b border-border bg-card">
          <div className="mx-auto max-w-2xl px-5 py-4 flex items-center gap-3">
            <button onClick={backFromLevel} className="text-muted-foreground hover:text-foreground">
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
            Fyll inn SF6-nivå per fase (L1, L2, L3) for hver bryter. Benevnelse er MPa, med unntak av T7E (132 kV) som bruker Bar. Du kan fullføre steget selv om noen felt er tomme.
          </p>
          <div className="space-y-2">
            {activeLevel.breakers.map((b) => {
              const vals = measurements[activeLevel.kV]?.[b.name] ?? {};
              const pKey = photosKey(activeLevel.kV, b.name);
              const bPhotos = photos[pKey] ?? [];
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
                  <div className="flex items-end gap-3">
                    <div className="flex-1 min-w-0">
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
                              {breakerUnit(activeLevel.kV, b.name)}
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
                                  {breakerUnit(activeLevel.kV, b.name)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setPhotoDialog({ kV: activeLevel.kV, breaker: b.name })}
                      className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition-colors ${
                        bPhotos.length > 0
                          ? "border-primary/50 bg-primary/10 text-primary hover:bg-primary/15"
                          : "border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                      aria-label="Bilder"
                      title="Legg til / se bilder"
                    >
                      <Camera className="h-4 w-4" />
                      {bPhotos.length > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                          {bPhotos.length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        <div className="fixed bottom-0 inset-x-0 border-t border-border bg-card">
          <div className="mx-auto max-w-2xl px-5 py-3 flex items-center gap-3">
            <div className="flex-1 text-xs text-muted-foreground">
              {status === "complete" && "Alle brytere er fylt inn"}
              {status === "partial" && "Delvis utfylt – lagres som «Delvis utført»"}
              {status === "empty" && "Ingen felt utfylt ennå"}
            </div>
            <Button onClick={backFromLevel} size="sm" disabled={saving}>
              <Check className="mr-1.5 h-4 w-4" /> Fullfør steg
            </Button>
          </div>
        </div>
        {renderPhotoDialog(false)}
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
                <p className="font-medium">{r.temperature != null ? `${r.temperature}°C` : "—"}</p>
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
                        <th className="text-center px-3 py-2 font-medium text-xs uppercase tracking-wider text-muted-foreground w-14">
                          Bilder
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {lvl.breakers.map((b) => {
                        const v = r.measurements?.[lvl.kV]?.[b.name] ?? {};
                        const key = `${lvl.kV}::${b.name}`;
                        const isActive = activeBreaker === key;
                        const isGreen = greenBreakers.has(key);
                        const bPhotos = photos[photosKey(lvl.kV, b.name)] ?? [];
                        const rowClass = `border-t border-border cursor-pointer transition-colors ${
                          isActive
                            ? "bg-amber-500/30 hover:bg-amber-500/35"
                            : isGreen
                            ? "bg-green-500/25 hover:bg-green-500/30"
                            : "hover:bg-secondary/50"
                        }`;
                        const photoCell = (
                          <td className="px-2 py-2 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPhotoDialog({ kV: lvl.kV, breaker: b.name });
                              }}
                              className={`relative inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${
                                bPhotos.length > 0
                                  ? "border-primary/50 bg-primary/10 text-primary hover:bg-primary/15"
                                  : "border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"
                              }`}
                              aria-label="Se bilder"
                            >
                              <Camera className="h-3.5 w-3.5" />
                              {bPhotos.length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                                  {bPhotos.length}
                                </span>
                              )}
                            </button>
                          </td>
                        );
                        if (b.singlePhase) {
                          return (
                            <tr key={b.name} className={rowClass} onClick={() => handleBreakerClick(key)}>
                              <td className="px-3 py-2 font-medium">{b.name}</td>
                              <td className="px-3 py-2 text-center tabular-nums" colSpan={3}>
                                {v.value ?? "—"} <span className="text-xs text-muted-foreground">{breakerUnit(lvl.kV, b.name)}</span>
                              </td>
                              {photoCell}
                            </tr>
                          );
                        }
                        return (
                          <tr key={b.name} className={rowClass} onClick={() => handleBreakerClick(key)}>
                            <td className="px-3 py-2 font-medium">{b.name}</td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {v.L1 ?? "—"} <span className="text-xs text-muted-foreground">{breakerUnit(lvl.kV, b.name)}</span>
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {v.L2 ?? "—"} <span className="text-xs text-muted-foreground">{breakerUnit(lvl.kV, b.name)}</span>
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {v.L3 ?? "—"} <span className="text-xs text-muted-foreground">{breakerUnit(lvl.kV, b.name)}</span>
                            </td>
                            {photoCell}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground text-right">Verdier i MPa{lvl.breakers.some((b) => b.name === "T7E") ? " (T7E: Bar)" : ""}</p>
              </div>
            );
          })}
        </main>
        {renderPhotoDialog(true)}
      </div>
    );
  }

  return null;
}
