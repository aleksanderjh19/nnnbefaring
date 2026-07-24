import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSmartBack } from "@/hooks/useSmartBack";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Plus, FileText, Trash2, ChevronRight, ChevronDown, Printer,
  Wrench, Car, HardHat, Cpu, Package, Pencil, Calendar, User, Building2, Fuel
} from "lucide-react";
import statnettLogo from "@/assets/statnett-logo.png";
import { useDeletionRequests } from "@/hooks/useDeletionRequests";
import { DeletionRequestBadge } from "@/components/DeletionRequestBadge";

const CATEGORIES = [
  { value: "bensinverktoy", label: "Bensin-/motorverktøy", icon: Fuel },
  { value: "el_verktoy", label: "El.verktøy", icon: Wrench },
  { value: "kjøretøy", label: "Kjøretøy", icon: Car },
  { value: "maskin", label: "Maskin", icon: Cpu },
  { value: "utstyr", label: "Utstyr", icon: HardHat },
  { value: "annet", label: "Annet", icon: Package },
];

const CONFIRMATION_LABELS: Record<string, string> = {
  practical_and_theoretical: "Praktisk og teoretisk opplæring",
  self_study: "Gjennomgang av bruksanvisning",
};

interface Employee {
  id: string;
  name: string;
  department: string | null;
}

interface TrainingRecord {
  id: string;
  equipment_name: string;
  equipment_type: string | null;
  equipment_category: string | null;
  noise_level_db: string | null;
  vibration_ms2: string | null;
  training_date: string;
  trainer_name: string;
  trainer_company: string | null;
  confirmation_type: string;
  notes: string | null;
  photo_urls: string[] | null;
  trainee_signature_url: string | null;
  trainer_signature_url: string | null;
}

interface GroupedEquipment {
  key: string;
  equipment_name: string;
  equipment_category: string | null;
  records: TrainingRecord[];
}

