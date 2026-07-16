import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const KEY = "nnhh:navDepth";

/**
 * Tracks how many in-app navigations have happened during this session,
 * so we can safely call navigate(-1) only when there's history to go back to.
 * Otherwise we fall back to the given route (default: "/").
 */
export function useSmartBack(fallback: string = "/") {
  const navigate = useNavigate();

  return useCallback(() => {
    const depth = Number(sessionStorage.getItem(KEY) || "0");
    if (depth > 0 && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback, { replace: true });
    }
  }, [navigate, fallback]);
}

/**
 * Mount once at the app root. Increments an in-session counter on every
 * client-side navigation so useSmartBack knows whether there's real history.
 */
export function useTrackNavDepth(pathname: string) {
  useEffect(() => {
    const current = Number(sessionStorage.getItem(KEY) || "0");
    sessionStorage.setItem(KEY, String(current + 1));
  }, [pathname]);
}
