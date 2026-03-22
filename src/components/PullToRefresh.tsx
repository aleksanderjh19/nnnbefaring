import { useState, useRef, useCallback, useEffect } from "react";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
}

const THRESHOLD = 80;

const PullToRefresh = ({ onRefresh, children }: PullToRefreshProps) => {
  const [displayDistance, setDisplayDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const startY = useRef(0);
  const pullingRef = useRef(false);
  const pullDistRef = useRef(0);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    const isAtTop = () => window.scrollY <= 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (isAtTop() && !refreshingRef.current) {
        startY.current = e.touches[0].clientY;
        pullingRef.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!pullingRef.current || refreshingRef.current) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;
      if (diff > 0 && isAtTop()) {
        const dist = Math.min(diff * 0.5, THRESHOLD * 1.5);
        pullDistRef.current = dist;
        setDisplayDistance(dist);
      } else {
        pullDistRef.current = 0;
        setDisplayDistance(0);
      }
    };

    const handleTouchEnd = async () => {
      if (!pullingRef.current) return;
      const dist = pullDistRef.current;
      pullingRef.current = false;
      pullDistRef.current = 0;

      if (dist >= THRESHOLD && !refreshingRef.current) {
        refreshingRef.current = true;
        setRefreshing(true);
        setDisplayDistance(THRESHOLD * 0.6);
        try {
          await onRefreshRef.current();
        } finally {
          refreshingRef.current = false;
          setRefreshing(false);
          setDisplayDistance(0);
        }
      } else {
        setDisplayDistance(0);
      }
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  const progress = Math.min(displayDistance / THRESHOLD, 1);

  return (
    <div>
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-out"
        style={{ height: displayDistance > 0 || refreshing ? `${Math.max(displayDistance, refreshing ? THRESHOLD * 0.6 : 0)}px` : "0px" }}
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
