import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, AlertTriangle, Clock, Check, RotateCcw, X, ZoomIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { getGuideById } from "@/data/montasjeGuides";

const MontasjeDetail = () => {
  const { guideId } = useParams<{ guideId: string }>();
  const navigate = useNavigate();
  const guide = guideId ? getGuideById(guideId) : undefined;

  useEffect(() => {
    document.title = guide ? `${guide.title} – Statnett` : "Veiledning – Statnett";
  }, [guide]);

  const storageKey = `montasje-checks:${guideId}`;
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(storageKey, JSON.stringify(checked));
  }, [checked, storageKey]);

  if (!guide) {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto max-w-2xl px-5 py-10 text-center">
          <p className="font-body text-sm text-muted-foreground">Fant ikke veiledningen.</p>
          <button
            onClick={() => navigate("/ledning/montasje")}
            className="mt-4 inline-flex items-center gap-1.5 font-body text-sm font-medium text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Tilbake til oversikt
          </button>
        </main>
      </div>
    );
  }

  const toggle = (key: string) =>
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));

  const totalItems = guide.sections.reduce((n, s) => n + s.items.length, 0);
  const doneItems = guide.sections.reduce(
    (n, s) => n + s.items.filter((_, i) => checked[`${s.title}:${i}`]).length,
    0
  );
  const pct = totalItems ? Math.round((doneItems / totalItems) * 100) : 0;
  const [imageOpen, setImageOpen] = useState(false);
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

  const resetZoom = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto max-w-2xl px-5 py-4">
          <button
            onClick={() => navigate("/ledning/montasje")}
            className="mb-2 inline-flex items-center gap-1.5 font-body text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Tilbake
          </button>
          <h1 className="font-display text-lg font-extrabold tracking-tight text-foreground">
            {guide.title}
          </h1>
          <p className="mt-0.5 font-body text-xs text-muted-foreground">
            {guide.description}
          </p>
          {guide.estimatedTime && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 font-body text-[11px] font-medium text-muted-foreground">
              <Clock className="h-3 w-3" />
              {guide.estimatedTime}
            </div>
          )}

          <div className="mt-3 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="font-body text-[11px] font-semibold tabular-nums text-muted-foreground">
              {doneItems}/{totalItems}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-6 space-y-6">
        {guide.image && (
          <figure className="overflow-hidden rounded-xl border border-border bg-card">
            <button
              onClick={() => setImageOpen(true)}
              className="relative block w-full cursor-zoom-in"
            >
              <img
                src={guide.image.url}
                alt={guide.image.caption || guide.title}
                className="w-full object-contain bg-muted"
              />
              <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white">
                <ZoomIn className="h-4 w-4" />
              </span>
            </button>
            {guide.image.caption && (
              <figcaption className="px-4 py-2 font-body text-[11px] text-muted-foreground">
                {guide.image.caption}
              </figcaption>
            )}
          </figure>
        )}
        {guide.sections.map((section) => (
          <section key={section.title}>
            <h2 className="mb-3 font-display text-xs font-bold uppercase tracking-widest text-statnett">
              {section.title}
            </h2>
            <ul className="space-y-2">
              {section.items.map((item, i) => {
                const key = `${section.title}:${i}`;
                const isChecked = !!checked[key];
                return (
                  <li key={key}>
                    <button
                      onClick={() => toggle(key)}
                      className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                        isChecked
                          ? "border-primary/40 bg-primary/5"
                          : "border-border bg-card hover:bg-secondary"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                          isChecked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background"
                        }`}
                      >
                        {isChecked && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`font-body text-sm ${
                            isChecked
                              ? "text-muted-foreground line-through"
                              : "text-foreground"
                          }`}
                        >
                          {item.text}
                        </p>
                        {item.warning && (
                          <div className="mt-1.5 flex items-start gap-1.5 rounded-md bg-amber-500/10 px-2 py-1.5">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                            <p className="font-body text-[11px] font-medium text-amber-700 dark:text-amber-300">
                              {item.warning}
                            </p>
                          </div>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {doneItems > 0 && (
          <button
            onClick={() => setChecked({})}
            className="mx-auto flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 font-body text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Nullstill avkrysning
          </button>
        )}
      </main>

      <Dialog open={imageOpen} onOpenChange={(open) => { setImageOpen(open); if (!open) resetZoom(); }}>
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
                if (scale > 1) {
                  resetZoom();
                } else {
                  setScale(3);
                }
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
            if (scale < 1.1) {
              resetZoom();
            }
          }}
          onWheel={(e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.2 : 0.2;
            setScale((prev) => Math.min(Math.max(prev + delta, 1), 8));
          }}
        >
          <DialogTitle className="sr-only">
            {guide.image?.caption || guide.title}
          </DialogTitle>
          <button
            onClick={() => { setImageOpen(false); resetZoom(); }}
            className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex h-full w-full items-center justify-center p-4 overflow-hidden">
            <img
              src={guide.image?.url}
              alt={guide.image?.caption || guide.title}
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
    </div>
  );
};

export default MontasjeDetail;
