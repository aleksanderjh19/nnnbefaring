import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

const DEV_ADMIN_KEY = "__dev_admin_override";

function getDevAdminOverride(): boolean | null {
  const val = localStorage.getItem(DEV_ADMIN_KEY);
  if (val === "true") return true;
  if (val === "false") return false;
  return null;
}

export function setDevAdminOverride(isAdmin: boolean) {
  localStorage.setItem(DEV_ADMIN_KEY, String(isAdmin));
  window.dispatchEvent(new Event("dev-admin-change"));
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [realIsAdmin, setRealIsAdmin] = useState(false);
  const [devOverride, setDevOverride] = useState<boolean | null>(getDevAdminOverride);
  const [loading, setLoading] = useState(true);

  // Listen for dev toggle changes
  useEffect(() => {
    const handler = () => setDevOverride(getDevAdminOverride());
    window.addEventListener("dev-admin-change", handler);
    return () => window.removeEventListener("dev-admin-change", handler);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .eq("role", "admin")
            .maybeSingle()
            .then(({ data }) => setRealIsAdmin(!!data));
        }, 0);
      } else {
        setRealIsAdmin(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle()
          .then(({ data }) => {
            setRealIsAdmin(!!data);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = devOverride !== null ? devOverride : realIsAdmin;

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { session, user, isAdmin, realIsAdmin, loading, signOut };
}
