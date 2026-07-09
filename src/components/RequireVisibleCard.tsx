import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  scope: string;
  cardId: string;
  children: ReactNode;
  /** Where to send blocked users. Defaults to "/". */
  redirectTo?: string;
};

/**
 * Blocks navigation into a route if the corresponding card is hidden by admin.
 * Admins always pass through. Users see a redirect to `redirectTo` if hidden.
 */
const RequireVisibleCard = ({ scope, cardId, children, redirectTo = "/" }: Props) => {
  const { isAdmin, loading } = useAuth();
  const [status, setStatus] = useState<"loading" | "allowed" | "blocked">("loading");

  useEffect(() => {
    if (loading) return;
    if (isAdmin) {
      setStatus("allowed");
      return;
    }
    let active = true;
    supabase
      .from("feature_flags")
      .select("enabled")
      .eq("key", `card:${scope}:${cardId}`)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setStatus(data?.enabled === false ? "blocked" : "allowed");
      });
    return () => {
      active = false;
    };
  }, [scope, cardId, isAdmin, loading]);

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-body text-sm text-muted-foreground">Laster...</p>
      </div>
    );
  }
  if (status === "blocked") return <Navigate to={redirectTo} replace />;
  return <>{children}</>;
};

export default RequireVisibleCard;
