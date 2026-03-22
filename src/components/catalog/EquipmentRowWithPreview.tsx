import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Trash2, MapPin, Volume2, Activity, Pencil, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CatalogRow } from "./types";

interface Props {
  row: CatalogRow;
  selected: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onClick: () => void;
  isAdmin?: boolean;
  onRefresh?: () => void;
}

const EquipmentRowWithPreview = ({ row, selected, onToggle, onDelete, onClick, isAdmin, onRefresh }: Props) => {
  const [hovered, setHovered] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [cardStyle, setCardStyle] = useState<React.CSSProperties>({});
  const rowRef = useRef<HTMLTableRowElement>(null);

  // Inline edit state
  const [editingBrand, setEditingBrand] = useState(false);
  const [editingType, setEditingType] = useState(false);
  const [brandValue, setBrandValue] = useState(row.brand || "");
  const [typeValue, setTypeValue] = useState(row.type || "");
  const [saving, setSaving] = useState(false);

  const handleMouseEnter = () => {
    if (editingBrand || editingType) return;
    const t = setTimeout(() => {
      if (rowRef.current) {
        const rect = rowRef.current.getBoundingClientRect();
        const cardHeight = 280;
        const spaceBelow = window.innerHeight - rect.bottom;
        const showAbove = spaceBelow < cardHeight;
        setCardStyle({
          position: "fixed",
          right: window.innerWidth - rect.right,
          top: showAbove ? rect.top - cardHeight - 4 : rect.bottom + 4,
          zIndex: 9999,
        });
      }
      setHovered(true);
    }, 300);
    setHoverTimeout(t);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setHovered(false);
  };

  const saveBrand = async () => {
    const newBrand = brandValue.trim();
    if (!newBrand || newBrand === row.brand) { setEditingBrand(false); return; }
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke("catalog-manage", {
        body: {
          action: "rename_brand",
          category_value: row.category_value,
          equipment_name: row.equipment_name,
          old_brand: row.brand,
          new_brand: newBrand,
        },
      });
      if (error) throw error;
      toast.success(`Merke endret til "${newBrand}"`);
      setEditingBrand(false);
      onRefresh?.();
    } catch (e: any) {
      toast.error(e.message || "Feil ved endring");
    }
    setSaving(false);
  };

  const saveType = async () => {
    const newType = typeValue.trim();
    if (!newType || newType === row.type) { setEditingType(false); return; }
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke("catalog-manage", {
        body: {
          action: "rename_type",
          id: row.id,
          new_type: newType,
        },
      });
      if (error) throw error;
      toast.success(`Type endret til "${newType}"`);
      setEditingType(false);
      onRefresh?.();
    } catch (e: any) {
      toast.error(e.message || "Feil ved endring");
    }
    setSaving(false);
  };

  return (
    <>
      <tr
        ref={rowRef}
        className={`border-t border-border cursor-pointer hover:bg-secondary/50 ${selected ? "bg-primary/5" : ""}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <td
          className="w-12 px-4 py-2 cursor-default"
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={() => {}}
            className="h-4 w-4 rounded border-input accent-primary pointer-events-none"
          />
        </td>
        <td className="px-4 py-2 font-body text-sm text-foreground" onClick={editingBrand ? undefined : onClick}>
          {editingBrand ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <input
                autoFocus
                value={brandValue}
                onChange={(e) => setBrandValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveBrand(); if (e.key === "Escape") setEditingBrand(false); }}
                className="h-7 w-full rounded border border-input bg-background px-2 font-body text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                disabled={saving}
              />
              <button onClick={saveBrand} disabled={saving} className="shrink-0 rounded p-1 text-primary hover:bg-primary/10"><Check className="h-3.5 w-3.5" /></button>
              <button onClick={() => { setEditingBrand(false); setBrandValue(row.brand || ""); }} className="shrink-0 rounded p-1 text-muted-foreground hover:bg-secondary"><X className="h-3.5 w-3.5" /></button>
            </div>
          ) : (
            <div className="group/brand flex items-center gap-1">
              <span>{row.brand || "–"}</span>
              {isAdmin && row.brand && (
                <button
                  onClick={(e) => { e.stopPropagation(); setBrandValue(row.brand || ""); setEditingBrand(true); }}
                  className="invisible group-hover/brand:visible shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
                  title="Endre merke"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </td>
        <td className="px-4 py-2 font-body text-sm text-foreground" onClick={editingType ? undefined : onClick}>
          {editingType ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <input
                autoFocus
                value={typeValue}
                onChange={(e) => setTypeValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveType(); if (e.key === "Escape") setEditingType(false); }}
                className="h-7 w-full rounded border border-input bg-background px-2 font-body text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                disabled={saving}
              />
              <button onClick={saveType} disabled={saving} className="shrink-0 rounded p-1 text-primary hover:bg-primary/10"><Check className="h-3.5 w-3.5" /></button>
              <button onClick={() => { setEditingType(false); setTypeValue(row.type || ""); }} className="shrink-0 rounded p-1 text-muted-foreground hover:bg-secondary"><X className="h-3.5 w-3.5" /></button>
            </div>
          ) : (
            <div className="group/type flex items-center gap-1">
              <span>{row.type || "–"}</span>
              {isAdmin && row.type && (
                <button
                  onClick={(e) => { e.stopPropagation(); setTypeValue(row.type || ""); setEditingType(true); }}
                  className="invisible group-hover/type:visible shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
                  title="Endre type"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </td>
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
        </td>
      </tr>
      {hovered && !editingBrand && !editingType && createPortal(
        <div
          style={cardStyle}
          className="w-72 overflow-hidden rounded-xl border border-border bg-card shadow-lg"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={handleMouseLeave}
        >
          {row.image_url && (
            <img src={row.image_url} alt={row.equipment_name} className="h-36 w-full object-contain bg-muted/30" />
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
        </div>,
        document.body
      )}
    </>
  );
};

export default EquipmentRowWithPreview;
