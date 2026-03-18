import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, FileText, Trash2, ChevronRight, Printer } from "lucide-react";

interface Employee {
  id: string;
  name: string;
  department: string | null;
}

interface TrainingRecord {
  id: string;
  equipment_name: string;
  equipment_type: string | null;
  training_date: string;
  trainer_name: string;
  trainee_signature_url: string | null;
  trainer_signature_url: string | null;
}

const EmployeeTraining = () => {
  const navigate = useNavigate();
  const { employeeId } = useParams<{ employeeId: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const [empRes, recRes] = await Promise.all([
      supabase.from("employees").select("*").eq("id", employeeId!).single(),
      supabase.from("training_records").select("*").eq("employee_id", employeeId!).order("training_date", { ascending: false }),
    ]);
    if (empRes.data) setEmployee(empRes.data);
    if (recRes.data) setRecords(recRes.data);
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth", { replace: true });
      else fetchData();
    });
  }, [employeeId, navigate]);

  const deleteRecord = async (id: string) => {
    if (!confirm("Er du sikker på at du vil slette denne opplæringen?")) return;
    await supabase.from("training_records").delete().eq("id", id);
    fetchData();
  };

  const handlePrintAll = () => {
    navigate(`/dokumentert-opplaering/ansatt/${employeeId}/print`);
  };

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

        {records.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <FileText className="h-10 w-10 text-muted" />
            <p className="font-body text-sm text-muted-foreground">Ingen opplæringer registrert ennå</p>
          </div>
        ) : (
          <div className="space-y-2">
            {records.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center gap-2 rounded-xl border border-border bg-card"
              >
                <button
                  onClick={() => navigate(`/dokumentert-opplaering/ansatt/${employeeId}/skjema/${rec.id}`)}
                  className="flex min-w-0 flex-1 items-center gap-4 px-5 py-4 text-left hover:bg-secondary rounded-l-xl"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-bold text-foreground">{rec.equipment_name}</p>
                    <p className="font-body text-xs text-muted-foreground">
                      {rec.equipment_type && `${rec.equipment_type} · `}
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
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </button>
                <button
                  onClick={() => deleteRecord(rec.id)}
                  className="flex h-full shrink-0 items-center px-3 text-destructive/60 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default EmployeeTraining;
