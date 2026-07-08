import { useEffect } from "react";
import { Zap, Trash2, Wind } from "lucide-react";
import CategoryHeader from "@/components/CategoryHeader";
import ToolCardList, { ToolCard } from "@/components/ToolCardList";

const tools: ToolCard[] = [
  {
    id: "spenningsrunde",
    name: "Spenningsrunde",
    description: "Kontroll av spenningstrafoer på stasjoner",
    icon: Zap,
    path: "/spenningsrunde",
    ready: true,
    wip: true,
  },
  {
    id: "sf6-runde",
    name: "SF6 gassrunde",
    description: "Registrer SF6-gassnivå på brytere per stasjon",
    icon: Wind,
    path: "/sf6-runde",
    ready: true,
    wip: true,
  },
  {
    id: "avfallshandtering",
    name: "Avfallshåndtering Bjerka",
    description: "Sorteringsoversikt og varsling om tømming",
    icon: Trash2,
    path: "/avfallshandtering",
    ready: true,
    wip: true,
  },
];

const Stasjon = () => {
  useEffect(() => { document.title = "Stasjon – Statnett Verktøy"; }, []);
  return (
    <div className="min-h-screen bg-background">
      <CategoryHeader
        title="Stasjon"
        subtitle="Verktøy, prosedyrer og fremgangsmåter for stasjon"
      />
      <main className="mx-auto max-w-2xl px-5 py-6">
        <ToolCardList heading="Verktøy" tools={tools} />
      </main>
    </div>
  );
};

export default Stasjon;
