import { useState, useEffect } from "react";
import { Shield, ShieldOff } from "lucide-react";
import { setDevAdminOverride } from "@/hooks/useAuth";

const DEV_ADMIN_KEY = "__dev_admin_override";

const DevAdminToggle = () => {
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem(DEV_ADMIN_KEY) !== "false");

  useEffect(() => {
    const handler = () => setIsAdmin(localStorage.getItem(DEV_ADMIN_KEY) !== "false");
    window.addEventListener("dev-admin-change", handler);
    return () => window.removeEventListener("dev-admin-change", handler);
  }, []);

  const toggle = () => {
    const next = !isAdmin;
    setIsAdmin(next);
    setDevAdminOverride(next);
  };

  return (
    <button
      onClick={toggle}
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 font-body text-xs font-medium shadow-lg transition-colors hover:bg-secondary"
      title={isAdmin ? "Visning: Admin – klikk for bruker" : "Visning: Bruker – klikk for admin"}
    >
      {isAdmin ? (
        <>
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-foreground">Admin</span>
        </>
      ) : (
        <>
          <ShieldOff className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Bruker</span>
        </>
      )}
    </button>
  );
};

export default DevAdminToggle;
