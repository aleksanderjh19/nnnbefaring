import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Camera, Save, X } from "lucide-react";
import SignaturePad from "@/components/SignaturePad";

const TrainingForm = () => {
  const navigate = useNavigate();
  const { employeeId, recordId } = useParams<{ employeeId: string; recordId?: string }>();
  const isEdit = !!recordId;

  const [employeeName, setEmployeeName] = useState("");
  const [equipmentName, setEquipmentName] = useState("");
  const [equipmentType, setEquipmentType] = useState("");
  const [noiseLevel, setNoiseLevel] = useState("");
  const [vibration, setVibration] = useState("");
  const [trainerName, setTrainerName] = useState("");
  const [trainerCompany, setTrainerCompany] = useState("");
  const [trainingDate, setTrainingDate] = useState(new Date().toISOString().split("T")[0]);
  const [confirmationType, setConfirmationType] = useState("practical_and_theoretical");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [traineeSignature, setTraineeSignature] = useState<string | null>(null);
  const [trainerSignature, setTrainerSignature] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth", { replace: true }); return; }

      const { data: emp } = await supabase.from("employees").select("name").eq("id", employeeId!).single();
      if (emp) setEmployeeName(emp.name);

      if (isEdit) {
        const { data: rec } = await supabase.from("training_records").select("*").eq("id", recordId!).single();
        if (rec) {
          setEquipmentName(rec.equipment_name);
          setEquipmentType(rec.equipment_type || "");
          setNoiseLevel(rec.noise_level_db || "");
          setVibration(rec.vibration_ms2 || "");
          setTrainerName(rec.trainer_name);
          setTrainerCompany(rec.trainer_company || "");
          setTrainingDate(rec.training_date);
          setConfirmationType(rec.confirmation_type);
          setNotes(rec.notes || "");
          setPhotos(rec.photo_urls || []);
          setTraineeSignature(rec.trainee_signature_url);
          setTrainerSignature(rec.trainer_signature_url);
        }
      }
      setLoading(false);
    };
    load();
  }, [employeeId, recordId, navigate, isEdit]);

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("training-files").upload(path, file);
    if (error) { console.error(error); return null; }
    const { data } = supabase.storage.from("training-files").getPublicUrl(path);
    return data.publicUrl;
  };

  const uploadSignature = async (dataUrl: string, folder: string): Promise<string | null> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], "signature.png", { type: "image/png" });
    return uploadFile(file, folder);
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const url = await uploadFile(file, "photos");
      if (url) setPhotos((prev) => [...prev, url]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!equipmentName.trim() || !trainerName.trim()) return;
    setSaving(true);

    let traineeSignUrl = traineeSignature;
    let trainerSignUrl = trainerSignature;

    // Upload signatures if they are data URLs (new signatures)
    if (traineeSignature?.startsWith("data:")) {
      traineeSignUrl = await uploadSignature(traineeSignature, "signatures");
    }
    if (trainerSignature?.startsWith("data:")) {
      trainerSignUrl = await uploadSignature(trainerSignature, "signatures");
    }

    const { data: { session } } = await supabase.auth.getSession();

    const record = {
      employee_id: employeeId!,
      equipment_name: equipmentName.trim(),
      equipment_type: equipmentType.trim() || null,
      noise_level_db: noiseLevel.trim() || null,
      vibration_ms2: vibration.trim() || null,
      trainer_name: trainerName.trim(),
      trainer_company: trainerCompany.trim() || null,
      training_date: trainingDate,
      confirmation_type: confirmationType,
      notes: notes.trim() || null,
      photo_urls: photos,
      trainee_signature_url: traineeSignUrl,
      trainer_signature_url: trainerSignUrl,
      created_by: session?.user.id,
    };

    if (isEdit) {
      await supabase.from("training_records").update(record).eq("id", recordId!);
    } else {
      await supabase.from("training_records").insert(record);
    }

    setSaving(false);
    navigate(`/dokumentert-opplaering/ansatt/${employeeId}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-body text-sm text-muted-foreground">Laster...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-2xl px-5 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/dokumentert-opplaering/ansatt/${employeeId}`)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-lg font-extrabold text-foreground">
                {isEdit ? "Rediger opplæring" : "Ny opplæring"}
              </h1>
              <p className="font-body text-xs text-muted-foreground">{employeeName}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-5 space-y-6">
        {/* Equipment info - based on Word template */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-display text-sm font-bold text-foreground">Detaljert beskrivelse av utstyr</h2>
          <p className="font-body text-xs text-muted-foreground">
            Dokumentasjon på gjennomført sikkerhetsopplæring i bruk av arbeidsutstyr, jf. forskrift om utførelse av arbeid §§ 10-1, 10-2 og 10-4.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="mb-1 block font-body text-xs font-medium text-muted-foreground">Maskin/utstyr *</label>
              <input
                value={equipmentName}
                onChange={(e) => setEquipmentName(e.target.value)}
                placeholder="F.eks. snøfres"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="mb-1 block font-body text-xs font-medium text-muted-foreground">Type</label>
              <input
                value={equipmentType}
                onChange={(e) => setEquipmentType(e.target.value)}
                placeholder="F.eks. Honda HS 970"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block font-body text-xs font-medium text-muted-foreground">Lydnivå dB</label>
              <input
                value={noiseLevel}
                onChange={(e) => setNoiseLevel(e.target.value)}
                placeholder="dB"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block font-body text-xs font-medium text-muted-foreground">Vibrasjon m/s²</label>
              <input
                value={vibration}
                onChange={(e) => setVibration(e.target.value)}
                placeholder="m/s²"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </section>

        {/* Trainer info */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-display text-sm font-bold text-foreground">Opplæringsansvarlig</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-body text-xs font-medium text-muted-foreground">Navn *</label>
              <input
                value={trainerName}
                onChange={(e) => setTrainerName(e.target.value)}
                placeholder="Fullt navn"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block font-body text-xs font-medium text-muted-foreground">Virksomhet</label>
              <input
                value={trainerCompany}
                onChange={(e) => setTrainerCompany(e.target.value)}
                placeholder="Virksomhet"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </section>

        {/* Training date and confirmation */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-display text-sm font-bold text-foreground">Opplæringsdetaljer</h2>
          <div>
            <label className="mb-1 block font-body text-xs font-medium text-muted-foreground">Dato for opplæring</label>
            <input
              type="date"
              value={trainingDate}
              onChange={(e) => setTrainingDate(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-3">
            <p className="font-body text-xs font-medium text-muted-foreground">Bekreftelsestype</p>
            <label className="flex items-start gap-3 rounded-lg border border-input p-3 cursor-pointer hover:bg-secondary">
              <input
                type="radio"
                name="confirmation"
                checked={confirmationType === "practical_and_theoretical"}
                onChange={() => setConfirmationType("practical_and_theoretical")}
                className="mt-0.5"
              />
              <div>
                <p className="font-body text-sm font-medium text-foreground">Praktisk og teoretisk opplæring</p>
                <p className="font-body text-xs text-muted-foreground">
                  Kunnskap om oppbygning, betjening, bruksegenskaper, vedlikehold og krav til sikker bruk.
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 rounded-lg border border-input p-3 cursor-pointer hover:bg-secondary">
              <input
                type="radio"
                name="confirmation"
                checked={confirmationType === "self_study"}
                onChange={() => setConfirmationType("self_study")}
                className="mt-0.5"
              />
              <div>
                <p className="font-body text-sm font-medium text-foreground">Gjennomgang av bruksanvisning</p>
                <p className="font-body text-xs text-muted-foreground">
                  Har satt seg inn i bruksanvisning og tilegnet kunnskap gjennom erfaring.
                </p>
              </div>
            </label>
          </div>

          <div>
            <label className="mb-1 block font-body text-xs font-medium text-muted-foreground">Notater</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Ekstra informasjon..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </section>

        {/* Photos */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-display text-sm font-bold text-foreground">Bilder av utstyr</h2>
          <div className="flex flex-wrap gap-3">
            {photos.map((url, i) => (
              <div key={i} className="relative h-24 w-24 overflow-hidden rounded-lg border border-border">
                <img src={url} alt={`Bilde ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary"
            >
              <Camera className="h-5 w-5" />
              <span className="font-body text-[10px]">Ta bilde</span>
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handlePhotoCapture}
            className="hidden"
          />
        </section>

        {/* Signatures */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-display text-sm font-bold text-foreground">Signaturer</h2>

          <div className="space-y-4">
            <div>
              <p className="mb-2 font-body text-xs font-medium text-muted-foreground">Signatur, opplært person ({employeeName})</p>
              <SignaturePad
                value={traineeSignature}
                onChange={setTraineeSignature}
              />
            </div>

            <div>
              <p className="mb-2 font-body text-xs font-medium text-muted-foreground">Signatur, opplæringsansvarlig</p>
              <SignaturePad
                value={trainerSignature}
                onChange={setTrainerSignature}
              />
            </div>
          </div>
        </section>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving || !equipmentName.trim() || !trainerName.trim()}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-body text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Lagrer..." : isEdit ? "Oppdater opplæring" : "Lagre opplæring"}
        </button>
      </main>
    </div>
  );
};

export default TrainingForm;
