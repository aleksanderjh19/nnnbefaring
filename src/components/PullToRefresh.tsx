import { useState, useRef, useEffect } from "react";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
}

const THRESHOLD = 70;
const MAX_PULL = 120;

const PullToRefresh = ({ onRefresh, children }: PullToRefreshProps) => {
  const [displayDistance, setDisplayDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [releasing, setReleasing] = useState(false);

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
        setReleasing(false);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!pullingRef.current || refreshingRef.current) return;
      const currentY = e.touches[0].clientY;
      const rawDiff = currentY - startY.current;
      if (rawDiff > 0 && isAtTop()) {
        // Rubber-band effect: diminishing returns as you pull further
        const resistance = Math.min(rawDiff / 2.5, MAX_PULL);
        pullDistRef.current = resistance;
        setDisplayDistance(resistance);
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
        setReleasing(true);
        setDisplayDistance(48); // Snap to spinner resting position
        try {
          await onRefreshRef.current();
        } finally {
          refreshingRef.current = false;
          setRefreshing(false);
          setReleasing(true);
          setDisplayDistance(0);
          setTimeout(() => setReleasing(false), 300);
        }
      } else {
        setReleasing(true);
        setDisplayDistance(0);
        setTimeout(() => setReleasing(false), 300);
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
  const isPulling = displayDistance > 0 || refreshing;
  const pastThreshold = displayDistance >= THRESHOLD;

  return (
    <div className="relative">
      {/* Pull indicator */}
      <div
        className={`pointer-events-none flex items-center justify-center overflow-hidden ${
          releasing ? "transition-[height] duration-300 ease-out" : ""
        }`}
        style={{ height: isPulling ? `${displayDistance}px` : "0px" }}
      >
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full border bg-card shadow-sm ${
            releasing ? "transition-all duration-300 ease-out" : ""
          } ${
            pastThreshold || refreshing
              ? "border-primary/30 shadow-primary/10"
              : "border-border"
          }`}
          style={{
            opacity: Math.max(0, Math.min(progress * 1.5, 1)),
            transform: `scale(${0.5 + progress * 0.5})`,
          }}
        >
          <RefreshCw
            className={`h-4 w-4 ${
              refreshing
                ? "animate-spin text-primary"
                : pastThreshold
                ? "text-primary"
                : "text-muted-foreground"
            }`}
            style={
              !refreshing
                ? { transform: `rotate(${progress * 360}deg)`, transition: releasing ? "transform 0.3s ease-out" : "none" }
                : undefined
            }
          />
        </div>
      </div>
      {children}
    </div>
  );
};

export default PullToRefresh;
