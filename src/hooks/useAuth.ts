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
  const [isOwner, setIsOwner] = useState(false);
  const [devOverride, setDevOverride] = useState<boolean | null>(getDevAdminOverride);
  const [loading, setLoading] = useState(true);

  // Listen for dev toggle changes
  useEffect(() => {
    const handler = () => setDevOverride(getDevAdminOverride());
    window.addEventListener("dev-admin-change", handler);
    return () => window.removeEventListener("dev-admin-change", handler);
  }, []);

  const loadRoles = (userId: string) => {
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .then(({ data }) => {
        const roles = (data ?? []).map((r: any) => r.role);
        setRealIsAdmin(roles.includes("admin"));
        setIsOwner(roles.includes("equipment_owner") || roles.includes("admin"));
      });
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => loadRoles(session.user.id), 0);
      } else {
        setRealIsAdmin(false);
        setIsOwner(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadRoles(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = devOverride !== null ? devOverride : realIsAdmin;

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { session, user, isAdmin, realIsAdmin, isOwner, loading, signOut };
}

