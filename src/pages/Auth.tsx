import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, ArrowLeft } from "lucide-react";
import statnettLogo from "@/assets/statnett-logo.png";

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { document.title = "Logg inn – Statnett"; }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate("/", { replace: true });
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/", { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      navigate("/", { replace: true });
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Skriv inn e-postadressen din først");
      return;
    }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setError(error.message);
    } else {
      setError("");
      alert("Sjekk e-posten din for å tilbakestille passordet.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-md px-5 py-6 space-y-4">
          <div className="flex w-full items-center justify-center overflow-hidden rounded-xl bg-[hsl(155,100%,15%)] px-8 py-8 shadow-lg">
            <img
              src={statnettLogo}
              alt="Statnett"
              className="h-12 w-auto"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="font-display text-xl font-extrabold tracking-tight text-foreground">
                Statnett Verktøy
              </h1>
              <p className="font-body text-xs text-muted-foreground">
                Logg inn for å fortsette
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-5 py-8">
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block font-body text-xs font-medium text-muted-foreground">E-post</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="din@epost.no"
                className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block font-body text-xs font-medium text-muted-foreground">Passord</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 font-body text-sm text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-xl bg-primary font-body text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Venter..." : "Logg inn"}
          </button>
        </form>

        <button
          onClick={handleForgotPassword}
          className="mt-4 block w-full text-center font-body text-sm text-muted-foreground hover:text-primary"
        >
          Glemt passord?
        </button>

        <p className="mt-6 text-center font-body text-xs text-muted-foreground">
          Tilgang gis via invitasjon fra administrator.
        </p>
      </main>
    </div>
  );
};

export default Auth;
