import { AlertTriangle, ChevronRight, LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

export type ToolCard = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  path: string;
  ready: boolean;
  wip?: boolean;
};

type Props = {
  heading?: string;
  tools: ToolCard[];
  emptyText?: string;
};

const ToolCardList = ({ heading, tools, emptyText }: Props) => {
  const navigate = useNavigate();

  return (
    <section>
      {heading && (
        <h2 className="mb-4 font-display text-xs font-bold uppercase tracking-widest text-statnett">
          {heading}
        </h2>
      )}
      {tools.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 px-5 py-8 text-center">
          <p className="font-body text-sm text-muted-foreground">
            {emptyText ?? "Ingen verktøy lagt til ennå"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tools.map((tool) => (
            <button
              key={tool.id}
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
              {tool.wip && (
                <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 font-body text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  OBS! Under bygging
                </span>
              )}
              {tool.ready && !tool.wip && (
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default ToolCardList;
