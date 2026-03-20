import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Cable, Landmark, Zap, ChevronRight, GraduationCap, Trash2 } from "lucide-react";
import heroVideo from "@/assets/hero-video.mp4";

const tools = [
  {
    id: "ledningsbefaring",
    name: "Ledningsbefaring",
    description: "Befaring av ledningsanlegg og master",
    icon: Cable,
    path: "/ledningsbefaring",
    ready: true,
  },
  {
    id: "fundamentbefaring",
    name: "Fundamentbefaring",
    description: "Befaring av fundamenter og forankringer",
    icon: Landmark,
    path: "/fundamentbefaring",
    ready: false,
  },
  {
    id: "spenningsrunde",
    name: "Spenningsrunde",
    description: "Spenningsrunde og kontroll av anlegg",
    icon: Zap,
    path: "/spenningsrunde",
    ready: false,
  },
  {
    id: "dokumentert-opplaering",
    name: "Dokumentert opplæring",
    description: "Registrering og oppfølging av opplæring",
    icon: GraduationCap,
    path: "/dokumentert-opplaering",
    ready: true,
  },
  {
    id: "avfallshandtering",
    name: "Avfallshåndtering",
    description: "Sorteringsoversikt og varsling om tømming",
    icon: Trash2,
    path: "/avfallshandtering",
    ready: true,
  },
];

const Dashboard = () => {
  useEffect(() => { document.title = "Statnett Verktøy"; }, []);
  const navigate = useNavigate();

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
              NNN Verktøy
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
              {tool.ready && (
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              )}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
