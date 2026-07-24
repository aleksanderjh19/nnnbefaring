import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function DeletionRequestBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-destructive/40 bg-destructive/10 text-destructive gap-1",
        className
      )}
    >
      <Clock className="h-3 w-3" />
      Slettes snart
    </Badge>
  );
}
