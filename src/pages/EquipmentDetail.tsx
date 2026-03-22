import { useState, useEffect, useRef, useCallback, forwardRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MapPin, Volume2, Activity, FileText, Pencil, Save, X, GraduationCap } from "lucide-react";
import ComboInput from "@/components/ComboInput";
import { ImageDropZone } from "@/components/ImageDropZone";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const LOCATIONS = [
  "Bjerka",
  "Fauske",
  "KBV, Stasjon: Kobbvatnet",
  "KOL, Stasjon: Kolsvik",
  "MAR, Stasjon: Marka",
  "NMS, Stasjon: Namsskogan",
  "NRØ, Stasjon: Nedre Røssåga",
  "RAA, Stasjon: Rana",
  "SAL, Stasjon: Salten",
  "SVN, Stasjon: Svartisen",
  "TRO, Stasjon: Trofors",
  "Annet",
];

interface CatalogItem {
  id: string;
  category_value: string;
  category_label: string;
  equipment_name: string;
  brand: string | null;
  type: string | null;
  image_url: string | null;
  location: string | null;
  noise_level_db: string | null;
  vibration_ms2: string | null;
  description: string | null;
}

const EquipmentDetail = () => {
  const navigate = useNavigate();
  const { itemId } = useParams<{ itemId: string }>();
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [showEmployeePicker, setShowEmployeePicker] = useState(false);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState("");

  // Edit state
  const [editLocation, setEditLocation] = useState("");
  const [editCustomLocation, setEditCustomLocation] = useState("");
  const [editNoise, setEditNoise] = useState("");
  const [editVibration, setEditVibration] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editEquipmentName, setEditEquipmentName] = useState("");
  const [editBrand, setEditBrand] = useState("");
  const [editType, setEditType] = useState("");

  useEffect(() => { document.title = "Utstyr – Statnett"; }, []);

  const fetchItem = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("equipment_catalog")
      .select("*")
      .eq("id", itemId!)
      .maybeSingle();
    if (data) {
      const d = data as CatalogItem;
      setItem(d);
      const loc = d.location || "";
      if (LOCATIONS.includes(loc)) {
        setEditLocation(loc);
        setEditCustomLocation("");
      } else if (loc) {
        setEditLocation("Annet");
        setEditCustomLocation(loc);
      } else {
        setEditLocation("");
        setEditCustomLocation("");
      }
      setEditNoise(d.noise_level_db || "");
      setEditVibration(d.vibration_ms2 || "");
      setEditDescription(d.description || "");
      setEditEquipmentName(d.equipment_name || "");
      setEditBrand(d.brand || "");
      setEditType(d.type || "");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItem();
  }, [itemId]);

  useEffect(() => {
    if (showEmployeePicker && employees.length === 0) {
      supabase.from("employees").select("id, name").order("name").then(({ data }) => {
        if (data) setEmployees(data);
      });
    }
  }, [showEmployeePicker]);

  const handleAddTraining = (employeeId: string) => {
    if (!item) return;
    const params = new URLSearchParams({
      category: item.category_value,
      equipment: item.equipment_name,
    });
    if (item.brand) params.set("brand", item.brand);
    if (item.type) params.set("type", item.type);
    navigate(`/dokumentert-opplaering/ansatt/${employeeId}/ny?${params.toString()}`);
  };

  const filteredEmployees = employees.filter((e) =>
    e.name.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  const handleSave = async () => {
    if (!item) return;
    setSaving(true);
    const resolvedLocation = editLocation === "Annet" ? editCustomLocation.trim() : editLocation;
    const newName = editEquipmentName.trim() || item.equipment_name;

    // If equipment name changed, propagate to all catalog rows + training records via edge function
    if (newName !== item.equipment_name) {
      await supabase.functions.invoke("catalog-manage", {
        body: {
          action: "rename_equipment",
          category_value: item.category_value,
          old_name: item.equipment_name,
          new_name: newName,
        },
      });
    }

    // Update this specific row's details
    await supabase.from("equipment_catalog").update({
      equipment_name: newName,
      brand: editBrand.trim() || null,
      type: editType.trim() || null,
      location: resolvedLocation || null,
      noise_level_db: editNoise.trim() || null,
      vibration_ms2: editVibration.trim() || null,
      description: editDescription.trim() || null,
    }).eq("id", item.id);
    setEditing(false);
    setSaving(false);
    fetchItem();
  };

  const handleFileUpload = useCallback(async (file: File) => {
    if (!item) return;
    const ext = file.name.split(".").pop();
    const path = `equipment-photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("training-files").upload(path, file);
    if (error) { console.error(error); return; }
    const { data } = supabase.storage.from("training-files").getPublicUrl(path);
    await supabase.from("equipment_catalog").update({ image_url: data.publicUrl }).eq("id", item.id);
    fetchItem();
  }, [item]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-body text-sm text-muted-foreground">Laster...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4">
        <p className="font-body text-sm text-muted-foreground">Utstyr ikke funnet</p>
        <button onClick={() => navigate(-1)} className="text-primary font-body text-sm underline">Tilbake</button>
      </div>
    );
  }

  const displayName = [item.equipment_name, item.brand, item.type].filter(Boolean).join(" – ");

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-2xl px-5 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dokumentert-opplaering/katalog")}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-lg font-extrabold text-foreground">{item.equipment_name}</h1>
              <p className="font-body text-xs text-muted-foreground">{item.category_label}</p>
            </div>
            {!editing && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEmployeePicker(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 font-body text-xs font-semibold text-foreground hover:bg-secondary"
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                  Legg til opplæring
                </button>
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 font-body text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Rediger
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-5 space-y-5">
        {/* Image */}
        <ImageDropZone
          onFileSelected={handleFileUpload}
          currentImageUrl={item.image_url}
          alt={displayName}
          emptyLabel="Legg til bilde"
        />

        {/* Info */}
        <section className={`rounded-xl border bg-card p-5 space-y-4 ${editing ? "border-primary/30" : "border-border"}`}>
          <h2 className="font-display text-sm font-bold text-foreground">Utstyrsinformasjon</h2>

          {editing ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block font-body text-xs font-medium text-muted-foreground">Maskin/utstyr</label>
                <input
                  value={editEquipmentName}
                  onChange={(e) => setEditEquipmentName(e.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block font-body text-xs font-medium text-muted-foreground">Merke</label>
                <input
                  value={editBrand}
                  onChange={(e) => setEditBrand(e.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block font-body text-xs font-medium text-muted-foreground">Type/modell</label>
                <input
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <InfoField icon={<FileText className="h-4 w-4" />} label="Kategori" value={item.category_label} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <InfoField icon={<FileText className="h-4 w-4" />} label="Maskin/utstyr" value={item.equipment_name} />
              <InfoField icon={<FileText className="h-4 w-4" />} label="Merke" value={item.brand || "–"} />
              <InfoField icon={<FileText className="h-4 w-4" />} label="Type/modell" value={item.type || "–"} />
              <InfoField icon={<FileText className="h-4 w-4" />} label="Kategori" value={item.category_label} />
            </div>
          )}
        </section>

        {/* Editable details */}
        {editing ? (
          <section className="rounded-xl border border-primary/30 bg-card p-5 space-y-4">
            <h2 className="font-display text-sm font-bold text-foreground">Rediger detaljer</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1 block font-body text-xs font-medium text-muted-foreground">Plassering</label>
                <select
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Ingen plassering</option>
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
                {editLocation === "Annet" && (
                  <input
                    value={editCustomLocation}
                    onChange={(e) => setEditCustomLocation(e.target.value)}
                    placeholder="Skriv inn plassering"
                    className="mt-2 h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                )}
              </div>
              <div>
                <label className="mb-1 block font-body text-xs font-medium text-muted-foreground">Lydnivå (dB)</label>
                <input
                  value={editNoise}
                  onChange={(e) => setEditNoise(e.target.value)}
                  placeholder="dB"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block font-body text-xs font-medium text-muted-foreground">Vibrasjon (m/s²)</label>
                <input
                  value={editVibration}
                  onChange={(e) => setEditVibration(e.target.value)}
                  placeholder="m/s²"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block font-body text-xs font-medium text-muted-foreground">Beskrivelse</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  placeholder="Ekstra informasjon om utstyret..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditing(false)}
                className="rounded-lg border border-border px-4 py-2 font-body text-sm text-muted-foreground hover:bg-secondary"
              >
                Avbryt
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-body text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? "Lagrer..." : "Lagre"}
              </button>
            </div>
          </section>
        ) : (
          <section className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="font-display text-sm font-bold text-foreground">Detaljer</h2>
            <div className="grid grid-cols-2 gap-4">
              <InfoField icon={<MapPin className="h-4 w-4" />} label="Plassering" value={item.location || "Ikke angitt"} />
              <InfoField icon={<Volume2 className="h-4 w-4" />} label="Lydnivå" value={item.noise_level_db ? `${item.noise_level_db} dB` : "Ikke angitt"} />
              <InfoField icon={<Activity className="h-4 w-4" />} label="Vibrasjon" value={item.vibration_ms2 ? `${item.vibration_ms2} m/s²` : "Ikke angitt"} />
            </div>
            {item.description && (
              <div>
                <p className="mb-1 font-body text-xs font-medium text-muted-foreground">Beskrivelse</p>
                <p className="font-body text-sm text-foreground whitespace-pre-wrap">{item.description}</p>
              </div>
            )}
          </section>
        )}
      </main>

      <Dialog open={showEmployeePicker} onOpenChange={setShowEmployeePicker}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-base">Velg ansatt</DialogTitle>
            <DialogDescription className="font-body text-sm text-muted-foreground">
              Velg hvem som skal få opplæring på {item.equipment_name}
            </DialogDescription>
          </DialogHeader>
          <input
            value={employeeSearch}
            onChange={(e) => setEmployeeSearch(e.target.value)}
            placeholder="Søk etter ansatt..."
            className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filteredEmployees.length === 0 ? (
              <p className="py-4 text-center font-body text-sm text-muted-foreground">Ingen ansatte funnet</p>
            ) : (
              filteredEmployees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => handleAddTraining(emp.id)}
                  className="w-full rounded-lg px-3 py-2.5 text-left font-body text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  {emp.name}
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const InfoField = forwardRef<HTMLDivElement, { icon: React.ReactNode; label: string; value: string }>(
  ({ icon, label, value }, ref) => {
    return (
      <div ref={ref} className="flex items-start gap-2">
        <div className="mt-0.5 text-muted-foreground">{icon}</div>
        <div>
          <p className="font-body text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="font-body text-sm font-medium text-foreground">{value}</p>
        </div>
      </div>
    );
  }
);

export default EquipmentDetail;
