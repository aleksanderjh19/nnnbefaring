import { useEffect } from "react";
import { Cable, Landmark, Wrench } from "lucide-react";
import CategoryHeader from "@/components/CategoryHeader";
import ToolCardList, { ToolCard } from "@/components/ToolCardList";

const tools: ToolCard[] = [
  {
    id: "ledningsbefaring",
    name: "Ledningsbefaring",
    description: "Befaring av ledningsanlegg og master",
    icon: Cable,
    path: "/ledningsbefaring",
    ready: true,
  },
  {
    id: "montasjeveiledninger",
    name: "Montasjeveiledninger",
    description: "Huskelister og fremgangsmåter for korrekt montering",
    icon: Wrench,
    path: "/ledning/montasje",
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
];

const Ledning = () => {
  useEffect(() => { document.title = "Ledning – Statnett Verktøy"; }, []);
  return (
    <div className="min-h-screen bg-background">
      <CategoryHeader
        title="Ledning"
        subtitle="Verktøy, prosedyrer og fremgangsmåter for ledning"
      />
      <main className="mx-auto max-w-2xl px-5 py-6">
        <ToolCardList heading="Verktøy" tools={tools} visibilityScope="ledning" />
      </main>
    </div>
  );
};

export default Ledning;
