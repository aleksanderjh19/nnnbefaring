import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { ExternalLink, Scale, Gauge, ArrowUp, Zap, Layers } from "lucide-react";
import CategoryHeader from "@/components/CategoryHeader";
import { getDroneClassById } from "@/data/droneClasses";

const DroneClassDetail = () => {
  const { classId } = useParams<{ classId: string }>();
  const cls = classId ? getDroneClassById(classId) : undefined;

  useEffect(() => {
    document.title = cls ? `${cls.code} – Droneklasse` : "Klasse – Drone";
  }, [cls]);

  if (!cls) {
    return (
      <div className="min-h-screen bg-background">
        <CategoryHeader title="Ikke funnet" backTo="/drone/klasser" />
        <main className="mx-auto max-w-2xl px-5 py-6">
          <p className="font-body text-sm text-muted-foreground">Klassen finnes ikke.</p>
        </main>
      </div>
    );
  }

  const facts = [
    { icon: Scale, label: "Maks vekt", value: cls.maxWeight },
    cls.maxSpeed && { icon: Gauge, label: "Maks hastighet", value: cls.maxSpeed },
    cls.maxHeight && { icon: ArrowUp, label: "Maks høyde", value: cls.maxHeight },
    cls.kineticEnergy && { icon: Zap, label: "Kinetisk energi", value: cls.kineticEnergy },
    { icon: Layers, label: "Underkategori", value: cls.subcategories.join(" · ") },
  ].filter(Boolean) as { icon: typeof Scale; label: string; value: string }[];

  return (
    <div className="min-h-screen bg-background">
      <CategoryHeader
        title={cls.title}
        subtitle={cls.shortDescription}
        backTo="/drone/klasser"
      />
      <main className="mx-auto max-w-2xl px-5 py-6 space-y-6">
        <section className="space-y-3">
          {facts.map((f) => (
            <div
              key={f.label}
              className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  {f.label}
                </p>
                <p className="font-body text-sm text-foreground">{f.value}</p>
              </div>
            </div>
          ))}
        </section>

        <section>
          <h2 className="mb-3 font-display text-xs font-bold uppercase tracking-widest text-statnett">
            Tekniske krav
          </h2>
          <ul className="space-y-2 rounded-xl border border-border bg-card px-5 py-4">
            {cls.requirements.map((it, i) => (
              <li key={i} className="flex gap-3 font-body text-sm text-foreground">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{it}</span>
              </li>
            ))}
          </ul>
        </section>

        {cls.notes && cls.notes.length > 0 && (
          <section>
            <h2 className="mb-3 font-display text-xs font-bold uppercase tracking-widest text-statnett">
              Merknader
            </h2>
            <ul className="space-y-2 rounded-xl border border-border bg-card px-5 py-4">
              {cls.notes.map((it, i) => (
                <li key={i} className="font-body text-sm text-foreground">{it}</li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className="mb-3 font-display text-xs font-bold uppercase tracking-widest text-statnett">
            Kilder
          </h2>
          <div className="space-y-2">
            {cls.sources.map((src) => (
              <a
                key={src.url}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-secondary"
              >
                <ExternalLink className="h-4 w-4 shrink-0 text-primary" />
                <span className="font-body text-sm text-foreground group-hover:underline">
                  {src.label}
                </span>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default DroneClassDetail;
