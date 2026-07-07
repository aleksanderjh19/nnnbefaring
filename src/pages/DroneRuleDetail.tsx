import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ExternalLink, Scale, Users, User, Ruler, FileText, ChevronRight } from "lucide-react";

import CategoryHeader from "@/components/CategoryHeader";
import { getDroneRuleById } from "@/data/droneRules";
import { getProceduresForRule } from "@/data/statnettProcedures";

const DroneRuleDetail = () => {
  const { ruleId } = useParams<{ ruleId: string }>();
  const rule = ruleId ? getDroneRuleById(ruleId) : undefined;

  useEffect(() => {
    document.title = rule ? `${rule.code} – Drone` : "Regel – Drone";
  }, [rule]);

  if (!rule) {
    return (
      <div className="min-h-screen bg-background">
        <CategoryHeader title="Ikke funnet" backTo="/drone/regler" />
        <main className="mx-auto max-w-2xl px-5 py-6">
          <p className="font-body text-sm text-muted-foreground">
            Regelen finnes ikke.
          </p>
        </main>
      </div>
    );
  }

  const facts = [
    rule.weightClass && { icon: Scale, label: "Vekt/klasse", value: rule.weightClass },
    rule.minDistance && { icon: Users, label: "Avstand", value: rule.minDistance },
    rule.pilotRequirement && { icon: User, label: "Pilotkrav", value: rule.pilotRequirement },
  ].filter(Boolean) as { icon: typeof Scale; label: string; value: string }[];

  return (
    <div className="min-h-screen bg-background">
      <CategoryHeader
        title={rule.title}
        subtitle={rule.shortDescription}
        backTo="/drone/regler"
      />
      <main className="mx-auto max-w-2xl px-5 py-6 space-y-6">
        {facts.length > 0 && (
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
        )}

        {rule.distanceRule && (
          <section>
            <h2 className="mb-3 font-display text-xs font-bold uppercase tracking-widest text-statnett">
              Avstand og 1:1-regel
            </h2>
            <div className="flex items-start gap-3 rounded-xl border-2 border-primary/30 bg-primary/5 px-5 py-4">
              <Ruler className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="font-body text-sm text-foreground">{rule.distanceRule}</p>
            </div>
          </section>
        )}

        {rule.images && rule.images.length > 0 && (
          <section>
            <h2 className="mb-3 font-display text-xs font-bold uppercase tracking-widest text-statnett">
              Illustrasjoner
            </h2>
            <div className="space-y-3">
              {rule.images.map((img) => (
                <figure key={img.src} className="overflow-hidden rounded-xl border border-border bg-card">
                  <img
                    src={img.src}
                    alt={img.caption}
                    className="w-full"
                    onError={(e) => {
                      const fig = (e.currentTarget as HTMLImageElement).closest("figure");
                      if (fig) (fig as HTMLElement).style.display = "none";
                    }}
                  />
                  <figcaption className="border-t border-border px-4 py-2 font-body text-xs text-muted-foreground">
                    {img.caption}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {rule.sections.map((s) => (
          <section key={s.title}>
            <h2 className="mb-3 font-display text-xs font-bold uppercase tracking-widest text-statnett">
              {s.title}
            </h2>
            <ul className="space-y-2 rounded-xl border border-border bg-card px-5 py-4">
              {s.items.map((it, i) => (
                <li key={i} className="flex gap-3 font-body text-sm text-foreground">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section>
          <h2 className="mb-3 font-display text-xs font-bold uppercase tracking-widest text-statnett">
            Kilder
          </h2>
          <div className="space-y-2">
            {rule.sources.map((src) => (
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

export default DroneRuleDetail;
