import { memo } from "react";
import { Check } from "lucide-react";

interface MastRowProps {
  mastNumber: number;
  checked: boolean;
  pending?: boolean;
  onToggle: () => void;
}

export const MastRow = memo(function MastRow({ mastNumber, checked, pending, onToggle }: MastRowProps) {
  const isPending = pending && !checked;
  const isPendingUncheck = pending && checked;

  return (
    <div
      data-mast={mastNumber}
      className={`tap-highlight-none flex w-full cursor-pointer items-center justify-between rounded-lg border px-4 py-3 transition-colors duration-100 ${
        isPending
          ? "border-primary/40 bg-primary/10"
          : isPendingUncheck
            ? "border-warning/40 bg-warning/10"
            : checked
              ? "border-success/30 bg-success/10"
              : "border-border bg-card hover:bg-secondary"
      }`}
    >
      <span className="font-display text-sm font-semibold tracking-tight text-foreground pointer-events-none">
        MAST {mastNumber}
      </span>
      <div
        className={`pointer-events-none flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-all duration-100 ${
          isPending
            ? "border-2 border-primary bg-primary/20"
            : isPendingUncheck
              ? "bg-warning"
              : checked
                ? "bg-success animate-check-pop"
                : "border-2 border-muted bg-card"
        }`}
      >
        {checked && !isPendingUncheck && <Check className="h-5 w-5 text-success-foreground" strokeWidth={3} />}
        {isPending && <Check className="h-5 w-5 text-primary" strokeWidth={3} />}
        {isPendingUncheck && <span className="font-body text-xs font-bold text-warning-foreground">✕</span>}
      </div>
    </div>
  );
});
