import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import {
  ArrowLeft, Plus, ChevronDown, ChevronRight, Search, X, GraduationCap, ImagePlus, Merge, Pencil,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useSortOrders } from "@/hooks/useSortOrders";
import { LOCATIONS, CATEGORY_META } from "@/components/catalog/constants";
import type { CatalogRow, GroupedEquipment } from "@/components/catalog/types";
import SortableCategoryChip from "@/components/catalog/SortableCategoryChip";
import SortableEquipmentCard from "@/components/catalog/SortableEquipmentCard";
import EquipmentRowWithPreview from "@/components/catalog/EquipmentRowWithPreview";
import QuickAdd from "@/components/catalog/QuickAdd";

const EquipmentCatalog = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { saveSortOrders, sortItems } = useSortOrders();
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedEquipment, setExpandedEquipment] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [showEmployeePicker, setShowEmployeePicker] = useState(false);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState("");

  // Admin merge/rename state
  const [showMerge, setShowMerge] = useState(false);
  const [mergeType, setMergeType] = useState<"equipment" | "category">("equipment");
  const [mergeSourceCat, setMergeSourceCat] = useState("");
  const [mergeSourceEquip, setMergeSourceEquip] = useState("");
  const [mergeTargetCat, setMergeTargetCat] = useState("");
  const [mergeTargetEquip, setMergeTargetEquip] = useState("");
  const [merging, setMerging] = useState(false);
  const [showRenameEquip, setShowRenameEquip] = useState(false);
  const [renameCat, setRenameCat] = useState("");
  const [renameOldName, setRenameOldName] = useState("");
  const [renameNewName, setRenameNewName] = useState("");
  const [renaming, setRenaming] = useState(false);

  // Merge types state
  const [showMergeTypes, setShowMergeTypes] = useState(false);
  const [mergeTypesRows, setMergeTypesRows] = useState<CatalogRow[]>([]);
  const [mergeTypesTarget, setMergeTypesTarget] = useState("");
  const [mergingTypes, setMergingTypes] = useState(false);

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
  const [addImageFile, setAddImageFile] = useState<File | null>(null);
  const [addImagePreview, setAddImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchCatalog = async (preserveScroll = false) => {
    const scrollY = preserveScroll ? window.scrollY : 0;
    const { data } = await supabase
      .from("equipment_catalog")
      .select("*")
      .order("category_value")
      .order("equipment_name")
      .order("brand")
      .order("type");
    if (data) setRows(data as CatalogRow[]);
    setLoading(false);
    if (preserveScroll) requestAnimationFrame(() => window.scrollTo(0, scrollY));
  };

  useEffect(() => { document.title = "Utstyrskatalog – Statnett"; fetchCatalog(); }, []);

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

  const categories = useMemo(() => {
    const cats = CATEGORY_META.map((cat) => ({
      ...cat,
      count: grouped.get(cat.value)?.size || 0,
    }));
    return sortItems(cats, "category", "_all_", (c) => c.value);
  }, [grouped, sortItems]);

  const filteredCategories = activeCategory
    ? categories.filter((c) => c.value === activeCategory)
    : categories.filter((c) => c.count > 0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleCategoryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = categories.findIndex((c) => c.value === active.id);
    const newIndex = categories.findIndex((c) => c.value === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(categories, oldIndex, newIndex);
    await saveSortOrders("category", "_all_", reordered.map((c) => c.value));
  };

  const handleEquipmentDragEnd = async (catValue: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const catEquipment = grouped.get(catValue);
    if (!catEquipment) return;
    const equipmentList = sortItems(
      Array.from(catEquipment.values()).filter(matchesSearch),
      "equipment", catValue, (eq) => eq.equipment_name
    );
    const oldIndex = equipmentList.findIndex((eq) => eq.equipment_name === active.id);
    const newIndex = equipmentList.findIndex((eq) => eq.equipment_name === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(equipmentList, oldIndex, newIndex);
    await saveSortOrders("equipment", catValue, reordered.map((eq) => eq.equipment_name));
  };

  const handleAdd = async () => {
    if (!addEquipment.trim()) return;
    setUploading(true);
    const catLabel = CATEGORY_META.find((c) => c.value === addCategory)?.label || addCategory;
    const resolvedLocation = addLocation === "Annet" ? addCustomLocation.trim() : addLocation;

    let imageUrl: string | null = null;
    if (addImageFile) {
      const ext = addImageFile.name.split(".").pop() || "jpg";
      const path = `equipment/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("training-files").upload(path, addImageFile);
      if (!error) {
        const { data: urlData } = supabase.storage.from("training-files").getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }
    }

    await supabase.from("equipment_catalog").insert({
      category_value: addCategory,
      category_label: catLabel,
      equipment_name: addEquipment.trim(),
      brand: addBrand.trim() || null,
      type: addType.trim() || null,
      location: resolvedLocation || null,
      image_url: imageUrl,
    });
    setAddEquipment(""); setAddEquipmentCustom(false);
    setAddBrand(""); setAddBrandCustom(false);
    setAddType(""); setAddLocation(""); setAddCustomLocation("");
    setAddImageFile(null); setAddImagePreview(null);
    setShowAdd(false); setUploading(false);
    fetchCatalog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Slette denne oppføringen?")) return;
    await supabase.from("equipment_catalog").delete().eq("id", id);
    fetchCatalog(true);
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
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAllInEquipment = (eqRows: CatalogRow[]) => {
    const allSelected = eqRows.every((r) => selectedRowIds.has(r.id));
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      eqRows.forEach((r) => { if (allSelected) next.delete(r.id); else next.add(r.id); });
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
    if (selectedRows.length === 1) {
      const row = selectedRows[0];
      const params = new URLSearchParams({ category: row.category_value, equipment: row.equipment_name });
      if (row.brand) params.set("brand", row.brand);
      if (row.type) params.set("type", row.type);
      navigate(`/dokumentert-opplaering/ansatt/${employeeId}/ny?${params.toString()}`);
      return;
    }
    const items = selectedRows.map((r) => ({
      category: r.category_value, equipment: r.equipment_name,
      brand: r.brand || "", type: r.type || "",
    }));
    sessionStorage.setItem("bulk_training_items", JSON.stringify(items));
    const first = items[0];
    const params = new URLSearchParams({ category: first.category, equipment: first.equipment, bulk: "true" });
    if (first.brand) params.set("brand", first.brand);
    if (first.type) params.set("type", first.type);
    navigate(`/dokumentert-opplaering/ansatt/${employeeId}/ny?${params.toString()}`);
  };

  const handleMerge = async () => {
    setMerging(true);
    try {
      if (mergeType === "equipment") {
        const { error } = await supabase.functions.invoke("catalog-manage", {
          body: { action: "merge_equipment", category_value: mergeSourceCat, source_name: mergeSourceEquip, target_name: mergeTargetEquip },
        });
        if (error) throw error;
        toast.success(`"${mergeSourceEquip}" slått sammen med "${mergeTargetEquip}"`);
      } else {
        const targetLabel = CATEGORY_META.find((c) => c.value === mergeTargetCat)?.label || mergeTargetCat;
        const { error } = await supabase.functions.invoke("catalog-manage", {
          body: { action: "merge_category", source_value: mergeSourceCat, target_value: mergeTargetCat, target_label: targetLabel },
        });
        if (error) throw error;
        toast.success("Kategorier slått sammen");
      }
      setShowMerge(false);
      fetchCatalog(true);
    } catch (e: any) {
      toast.error(e.message || "Feil ved sammenslåing");
    }
    setMerging(false);
  };

  const handleRenameEquip = async () => {
    if (!renameNewName.trim() || renameNewName.trim() === renameOldName) return;
    setRenaming(true);
    try {
      const { error } = await supabase.functions.invoke("catalog-manage", {
        body: { action: "rename_equipment", category_value: renameCat, old_name: renameOldName, new_name: renameNewName.trim() },
      });
      if (error) throw error;
      toast.success(`"${renameOldName}" omdøpt til "${renameNewName.trim()}"`);
      setShowRenameEquip(false);
      fetchCatalog(true);
    } catch (e: any) {
      toast.error(e.message || "Feil ved omdøping");
    }
    setRenaming(false);
  };

  const openMergeTypes = (eqRows: CatalogRow[]) => {
    const selected = eqRows.filter((r) => selectedRowIds.has(r.id));
    if (selected.length < 2) { toast.error("Velg minst 2 typer for sammenslåing"); return; }
    setMergeTypesRows(selected);
    setMergeTypesTarget(selected[0].id);
    setShowMergeTypes(true);
  };

  const handleMergeTypes = async () => {
    if (!mergeTypesTarget || mergeTypesRows.length < 2) return;
    setMergingTypes(true);
    const targetRow = mergeTypesRows.find((r) => r.id === mergeTypesTarget);
    if (!targetRow) return;
    const sourceIds = mergeTypesRows.filter((r) => r.id !== mergeTypesTarget).map((r) => r.id);
    try {
      const { error } = await supabase.functions.invoke("catalog-manage", {
        body: {
          action: "merge_types",
          source_ids: sourceIds,
          target_id: mergeTypesTarget,
          target_brand: targetRow.brand,
          target_type: targetRow.type,
          category_value: targetRow.category_value,
          equipment_name: targetRow.equipment_name,
        },
      });
      if (error) throw error;
      toast.success(`${mergeTypesRows.length} typer slått sammen til "${targetRow.brand} ${targetRow.type}"`);
      setShowMergeTypes(false);
      setSelectedRowIds(new Set());
      fetchCatalog(true);
    } catch (e: any) {
      toast.error(e.message || "Feil ved sammenslåing");
    }
    setMergingTypes(false);
  };

  // Get unique equipment names for a category (for merge UI)
  const getEquipmentNamesForCategory = (catValue: string) => {
    const catMap = grouped.get(catValue);
    return catMap ? Array.from(catMap.keys()).sort() : [];
  };

  const handleImageSelect = (file: File | null) => {
    setAddImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setAddImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setAddImagePreview(null);
    }
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
          {isAdmin && (
            <button
              onClick={() => { setShowMerge(true); setMergeType("equipment"); setMergeSourceCat(categories[0]?.value || ""); setMergeTargetCat(categories[0]?.value || ""); setMergeSourceEquip(""); setMergeTargetEquip(""); }}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 font-body text-xs font-semibold text-foreground hover:bg-secondary"
            >
              <Merge className="h-3.5 w-3.5" />
              Slå sammen
            </button>
          )}
        </div>

        {/* Add form */}
        {showAdd && (
          <AddEquipmentForm
            rows={rows}
            addCategory={addCategory}
            setAddCategory={(v) => { setAddCategory(v); setAddEquipment(""); setAddEquipmentCustom(false); setAddBrand(""); setAddBrandCustom(false); }}
            addEquipment={addEquipment}
            setAddEquipment={setAddEquipment}
            addEquipmentCustom={addEquipmentCustom}
            setAddEquipmentCustom={setAddEquipmentCustom}
            addBrand={addBrand}
            setAddBrand={setAddBrand}
            addBrandCustom={addBrandCustom}
            setAddBrandCustom={setAddBrandCustom}
            addType={addType}
            setAddType={setAddType}
            addLocation={addLocation}
            setAddLocation={setAddLocation}
            addCustomLocation={addCustomLocation}
            setAddCustomLocation={setAddCustomLocation}
            addImagePreview={addImagePreview}
            onImageSelect={handleImageSelect}
            uploading={uploading}
            onClose={() => setShowAdd(false)}
            onSubmit={handleAdd}
          />
        )}

        {/* Category filter chips */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
          <SortableContext items={categories.filter((c) => c.count > 0).map((c) => c.value)} strategy={verticalListSortingStrategy}>
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
              {categories.filter((c) => c.count > 0).map((cat) => (
                <SortableCategoryChip
                  key={cat.value}
                  cat={cat}
                  isActive={activeCategory === cat.value}
                  onClick={() => setActiveCategory(activeCategory === cat.value ? null : cat.value)}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {loading ? (
          <p className="py-8 text-center font-body text-sm text-muted-foreground">Laster...</p>
        ) : (
          <div className="space-y-4">
            {filteredCategories.map((cat) => {
              const catEquipment = grouped.get(cat.value);
              if (!catEquipment) return null;
              const CatIcon = cat.icon;
              const equipmentList = sortItems(
                Array.from(catEquipment.values()).filter(matchesSearch),
                "equipment", cat.value, (eq) => eq.equipment_name
              );
              if (equipmentList.length === 0) return null;

              return (
                <div key={cat.value}>
                  <div className="mb-2 flex items-center gap-2">
                    <CatIcon className="h-4 w-4 text-accent" />
                    <h2 className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      {cat.label}
                    </h2>
                  </div>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleEquipmentDragEnd(cat.value, e)}>
                    <SortableContext items={equipmentList.map((eq) => eq.equipment_name)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-1">
                        {equipmentList.map((eq) => {
                          const eqKey = `${cat.value}::${eq.equipment_name}`;
                          const isExpanded = expandedEquipment === eqKey;
                          return (
                            <SortableEquipmentCard key={eq.equipment_name} id={eq.equipment_name} isAdmin={isAdmin}>
                              <div className="flex w-full items-center gap-1">
                                <button
                                  onClick={() => setExpandedEquipment(isExpanded ? null : eqKey)}
                                  className="flex flex-1 items-center gap-3 px-4 py-3 text-left hover:bg-secondary"
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="font-display text-sm font-bold text-foreground">{eq.equipment_name}</p>
                                    <p className="font-body text-xs text-muted-foreground">
                                      {eq.brands.size} merke{eq.brands.size !== 1 ? "r" : ""} · {eq.rows.length} type{eq.rows.length !== 1 ? "r" : ""}
                                    </p>
                                  </div>
                                  {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                                </button>
                                {isAdmin && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setRenameCat(cat.value); setRenameOldName(eq.equipment_name); setRenameNewName(eq.equipment_name); setShowRenameEquip(true); }}
                                    className="mr-2 shrink-0 rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                                    title="Endre navn"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                              {isExpanded && (
                                <div className="border-t border-border bg-secondary/30">
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
                                      <div className="flex items-center gap-2">
                                        {isAdmin && eq.rows.filter((r) => selectedRowIds.has(r.id)).length >= 2 && (
                                          <button
                                            onClick={() => openMergeTypes(eq.rows)}
                                            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 font-body text-xs font-semibold text-foreground hover:bg-secondary"
                                          >
                                            <Merge className="h-3.5 w-3.5" />
                                            Slå sammen ({eq.rows.filter((r) => selectedRowIds.has(r.id)).length})
                                          </button>
                                        )}
                                        <button
                                          onClick={() => { setEmployeeSearch(""); setShowEmployeePicker(true); }}
                                          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 font-body text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                                        >
                                          <GraduationCap className="h-3.5 w-3.5" />
                                          Legg til opplæring ({eq.rows.filter((r) => selectedRowIds.has(r.id)).length})
                                        </button>
                                      </div>
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
                                            isAdmin={isAdmin}
                                            onRefresh={fetchCatalog}
                                          />
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                  <QuickAdd
                                    categoryValue={cat.value}
                                    categoryLabel={cat.label}
                                    equipmentName={eq.equipment_name}
                                    onAdded={fetchCatalog}
                                  />
                                </div>
                              )}
                            </SortableEquipmentCard>
                          );
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Employee picker dialog */}
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

      {/* Merge dialog */}
      <Dialog open={showMerge} onOpenChange={setShowMerge}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-base">Slå sammen</DialogTitle>
            <DialogDescription className="font-body text-sm text-muted-foreground">
              Slå sammen utstyr eller kategorier. Opplæringsdata flyttes automatisk.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setMergeType("equipment")}
                className={`flex-1 rounded-lg px-3 py-2 font-body text-xs font-semibold transition-colors ${mergeType === "equipment" ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-secondary"}`}
              >
                Utstyr
              </button>
              <button
                onClick={() => setMergeType("category")}
                className={`flex-1 rounded-lg px-3 py-2 font-body text-xs font-semibold transition-colors ${mergeType === "category" ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-secondary"}`}
              >
                Kategori
              </button>
            </div>

            {mergeType === "equipment" ? (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block font-body text-xs text-muted-foreground">Kategori</label>
                  <select value={mergeSourceCat} onChange={(e) => { setMergeSourceCat(e.target.value); setMergeSourceEquip(""); setMergeTargetEquip(""); }}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    {categories.filter((c) => c.count > 0).map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-body text-xs text-muted-foreground">Flytt fra (kilde)</label>
                  <select value={mergeSourceEquip} onChange={(e) => setMergeSourceEquip(e.target.value)}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Velg utstyr...</option>
                    {getEquipmentNamesForCategory(mergeSourceCat).map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-body text-xs text-muted-foreground">Slå sammen med (mål)</label>
                  <select value={mergeTargetEquip} onChange={(e) => setMergeTargetEquip(e.target.value)}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Velg utstyr...</option>
                    {getEquipmentNamesForCategory(mergeSourceCat).filter((n) => n !== mergeSourceEquip).map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                {mergeSourceEquip && mergeTargetEquip && (
                  <p className="rounded-lg bg-destructive/10 px-3 py-2 font-body text-xs text-destructive">
                    Alt utstyr og opplæring under «{mergeSourceEquip}» flyttes til «{mergeTargetEquip}». Kildeoppføringene slettes.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block font-body text-xs text-muted-foreground">Flytt fra (kilde-kategori)</label>
                  <select value={mergeSourceCat} onChange={(e) => setMergeSourceCat(e.target.value)}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Velg kategori...</option>
                    {categories.filter((c) => c.count > 0).map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-body text-xs text-muted-foreground">Slå sammen med (mål-kategori)</label>
                  <select value={mergeTargetCat} onChange={(e) => setMergeTargetCat(e.target.value)}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Velg kategori...</option>
                    {categories.filter((c) => c.value !== mergeSourceCat).map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                {mergeSourceCat && mergeTargetCat && (
                  <p className="rounded-lg bg-destructive/10 px-3 py-2 font-body text-xs text-destructive">
                    Alt utstyr flyttes fra «{categories.find((c) => c.value === mergeSourceCat)?.label}» til «{categories.find((c) => c.value === mergeTargetCat)?.label}». Opplæringsdata oppdateres.
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowMerge(false)} className="rounded-lg border border-border px-4 py-2 font-body text-sm text-muted-foreground hover:bg-secondary">Avbryt</button>
              <button
                onClick={handleMerge}
                disabled={merging || (mergeType === "equipment" ? (!mergeSourceEquip || !mergeTargetEquip) : (!mergeSourceCat || !mergeTargetCat))}
                className="rounded-lg bg-destructive px-4 py-2 font-body text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {merging ? "Slår sammen..." : "Slå sammen"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename equipment dialog */}
      <Dialog open={showRenameEquip} onOpenChange={setShowRenameEquip}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-base">Endre navn på utstyr</DialogTitle>
            <DialogDescription className="font-body text-sm text-muted-foreground">
              Endringen gjelder for alle oppføringer og opplæringsdata.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block font-body text-xs text-muted-foreground">Nåværende navn</label>
              <p className="font-body text-sm font-medium text-foreground">{renameOldName}</p>
            </div>
            <div>
              <label className="mb-1 block font-body text-xs text-muted-foreground">Nytt navn</label>
              <input
                value={renameNewName}
                onChange={(e) => setRenameNewName(e.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowRenameEquip(false)} className="rounded-lg border border-border px-4 py-2 font-body text-sm text-muted-foreground hover:bg-secondary">Avbryt</button>
              <button
                onClick={handleRenameEquip}
                disabled={renaming || !renameNewName.trim() || renameNewName.trim() === renameOldName}
                className="rounded-lg bg-primary px-4 py-2 font-body text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {renaming ? "Lagrer..." : "Lagre"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Merge types dialog */}
      <Dialog open={showMergeTypes} onOpenChange={setShowMergeTypes}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-base">Slå sammen typer</DialogTitle>
            <DialogDescription className="font-body text-sm text-muted-foreground">
              Velg hvilken type som skal beholdes. De andre slettes fra katalogen, men ansatte som har opplæring på disse beholder opplæringen med oppdatert navn.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {mergeTypesRows.map((r) => (
              <label
                key={r.id}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                  mergeTypesTarget === r.id ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"
                }`}
              >
                <input
                  type="radio"
                  name="mergeTarget"
                  checked={mergeTypesTarget === r.id}
                  onChange={() => setMergeTypesTarget(r.id)}
                  className="accent-primary"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-body text-sm font-medium text-foreground">{r.brand || "–"}</p>
                  <p className="font-body text-xs text-muted-foreground">{r.type || "–"}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowMergeTypes(false)}
              className="rounded-lg border border-border px-4 py-2 font-body text-sm text-muted-foreground hover:bg-secondary"
            >
              Avbryt
            </button>
            <button
              onClick={handleMergeTypes}
              disabled={mergingTypes}
              className="rounded-lg bg-primary px-4 py-2 font-body text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {mergingTypes ? "Slår sammen..." : `Slå sammen (${mergeTypesRows.length} → 1)`}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/** Inline add-equipment form (extracted for readability) */
function AddEquipmentForm({
  rows, addCategory, setAddCategory, addEquipment, setAddEquipment,
  addEquipmentCustom, setAddEquipmentCustom, addBrand, setAddBrand,
  addBrandCustom, setAddBrandCustom, addType, setAddType,
  addLocation, setAddLocation, addCustomLocation, setAddCustomLocation,
  addImagePreview, onImageSelect, uploading, onClose, onSubmit,
}: {
  rows: CatalogRow[];
  addCategory: string; setAddCategory: (v: string) => void;
  addEquipment: string; setAddEquipment: (v: string) => void;
  addEquipmentCustom: boolean; setAddEquipmentCustom: (v: boolean) => void;
  addBrand: string; setAddBrand: (v: string) => void;
  addBrandCustom: boolean; setAddBrandCustom: (v: boolean) => void;
  addType: string; setAddType: (v: string) => void;
  addLocation: string; setAddLocation: (v: string) => void;
  addCustomLocation: string; setAddCustomLocation: (v: string) => void;
  addImagePreview: string | null; onImageSelect: (f: File | null) => void;
  uploading: boolean; onClose: () => void; onSubmit: () => void;
}) {
  const existingNames = Array.from(
    new Set(rows.filter((r) => r.category_value === addCategory).map((r) => r.equipment_name))
  ).sort();

  const existingBrands = Array.from(
    new Set(
      rows
        .filter((r) => r.category_value === addCategory && (!addEquipment || r.equipment_name === addEquipment))
        .map((r) => r.brand)
        .filter(Boolean) as string[]
    )
  ).sort();

  return (
    <div className="mb-4 rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-bold text-foreground">Legg til i katalog</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {/* Category */}
        <div>
          <label className="mb-1 block font-body text-xs text-muted-foreground">Kategori *</label>
          <select
            value={addCategory}
            onChange={(e) => setAddCategory(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {CATEGORY_META.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        {/* Equipment name */}
        <div>
          <label className="mb-1 block font-body text-xs text-muted-foreground">Maskin/utstyr *</label>
          {addEquipmentCustom || existingNames.length === 0 ? (
            <div className="flex gap-1">
              <input
                value={addEquipment}
                onChange={(e) => setAddEquipment(e.target.value)}
                placeholder="F.eks. Motorsag"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {existingNames.length > 0 && (
                <button type="button" onClick={() => { setAddEquipmentCustom(false); setAddEquipment(""); }}
                  className="shrink-0 rounded-lg border border-input px-2 text-muted-foreground hover:bg-secondary" title="Velg fra liste">
                  <ChevronDown className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <select
              value={addEquipment}
              onChange={(e) => { if (e.target.value === "__custom__") { setAddEquipmentCustom(true); setAddEquipment(""); } else setAddEquipment(e.target.value); }}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Velg maskin/utstyr...</option>
              <option value="__custom__">✏️ Skriv eget...</option>
              {existingNames.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          )}
        </div>

        {/* Brand */}
        <div>
          <label className="mb-1 block font-body text-xs text-muted-foreground">Merke</label>
          {addBrandCustom || existingBrands.length === 0 ? (
            <div className="flex gap-1">
              <input
                value={addBrand}
                onChange={(e) => setAddBrand(e.target.value)}
                placeholder="F.eks. Stihl"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {existingBrands.length > 0 && (
                <button type="button" onClick={() => { setAddBrandCustom(false); setAddBrand(""); }}
                  className="shrink-0 rounded-lg border border-input px-2 text-muted-foreground hover:bg-secondary" title="Velg fra liste">
                  <ChevronDown className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <select
              value={addBrand}
              onChange={(e) => { if (e.target.value === "__custom__") { setAddBrandCustom(true); setAddBrand(""); } else setAddBrand(e.target.value); }}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Velg merke...</option>
              <option value="__custom__">✏️ Skriv eget...</option>
              {existingBrands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
            </select>
          )}
        </div>

        {/* Type */}
        <div>
          <label className="mb-1 block font-body text-xs text-muted-foreground">Type/modell</label>
          <input
            value={addType}
            onChange={(e) => setAddType(e.target.value)}
            placeholder="F.eks. MS 261"
            className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Location */}
        <div className="col-span-2">
          <label className="mb-1 block font-body text-xs text-muted-foreground">Plassering</label>
          <select
            value={addLocation}
            onChange={(e) => setAddLocation(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Ingen plassering</option>
            {LOCATIONS.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
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

        {/* Image */}
        <div className="col-span-2">
          <label className="mb-1 block font-body text-xs text-muted-foreground">Bilde</label>
          {addImagePreview ? (
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border">
                <img src={addImagePreview} alt="Forhåndsvisning" className="h-full w-full object-contain" />
                <button type="button" onClick={() => onImageSelect(null)}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const file = e.dataTransfer.files?.[0]; if (file?.type.startsWith("image/")) onImageSelect(file); }}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              className="group"
            >
              <label className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-input px-4 py-6 text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
                <ImagePlus className="h-6 w-6" />
                <span className="font-body text-xs">Klikk eller dra og slipp bilde</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onImageSelect(e.target.files?.[0] || null)} />
              </label>
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={onSubmit}
          disabled={!addEquipment.trim() || uploading}
          className="rounded-lg bg-primary px-4 py-2 font-body text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {uploading ? "Laster opp..." : "Legg til"}
        </button>
      </div>
    </div>
  );
}

export default EquipmentCatalog;
