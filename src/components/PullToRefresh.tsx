import { useState, useRef, useCallback, useEffect } from "react";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
}

const THRESHOLD = 80;

const PullToRefresh = ({ onRefresh, children }: PullToRefreshProps) => {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const isAtTop = useCallback(() => {
    return window.scrollY <= 0;
  }, []);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (isAtTop() && !refreshing) {
        startY.current = e.touches[0].clientY;
        setPulling(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!pulling || refreshing) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;
      if (diff > 0 && isAtTop()) {
        setPullDistance(Math.min(diff * 0.5, THRESHOLD * 1.5));
      } else {
        setPullDistance(0);
      }
    };

    const handleTouchEnd = async () => {
      if (!pulling) return;
      if (pullDistance >= THRESHOLD && !refreshing) {
        setRefreshing(true);
        setPullDistance(THRESHOLD * 0.6);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
        }
      }
      setPullDistance(0);
      setPulling(false);
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pulling, pullDistance, refreshing, isAtTop, onRefresh]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div ref={containerRef}>
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-out"
        style={{ height: pullDistance > 0 || refreshing ? `${Math.max(pullDistance, refreshing ? THRESHOLD * 0.6 : 0)}px` : "0px" }}
      >
        <RefreshCw
          className={`h-5 w-5 text-muted-foreground transition-transform ${refreshing ? "animate-spin" : ""}`}
          style={{ opacity: progress, transform: `rotate(${progress * 360}deg)` }}
        />
      </div>
      {children}
    </div>
  );
};

export default PullToRefresh;
