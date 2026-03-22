import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, BookOpen, ChevronRight, ClipboardPlus, User, Users, Wrench } from "lucide-react";
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
  const [myEmployee, setMyEmployee] = useState<Employee | null>(null);
  const [showProfilePicker, setShowProfilePicker] = useState(false);
  const [recordCounts, setRecordCounts] = useState<Record<string, number>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("employees").select("*").order("name");
    if (data) {
      const emps = data as Employee[];
      setEmployees(emps);
      if (user) {
        const linked = emps.find((e) => e.user_id === user.id);
        setMyEmployee(linked || null);
        if (!linked) setShowProfilePicker(true);
      }
    }
    const { data: records } = await supabase.from("training_records").select("employee_id");
    if (records) {
      const counts: Record<string, number> = {};
      records.forEach((r) => { counts[r.employee_id] = (counts[r.employee_id] || 0) + 1; });
      setRecordCounts(counts);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    document.title = "Dokumentert Opplæring – Statnett";
    fetchData();
  }, [fetchData]);

  const linkProfile = async (empId: string) => {
    await supabase.from("employees").update({ user_id: user?.id } as any).eq("id", empId);
    setShowProfilePicker(false);
    const linked = employees.find((e) => e.id === empId);
    if (linked) setMyEmployee({ ...linked, user_id: user?.id || null });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-body text-sm text-muted-foreground">Laster...</p>
      </div>
    );
  }

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

            {/* Admin-only: Ansattes opplæring */}
            {isAdmin && (
              <button
                onClick={() => navigate("/dokumentert-opplaering/ansatte")}
                className="group flex w-full items-center gap-5 rounded-2xl border-2 border-border bg-card p-6 transition-all hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent/10 transition-colors group-hover:bg-accent/20">
                  <Users className="h-8 w-8 text-accent" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-display text-lg font-bold text-foreground">Ansattes opplæring</h3>
                  <p className="font-body text-sm text-muted-foreground">Se og administrer opplæring for alle ansatte</p>
                </div>
                <ChevronRight className="h-6 w-6 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </button>
            )}

            <button
              onClick={() => navigate(`/dokumentert-opplaering/ansatt/${myEmployee.id}/ny`)}
              className="group flex w-full items-center gap-5 rounded-2xl border-2 border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--success))]/10 transition-colors group-hover:bg-[hsl(var(--success))]/20">
                <ClipboardPlus className="h-8 w-8 text-[hsl(var(--success))]" />
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
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-muted transition-colors group-hover:bg-muted/80">
                <Wrench className="h-8 w-8 text-muted-foreground" />
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
};

export default TrainingHome;
