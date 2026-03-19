import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Trash2, MapPin, Volume2, Activity } from "lucide-react";
import type { CatalogRow } from "./types";

interface Props {
  row: CatalogRow;
  selected: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onClick: () => void;
}

const EquipmentRowWithPreview = ({ row, selected, onToggle, onDelete, onClick }: Props) => {
  const [hovered, setHovered] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [cardStyle, setCardStyle] = useState<React.CSSProperties>({});
  const rowRef = useRef<HTMLTableRowElement>(null);

  const handleMouseEnter = () => {
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
        <td className="px-4 py-2 font-body text-sm text-foreground" onClick={onClick}>{row.brand || "–"}</td>
        <td className="px-4 py-2 font-body text-sm text-foreground" onClick={onClick}>{row.type || "–"}</td>
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
      {hovered && createPortal(
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
