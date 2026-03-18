import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Printer } from "lucide-react";

interface Employee {
  id: string;
  name: string;
  department: string | null;
}

interface TrainingRecord {
  id: string;
  equipment_name: string;
  equipment_type: string | null;
  noise_level_db: string | null;
  vibration_ms2: string | null;
  trainer_name: string;
  trainer_company: string | null;
  training_date: string;
  confirmation_type: string;
  notes: string | null;
  photo_urls: string[] | null;
  trainee_signature_url: string | null;
  trainer_signature_url: string | null;
}

const TrainingPrint = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [empRes, recRes] = await Promise.all([
        supabase.from("employees").select("*").eq("id", employeeId!).single(),
        supabase.from("training_records").select("*").eq("employee_id", employeeId!).order("training_date"),
      ]);
      if (empRes.data) setEmployee(empRes.data);
      if (recRes.data) setRecords(recRes.data);
      setLoading(false);
    };
    load();
  }, [employeeId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-body text-sm text-muted-foreground">Laster...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Screen-only header */}
      <header className="border-b border-border bg-card print:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-lg font-extrabold text-foreground">Utskrift</h1>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-body text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Printer className="h-4 w-4" />
            Skriv ut / Lagre PDF
          </button>
        </div>
      </header>

      {/* Print content */}
      <div className="mx-auto max-w-3xl p-5 print:max-w-none print:p-0">
        {records.map((rec, index) => (
          <div key={rec.id} className="mb-8 break-inside-avoid rounded-xl border border-border bg-card p-6 print:mb-0 print:rounded-none print:border-0 print:p-8 print:shadow-none" style={{ pageBreakAfter: index < records.length - 1 ? "always" : "auto" }}>
            {/* Header */}
            <div className="mb-6 border-b border-border pb-4 print:border-b-2 print:border-foreground">
              <h2 className="font-display text-lg font-bold text-foreground">Skjema for Dokumentert Opplæring</h2>
              <p className="font-body text-xs text-muted-foreground print:text-foreground">
                Dokumentasjon på gjennomført sikkerhetsopplæring i bruk av arbeidsutstyr, jf. forskrift om utførelse av arbeid §§ 10-1, 10-2 og 10-4.
              </p>
            </div>

            {/* Equipment table */}
            <div className="mb-4">
              <h3 className="mb-2 font-display text-sm font-bold text-foreground">Detaljert beskrivelse av utstyr</h3>
              <table className="w-full border-collapse border border-border text-sm print:border-foreground">
                <thead>
                  <tr className="bg-muted print:bg-transparent">
                    <th className="border border-border px-3 py-2 text-left font-body font-medium text-muted-foreground print:border-foreground print:text-foreground">Maskin/utstyr</th>
                    <th className="border border-border px-3 py-2 text-left font-body font-medium text-muted-foreground print:border-foreground print:text-foreground">Type</th>
                    <th className="border border-border px-3 py-2 text-left font-body font-medium text-muted-foreground print:border-foreground print:text-foreground">Lydnivå dB</th>
                    <th className="border border-border px-3 py-2 text-left font-body font-medium text-muted-foreground print:border-foreground print:text-foreground">Vibrasjon m/s²</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border px-3 py-2 font-body text-foreground print:border-foreground">{rec.equipment_name}</td>
                    <td className="border border-border px-3 py-2 font-body text-foreground print:border-foreground">{rec.equipment_type || "-"}</td>
                    <td className="border border-border px-3 py-2 font-body text-foreground print:border-foreground">{rec.noise_level_db || "-"}</td>
                    <td className="border border-border px-3 py-2 font-body text-foreground print:border-foreground">{rec.vibration_ms2 || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* People */}
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <h3 className="mb-1 font-display text-sm font-bold text-foreground">Opplæringsansvarlig</h3>
                <p className="font-body text-sm text-foreground">{rec.trainer_name}</p>
                {rec.trainer_company && <p className="font-body text-xs text-muted-foreground">{rec.trainer_company}</p>}
              </div>
              <div>
                <h3 className="mb-1 font-display text-sm font-bold text-foreground">Opplært person</h3>
                <p className="font-body text-sm text-foreground">{employee?.name}</p>
                {employee?.department && <p className="font-body text-xs text-muted-foreground">{employee.department}</p>}
              </div>
            </div>

            {/* Confirmation */}
            <div className="mb-4 rounded-lg border border-border p-4 print:border-foreground">
              <p className="font-body text-sm text-foreground">
                {rec.confirmation_type === "practical_and_theoretical"
                  ? "Jeg bekrefter å ha mottatt praktisk og teoretisk opplæring som har gitt meg kunnskap om det aktuelle utstyrets oppbygning, betjening, bruksegenskaper og bruksområde, rutiner for vedlikehold og kontroll, samt krav som stilles til sikker bruk og betjening i forskrift og bruksanvisning."
                  : "Jeg bekrefter at jeg har satt meg inn i bruksanvisning og tilegnet meg kunnskap gjennom erfaring."}
              </p>
            </div>

            {/* Photos */}
            {rec.photo_urls && rec.photo_urls.length > 0 && (
              <div className="mb-4">
                <h3 className="mb-2 font-display text-sm font-bold text-foreground">Bilder</h3>
                <div className="flex flex-wrap gap-2">
                  {rec.photo_urls.map((url, i) => (
                    <img key={i} src={url} alt={`Utstyr ${i + 1}`} className="h-28 w-28 rounded-lg border border-border object-cover print:border-foreground" />
                  ))}
                </div>
              </div>
            )}

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 print:border-foreground">
              <div>
                <p className="mb-1 font-body text-xs font-medium text-muted-foreground print:text-foreground">
                  Dato: {new Date(rec.training_date).toLocaleDateString("nb-NO")}
                </p>
                <p className="mb-2 font-body text-xs font-medium text-muted-foreground print:text-foreground">Signatur, opplært person:</p>
                {rec.trainee_signature_url ? (
                  <img src={rec.trainee_signature_url} alt="Signatur" className="h-16 border-b border-border print:border-foreground" />
                ) : (
                  <div className="h-16 border-b border-border print:border-foreground" />
                )}
              </div>
              <div>
                <p className="mb-1 font-body text-xs font-medium text-muted-foreground print:text-foreground">
                  Dato: {new Date(rec.training_date).toLocaleDateString("nb-NO")}
                </p>
                <p className="mb-2 font-body text-xs font-medium text-muted-foreground print:text-foreground">Signatur, opplæringsansvarlig:</p>
                {rec.trainer_signature_url ? (
                  <img src={rec.trainer_signature_url} alt="Signatur" className="h-16 border-b border-border print:border-foreground" />
                ) : (
                  <div className="h-16 border-b border-border print:border-foreground" />
                )}
              </div>
            </div>

            {rec.notes && (
              <div className="mt-4 rounded-lg bg-muted p-3 print:bg-transparent print:border print:border-foreground">
                <p className="font-body text-xs font-medium text-muted-foreground print:text-foreground">Notater:</p>
                <p className="font-body text-sm text-foreground">{rec.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrainingPrint;
