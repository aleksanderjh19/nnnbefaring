import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X, Download, ChevronLeft, ChevronRight } from "lucide-react";

export interface LightboxItem {
  url: string;
  filename: string;
}

interface Props {
  items: LightboxItem[];
  index: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIndexChange: (i: number) => void;
}

export default function Sf6PhotoLightbox({ items, index, open, onOpenChange, onIndexChange }: Props) {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const touchRef = useRef({
    initialDist: 0,
    initialScale: 1,
    startX: 0,
    startY: 0,
    initialPanX: 0,
    initialPanY: 0,
    lastTouchTime: 0,
  });

  const reset = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    reset();
  }, [index, open]);

  const current = items[index];
  if (!current) return null;

  const download = async () => {
    try {
      const res = await fetch(current.url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = current.filename.endsWith(".jpg") ? current.filename : `${current.filename}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(current.url, "_blank");
    }
  };

  const prev = () => onIndexChange((index - 1 + items.length) % items.length);
  const next = () => onIndexChange((index + 1) % items.length);

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent
        className="h-[95vh] w-[95vw] max-w-none gap-0 border-none bg-transparent p-0 shadow-none overflow-hidden select-none touch-none"
        onTouchStart={(e) => {
          if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            touchRef.current.initialDist = Math.hypot(dx, dy);
            touchRef.current.initialScale = scale;
          } else if (e.touches.length === 1) {
            touchRef.current.startX = e.touches[0].clientX;
            touchRef.current.startY = e.touches[0].clientY;
            touchRef.current.initialPanX = pan.x;
            touchRef.current.initialPanY = pan.y;
            const now = Date.now();
            if (now - touchRef.current.lastTouchTime < 300) {
              if (scale > 1) reset(); else setScale(3);
            }
            touchRef.current.lastTouchTime = now;
          }
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.hypot(dx, dy);
            const newScale = Math.min(
              Math.max(touchRef.current.initialScale * (dist / (touchRef.current.initialDist || 1)), 1),
              8
            );
            setScale(newScale);
          } else if (e.touches.length === 1 && scale > 1) {
            const dx = e.touches[0].clientX - touchRef.current.startX;
            const dy = e.touches[0].clientY - touchRef.current.startY;
            setPan({
              x: touchRef.current.initialPanX + dx,
              y: touchRef.current.initialPanY + dy,
            });
          }
        }}
        onTouchEnd={() => {
          if (scale < 1.1) reset();
        }}
        onWheel={(e) => {
          e.preventDefault();
          const delta = e.deltaY > 0 ? -0.2 : 0.2;
          setScale((p) => Math.min(Math.max(p + delta, 1), 8));
        }}
      >
        <DialogTitle className="sr-only">{current.filename}</DialogTitle>

        <button
          onClick={() => { onOpenChange(false); reset(); }}
          className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
          aria-label="Lukk"
        >
          <X className="h-5 w-5" />
        </button>

        <button
          onClick={download}
          className="absolute left-4 top-4 z-50 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-2 text-xs font-medium text-white hover:bg-black/80"
        >
          <Download className="h-4 w-4" /> Last ned JPEG
        </button>

        {items.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 z-50 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              aria-label="Forrige"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 z-50 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              aria-label="Neste"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            <div className="absolute bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
              {index + 1} / {items.length}
            </div>
          </>
        )}

        <div className="flex h-full w-full items-center justify-center p-4 overflow-hidden">
          <img
            src={current.url}
            alt={current.filename}
            className="max-h-full max-w-full object-contain rounded-lg"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transition: scale === 1 && pan.x === 0 && pan.y === 0 ? "transform 0.2s ease-out" : "none",
            }}
            draggable={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
