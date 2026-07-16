import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Returns a back handler that goes to the previous page in history
 * when there is one, and otherwise navigates to the provided fallback.
 *
 * Detection: React Router sets `location.key === "default"` for the very
 * first entry in the browser history stack. Any in-app navigation gives
 * the location a non-default key, meaning `navigate(-1)` is safe.
 */
export function useSmartBack(fallback: string = "/") {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    if (location.key && location.key !== "default") {
      navigate(-1);
    } else {
      navigate(fallback, { replace: true });
    }
  }, [navigate, location.key, fallback]);
}
