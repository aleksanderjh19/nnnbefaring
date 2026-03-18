import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, Mail, Lock, User, ArrowLeft } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dokumentert-opplaering", { replace: true });
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        navigate("/dokumentert-opplaering", { replace: true });
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Sjekk e-posten din for å bekrefte kontoen.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-md items-center gap-3 px-5 py-4">
          <button
            onClick={() => navigate("/")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="font-display text-lg font-extrabold text-foreground">Logg inn</h1>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-5 pt-12">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">Dokumentert Opplæring</h2>
              <p className="font-body text-sm text-muted-foreground">
                {isLogin ? "Logg inn for å fortsette" : "Opprett en ny konto"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="mb-1 block font-body text-xs font-medium text-muted-foreground">Navn</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ditt fulle navn"
                    className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>
              </div>
            )}
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
            {message && (
              <p className="rounded-lg bg-success/10 px-3 py-2 font-body text-sm text-success">{message}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-xl bg-primary font-body text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Venter..." : isLogin ? "Logg inn" : "Opprett konto"}
            </button>
          </form>

          <p className="text-center font-body text-sm text-muted-foreground">
            {isLogin ? "Har du ikke en konto?" : "Har du allerede en konto?"}{" "}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(""); setMessage(""); }}
              className="font-semibold text-primary hover:underline"
            >
              {isLogin ? "Opprett konto" : "Logg inn"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Auth;
