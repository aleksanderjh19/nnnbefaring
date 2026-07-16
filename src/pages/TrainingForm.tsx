import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Camera, Save, X, ChevronDown } from "lucide-react";
import ComboInput from "@/components/ComboInput";
import SignaturePad from "@/components/SignaturePad";

const FALLBACK_CATEGORIES = [
  { value: "bensinverktoy", label: "Bensin-/motorverktøy" },
  { value: "el_verktoy", label: "El.verktøy" },
  { value: "kjøretøy", label: "Kjøretøy" },
  { value: "maskin", label: "Maskin" },
  { value: "traktor_utstyr", label: "Traktor m/utstyr" },
  { value: "utstyr", label: "Utstyr" },
  { value: "annet", label: "Annet" },
];

interface CatalogRow {
  id: string;
  category_value: string;
  equipment_name: string;
  brand: string | null;
  type: string | null;
  image_url: string | null;
}

const COMPANIES = ["Statnett SF", "Annet"];

interface Employee {
  id: string;
  name: string;
}

const TrainingForm = () => {
  const navigate = useNavigate();
  const goBack = useSmartBack(`/dokumentert-opplaering/ansatt/${useParams().employeeId ?? ""}`);
  const { employeeId, recordId } = useParams<{ employeeId: string; recordId?: string }>();
  const [searchParams] = useSearchParams();
  const isEdit = !!recordId;

  useEffect(() => { document.title = isEdit ? "Rediger opplæring – Statnett" : "Ny opplæring – Statnett"; }, [isEdit]);

  const [employeeName, setEmployeeName] = useState("");
  const [equipmentCategory, setEquipmentCategory] = useState(searchParams.get("category") || "el_verktoy");
  const [equipmentName, setEquipmentName] = useState(searchParams.get("equipment") || "");
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get("brand") || "");
  const [equipmentType, setEquipmentType] = useState(searchParams.get("type") || "");
  const [noiseLevel, setNoiseLevel] = useState("");
  const [vibration, setVibration] = useState("");
  const [trainerName, setTrainerName] = useState("");
  const [trainerCompany, setTrainerCompany] = useState("Statnett SF");
  const [customCompany, setCustomCompany] = useState("");
  const [trainingDate, setTrainingDate] = useState(new Date().toISOString().split("T")[0]);
  const [confirmationType, setConfirmationType] = useState("practical_and_theoretical");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [traineeSignature, setTraineeSignature] = useState<string | null>(null);
  const [trainerSignature, setTrainerSignature] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const equipmentPhotoRef = useRef<HTMLInputElement>(null);
  const [catalogRows, setCatalogRows] = useState<CatalogRow[]>([]);
  const [selectedTractorTypes, setSelectedTractorTypes] = useState<string[]>([]);

  const isTractorCategory = equipmentCategory === "traktor_utstyr";

  // Get all types for current tractor equipment selection
  const tractorTypes = useMemo(() => {
    if (!isTractorCategory || !equipmentName) return [];
    return catalogRows
      .filter((r) => r.category_value === "traktor_utstyr" && r.equipment_name === equipmentName && r.type)
      .map((r) => r.type!);
  }, [isTractorCategory, equipmentName, catalogRows]);

  // Auto-select all tractor types when equipment name changes
  useEffect(() => {
    if (isTractorCategory && equipmentName && tractorTypes.length > 0) {
      setSelectedTractorTypes(tractorTypes);
    } else {
      setSelectedTractorTypes([]);
    }
  }, [isTractorCategory, equipmentName, tractorTypes]);

  useEffect(() => {
    supabase.from("equipment_catalog").select("id, category_value, category_label, equipment_name, brand, type, image_url").then(({ data }) => {
      if (data) setCatalogRows(data as (CatalogRow & { category_label: string })[]);
    });
  }, []);

  const categories = useMemo(() => {
    const dbCats = new Map<string, string>();
    catalogRows.forEach((r: any) => {
      if (r.category_value && r.category_label) {
        dbCats.set(r.category_value, r.category_label);
      }
    });
    const merged = [...FALLBACK_CATEGORIES];
    dbCats.forEach((label, value) => {
      if (!merged.some((c) => c.value === value)) {
        merged.push({ value, label });
      }
    });
    return merged;
  }, [catalogRows]);

  const getEquipmentForCategory = (cat: string) => {
    const names = [...new Set(catalogRows.filter((r) => r.category_value === cat).map((r) => r.equipment_name))];
    return names.map((name) => ({ name }));
  };

  const getBrandsForEquipment = (cat: string, eqName: string) => {
    const brands = [...new Set(catalogRows.filter((r) => r.category_value === cat && r.equipment_name === eqName && r.brand).map((r) => r.brand!))];
    return brands.map((brand) => ({ brand }));
  };

  const getTypesForBrand = (cat: string, eqName: string, brand: string) => {
    return catalogRows.filter((r) => r.category_value === cat && r.equipment_name === eqName && r.brand === brand && r.type).map((r) => r.type!);
  };

  // Find the matching catalog row for current selection
  const matchingCatalogRow = useMemo(() => {
    return catalogRows.find(
      (r) =>
        r.category_value === equipmentCategory &&
        r.equipment_name === equipmentName &&
        (r.brand || "") === selectedBrand &&
        (r.type || "") === equipmentType
    ) || null;
  }, [catalogRows, equipmentCategory, equipmentName, selectedBrand, equipmentType]);

  const catalogImageUrl = matchingCatalogRow?.image_url || null;

  const handleEquipmentPhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const url = await uploadFile(file, "equipment-photos");
    if (url && matchingCatalogRow) {
      // Update existing catalog row with image
      await supabase.from("equipment_catalog").update({ image_url: url }).eq("id", matchingCatalogRow.id);
      setCatalogRows((prev) => prev.map((r) => r.id === matchingCatalogRow.id ? { ...r, image_url: url } : r));
    } else if (url) {
      // No matching row yet - save photo to training record photos
      setPhotos((prev) => [...prev, url]);
    }
  };

  // Auto-select type when brand has only one type
  useEffect(() => {
    if (selectedBrand) {
      const types = getTypesForBrand(equipmentCategory, equipmentName, selectedBrand);
      if (types.length === 1) {
        setEquipmentType(types[0]);
      }
    }
  }, [selectedBrand, equipmentCategory, equipmentName, catalogRows]);

  useEffect(() => {
    const load = async () => {
      const [empRes, allEmpRes] = await Promise.all([
        supabase.from("employees").select("name").eq("id", employeeId!).maybeSingle(),
        supabase.from("employees").select("id, name").order("name"),
      ]);
      if (empRes.data) setEmployeeName(empRes.data.name);
      if (allEmpRes.data) setAllEmployees(allEmpRes.data);

      if (isEdit) {
        const { data: rec } = await supabase.from("training_records").select("*").eq("id", recordId!).maybeSingle();
        if (rec) {
          setEquipmentName(rec.equipment_name);
          setEquipmentType(rec.equipment_type || "");
          setEquipmentCategory((rec as any).equipment_category || "el_verktoy");
          setNoiseLevel(rec.noise_level_db || "");
          setVibration(rec.vibration_ms2 || "");
          setTrainerName(rec.trainer_name);
          const company = rec.trainer_company || "";
          if (COMPANIES.includes(company)) {
            setTrainerCompany(company);
          } else {
            setTrainerCompany("Annet");
            setCustomCompany(company);
          }
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

  const resolvedCompany = trainerCompany === "Annet" ? customCompany.trim() : trainerCompany;

  const handleSave = async () => {
    if (!equipmentName.trim() || !trainerName.trim()) return;
    setSaving(true);

    let traineeSignUrl = traineeSignature;
    let trainerSignUrl = trainerSignature;

    if (traineeSignature?.startsWith("data:")) {
      traineeSignUrl = await uploadSignature(traineeSignature, "signatures");
    }
    if (trainerSignature?.startsWith("data:")) {
      trainerSignUrl = await uploadSignature(trainerSignature, "signatures");
    }

    const catLabel = categories.find((c) => c.value === equipmentCategory)?.label || equipmentCategory;
    const trimmedName = equipmentName.trim();

    // For tractor category: create one record per selected type
    if (isTractorCategory && selectedTractorTypes.length > 0 && !isEdit) {
      const records = selectedTractorTypes.map((type) => {
        const catalogMatch = catalogRows.find(
          (r) => r.category_value === "traktor_utstyr" && r.equipment_name === trimmedName && r.type === type
        );
        return {
          employee_id: employeeId!,
          equipment_name: trimmedName,
          equipment_type: type,
          equipment_category: equipmentCategory,
          noise_level_db: catalogMatch ? (catalogMatch as any).noise_level_db || null : noiseLevel.trim() || null,
          vibration_ms2: catalogMatch ? (catalogMatch as any).vibration_ms2 || null : vibration.trim() || null,
          trainer_name: trainerName.trim(),
          trainer_company: resolvedCompany || null,
          training_date: trainingDate,
          confirmation_type: confirmationType,
          notes: notes.trim() || null,
          photo_urls: photos,
          trainee_signature_url: traineeSignUrl,
          trainer_signature_url: trainerSignUrl,
        };
      });
      await supabase.from("training_records").insert(records);
    } else {
      // Standard single-record flow
      const fullType = [selectedBrand, equipmentType].filter(Boolean).join(" ") || null;
      const trimmedBrand = selectedBrand.trim() || null;
      const trimmedType = equipmentType.trim() || null;

      if (trimmedName) {
        const existsInCatalog = catalogRows.some(
          (r) =>
            r.category_value === equipmentCategory &&
            r.equipment_name === trimmedName &&
            (r.brand || null) === trimmedBrand &&
            (r.type || null) === trimmedType
        );
        if (!existsInCatalog) {
          await supabase.from("equipment_catalog").insert({
            category_value: equipmentCategory,
            category_label: catLabel,
            equipment_name: trimmedName,
            brand: trimmedBrand,
            type: trimmedType,
          });
        }
      }

      const record = {
        employee_id: employeeId!,
        equipment_name: trimmedName,
        equipment_type: fullType,
        equipment_category: equipmentCategory,
        noise_level_db: noiseLevel.trim() || null,
        vibration_ms2: vibration.trim() || null,
        trainer_name: trainerName.trim(),
        trainer_company: resolvedCompany || null,
        training_date: trainingDate,
        confirmation_type: confirmationType,
        notes: notes.trim() || null,
        photo_urls: photos,
        trainee_signature_url: traineeSignUrl,
        trainer_signature_url: trainerSignUrl,
      };

      if (isEdit) {
        await supabase.from("training_records").update(record).eq("id", recordId!);
      } else {
        await supabase.from("training_records").insert(record);
      }
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
        {/* Category */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-display text-sm font-bold text-foreground">Kategori</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => {
                  setEquipmentCategory(cat.value);
                  setEquipmentName("");
                  setSelectedBrand("");
                  setEquipmentType("");
                }}
                className={`rounded-lg px-4 py-2 font-body text-sm font-medium transition-colors ${
                  equipmentCategory === cat.value
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-background text-muted-foreground hover:bg-secondary"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        {/* Equipment info */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-display text-sm font-bold text-foreground">Detaljert beskrivelse av utstyr</h2>
          <p className="font-body text-xs text-muted-foreground">
            Dokumentasjon på gjennomført sikkerhetsopplæring i bruk av arbeidsutstyr, jf. forskrift om utførelse av arbeid §§ 10-1, 10-2 og 10-4.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {/* Equipment name - dropdown + free text */}
            <div className="col-span-2 sm:col-span-1">
              <label className="mb-1 block font-body text-xs font-medium text-muted-foreground">Maskin/utstyr *</label>
              <ComboInput
                value={equipmentName}
                onChange={(val) => {
                  setEquipmentName(val);
                  setSelectedBrand("");
                  setEquipmentType("");
                }}
                options={getEquipmentForCategory(equipmentCategory).map((eq) => eq.name)}
                placeholder="Velg eller skriv inn..."
              />
            </div>

            {/* Tractor: show types checklist */}
            {isTractorCategory && equipmentName && tractorTypes.length > 0 ? (
              <div className="col-span-2">
                <label className="mb-2 block font-body text-xs font-medium text-muted-foreground">
                  Utstyr inkludert ({selectedTractorTypes.length} av {tractorTypes.length} valgt)
                </label>
                <div className="space-y-1.5 rounded-lg border border-border bg-background p-3 max-h-64 overflow-y-auto">
                  <label className="flex items-center gap-2 pb-2 mb-2 border-b border-border cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTractorTypes.length === tractorTypes.length}
                      onChange={(e) => {
                        setSelectedTractorTypes(e.target.checked ? tractorTypes : []);
                      }}
                      className="h-4 w-4 rounded border-input text-primary accent-primary"
                    />
                    <span className="font-body text-sm font-medium text-foreground">Velg alle</span>
                  </label>
                  {tractorTypes.map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer rounded px-1 py-1 hover:bg-secondary">
                      <input
                        type="checkbox"
                        checked={selectedTractorTypes.includes(type)}
                        onChange={(e) => {
                          setSelectedTractorTypes((prev) =>
                            e.target.checked ? [...prev, type] : prev.filter((t) => t !== type)
                          );
                        }}
                        className="h-4 w-4 rounded border-input text-primary accent-primary"
                      />
                      <span className="font-body text-sm text-foreground">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Brand - single input with datalist */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-1 block font-body text-xs font-medium text-muted-foreground">Merke</label>
                  <ComboInput
                    value={selectedBrand}
                    onChange={(val) => { setSelectedBrand(val); setEquipmentType(""); }}
                    options={getBrandsForEquipment(equipmentCategory, equipmentName).map((b) => b.brand)}
                    placeholder="Velg eller skriv inn..."
                  />
                </div>

                {/* Type */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-1 block font-body text-xs font-medium text-muted-foreground">Type</label>
                  <ComboInput
                    value={equipmentType}
                    onChange={(val) => setEquipmentType(val)}
                    options={getTypesForBrand(equipmentCategory, equipmentName, selectedBrand)}
                    placeholder="Velg eller skriv inn..."
                  />
                </div>
              </>
            )}

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

          {/* Equipment photo - from catalog or capture new */}
          <div className="space-y-2">
            <label className="block font-body text-xs font-medium text-muted-foreground">Bilde av utstyr</label>
            {catalogImageUrl ? (
              <div className="relative inline-block">
                <img
                  src={catalogImageUrl}
                  alt={equipmentName}
                  className="h-32 w-32 rounded-lg border border-border object-cover"
                />
                <button
                  onClick={() => equipmentPhotoRef.current?.click()}
                  className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow"
                  title="Bytt bilde"
                >
                  <Camera className="h-3 w-3" />
                </button>
              </div>
            ) : photos.length > 0 ? (
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
                  <span className="font-body text-[10px]">Legg til</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (matchingCatalogRow) {
                    equipmentPhotoRef.current?.click();
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
                className="flex h-24 w-32 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary"
              >
                <Camera className="h-5 w-5" />
                <span className="font-body text-[10px]">Ta bilde</span>
              </button>
            )}
            <input
              ref={equipmentPhotoRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleEquipmentPhotoCapture}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handlePhotoCapture}
              className="hidden"
            />
          </div>
        </section>

        {/* Trainer info */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-display text-sm font-bold text-foreground">Opplæringsansvarlig</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-body text-xs font-medium text-muted-foreground">Navn *</label>
              <ComboInput
                value={trainerName}
                onChange={setTrainerName}
                options={allEmployees.map((emp) => emp.name)}
                placeholder="Velg person..."
              />
            </div>
            <div>
              <label className="mb-1 block font-body text-xs font-medium text-muted-foreground">Virksomhet</label>
              <ComboInput
                value={trainerCompany === "Annet" ? customCompany : trainerCompany}
                onChange={(val) => {
                  if (COMPANIES.includes(val)) {
                    setTrainerCompany(val);
                    setCustomCompany("");
                  } else {
                    setTrainerCompany("Annet");
                    setCustomCompany(val);
                  }
                }}
                options={COMPANIES}
                placeholder="Velg eller skriv inn..."
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



        {/* Signatures */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-display text-sm font-bold text-foreground">Signaturer</h2>

          <div className="space-y-4">
            <div>
              <p className="mb-2 font-body text-xs font-medium text-muted-foreground">
                Signatur – opplært person ({employeeName})
              </p>
              <SignaturePad
                value={traineeSignature}
                onChange={setTraineeSignature}
              />
            </div>

            <div>
              <p className="mb-2 font-body text-xs font-medium text-muted-foreground">
                Signatur – opplæringsansvarlig ({trainerName || "ikke valgt"})
              </p>
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
          {saving ? "Lagrer..." : isEdit ? "Oppdater opplæring" : isTractorCategory && selectedTractorTypes.length > 1 ? `Lagre ${selectedTractorTypes.length} opplæringer` : "Lagre opplæring"}
        </button>
      </main>
    </div>
  );
};

export default TrainingForm;
