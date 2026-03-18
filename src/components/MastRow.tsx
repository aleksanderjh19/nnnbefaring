import { memo } from "react";
import { Check } from "lucide-react";

interface MastRowProps {
  mastNumber: number;
  checked: boolean;
  onToggle: () => void;
}

export const MastRow = memo(function MastRow({ mastNumber, checked, onToggle }: MastRowProps) {
  return (
    <button
      onClick={onToggle}
      className={`tap-highlight-none flex w-full items-center justify-between rounded-lg border px-4 py-3 transition-colors duration-100 active:scale-[0.98] ${
        checked
          ? "border-success/30 bg-success/10"
          : "border-border bg-card hover:bg-secondary"
      }`}
    >
      <span className="font-display text-sm font-semibold tracking-tight text-foreground">
        MAST {mastNumber}
      </span>
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-all duration-100 ${
          checked
            ? "bg-success animate-check-pop"
            : "border-2 border-muted bg-card"
        }`}
      >
        {checked && <Check className="h-5 w-5 text-success-foreground" strokeWidth={3} />}
      </div>
    </button>
  );
});
