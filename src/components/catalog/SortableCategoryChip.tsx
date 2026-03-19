import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { CategoryMeta } from "./types";

interface Props {
  cat: CategoryMeta;
  isActive: boolean;
  onClick: () => void;
  isAdmin: boolean;
}

const SortableCategoryChip = ({ cat, isActive, onClick, isAdmin }: Props) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cat.value,
    disabled: !isAdmin,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const CatIcon = cat.icon;

  return (
    <button
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-body text-xs font-medium transition-colors ${
        isActive
          ? "bg-primary text-primary-foreground"
          : "border border-border text-muted-foreground hover:bg-secondary"
      }`}
    >
      {isAdmin && (
        <span {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none">
          <GripVertical className="h-3 w-3 opacity-40" />
        </span>
      )}
      <CatIcon className="h-3 w-3" />
      {cat.label} ({cat.count})
    </button>
  );
};

export default SortableCategoryChip;
