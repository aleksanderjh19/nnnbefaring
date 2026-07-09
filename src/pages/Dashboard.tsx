import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Cable, ChevronRight, GraduationCap, AlertTriangle, Plane, Eye, EyeOff } from "lucide-react";
import heroVideo from "@/assets/hero-video.mp4";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const FLAG_KEY = "dokumentert_opplaering_for_brukere";

const tools = [
  {
    id: "stasjon",
    name: "Stasjon",
    description: "Verktøy, prosedyrer og fremgangsmåter for stasjon",
    icon: Building2,
    path: "/stasjon",
    ready: true,
  },
  {
    id: "ledning",
    name: "Ledning",
    description: "Verktøy, prosedyrer og fremgangsmåter for ledning",
    icon: Cable,
    path: "/ledning",
    ready: true,
  },
  {
    id: "drone",
    name: "Drone",
    description: "Regelverk, sjekklister og operatørverktøy",
    icon: Plane,
    path: "/drone",
    ready: true,
  },
  {
    id: "dokumentert-opplaering",
    name: "Dokumentert opplæring",
    description: "Registrering og oppfølging av opplæring",
    icon: GraduationCap,
    path: "/dokumentert-opplaering",
    ready: true,
    wip: true,
    adminGated: true,
  },
];


const Dashboard = () => {
  useEffect(() => { document.title = "NNHH Verktøy"; }, []);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [opplaeringEnabled, setOpplaeringEnabled] = useState<boolean>(false);
  const [flagLoading, setFlagLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("feature_flags")
      .select("enabled")
      .eq("key", FLAG_KEY)
      .maybeSingle()
      .then(({ data }) => {
        setOpplaeringEnabled(!!data?.enabled);
        setFlagLoading(false);
      });
  }, []);

  const toggleOpplaering = async () => {
    const next = !opplaeringEnabled;
    setOpplaeringEnabled(next);
    const { error } = await supabase
      .from("feature_flags")
      .upsert({ key: FLAG_KEY, enabled: next, updated_at: new Date().toISOString() });
    if (error) {
      setOpplaeringEnabled(!next);
      toast.error("Kunne ikke oppdatere synlighet");
    } else {
      toast.success(next ? "Synlig for brukere" : "Skjult for brukere");
    }
  };

  const visibleTools = tools.filter((t) => {
    if (t.id === "dokumentert-opplaering") {
      return isAdmin || opplaeringEnabled;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-2xl px-5 py-6 space-y-4">
          <div className="relative w-full overflow-hidden rounded-xl shadow-lg" style={{ aspectRatio: "4/1" }}>
            <video
              src={heroVideo}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 h-full w-full scale-150 object-cover"
            />
          </div>
          <div>
            <h1 className="font-display text-xl font-extrabold tracking-tight text-foreground">
              NNHH Verktøy
            </h1>
            <p className="font-body text-xs text-muted-foreground">
              Velg et verktøy for å komme i gang
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-6">
        <h2 className="mb-4 font-display text-xs font-bold uppercase tracking-widest text-statnett">
          Verktøy
        </h2>
        <div className="space-y-3">
          {visibleTools.map((tool) => (
            <div key={tool.id} className="space-y-2">
              <button
                onClick={() => tool.ready && navigate(tool.path)}
                disabled={!tool.ready}
                className="group flex w-full items-center gap-4 rounded-xl border border-border bg-card px-5 py-5 text-left transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                  <tool.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-bold text-foreground">
                    {tool.name}
                  </p>
                  <p className="font-body text-xs text-muted-foreground">
                    {tool.description}
                  </p>
                  {!tool.ready && (
                    <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 font-body text-[10px] font-medium text-muted-foreground">
                      Kommer snart
                    </span>
                  )}
                </div>
                {'wip' in tool && tool.wip && (
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 font-body text-xs font-semibold text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    OBS! Under bygging
                  </span>
                )}
                {tool.ready && (
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                )}
              </button>
              {isAdmin && tool.id === "dokumentert-opplaering" && !flagLoading && (
                <button
                  onClick={toggleOpplaering}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-dashed border-border bg-background/50 px-4 py-2 text-left transition-colors hover:bg-secondary"
                >
                  <span className="flex items-center gap-2 font-body text-xs text-muted-foreground">
                    {opplaeringEnabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    Synlighet for brukere: <strong className="text-foreground">{opplaeringEnabled ? "Synlig" : "Skjult"}</strong>
                  </span>
                  <span className="font-body text-[10px] font-semibold uppercase tracking-wider text-statnett">
                    {opplaeringEnabled ? "Skjul" : "Vis"}
                  </span>
                </button>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
