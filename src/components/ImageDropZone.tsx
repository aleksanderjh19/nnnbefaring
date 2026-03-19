import { useState, useRef, useCallback } from "react";
import { Camera, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageDropZoneProps {
  onFileSelected: (file: File) => void;
  currentImageUrl?: string | null;
  alt?: string;
  className?: string;
  emptyLabel?: string;
  /** Show camera button overlay on existing image */
  showOverlayButton?: boolean;
  accept?: string;
}

export function ImageDropZone({
  onFileSelected,
  currentImageUrl,
  alt = "Bilde",
  className,
  emptyLabel = "Legg til bilde",
  showOverlayButton = true,
  accept = "image/*",
}: ImageDropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) {
        onFileSelected(file);
      }
    },
    [onFileSelected]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
    e.target.value = "";
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn("relative rounded-xl border border-border bg-card overflow-hidden transition-colors", dragging && "border-primary bg-primary/5", className)}
    >
      {currentImageUrl ? (
        <div className="relative">
          <img src={currentImageUrl} alt={alt} className="w-full max-h-72 object-contain bg-muted/30" />
          {showOverlayButton && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-card/80 backdrop-blur text-foreground shadow hover:bg-card"
              title="Bytt bilde"
            >
              <Camera className="h-4 w-4" />
            </button>
          )}
          {dragging && (
            <div className="absolute inset-0 flex items-center justify-center bg-primary/10 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-1 text-primary">
                <Upload className="h-8 w-8" />
                <span className="font-body text-sm font-semibold">Slipp for å bytte bilde</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 py-16 text-muted-foreground hover:text-primary"
        >
          {dragging ? (
            <>
              <Upload className="h-8 w-8 text-primary" />
              <span className="font-body text-sm text-primary font-semibold">Slipp bildet her</span>
            </>
          ) : (
            <>
              <Camera className="h-8 w-8" />
              <span className="font-body text-sm">{emptyLabel}</span>
              <span className="font-body text-xs text-muted-foreground/60">eller dra og slipp</span>
            </>
          )}
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
