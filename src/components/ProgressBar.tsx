interface ProgressBarProps {
  done: number;
  total: number;
  percent: number;
}

export function ProgressBar({ done, total, percent }: ProgressBarProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-body">
        <span className="font-medium text-foreground">
          {done} / {total} utført
        </span>
        <span className="font-bold text-foreground">{percent}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
