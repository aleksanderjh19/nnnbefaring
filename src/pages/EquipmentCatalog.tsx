import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Plus, Trash2, ChevronDown, ChevronRight,
  Wrench, Car, HardHat, Cpu, Package, Fuel, Search, X, Tractor, GraduationCap, MapPin, Volume2, Activity
} from "lucide-react";
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

const CATEGORY_META = [
  { value: "bensinverktoy", label: "Bensin-/motorverktøy", icon: Fuel },
  { value: "el_verktoy", label: "El.verktøy", icon: Wrench },
  { value: "kjøretøy", label: "Kjøretøy", icon: Car },
  { value: "maskin", label: "Maskin", icon: Cpu },
  { value: "traktor_utstyr", label: "Traktor m/utstyr", icon: Tractor },
  { value: "utstyr", label: "Utstyr", icon: HardHat },
  { value: "annet", label: "Annet", icon: Package },
];

interface CatalogRow {
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

interface GroupedEquipment {
  equipment_name: string;
  brands: Map<string, string[]>; // brand -> types
  rows: CatalogRow[];
}

const EquipmentCatalog = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedEquipment, setExpandedEquipment] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [showEmployeePicker, setShowEmployeePicker] = useState(false);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState("");

  // Add form state
  const [showAdd, setShowAdd] = useState(false);
  const [addCategory, setAddCategory] = useState("bensinverktoy");
  const [addEquipment, setAddEquipment] = useState("");
  const [addEquipmentCustom, setAddEquipmentCustom] = useState(false);
  const [addBrand, setAddBrand] = useState("");
  const [addBrandCustom, setAddBrandCustom] = useState(false);
  const [addType, setAddType] = useState("");
  const [addLocation, setAddLocation] = useState("");
  const [addCustomLocation, setAddCustomLocation] = useState("");

  const fetchCatalog = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("equipment_catalog")
      .select("*")
      .order("category_value")
      .order("equipment_name")
      .order("brand")
      .order("type");
    if (data) setRows(data as CatalogRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchCatalog(); }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Map<string, GroupedEquipment>>();
    for (const row of rows) {
      if (!map.has(row.category_value)) map.set(row.category_value, new Map());
      const catMap = map.get(row.category_value)!;
      if (!catMap.has(row.equipment_name)) {
        catMap.set(row.equipment_name, { equipment_name: row.equipment_name, brands: new Map(), rows: [] });
      }
      const eq = catMap.get(row.equipment_name)!;
      eq.rows.push(row);
      if (row.brand) {
        if (!eq.brands.has(row.brand)) eq.brands.set(row.brand, []);
        if (row.type) eq.brands.get(row.brand)!.push(row.type);
      }
    }
    return map;
  }, [rows]);

  const categories = CATEGORY_META.map((cat) => ({
    ...cat,
    count: grouped.get(cat.value)?.size || 0,
  }));

  const filteredCategories = activeCategory
    ? categories.filter((c) => c.value === activeCategory)
    : categories.filter((c) => c.count > 0);

  const handleAdd = async () => {
    if (!addEquipment.trim()) return;
    const catLabel = CATEGORY_META.find((c) => c.value === addCategory)?.label || addCategory;
    const resolvedLocation = addLocation === "Annet" ? addCustomLocation.trim() : addLocation;
    await supabase.from("equipment_catalog").insert({
      category_value: addCategory,
      category_label: catLabel,
      equipment_name: addEquipment.trim(),
      brand: addBrand.trim() || null,
      type: addType.trim() || null,
      location: resolvedLocation || null,
    });
    setAddEquipment("");
    setAddEquipmentCustom(false);
    setAddBrand("");
    setAddBrandCustom(false);
    setAddType("");
    setAddLocation("");
    setAddCustomLocation("");
    setShowAdd(false);
    fetchCatalog();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Slette denne oppføringen?")) return;
    await supabase.from("equipment_catalog").delete().eq("id", id);
    fetchCatalog();
  };

  const matchesSearch = (eq: GroupedEquipment) => {
    if (!search) return true;
    const s = search.toLowerCase();
    if (eq.equipment_name.toLowerCase().includes(s)) return true;
    for (const [brand, types] of eq.brands) {
      if (brand.toLowerCase().includes(s)) return true;
      if (types.some((t) => t.toLowerCase().includes(s))) return true;
    }
    return false;
  };

  const toggleRowSelection = (id: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllInEquipment = (eqRows: CatalogRow[]) => {
    const allSelected = eqRows.every((r) => selectedRowIds.has(r.id));
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      eqRows.forEach((r) => {
        if (allSelected) next.delete(r.id);
        else next.add(r.id);
      });
      return next;
    });
  };

  useEffect(() => {
    if (showEmployeePicker && employees.length === 0) {
      supabase.from("employees").select("id, name").order("name").then(({ data }) => {
        if (data) setEmployees(data);
      });
    }
  }, [showEmployeePicker]);

  const filteredEmployees = employees.filter((e) =>
    e.name.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  const selectedRows = rows.filter((r) => selectedRowIds.has(r.id));

  const handleAddTraining = (employeeId: string) => {
    if (selectedRows.length === 0) return;
    // If only one selected, navigate directly with full info
    if (selectedRows.length === 1) {
      const row = selectedRows[0];
      const params = new URLSearchParams({
        category: row.category_value,
        equipment: row.equipment_name,
      });
      if (row.brand) params.set("brand", row.brand);
      if (row.type) params.set("type", row.type);
      navigate(`/dokumentert-opplaering/ansatt/${employeeId}/ny?${params.toString()}`);
      return;
    }
    // Multiple selected - navigate with first item and store rest in sessionStorage
    const items = selectedRows.map((r) => ({
      category: r.category_value,
      equipment: r.equipment_name,
      brand: r.brand || "",
      type: r.type || "",
    }));
    sessionStorage.setItem("bulk_training_items", JSON.stringify(items));
    const first = items[0];
    const params = new URLSearchParams({
      category: first.category,
      equipment: first.equipment,
      bulk: "true",
    });
    if (first.brand) params.set("brand", first.brand);
    if (first.type) params.set("type", first.type);
    navigate(`/dokumentert-opplaering/ansatt/${employeeId}/ny?${params.toString()}`);
  };

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
              <h1 className="font-display text-lg font-extrabold text-foreground">Utstyrskatalog</h1>
              <p className="font-body text-xs text-muted-foreground">Administrer kategorier, merker og typer</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-5">
        {/* Search + Add */}
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Søk utstyr, merke, type..."
              className="h-10 w-full rounded-xl border border-input bg-card pl-10 pr-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 font-body text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" />
            Legg til
          </button>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="mb-4 rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-foreground">Legg til i katalog</h3>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block font-body text-xs text-muted-foreground">Kategori *</label>
                <select
                  value={addCategory}
                  onChange={(e) => { setAddCategory(e.target.value); setAddEquipment(""); setAddEquipmentCustom(false); setAddBrand(""); setAddBrandCustom(false); }}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {CATEGORY_META.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block font-body text-xs text-muted-foreground">Maskin/utstyr *</label>
                {(() => {
                  const existingNames = Array.from(
                    new Set(rows.filter((r) => r.category_value === addCategory).map((r) => r.equipment_name))
                  ).sort();
                  if (addEquipmentCustom || existingNames.length === 0) {
                    return (
                      <div className="flex gap-1">
                        <input
                          value={addEquipment}
                          onChange={(e) => setAddEquipment(e.target.value)}
                          placeholder="F.eks. Motorsag"
                          className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        {existingNames.length > 0 && (
                          <button
                            type="button"
                            onClick={() => { setAddEquipmentCustom(false); setAddEquipment(""); }}
                            className="shrink-0 rounded-lg border border-input px-2 text-muted-foreground hover:bg-secondary"
                            title="Velg fra liste"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    );
                  }
                  return (
                    <select
                      value={addEquipment}
                      onChange={(e) => {
                        if (e.target.value === "__custom__") {
                          setAddEquipmentCustom(true);
                          setAddEquipment("");
                        } else {
                          setAddEquipment(e.target.value);
                        }
                      }}
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Velg maskin/utstyr...</option>
                      <option value="__custom__">✏️ Skriv eget...</option>
                      {existingNames.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  );
                })()}
              </div>
              <div>
                <label className="mb-1 block font-body text-xs text-muted-foreground">Merke</label>
                {(() => {
                  const existingBrands = Array.from(
                    new Set(
                      rows
                        .filter((r) => r.category_value === addCategory && (!addEquipment || r.equipment_name === addEquipment))
                        .map((r) => r.brand)
                        .filter(Boolean) as string[]
                    )
                  ).sort();
                  if (addBrandCustom || existingBrands.length === 0) {
                    return (
                      <div className="flex gap-1">
                        <input
                          value={addBrand}
                          onChange={(e) => setAddBrand(e.target.value)}
                          placeholder="F.eks. Stihl"
                          className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        {existingBrands.length > 0 && (
                          <button
                            type="button"
                            onClick={() => { setAddBrandCustom(false); setAddBrand(""); }}
                            className="shrink-0 rounded-lg border border-input px-2 text-muted-foreground hover:bg-secondary"
                            title="Velg fra liste"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    );
                  }
                  return (
                    <select
                      value={addBrand}
                      onChange={(e) => {
                        if (e.target.value === "__custom__") {
                          setAddBrandCustom(true);
                          setAddBrand("");
                        } else {
                          setAddBrand(e.target.value);
                        }
                      }}
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Velg merke...</option>
                      <option value="__custom__">✏️ Skriv eget...</option>
                      {existingBrands.map((brand) => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                  );
                })()}
              </div>
              <div>
                <label className="mb-1 block font-body text-xs text-muted-foreground">Type/modell</label>
                <input
                  value={addType}
                  onChange={(e) => setAddType(e.target.value)}
                  placeholder="F.eks. MS 261"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block font-body text-xs text-muted-foreground">Plassering</label>
                <select
                  value={addLocation}
                  onChange={(e) => setAddLocation(e.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Ingen plassering</option>
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
                {addLocation === "Annet" && (
                  <input
                    value={addCustomLocation}
                    onChange={(e) => setAddCustomLocation(e.target.value)}
                    placeholder="Skriv inn plassering"
                    className="mt-2 h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleAdd}
                disabled={!addEquipment.trim()}
                className="rounded-lg bg-primary px-4 py-2 font-body text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Legg til
              </button>
            </div>
          </div>
        )}

        {/* Category filter chips */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`rounded-lg px-3 py-1.5 font-body text-xs font-medium transition-colors ${
              activeCategory === null
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            Alle
          </button>
          {categories.filter((c) => c.count > 0).map((cat) => {
            const CatIcon = cat.icon;
            return (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(activeCategory === cat.value ? null : cat.value)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-body text-xs font-medium transition-colors ${
                  activeCategory === cat.value
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover:bg-secondary"
                }`}
              >
                <CatIcon className="h-3 w-3" />
                {cat.label} ({cat.count})
              </button>
            );
          })}
        </div>

        {loading ? (
          <p className="py-8 text-center font-body text-sm text-muted-foreground">Laster...</p>
        ) : (
          <div className="space-y-4">
            {filteredCategories.map((cat) => {
              const catEquipment = grouped.get(cat.value);
              if (!catEquipment) return null;
              const CatIcon = cat.icon;
              const equipmentList = Array.from(catEquipment.values()).filter(matchesSearch);
              if (equipmentList.length === 0) return null;

              return (
                <div key={cat.value}>
                  <div className="mb-2 flex items-center gap-2">
                    <CatIcon className="h-4 w-4 text-accent" />
                    <h2 className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      {cat.label}
                    </h2>
                  </div>
                  <div className="space-y-1">
                    {equipmentList.map((eq) => {
                      const eqKey = `${cat.value}::${eq.equipment_name}`;
                      const isExpanded = expandedEquipment === eqKey;
                      return (
                        <div key={eqKey} className="overflow-hidden rounded-xl border border-border bg-card">
                          <button
                            onClick={() => setExpandedEquipment(isExpanded ? null : eqKey)}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-secondary"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-display text-sm font-bold text-foreground">{eq.equipment_name}</p>
                              <p className="font-body text-xs text-muted-foreground">
                                {eq.brands.size} merke{eq.brands.size !== 1 ? "r" : ""} · {eq.rows.length} type{eq.rows.length !== 1 ? "r" : ""}
                              </p>
                            </div>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                            )}
                          </button>
                          {isExpanded && (
                            <div className="border-t border-border bg-secondary/30">
                              {/* Select all + training button */}
                              <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={eq.rows.every((r) => selectedRowIds.has(r.id))}
                                    onChange={() => toggleAllInEquipment(eq.rows)}
                                    className="h-4 w-4 rounded border-input accent-primary"
                                  />
                                  <span className="font-body text-xs font-medium text-muted-foreground">Velg alle</span>
                                </label>
                                {eq.rows.some((r) => selectedRowIds.has(r.id)) && (
                                  <button
                                    onClick={() => { setEmployeeSearch(""); setShowEmployeePicker(true); }}
                                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 font-body text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                                  >
                                    <GraduationCap className="h-3.5 w-3.5" />
                                    Legg til opplæring ({eq.rows.filter((r) => selectedRowIds.has(r.id)).length})
                                  </button>
                                )}
                              </div>
                              <div className="overflow-hidden">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="bg-muted/50">
                                      <th className="w-10 px-4 py-2"></th>
                                      <th className="px-4 py-2 text-left font-body text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Merke</th>
                                      <th className="px-4 py-2 text-left font-body text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Type/modell</th>
                                      <th className="px-4 py-2 text-right font-body text-[10px] font-medium uppercase tracking-wider text-muted-foreground"></th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {eq.rows.map((row) => (
                                      <EquipmentRowWithPreview
                                        key={row.id}
                                        row={row}
                                        selected={selectedRowIds.has(row.id)}
                                        onToggle={() => toggleRowSelection(row.id)}
                                        onDelete={() => handleDelete(row.id)}
                                        onClick={() => navigate(`/dokumentert-opplaering/katalog/${row.id}`)}
                                      />
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              {/* Quick add for this equipment */}
                              <QuickAdd
                                categoryValue={cat.value}
                                categoryLabel={cat.label}
                                equipmentName={eq.equipment_name}
                                onAdded={fetchCatalog}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={showEmployeePicker} onOpenChange={setShowEmployeePicker}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-base">Velg ansatt</DialogTitle>
            <DialogDescription className="font-body text-sm text-muted-foreground">
              Legg til opplæring for {selectedRowIds.size} valgt{selectedRowIds.size !== 1 ? "e" : ""} utstyr
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

function EquipmentRowWithPreview({
  row,
  selected,
  onToggle,
  onDelete,
  onClick,
}: {
  row: CatalogRow;
  selected: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    const t = setTimeout(() => setHovered(true), 300);
    setHoverTimeout(t);
  };
  const handleMouseLeave = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setHovered(false);
  };

  return (
    <tr
      className={`relative border-t border-border cursor-pointer hover:bg-secondary/50 ${selected ? "bg-primary/5" : ""}`}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <td className="px-4 py-2">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => { e.stopPropagation(); onToggle(); }}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-input accent-primary"
        />
      </td>
      <td className="px-4 py-2 font-body text-sm text-foreground">{row.brand || "–"}</td>
      <td className="px-4 py-2 font-body text-sm text-foreground">{row.type || "–"}</td>
      <td className="px-4 py-2 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            title="Slett"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        {hovered && (
          <div
            className="absolute right-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-xl border border-border bg-card shadow-lg"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={handleMouseLeave}
          >
            {row.image_url && (
              <img
                src={row.image_url}
                alt={row.equipment_name}
                className="h-36 w-full object-contain bg-muted/30"
              />
            )}
            <div className="p-3 space-y-2">
              <div>
                <p className="font-display text-sm font-bold text-foreground">{row.equipment_name}</p>
                <p className="font-body text-xs text-muted-foreground">
                  {[row.brand, row.type].filter(Boolean).join(" · ") || row.category_label}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {row.location && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="font-body text-xs truncate">{row.location}</span>
                  </div>
                )}
                {row.noise_level_db && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Volume2 className="h-3 w-3 shrink-0" />
                    <span className="font-body text-xs">{row.noise_level_db} dB</span>
                  </div>
                )}
                {row.vibration_ms2 && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Activity className="h-3 w-3 shrink-0" />
                    <span className="font-body text-xs">{row.vibration_ms2} m/s²</span>
                  </div>
                )}
              </div>
              {row.description && (
                <p className="font-body text-xs text-muted-foreground line-clamp-2">{row.description}</p>
              )}
              {!row.image_url && !row.location && !row.noise_level_db && !row.vibration_ms2 && !row.description && (
                <p className="font-body text-xs italic text-muted-foreground">Ingen detaljer lagt til ennå</p>
              )}
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}

function QuickAdd({
  categoryValue,
  categoryLabel,
  equipmentName,
  onAdded,
}: {
  categoryValue: string;
  categoryLabel: string;
  equipmentName: string;
  onAdded: () => void;
}) {
  const [brand, setBrand] = useState("");
  const [type, setType] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!brand.trim() && !type.trim()) return;
    setAdding(true);
    await supabase.from("equipment_catalog").insert({
      category_value: categoryValue,
      category_label: categoryLabel,
      equipment_name: equipmentName,
      brand: brand.trim() || null,
      type: type.trim() || null,
    });
    setBrand("");
    setType("");
    setAdding(false);
    onAdded();
  };

  return (
    <div className="flex items-center gap-2 border-t border-border px-4 py-2">
      <input
        value={brand}
        onChange={(e) => setBrand(e.target.value)}
        placeholder="Merke"
        className="h-8 flex-1 rounded-lg border border-input bg-background px-2 font-body text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <input
        value={type}
        onChange={(e) => setType(e.target.value)}
        placeholder="Type/modell"
        className="h-8 flex-1 rounded-lg border border-input bg-background px-2 font-body text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <button
        onClick={handleAdd}
        disabled={adding || (!brand.trim() && !type.trim())}
        className="flex h-8 items-center gap-1 rounded-lg bg-primary px-2.5 font-body text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

export default EquipmentCatalog;
