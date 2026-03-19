import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  id: string;
  isAdmin: boolean;
  children: ReactNode;
}

const SortableEquipmentCard = ({ id, isAdmin, children }: Props) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !isAdmin,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-stretch">
        {isAdmin && (
          <div
            {...attributes}
            {...listeners}
            className="flex w-8 shrink-0 cursor-grab items-center justify-center border-r border-border text-muted-foreground hover:bg-secondary active:cursor-grabbing touch-none"
          >
            <GripVertical className="h-4 w-4 opacity-40" />
          </div>
        )}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
};

export default SortableEquipmentCard;
