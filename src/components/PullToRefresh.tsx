import { useRef, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
}

const THRESHOLD = 70;
const MAX_PULL = 120;

const PullToRefresh = ({ onRefresh, children }: PullToRefreshProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const spinnerRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<SVGSVGElement>(null);

  const startY = useRef(0);
  const pulling = useRef(false);
  const dist = useRef(0);
  const busy = useRef(false);
  const rafId = useRef(0);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const applyVisuals = useCallback((d: number, animate: boolean) => {
    const el = containerRef.current;
    const sp = spinnerRef.current;
    const ic = iconRef.current;
    if (!el || !sp || !ic) return;

    const t = animate ? "height .3s cubic-bezier(.2,.9,.3,1)" : "none";
    el.style.transition = t;
    el.style.height = d > 0 ? `${d}px` : "0px";

    const progress = Math.min(d / THRESHOLD, 1);
    const past = d >= THRESHOLD;

    sp.style.transition = animate ? "all .3s cubic-bezier(.2,.9,.3,1)" : "none";
    sp.style.opacity = `${Math.min(progress * 1.5, 1)}`;
    sp.style.transform = `scale(${0.5 + progress * 0.5})`;
    sp.style.borderColor = past ? "hsl(var(--primary) / 0.3)" : "";

    if (!busy.current) {
      ic.style.transition = animate ? "transform .3s ease-out" : "none";
      ic.style.transform = `rotate(${progress * 360}deg)`;
      ic.style.color = past ? "hsl(var(--primary))" : "";
      ic.classList.remove("animate-spin");
    }
  }, []);

  const startSpin = useCallback(() => {
    const ic = iconRef.current;
    if (!ic) return;
    ic.style.transition = "none";
    ic.style.transform = "";
    ic.style.color = "hsl(var(--primary))";
    ic.classList.add("animate-spin");
  }, []);

  useEffect(() => {
    const isAtTop = () => window.scrollY <= 0;

    const onTouchStart = (e: TouchEvent) => {
      if (busy.current || !isAtTop()) return;
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current || busy.current) return;
      const raw = e.touches[0].clientY - startY.current;
      if (raw > 0 && isAtTop()) {
        dist.current = Math.min(raw / 2.5, MAX_PULL);
        cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(() => applyVisuals(dist.current, false));
      } else {
        dist.current = 0;
        cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(() => applyVisuals(0, false));
      }
    };

    const onTouchEnd = async () => {
      if (!pulling.current) return;
      pulling.current = false;
      const d = dist.current;
      dist.current = 0;
      cancelAnimationFrame(rafId.current);

      if (d >= THRESHOLD && !busy.current) {
        busy.current = true;
        applyVisuals(48, true);
        startSpin();
        try {
          await onRefreshRef.current();
        } finally {
          busy.current = false;
          applyVisuals(0, true);
          const ic = iconRef.current;
          if (ic) {
            setTimeout(() => ic.classList.remove("animate-spin"), 300);
          }
        }
      } else {
        applyVisuals(0, true);
      }
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd);

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      cancelAnimationFrame(rafId.current);
    };
  }, [applyVisuals, startSpin]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="pointer-events-none flex items-center justify-center overflow-hidden"
        style={{ height: 0, willChange: "height" }}
      >
        <div
          ref={spinnerRef}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-sm"
          style={{ opacity: 0, transform: "scale(0.5)", willChange: "transform, opacity" }}
        >
          <RefreshCw
            ref={iconRef}
            className="h-4 w-4 text-muted-foreground"
            style={{ willChange: "transform" }}
          />
        </div>
      </div>
      {children}
    </div>
  );
};

export default PullToRefresh;
