import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, Users, ChevronRight, RefreshCw, Search } from "lucide-react";

interface Employee {
  id: string;
  name: string;
  department: string | null;
  created_at: string;
}

const TrainingHome = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDept, setNewDept] = useState("");
  const [search, setSearch] = useState("");
  const [recordCounts, setRecordCounts] = useState<Record<string, number>>({});

  const fetchEmployees = async () => {
    setLoading(true);
    const { data } = await supabase.from("employees").select("*").order("name");
    if (data) setEmployees(data);

    // Get training record counts per employee
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
    fetchEmployees();
  }, []);

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


  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.department && e.department.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-2xl px-5 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-lg font-extrabold text-foreground">Dokumentert Opplæring</h1>
              <p className="font-body text-xs text-muted-foreground">Velg ansatt for å administrere opplæring</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary sm:hidden"
              title="Oppdater"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-5">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Søk etter ansatt..."
            className="h-10 w-full rounded-xl border border-input bg-card pl-10 pr-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xs font-bold uppercase tracking-widest text-statnett">
            Ansatte ({filtered.length})
          </h2>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 font-body text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" />
            Ny ansatt
          </button>
        </div>

        {/* Add dialog */}
        {showAdd && (
          <div className="mb-4 rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="font-display text-sm font-bold text-foreground">Legg til ansatt</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block font-body text-xs text-muted-foreground">Navn *</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ola Nordmann"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block font-body text-xs text-muted-foreground">Avdeling</label>
                <input
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  placeholder="Drift"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAdd(false)} className="rounded-lg border border-border px-4 py-2 font-body text-sm text-muted-foreground hover:bg-secondary">Avbryt</button>
              <button onClick={handleAdd} className="rounded-lg bg-primary px-4 py-2 font-body text-sm font-semibold text-primary-foreground hover:bg-primary/90">Legg til</button>
            </div>
          </div>
        )}

        {/* Employee list */}
        {loading ? (
          <p className="py-8 text-center font-body text-sm text-muted-foreground">Laster...</p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Users className="h-10 w-10 text-muted" />
            <p className="font-body text-sm text-muted-foreground">
              {search ? "Ingen ansatte funnet" : "Ingen ansatte lagt til ennå"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((emp) => (
              <button
                key={emp.id}
                onClick={() => navigate(`/dokumentert-opplaering/ansatt/${emp.id}`)}
                className="group flex w-full items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 text-left transition-colors hover:bg-secondary"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-display text-sm font-bold text-primary">
                  {emp.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-bold text-foreground">{emp.name}</p>
                  <p className="font-body text-xs text-muted-foreground">
                    {emp.department || "Ingen avdeling"} · {recordCounts[emp.id] || 0} opplæring{(recordCounts[emp.id] || 0) !== 1 ? "er" : ""}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default TrainingHome;