function groupRecords(records: TrainingRecord[]): GroupedEquipment[] {
  const map = new Map<string, GroupedEquipment>();
  for (const rec of records) {
    const key = `${rec.equipment_category || "annet"}::${rec.equipment_name}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        equipment_name: rec.equipment_name,
        equipment_category: rec.equipment_category,
        records: [],
      });
    }
    map.get(key)!.records.push(rec);
  }
  return Array.from(map.values());
}

const EmployeeTraining = () => {
  const navigate = useNavigate();
  const goBack = useSmartBack("/dokumentert-opplaering");
  const { employeeId } = useParams<{ employeeId: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const { isRequested, handleDeleteClick, isAdmin } = useDeletionRequests("training_records");

  const fetchData = async () => {
    setLoading(true);
    const [empRes, recRes] = await Promise.all([
      supabase.from("employees").select("*").eq("id", employeeId!).maybeSingle(),
      supabase.from("training_records").select("*").eq("employee_id", employeeId!).order("training_date", { ascending: false }),
    ]);
    if (empRes.data) {
      setEmployee(empRes.data);
      document.title = `${empRes.data.name} – Opplæring`;
    }
    if (recRes.data) setRecords(recRes.data as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [employeeId]);

  const hardDeleteRecord = async (id: string) => {
    await supabase.from("training_records").delete().eq("id", id);
    fetchData();
  };

  const deleteRecord = async (id: string) => {
    if (isAdmin) {
      if (!confirm("Er du sikker på at du vil slette denne opplæringen?")) return;
    }
    await handleDeleteClick(id, () => hardDeleteRecord(id));
  };

  const handlePrintAll = () => {
    navigate(`/dokumentert-opplaering/ansatt/${employeeId}/print`);
  };

  const grouped = useMemo(() => groupRecords(records), [records]);

  const filteredGroups = activeFilter
    ? grouped.filter((g) => (g.equipment_category || "annet") === activeFilter)
    : grouped;

  const getCategoryInfo = (value: string | null) => {
    return CATEGORIES.find((c) => c.value === value) || CATEGORIES[5];
  };

  const categoryCounts = CATEGORIES.map((cat) => ({
    ...cat,
    count: grouped.filter((g) => (g.equipment_category || "annet") === cat.value).length,
  })).filter((c) => c.count > 0);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-body text-sm text-muted-foreground">Laster...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-body text-sm text-muted-foreground">Ansatt ikke funnet</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-2xl px-5 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={goBack}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-lg font-extrabold text-foreground">{employee.name}</h1>
              <p className="font-body text-xs text-muted-foreground">{employee.department || "Ingen avdeling"}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xs font-bold uppercase tracking-widest text-statnett">
            Skjemaer ({grouped.length})
          </h2>
          <div className="flex gap-2">
            {records.length > 0 && (
              <button
                onClick={handlePrintAll}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 font-body text-xs font-medium text-muted-foreground hover:bg-secondary"
              >
                <Printer className="h-3.5 w-3.5" />
                Skriv ut alle
              </button>
            )}
            <button
              onClick={() => navigate(`/dokumentert-opplaering/ansatt/${employeeId}/ny`)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 font-body text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              Ny opplæring
            </button>
          </div>
        </div>

        {/* Category filter chips */}
        {categoryCounts.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveFilter(null)}
              className={`rounded-lg px-3 py-1.5 font-body text-xs font-medium transition-colors ${
                activeFilter === null
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              Alle ({grouped.length})
            </button>
            {categoryCounts.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveFilter(activeFilter === cat.value ? null : cat.value)}
                className={`rounded-lg px-3 py-1.5 font-body text-xs font-medium transition-colors ${
                  activeFilter === cat.value
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover:bg-secondary"
                }`}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>
        )}

        {grouped.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <FileText className="h-10 w-10 text-muted" />
            <p className="font-body text-sm text-muted-foreground">Ingen opplæringer registrert ennå</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="font-body text-sm text-muted-foreground">Ingen opplæringer i denne kategorien</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredGroups.map((group) => {
              const catInfo = getCategoryInfo(group.equipment_category);
              const CatIcon = catInfo.icon;
              const isExpanded = expandedKey === group.key;
              const typeCount = group.records.length;
              const latestDate = group.records
                .map((r) => r.training_date)
                .sort()
                .reverse()[0];
              const uniqueTrainers = [...new Set(group.records.map((r) => r.trainer_name))];
              const allSigned = group.records.every((r) => r.trainee_signature_url);

              return (
                <div
                  key={group.key}
                  className="overflow-hidden rounded-xl border border-border bg-card"
                >
                  {/* Row header */}
                  <button
                    onClick={() => setExpandedKey(isExpanded ? null : group.key)}
                    className="flex w-full min-w-0 items-center gap-4 px-5 py-4 text-left hover:bg-secondary"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <CatIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-sm font-bold text-foreground">{group.equipment_name}</p>
                      <p className="font-body text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/70">{catInfo.label}</span>
                        {" · "}
                        {typeCount} {typeCount === 1 ? "type" : "typer"}
                        {" · Sist "}
                        {new Date(latestDate).toLocaleDateString("nb-NO")}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {allSigned ? (
                          <span className="rounded-full bg-success/10 px-2 py-0.5 font-body text-[10px] font-medium text-success">Alle signert</span>
                        ) : (
                          <span className="rounded-full bg-muted px-2 py-0.5 font-body text-[10px] font-medium text-muted-foreground">Mangler signaturer</span>
                        )}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                    )}
                  </button>

                  {/* Expanded grouped preview */}
                  {isExpanded && (
                    <div className="border-t border-border bg-secondary/30 space-y-4">
                      {/* Statnett header */}
                      <div className="flex items-center justify-between bg-[hsl(155,100%,15%)] px-5 py-3">
                        <img src={statnettLogo} alt="Statnett" className="h-5" />
                        <span className="font-display text-xs font-bold text-white/80 tracking-wider uppercase">Dokumentert opplæring</span>
                      </div>

                      <div className="px-5 pb-4 space-y-4">
                        {/* Action: add new type for this equipment */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/dokumentert-opplaering/ansatt/${employeeId}/ny?equipment=${encodeURIComponent(group.equipment_name)}&category=${encodeURIComponent(group.equipment_category || "annet")}`)}
                            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 font-body text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Legg til ny type
                          </button>
                        </div>

                        {/* Category & equipment info */}
                        <div className="grid grid-cols-2 gap-3">
                          <DetailItem icon={Package} label="Kategori" value={catInfo.label} />
                          <DetailItem label="Maskin/utstyr" value={group.equipment_name} />
                        </div>

                        {/* Equipment types table */}
                        <div>
                          <p className="mb-2 font-body text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            Opplærte typer ({group.records.length})
                          </p>
                          <div className="overflow-hidden rounded-lg border border-border">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-muted/50">
                                  <th className="px-3 py-2 text-left font-body text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Type</th>
                                  <th className="px-3 py-2 text-left font-body text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Dato</th>
                                  <th className="px-3 py-2 text-left font-body text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Lydnivå</th>
                                  <th className="px-3 py-2 text-left font-body text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Vibrasjon</th>
                                  <th className="px-3 py-2 text-left font-body text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Instruktør</th>
                                  <th className="px-3 py-2 text-right font-body text-[10px] font-medium uppercase tracking-wider text-muted-foreground"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.records.map((rec) => (
                                  <tr key={rec.id} className="border-t border-border">
                                    <td className="px-3 py-2 font-body text-sm font-medium text-foreground">{rec.equipment_type || "–"}</td>
                                    <td className="px-3 py-2 font-body text-xs text-muted-foreground">{new Date(rec.training_date).toLocaleDateString("nb-NO")}</td>
                                    <td className="px-3 py-2 font-body text-xs text-muted-foreground">{rec.noise_level_db ? `${rec.noise_level_db} dB` : "–"}</td>
                                    <td className="px-3 py-2 font-body text-xs text-muted-foreground">{rec.vibration_ms2 ? `${rec.vibration_ms2} m/s²` : "–"}</td>
                                    <td className="px-3 py-2 font-body text-xs text-muted-foreground">{rec.trainer_name}</td>
                                    <td className="px-3 py-2 text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        <button
                                          onClick={() => navigate(`/dokumentert-opplaering/ansatt/${employeeId}/skjema/${rec.id}`)}
                                          className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                                          title="Rediger"
                                        >
                                          <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          onClick={() => deleteRecord(rec.id)}
                                          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                          title="Slett"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Confirmation type (use most common) */}
                        <DetailItem
                          label="Bekreftelsestype"
                          value={CONFIRMATION_LABELS[group.records[0].confirmation_type] || group.records[0].confirmation_type}
                          className="col-span-2"
                        />

                        {/* Notes from all records */}
                        {group.records.some((r) => r.notes) && (
                          <div>
                            <p className="mb-1 font-body text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Notater</p>
                            {group.records.filter((r) => r.notes).map((r) => (
                              <p key={r.id} className="font-body text-sm text-foreground">
                                <span className="text-muted-foreground">{r.equipment_type || "Generelt"}:</span> {r.notes}
                              </p>
                            ))}
                          </div>
                        )}

                        {/* Photos from all records */}
                        {group.records.some((r) => r.photo_urls && r.photo_urls.length > 0) && (
                          <div>
                            <p className="mb-2 font-body text-xs font-medium text-muted-foreground">Bilder</p>
                            <div className="flex flex-wrap gap-2">
                              {group.records.flatMap((r) => r.photo_urls || []).map((url, i) => (
                                <img key={i} src={url} alt={`Bilde ${i + 1}`} className="h-20 w-20 rounded-lg border border-border object-cover" />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Signatures – show all unique trainers + trainee */}
                        <div>
                          <p className="mb-2 font-body text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Signaturer</p>
                          <div className="grid grid-cols-2 gap-3">
                            {/* Trainee signature (use first available) */}
                            <SignaturePreview
                              label={`Signatur – ${employee.name}`}
                              url={group.records.find((r) => r.trainee_signature_url)?.trainee_signature_url || null}
                            />
                            {/* Each unique trainer gets their own signature block */}
                            {uniqueTrainers.map((trainerName) => {
                              const trainerRec = group.records.find((r) => r.trainer_name === trainerName && r.trainer_signature_url);
                              return (
                                <SignaturePreview
                                  key={trainerName}
                                  label={`Signatur – ${trainerName}`}
                                  url={trainerRec?.trainer_signature_url || null}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

function DetailItem({ icon: Icon, label, value, className }: { icon?: any; label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="flex items-center gap-1 font-body text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <p className="mt-0.5 font-body text-sm text-foreground">{value}</p>
    </div>
  );
}

function SignaturePreview({ label, url }: { label: string; url: string | null }) {
  return (
    <div>
      <p className="mb-1 font-body text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      {url ? (
        <img src={url} alt={label} className="h-16 rounded-lg border border-border bg-background object-contain p-1" />
      ) : (
        <p className="font-body text-xs italic text-muted-foreground">Ikke signert</p>
      )}
    </div>
  );
}

export default EmployeeTraining;
