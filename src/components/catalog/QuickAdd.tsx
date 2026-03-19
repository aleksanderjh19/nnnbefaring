import { useState } from "react";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  categoryValue: string;
  categoryLabel: string;
  equipmentName: string;
  onAdded: () => void;
}

const QuickAdd = ({ categoryValue, categoryLabel, equipmentName, onAdded }: Props) => {
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
};

export default QuickAdd;
