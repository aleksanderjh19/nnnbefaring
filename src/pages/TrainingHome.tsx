import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Plus, Users, ChevronRight, RefreshCw, Search, Settings, UserX, UserCheck, BookOpen, Wrench, ClipboardPlus, User } from "lucide-react";
import heroVideo from "@/assets/hero-video.mp4";

interface Employee {
  id: string;
  name: string;
  department: string | null;
  active: boolean;
  created_at: string;
  user_id: string | null;
}

const TrainingHome = () => {
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDept, setNewDept] = useState("");
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [recordCounts, setRecordCounts] = useState<Record<string, number>>({});
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [myEmployee, setMyEmployee] = useState<Employee | null>(null);
  const [showProfilePicker, setShowProfilePicker] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    const { data } = await supabase.from("employees").select("*").order("name");
    if (data) {
      const emps = data as Employee[];
      setEmployees(emps);

      // Find linked employee for current user
      if (user) {
        const linked = emps.find((e) => e.user_id === user.id);
        setMyEmployee(linked || null);
        if (!linked && !isAdmin) {
          setShowProfilePicker(true);
        }
      }
    }

    const { data: records } = await supabase.from("training_records").select("employee_id");
    if (records) {
      const counts: Record<string, number> = {};
      records.forEach((r) => {
        counts[r.employee_id] = (counts[r.employee_id] || 0) + 1;
      });
      setRecordCounts(counts);
    }
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Dokumentert Opplæring – Statnett";
    fetchEmployees();
  }, [user]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.from("employees").insert({
      name: newName.trim(),
      department: newDept.trim() || null,
      created_by: session?.user.id,
    });
    setNewName("");
    setNewDept("");
    setShowAdd(false);
    fetchEmployees();
  };

  const toggleActive = async (emp: Employee) => {
    setTogglingId(emp.id);
    await supabase.from("employees").update({ active: !emp.active } as any).eq("id", emp.id);
    setEmployees((prev) =>
      prev.map((e) => (e.id === emp.id ? { ...e, active: !e.active } : e))
    );
    setTogglingId(null);
  };

  const linkProfile = async (empId: string) => {
    await supabase.from("employees").update({ user_id: user?.id } as any).eq("id", empId);
    setShowProfilePicker(false);
    fetchEmployees();
  };

  const filtered = employees
    .filter((e) => showInactive || e.active)
    .filter(
      (e) =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        (e.department && e.department.toLowerCase().includes(search.toLowerCase()))
    );

  const activeCount = filtered.filter((e) => e.active).length;
  const inactiveCount = filtered.filter((e) => !e.active).length;

  // Non-admin user view with big action buttons
  if (!isAdmin && !loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="mx-auto max-w-2xl px-5 py-6 space-y-4">
            <div className="relative w-full overflow-hidden rounded-xl shadow-lg" style={{ aspectRatio: "4/1" }}>
              <video src={heroVideo} autoPlay loop muted playsInline className="absolute inset-0 h-full w-full scale-150 object-cover" />
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-secondary" title="Tilbake">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-xl font-extrabold tracking-tight text-foreground">Dokumentert Opplæring</h1>
                <p className="font-body text-xs text-muted-foreground">
                  {myEmployee ? `Velkommen, ${myEmployee.name}` : "Koble profilen din for å komme i gang"}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-2xl px-5 py-8">
          {/* Profile picker for unlinked users */}
          {showProfilePicker && !myEmployee && (
            <div className="mb-8 rounded-2xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-foreground">Velg din profil</h2>
                  <p className="font-body text-xs text-muted-foreground">Koble kontoen din til din ansattprofil</p>
                </div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {employees.filter(e => e.active && !e.user_id).map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => linkProfile(emp.id)}
                    className="flex w-full items-center gap-3 rounded-xl border border-border px-4 py-3 text-left transition-all hover:bg-secondary hover:border-primary/30"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 font-display text-sm font-bold text-primary">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-display text-sm font-bold text-foreground">{emp.name}</p>
                      <p className="font-body text-xs text-muted-foreground">{emp.department || "Ingen avdeling"}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Big action buttons */}
          {myEmployee && (
            <div className="space-y-4">
              <button
                onClick={() => navigate(`/dokumentert-opplaering/ansatt/${myEmployee.id}`)}
                className="group flex w-full items-center gap-5 rounded-2xl border-2 border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-display text-lg font-bold text-foreground">Se min opplæring</h3>
                  <p className="font-body text-sm text-muted-foreground">
                    Se all dokumentert opplæring registrert på deg
                    {recordCounts[myEmployee.id] ? ` · ${recordCounts[myEmployee.id]} registrering${recordCounts[myEmployee.id] !== 1 ? "er" : ""}` : ""}
                  </p>
                </div>
                <ChevronRight className="h-6 w-6 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => navigate(`/dokumentert-opplaering/ansatt/${myEmployee.id}/ny`)}
                className="group flex w-full items-center gap-5 rounded-2xl border-2 border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent/10 transition-colors group-hover:bg-accent/20">
                  <ClipboardPlus className="h-8 w-8 text-accent" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-display text-lg font-bold text-foreground">Legg til opplæring</h3>
                  <p className="font-body text-sm text-muted-foreground">Registrer ny dokumentert opplæring</p>
                </div>
                <ChevronRight className="h-6 w-6 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => navigate("/dokumentert-opplaering/katalog")}
                className="group flex w-full items-center gap-5 rounded-2xl border-2 border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--success))]/10 transition-colors group-hover:bg-[hsl(var(--success))]/20">
                  <Wrench className="h-8 w-8 text-[hsl(var(--success))]" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-display text-lg font-bold text-foreground">Utstyrskatalog</h3>
                  <p className="font-body text-sm text-muted-foreground">Se oversikt over alt utstyr og spesifikasjoner</p>
                </div>
                <ChevronRight className="h-6 w-6 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          )}

          {!myEmployee && !showProfilePicker && (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <User className="h-12 w-12 text-muted" />
              <p className="font-body text-sm text-muted-foreground">Ingen profil koblet ennå</p>
              <button onClick={() => setShowProfilePicker(true)} className="rounded-xl bg-primary px-6 py-3 font-body text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                Koble min profil
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Admin view (original)
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-2xl px-5 py-6 space-y-4">
          <div className="relative w-full overflow-hidden rounded-xl shadow-lg" style={{ aspectRatio: "4/1" }}>
            <video src={heroVideo} autoPlay loop muted playsInline className="absolute inset-0 h-full w-full scale-150 object-cover" />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-secondary" title="Tilbake">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-xl font-extrabold tracking-tight text-foreground">Dokumentert Opplæring</h1>
              <p className="font-body text-xs text-muted-foreground">Velg ansatt for å administrere opplæring</p>
            </div>
            <button onClick={() => window.location.reload()} className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-secondary sm:hidden" title="Oppdater">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-5">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Søk etter ansatt..." className="h-10 w-full rounded-xl border border-input bg-card pl-10 pr-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xs font-bold uppercase tracking-widest text-statnett">
            Ansatte ({activeCount}{showInactive && inactiveCount > 0 ? ` + ${inactiveCount} inaktive` : ""})
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setShowInactive(!showInactive)} className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 font-body text-xs font-medium transition-colors ${showInactive ? "border-primary/30 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary"}`}>
              <UserX className="h-3.5 w-3.5" />
              Inaktive
            </button>
            <button onClick={() => navigate("/dokumentert-opplaering/katalog")} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 font-body text-xs font-medium text-muted-foreground hover:bg-secondary">
              <Settings className="h-3.5 w-3.5" />
              Utstyrskatalog
            </button>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 font-body text-xs font-semibold text-primary-foreground hover:bg-primary/90">
              <Plus className="h-3.5 w-3.5" />
              Ny ansatt
            </button>
          </div>
        </div>

        {showAdd && (
          <div className="mb-4 rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="font-display text-sm font-bold text-foreground">Legg til ansatt</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block font-body text-xs text-muted-foreground">Navn *</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ola Nordmann" className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="mb-1 block font-body text-xs text-muted-foreground">Avdeling</label>
                <input value={newDept} onChange={(e) => setNewDept(e.target.value)} placeholder="Drift" className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAdd(false)} className="rounded-lg border border-border px-4 py-2 font-body text-sm text-muted-foreground hover:bg-secondary">Avbryt</button>
              <button onClick={handleAdd} className="rounded-lg bg-primary px-4 py-2 font-body text-sm font-semibold text-primary-foreground hover:bg-primary/90">Legg til</button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="py-8 text-center font-body text-sm text-muted-foreground">Laster...</p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Users className="h-10 w-10 text-muted" />
            <p className="font-body text-sm text-muted-foreground">{search ? "Ingen ansatte funnet" : "Ingen ansatte lagt til ennå"}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((emp) => (
              <div key={emp.id} className={`group flex w-full items-center gap-4 rounded-xl border bg-card px-5 py-4 transition-colors ${emp.active ? "border-border hover:bg-secondary" : "border-border/50 opacity-60"}`}>
                <button onClick={() => navigate(`/dokumentert-opplaering/ansatt/${emp.id}`)} className="flex flex-1 items-center gap-4 text-left min-w-0">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-display text-sm font-bold ${emp.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-display text-sm font-bold text-foreground">{emp.name}</p>
                      {!emp.active && <span className="rounded-full bg-muted px-2 py-0.5 font-body text-[10px] font-medium text-muted-foreground">Inaktiv</span>}
                    </div>
                    <p className="font-body text-xs text-muted-foreground">
                      {emp.department || "Ingen avdeling"} · {recordCounts[emp.id] || 0} opplæring{(recordCounts[emp.id] || 0) !== 1 ? "er" : ""}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleActive(emp); }}
                  disabled={togglingId === emp.id}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-body text-[11px] font-medium transition-colors ${emp.active ? "border-destructive/30 text-destructive hover:bg-destructive/10" : "border-primary/30 text-primary hover:bg-primary/10"}`}
                  title={emp.active ? "Deaktiver ansatt" : "Aktiver ansatt"}
                >
                  {emp.active ? <><UserX className="h-3.5 w-3.5" /> Deaktiver</> : <><UserCheck className="h-3.5 w-3.5" /> Aktiver</>}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default TrainingHome;
