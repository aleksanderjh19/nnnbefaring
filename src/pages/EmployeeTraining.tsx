import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Plus, FileText, Trash2, ChevronRight, ChevronDown, Printer,
  Wrench, Car, HardHat, Cpu, Package, Pencil, X, Calendar, User, Building2
} from "lucide-react";
import statnettLogo from "@/assets/statnett-logo.png";

const CATEGORIES = [
  { value: "el_verktoy", label: "El.verktøy", icon: Wrench },
  { value: "kjøretøy", label: "Kjøretøy", icon: Car },
  { value: "utstyr", label: "Utstyr", icon: HardHat },
  { value: "maskin", label: "Maskin", icon: Cpu },
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

const EmployeeTraining = () => {
  const navigate = useNavigate();
  const { employeeId } = useParams<{ employeeId: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [empRes, recRes] = await Promise.all([
      supabase.from("employees").select("*").eq("id", employeeId!).maybeSingle(),
      supabase.from("training_records").select("*").eq("employee_id", employeeId!).order("training_date", { ascending: false }),
    ]);
    if (empRes.data) setEmployee(empRes.data);
    if (recRes.data) setRecords(recRes.data as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [employeeId]);

  const deleteRecord = async (id: string) => {
    if (!confirm("Er du sikker på at du vil slette denne opplæringen?")) return;
    await supabase.from("training_records").delete().eq("id", id);
    if (expandedId === id) setExpandedId(null);
    fetchData();
  };

  const handlePrintAll = () => {
    navigate(`/dokumentert-opplaering/ansatt/${employeeId}/print`);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredRecords = activeFilter
    ? records.filter((r) => r.equipment_category === activeFilter)
    : records;

  const getCategoryInfo = (value: string | null) => {
    return CATEGORIES.find((c) => c.value === value) || CATEGORIES[4];
  };

  const categoryCounts = CATEGORIES.map((cat) => ({
    ...cat,
    count: records.filter((r) => (r.equipment_category || "annet") === cat.value).length,
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
              onClick={() => navigate("/dokumentert-opplaering")}
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
            Opplæringer ({records.length})
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
              Alle ({records.length})
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

        {records.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <FileText className="h-10 w-10 text-muted" />
            <p className="font-body text-sm text-muted-foreground">Ingen opplæringer registrert ennå</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="font-body text-sm text-muted-foreground">Ingen opplæringer i denne kategorien</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRecords.map((rec) => {
              const catInfo = getCategoryInfo(rec.equipment_category);
              const CatIcon = catInfo.icon;
              const isExpanded = expandedId === rec.id;

              return (
                <div
                  key={rec.id}
                  className="overflow-hidden rounded-xl border border-border bg-card"
                >
                  {/* Row header – clickable to expand/collapse */}
                  <div className="flex items-center">
                    <button
                      onClick={() => toggleExpand(rec.id)}
                      className="flex min-w-0 flex-1 items-center gap-4 px-5 py-4 text-left hover:bg-secondary"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                        <CatIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-sm font-bold text-foreground">{rec.equipment_name}</p>
                        <p className="font-body text-xs text-muted-foreground">
                          <span className="font-medium text-foreground/70">{catInfo.label}</span>
                          {rec.equipment_type && ` · ${rec.equipment_type}`}
                          {" · "}
                          {new Date(rec.training_date).toLocaleDateString("nb-NO")} · {rec.trainer_name}
                        </p>
                        <div className="mt-1 flex gap-1.5">
                          {rec.trainee_signature_url ? (
                            <span className="rounded-full bg-success/10 px-2 py-0.5 font-body text-[10px] font-medium text-success">Signert av mottaker</span>
                          ) : (
                            <span className="rounded-full bg-muted px-2 py-0.5 font-body text-[10px] font-medium text-muted-foreground">Mangler signatur</span>
                          )}
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                      )}
                    </button>
                  </div>

                  {/* Expanded preview */}
                  {isExpanded && (
                    <div className="border-t border-border bg-secondary/30 space-y-4">
                      {/* Statnett header */}
                      <div className="flex items-center justify-between bg-[hsl(155,100%,15%)] px-5 py-3">
                        <img src={statnettLogo} alt="Statnett" className="h-5" />
                        <span className="font-display text-xs font-bold text-white/80 tracking-wider uppercase">Dokumentert opplæring</span>
                      </div>
                      <div className="px-5 pb-4 space-y-4">
                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/dokumentert-opplaering/ansatt/${employeeId}/skjema/${rec.id}`)}
                          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 font-body text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Rediger
                        </button>
                        <button
                          onClick={() => deleteRecord(rec.id)}
                          className="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 font-body text-xs font-medium text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Slett
                        </button>
                      </div>

                      {/* Details grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <DetailItem icon={Calendar} label="Opplæringsdato" value={new Date(rec.training_date).toLocaleDateString("nb-NO")} />
                        <DetailItem icon={Package} label="Kategori" value={catInfo.label} />
                        <DetailItem label="Maskin/utstyr" value={rec.equipment_name} />
                        <DetailItem label="Type" value={rec.equipment_type || "–"} />
                        {rec.noise_level_db && <DetailItem label="Lydnivå" value={`${rec.noise_level_db} dB`} />}
                        {rec.vibration_ms2 && <DetailItem label="Vibrasjon" value={`${rec.vibration_ms2} m/s²`} />}
                        <DetailItem icon={User} label="Opplæringsansvarlig" value={rec.trainer_name} />
                        <DetailItem icon={Building2} label="Virksomhet" value={rec.trainer_company || "–"} />
                        <DetailItem label="Bekreftelsestype" value={CONFIRMATION_LABELS[rec.confirmation_type] || rec.confirmation_type} className="col-span-2" />
                        {rec.notes && <DetailItem label="Notater" value={rec.notes} className="col-span-2" />}
                      </div>

                      {/* Photos */}
                      {rec.photo_urls && rec.photo_urls.length > 0 && (
                        <div>
                          <p className="mb-2 font-body text-xs font-medium text-muted-foreground">Bilder</p>
                          <div className="flex flex-wrap gap-2">
                            {rec.photo_urls.map((url, i) => (
                              <img
                                key={i}
                                src={url}
                                alt={`Bilde ${i + 1}`}
                                className="h-20 w-20 rounded-lg border border-border object-cover"
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Signatures */}
                      <div className="grid grid-cols-2 gap-3">
                        <SignaturePreview label={`Signatur – ${employee.name}`} url={rec.trainee_signature_url} />
                        <SignaturePreview label={`Signatur – ${rec.trainer_name}`} url={rec.trainer_signature_url} />
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
