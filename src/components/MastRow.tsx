import { memo } from "react";
import { Check } from "lucide-react";

interface MastRowProps {
  mastNumber: number;
  checked: boolean;
  onToggle: () => void;
}

export const MastRow = memo(function MastRow({ mastNumber, checked, onToggle }: MastRowProps) {
  return (
    <div
      data-mast={mastNumber}
      className={`tap-highlight-none flex w-full cursor-pointer items-center justify-between rounded-lg border px-4 py-3 transition-colors duration-100 ${
        checked
          ? "border-success/30 bg-success/10"
          : "border-border bg-card hover:bg-secondary"
      }`}
    >
      <span className="font-display text-sm font-semibold tracking-tight text-foreground pointer-events-none">
        MAST {mastNumber}
      </span>
      <div
        className={`pointer-events-none flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-all duration-100 ${
          checked
            ? "bg-success animate-check-pop"
            : "border-2 border-muted bg-card"
        }`}
      >
        {checked && <Check className="h-5 w-5 text-success-foreground" strokeWidth={3} />}
      </div>
    </div>
  );
});
