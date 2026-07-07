import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import CategoryHeader from "@/components/CategoryHeader";
import { getExternalGuideById } from "@/data/droneGuides";

const DroneGuide = () => {
  const { guideId } = useParams<{ guideId: string }>();
  const guide = guideId ? getExternalGuideById(guideId) : undefined;

  useEffect(() => {
    document.title = guide ? `${guide.title} – Drone` : "Guide – Drone";
  }, [guide]);

  if (!guide) {
    return (
      <div className="min-h-screen bg-background">
        <CategoryHeader title="Ikke funnet" backTo="/drone" />
        <main className="mx-auto max-w-2xl px-5 py-6">
          <p className="font-body text-sm text-muted-foreground">
            Denne guiden finnes ikke.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CategoryHeader
        title={guide.title}
        subtitle={guide.tagline}
        backTo="/drone"
      />
      <main className="mx-auto max-w-2xl px-5 py-6 space-y-6">
        <section className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="font-body text-sm text-foreground">{guide.overview}</p>
        </section>

        {guide.chapters.map((ch) => (
          <section key={ch.title}>
            <h2 className="mb-3 font-display text-xs font-bold uppercase tracking-widest text-statnett">
              {ch.title}
            </h2>
            {ch.intro && (
              <p className="mb-3 font-body text-xs text-muted-foreground">{ch.intro}</p>
            )}
            <div className="space-y-3">
              {ch.steps.map((st, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-card px-5 py-4"
                >
                  <p className="font-display text-sm font-bold text-foreground">
                    {st.title}
                  </p>
                  {st.description && (
                    <p className="mt-1 font-body text-xs text-muted-foreground">
                      {st.description}
                    </p>
                  )}
                  {st.bullets && (
                    <ul className="mt-3 space-y-2">
                      {st.bullets.map((b, j) => (
                        <li
                          key={j}
                          className="flex gap-3 font-body text-sm text-foreground"
                        >
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        {guide.sources.length > 0 && (
          <section>
            <h2 className="mb-3 font-display text-xs font-bold uppercase tracking-widest text-statnett">
              Kilder
            </h2>
            <div className="space-y-2">
              {guide.sources.map((src) => (
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
        )}
      </main>
    </div>
  );
};

export default DroneGuide;
