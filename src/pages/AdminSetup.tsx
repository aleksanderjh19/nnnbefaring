import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, Shield } from "lucide-react";

const AdminSetup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Sign in immediately since auto-confirm is on
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => navigate("/", { replace: true }), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-5">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Shield className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Opprett admin-konto</h1>
            <p className="font-body text-sm text-destructive font-medium mt-1">
              ⚠️ Midlertidig side – fjernes etter oppsett
            </p>
          </div>
        </div>

        {success ? (
          <div className="rounded-lg bg-success/10 px-4 py-3 text-center">
            <p className="font-body text-sm text-success font-medium">
              Admin-konto opprettet! Du videresendes nå...
            </p>
            <p className="font-body text-xs text-muted-foreground mt-1">
              Be utvikleren om å gi deg admin-rolle og fjerne denne siden.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="din@epost.no" required
                className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Velg et sterkt passord" required minLength={6}
                className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 font-body text-sm text-destructive">{error}</p>}
            <button type="submit" disabled={loading}
              className="h-11 w-full rounded-xl bg-primary font-body text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {loading ? "Oppretter..." : "Opprett admin-konto"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminSetup;
