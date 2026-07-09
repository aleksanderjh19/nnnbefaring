import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Card visibility flags. Key convention: `card:${scope}:${cardId}`.
 * When a row is missing, the card is treated as visible (default true).
 * When `enabled` is false, the card is hidden for non-admin users; admins
 * still see it (dimmed) so they can toggle visibility back on.
 */
export function useFeatureFlags(scope: string) {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  const prefix = `card:${scope}:`;

  useEffect(() => {
    let active = true;
    const load = () => {
      supabase
        .from("feature_flags")
        .select("key, enabled")
        .like("key", `${prefix}%`)
        .then(({ data }) => {
          if (!active) return;
          const map: Record<string, boolean> = {};
          (data ?? []).forEach((f) => {
            map[f.key.slice(prefix.length)] = f.enabled;
          });
          setFlags(map);
          setLoaded(true);
        });
    };
    load();

    const channel = supabase
      .channel(`feature_flags:${prefix}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feature_flags" },
        () => load()
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [prefix]);

  const isVisible = useCallback(
    (cardId: string) => flags[cardId] !== false,
    [flags]
  );

  /** For non-admin users: hide until loaded to avoid a flash of hidden cards. */
  const isVisibleForUser = useCallback(
    (cardId: string, isAdmin: boolean) => {
      if (isAdmin) return true;
      if (!loaded) return false;
      return flags[cardId] !== false;
    },
    [flags, loaded]
  );

  const toggle = useCallback(
    async (cardId: string) => {
      const current = flags[cardId] !== false;
      const next = !current;
      setFlags((prev) => ({ ...prev, [cardId]: next }));
      const { error } = await supabase
        .from("feature_flags")
        .upsert({
          key: `${prefix}${cardId}`,
          enabled: next,
          updated_at: new Date().toISOString(),
        });
      if (error) {
        setFlags((prev) => ({ ...prev, [cardId]: current }));
        toast.error("Kunne ikke oppdatere synlighet");
      } else {
        toast.success(next ? "Synlig for brukere" : "Skjult for brukere");
      }
    },
    [flags, prefix]
  );

  return { isVisible, isVisibleForUser, toggle, loaded };
}
