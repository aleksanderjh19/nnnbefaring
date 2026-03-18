import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Mail, Send, Shield, LogOut, UserPlus } from "lucide-react";

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const { data, error: fnError } = await supabase.functions.invoke("invite-user", {
      body: { email },
    });

    if (fnError) {
      setError(fnError.message || "Noe gikk galt");
    } else if (data?.error) {
      setError(data.error);
    } else {
      setMessage(data?.message || `Invitasjon sendt til ${email}`);
      setEmail("");
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-md items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h1 className="font-display text-lg font-extrabold text-foreground">Admin</h1>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 font-body text-xs font-medium text-muted-foreground hover:bg-secondary"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logg ut
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-md px-5 py-8 space-y-8">
        {/* Invite user */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <h2 className="font-display text-base font-bold text-foreground">Inviter ny bruker</h2>
          </div>
          <p className="font-body text-sm text-muted-foreground">
            Brukeren mottar en e-post med invitasjonslenke for å opprette konto.
          </p>

          <form onSubmit={handleInvite} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="bruker@firma.no"
                className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 font-body text-sm text-destructive">{error}</p>
            )}
            {message && (
              <p className="rounded-lg bg-success/10 px-3 py-2 font-body text-sm text-success">{message}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary font-body text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {loading ? "Sender..." : "Send invitasjon"}
            </button>
          </form>
        </div>

        {/* Current user info */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="font-body text-xs text-muted-foreground">Innlogget som</p>
          <p className="font-body text-sm font-medium text-foreground">{user?.email}</p>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
