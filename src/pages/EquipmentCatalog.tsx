import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Plus, Trash2, ChevronDown, ChevronRight,
  Wrench, Car, HardHat, Cpu, Package, Fuel, Search, X, Tractor
} from "lucide-react";

const LOCATIONS = [
  "Bjerka (oppmøtested)",
  "Stasjon Nedre Røssåga",
  "Stasjon Øvre Røssåga",
  "Stasjon Langvatn",
  "Stasjon Bjerka",
  "Stasjon Bleikvassli",
  "Stasjon Sjøfossen",
  "Stasjon Sundsfjord",
  "Stasjon Haukvik",
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

  // Add form state
  const [showAdd, setShowAdd] = useState(false);
  const [addCategory, setAddCategory] = useState("bensinverktoy");
  const [addEquipment, setAddEquipment] = useState("");
  const [addBrand, setAddBrand] = useState("");
  const [addType, setAddType] = useState("");

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
    await supabase.from("equipment_catalog").insert({
      category_value: addCategory,
      category_label: catLabel,
      equipment_name: addEquipment.trim(),
      brand: addBrand.trim() || null,
      type: addType.trim() || null,
    });
    setAddEquipment("");
    setAddBrand("");
    setAddType("");
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
                  onChange={(e) => setAddCategory(e.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {CATEGORY_META.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block font-body text-xs text-muted-foreground">Maskin/utstyr *</label>
                <input
                  value={addEquipment}
                  onChange={(e) => setAddEquipment(e.target.value)}
                  placeholder="F.eks. Motorsag"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block font-body text-xs text-muted-foreground">Merke</label>
                <input
                  value={addBrand}
                  onChange={(e) => setAddBrand(e.target.value)}
                  placeholder="F.eks. Stihl"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
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
                              <div className="overflow-hidden">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="bg-muted/50">
                                      <th className="px-4 py-2 text-left font-body text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Merke</th>
                                      <th className="px-4 py-2 text-left font-body text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Type/modell</th>
                                      <th className="px-4 py-2 text-right font-body text-[10px] font-medium uppercase tracking-wider text-muted-foreground"></th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {eq.rows.map((row) => (
                                      <tr
                                        key={row.id}
                                        className="border-t border-border cursor-pointer hover:bg-secondary/50"
                                        onClick={() => navigate(`/dokumentert-opplaering/katalog/${row.id}`)}
                                      >
                                        <td className="px-4 py-2 font-body text-sm text-foreground">{row.brand || "–"}</td>
                                        <td className="px-4 py-2 font-body text-sm text-foreground">{row.type || "–"}</td>
                                        <td className="px-4 py-2 text-right">
                                          <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
                                            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                            title="Slett"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        </td>
                                      </tr>
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
    </div>
  );
};

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
