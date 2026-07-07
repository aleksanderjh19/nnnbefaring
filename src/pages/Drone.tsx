import { useEffect } from "react";
import { BookOpen, LineChart, Thermometer, FileText } from "lucide-react";
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
  {
    id: "ninox",
    name: "Ninox 2",
    description: "Termisk kamera – bruk og innstillinger",
    icon: Thermometer,
    path: "/drone/guide/ninox",
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
        <ToolCardList heading="Verktøy" tools={tools} />
      </main>
    </div>
  );
};

export default Drone;
