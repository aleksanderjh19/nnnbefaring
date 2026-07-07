import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ShieldCheck, Layers, FileText } from "lucide-react";
import CategoryHeader from "@/components/CategoryHeader";
import { droneRules } from "@/data/droneRules";
import { droneClasses } from "@/data/droneClasses";

const DroneRules = () => {
  useEffect(() => { document.title = "Lover og regler – Drone"; }, []);
  const navigate = useNavigate();

  const grouped = droneRules.reduce<Record<string, typeof droneRules>>((acc, r) => {
    (acc[r.category] ??= []).push(r);
    return acc;
  }, {});


  return (
    <div className="min-h-screen bg-background">
      <CategoryHeader
        title="Lover og regler"
        subtitle="Forenklet oppsummering basert på Luftfartstilsynet og EU-forordning 2019/947"
        backTo="/drone"
      />
      <main className="mx-auto max-w-2xl px-5 py-6 space-y-6">
        {Object.entries(grouped).map(([cat, rules]) => (
          <section key={cat}>
            <h2 className="mb-3 font-display text-xs font-bold uppercase tracking-widest text-statnett">
              {cat}
            </h2>
            <div className="space-y-3">
              {rules.map((rule) => (
                <button
                  key={rule.id}
                  onClick={() => navigate(`/drone/regler/${rule.id}`)}
                  className="group flex w-full items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 text-left transition-colors hover:bg-secondary"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                    <span className="font-display text-xs font-bold">{rule.code}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-bold text-foreground">
                      {rule.title}
                    </p>
                    <p className="font-body text-xs text-muted-foreground">
                      {rule.shortDescription}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </section>
        ))}
        <section>
          <h2 className="mb-3 font-display text-xs font-bold uppercase tracking-widest text-statnett">
            Droneklasser (C0–C6)
          </h2>
          <div className="space-y-3">
            {droneClasses.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/drone/klasser/${c.id}`)}
                className="group flex w-full items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 text-left transition-colors hover:bg-secondary"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                  <span className="font-display text-xs font-bold">{c.code}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-bold text-foreground">{c.title}</p>
                  <p className="font-body text-xs text-muted-foreground">{c.shortDescription}</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate("/drone/klasser")}
            className="mt-3 flex w-full items-center gap-3 rounded-xl border border-border bg-card/50 px-4 py-3 text-left transition-colors hover:bg-secondary"
          >
            <Layers className="h-4 w-4 shrink-0 text-primary" />
            <span className="font-body text-xs text-muted-foreground">Se samlet oversikt over klasser</span>
          </button>
        </section>
        <div className="flex items-start gap-3 rounded-xl border border-border bg-card/50 px-4 py-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="font-body text-xs text-muted-foreground">
            Dette er en forenklet oversikt. Ved tvil skal fullt regelverk fra
            Luftfartstilsynet og EASA legges til grunn.
          </p>
        </div>
      </main>
    </div>
  );
};

export default DroneRules;
