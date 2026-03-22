import { Zap, ChevronRight, MapPin } from "lucide-react";
import { StationTemplate, VoltageLevelConfig, STATIONS } from "@/data/stationTemplates";

interface Props {
  onSelect: (station: StationTemplate, level: VoltageLevelConfig) => void;
}

const STATION_COLORS: Record<string, { gradient: string; accent: string }> = {
  marka: { gradient: "from-blue-600 to-blue-800", accent: "bg-blue-500/20 text-blue-300" },
  rana: { gradient: "from-emerald-600 to-emerald-800", accent: "bg-emerald-500/20 text-emerald-300" },
  namsskogan: { gradient: "from-violet-600 to-violet-800", accent: "bg-violet-500/20 text-violet-300" },
  trofors: { gradient: "from-amber-600 to-amber-800", accent: "bg-amber-500/20 text-amber-300" },
};

export default function StationSelect({ onSelect }: Props) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 mb-3">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Velg stasjon</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Velg stasjonen du skal utføre spenningsrunde på
        </p>
      </div>

      <div className="grid gap-3">
        {STATIONS.map((station) => {
          const colors = STATION_COLORS[station.id] ?? { gradient: "from-gray-600 to-gray-800", accent: "bg-gray-500/20 text-gray-300" };
          const hasMultipleLevels = station.voltageLevels.length > 1;

          return (
            <div key={station.id} className="rounded-xl overflow-hidden border border-border">
              {/* Station header */}
              <div className={`bg-gradient-to-r ${colors.gradient} px-5 py-4`}>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-white">{station.name}</h3>
                    <p className="text-xs text-white/60 font-medium">{station.shortName}</p>
                  </div>
                </div>
              </div>

              {/* Voltage level buttons */}
              <div className={`bg-card divide-y divide-border`}>
                {station.voltageLevels.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => onSelect(station, level)}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-secondary/50 transition-colors text-left"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{level.kV} kV</p>
                      <p className="text-[10px] text-muted-foreground">
                        {level.fields.filter((f) => !f.isPlaceholder).length} felt
                        {" · "}Uf = {level.secondaryVoltage.toFixed(2)} V
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
