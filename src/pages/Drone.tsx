import { useEffect } from "react";
import { BookOpen, LineChart, FileText } from "lucide-react";
import CategoryHeader from "@/components/CategoryHeader";
import ToolCardList, { ToolCard } from "@/components/ToolCardList";

const tools: ToolCard[] = [
  {
    id: "regler",
    name: "Lover og regler",
    description: "Åpen kategori A1/A2/A3, Spesifikk (STS/SORA) og droneklasser C0–C6",
    icon: BookOpen,
    path: "/drone/regler",
    ready: true,
  },
  {
    id: "prosedyrer",
    name: "Statnett-prosedyrer",
    description: "Interne prosedyrer, SOP, SORA og kompetansekrav (SDOK-839)",
    icon: FileText,
    path: "/drone/prosedyrer",
    ready: true,
  },
  {
    id: "airdata",
    name: "Airdata UAV",
    description: "Viktigste funksjoner for logg, batteri og flåte",
    icon: LineChart,
    path: "/drone/guide/airdata",
    ready: true,
  },
];

const Drone = () => {
  useEffect(() => { document.title = "Drone – Statnett Verktøy"; }, []);
  return (
    <div className="min-h-screen bg-background">
      <CategoryHeader
        title="Drone"
        subtitle="Regelverk, sjekklister og instrukser for droneoperasjoner"
      />
      <main className="mx-auto max-w-2xl px-5 py-6">
        <ToolCardList heading="Verktøy" tools={tools} visibilityScope="drone" />
      </main>
    </div>
  );
};

export default Drone;
