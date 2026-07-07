import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ShieldCheck } from "lucide-react";
import CategoryHeader from "@/components/CategoryHeader";
import { droneClasses } from "@/data/droneClasses";

const DroneClasses = () => {
  useEffect(() => { document.title = "Droneklasser – Drone"; }, []);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <CategoryHeader
        title="Droneklasser C0–C6"
        subtitle="Klassemerking iht. EU-forordning 2019/945"
        backTo="/drone"
      />
      <main className="mx-auto max-w-2xl px-5 py-6 space-y-4">
        <img
          src="/drone/klasser-c0-c6.png"
          alt="Oversikt over droneklasser C0 til C6"
          className="w-full rounded-xl border border-border bg-card"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
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
        <div className="flex items-start gap-3 rounded-xl border border-border bg-card/50 px-4 py-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="font-body text-xs text-muted-foreground">
            Klassemerking (C0–C6) står på selve dronen og i produsentens brukerhåndbok.
            Ved tvil skal Luftfartstilsynet og EASAs regelverk legges til grunn.
          </p>
        </div>
      </main>
    </div>
  );
};

export default DroneClasses;
