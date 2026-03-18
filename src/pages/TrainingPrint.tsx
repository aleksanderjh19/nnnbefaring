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
        supabase.from("employees").select("*").eq("id", employeeId!).maybeSingle(),
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
    <>
      {/* Print-specific styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm 15mm 20mm 15mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-page {
            page-break-after: always;
            page-break-inside: avoid;
            min-height: calc(297mm - 35mm);
            display: flex;
            flex-direction: column;
          }
          .print-page:last-child {
            page-break-after: auto;
          }
          .no-print {
            display: none !important;
          }
          .print-page .signature-area {
            margin-top: auto;
          }
        }
      `}</style>

      <div className="min-h-screen bg-background">
        {/* Screen-only header */}
        <header className="no-print border-b border-border bg-card">
          <div className="mx-auto flex max-w-[210mm] items-center gap-3 px-5 py-4">
            <button
              onClick={() => navigate(-1)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex-1">
              <h1 className="font-display text-lg font-extrabold text-foreground">Utskrift – {employee?.name}</h1>
              <p className="font-body text-xs text-muted-foreground">{records.length} skjema{records.length !== 1 ? "er" : ""}</p>
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

        {/* Pages */}
        <div className="mx-auto max-w-[210mm] px-5 py-6 print:max-w-none print:p-0">
          {records.map((rec, index) => (
            <div
              key={rec.id}
              className="print-page mb-8 rounded-xl border border-border bg-white p-8 shadow-sm print:mb-0 print:rounded-none print:border-0 print:shadow-none"
            >
              {/* Title */}
              <div className="mb-6 border-b-2 border-foreground/20 pb-4 print:border-foreground">
                <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
                  Skjema for Dokumentert Opplæring
                </h2>
                <p className="mt-1 text-xs text-muted-foreground print:text-foreground/70" style={{ fontFamily: "Roboto, sans-serif" }}>
                  Dokumentasjon på gjennomført sikkerhetsopplæring i bruk av arbeidsutstyr,
                  jf. forskrift om utførelse av arbeid §§ 10-1, 10-2 og 10-4.
                </p>
              </div>

              {/* Equipment table */}
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-bold text-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
                  Detaljert beskrivelse av utstyr
                </h3>
                <table className="w-full border-collapse text-sm" style={{ fontFamily: "Roboto, sans-serif" }}>
                  <thead>
                    <tr>
                      <th className="border border-foreground/20 bg-foreground/5 px-4 py-2.5 text-left text-xs font-semibold text-foreground/70 print:border-foreground/40 print:bg-foreground/5">
                        Maskin/utstyr
                      </th>
                      <th className="border border-foreground/20 bg-foreground/5 px-4 py-2.5 text-left text-xs font-semibold text-foreground/70 print:border-foreground/40 print:bg-foreground/5">
                        Type
                      </th>
                      <th className="border border-foreground/20 bg-foreground/5 px-4 py-2.5 text-left text-xs font-semibold text-foreground/70 print:border-foreground/40 print:bg-foreground/5">
                        Lydnivå dB
                      </th>
                      <th className="border border-foreground/20 bg-foreground/5 px-4 py-2.5 text-left text-xs font-semibold text-foreground/70 print:border-foreground/40 print:bg-foreground/5">
                        Vibrasjon m/s²
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-foreground/20 px-4 py-2.5 font-medium text-foreground print:border-foreground/40">{rec.equipment_name}</td>
                      <td className="border border-foreground/20 px-4 py-2.5 text-foreground print:border-foreground/40">{rec.equipment_type || "–"}</td>
                      <td className="border border-foreground/20 px-4 py-2.5 text-foreground print:border-foreground/40">{rec.noise_level_db || "–"}</td>
                      <td className="border border-foreground/20 px-4 py-2.5 text-foreground print:border-foreground/40">{rec.vibration_ms2 || "–"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* People – side by side */}
              <div className="mb-6 grid grid-cols-2 gap-6">
                <div className="rounded-lg border border-foreground/10 p-4">
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-foreground/50" style={{ fontFamily: "Inter, sans-serif" }}>
                    Opplæringsansvarlig
                  </h3>
                  <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "Roboto, sans-serif" }}>{rec.trainer_name}</p>
                  {rec.trainer_company && (
                    <p className="mt-0.5 text-xs text-foreground/60" style={{ fontFamily: "Roboto, sans-serif" }}>{rec.trainer_company}</p>
                  )}
                </div>
                <div className="rounded-lg border border-foreground/10 p-4">
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-foreground/50" style={{ fontFamily: "Inter, sans-serif" }}>
                    Opplært person
                  </h3>
                  <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "Roboto, sans-serif" }}>{employee?.name}</p>
                  {employee?.department && (
                    <p className="mt-0.5 text-xs text-foreground/60" style={{ fontFamily: "Roboto, sans-serif" }}>{employee.department}</p>
                  )}
                </div>
              </div>

              {/* Confirmation */}
              <div className="mb-6 rounded-lg border border-foreground/10 bg-foreground/[0.02] p-4" style={{ fontFamily: "Roboto, sans-serif" }}>
                <p className="text-sm leading-relaxed text-foreground">
                  {rec.confirmation_type === "practical_and_theoretical"
                    ? "Jeg bekrefter å ha mottatt praktisk og teoretisk opplæring som har gitt meg kunnskap om det aktuelle utstyrets oppbygning, betjening, bruksegenskaper og bruksområde, rutiner for vedlikehold og kontroll, samt krav som stilles til sikker bruk og betjening i forskrift og bruksanvisning."
                    : "Jeg bekrefter at jeg har satt meg inn i bruksanvisning og tilegnet meg kunnskap gjennom erfaring."}
                </p>
              </div>

              {/* Notes */}
              {rec.notes && (
                <div className="mb-6 rounded-lg border border-foreground/10 p-4" style={{ fontFamily: "Roboto, sans-serif" }}>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-foreground/50">Notater</p>
                  <p className="text-sm text-foreground">{rec.notes}</p>
                </div>
              )}

              {/* Photos */}
              {rec.photo_urls && rec.photo_urls.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground/50" style={{ fontFamily: "Inter, sans-serif" }}>
                    Bilder
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {rec.photo_urls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Utstyr ${i + 1}`}
                        className="h-32 w-32 rounded-lg border border-foreground/10 object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Signatures – pushed to bottom on print */}
              <div className="signature-area mt-auto border-t-2 border-foreground/20 pt-5 print:border-foreground/40">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-xs text-foreground/60" style={{ fontFamily: "Roboto, sans-serif" }}>
                      Dato: {new Date(rec.training_date).toLocaleDateString("nb-NO")}
                    </p>
                    <p className="mb-3 text-xs font-semibold text-foreground/70" style={{ fontFamily: "Roboto, sans-serif" }}>
                      Signatur, opplært person:
                    </p>
                    {rec.trainee_signature_url ? (
                      <img src={rec.trainee_signature_url} alt="Signatur" className="h-16 object-contain" />
                    ) : (
                      <div className="h-12" />
                    )}
                    <div className="mt-1 border-b border-foreground/30" />
                  </div>
                  <div>
                    <p className="text-xs text-foreground/60" style={{ fontFamily: "Roboto, sans-serif" }}>
                      Dato: {new Date(rec.training_date).toLocaleDateString("nb-NO")}
                    </p>
                    <p className="mb-3 text-xs font-semibold text-foreground/70" style={{ fontFamily: "Roboto, sans-serif" }}>
                      Signatur, opplæringsansvarlig:
                    </p>
                    {rec.trainer_signature_url ? (
                      <img src={rec.trainer_signature_url} alt="Signatur" className="h-16 object-contain" />
                    ) : (
                      <div className="h-12" />
                    )}
                    <div className="mt-1 border-b border-foreground/30" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default TrainingPrint;
