import { useEffect } from "react";
import { BookOpen, LineChart, Thermometer, Layers } from "lucide-react";
import CategoryHeader from "@/components/CategoryHeader";
import ToolCardList, { ToolCard } from "@/components/ToolCardList";

const tools: ToolCard[] = [
  {
    id: "regler",
    name: "Lover og regler",
    description: "Åpen kategori A1/A2/A3 og Spesifikk kategori (STS/SORA)",
    icon: BookOpen,
    path: "/drone/regler",
    ready: true,
  },
  {
    id: "klasser",
    name: "Droneklasser (C0–C6)",
    description: "Klassemerking, vekt, hastighet og krav per klasse",
    icon: Layers,
    path: "/drone/klasser",
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
