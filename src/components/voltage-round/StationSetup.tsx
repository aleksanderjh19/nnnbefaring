import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VoltageRoundData, VOLTAGE_LEVELS, UF_OPTIONS } from "./types";

interface Props {
  data: VoltageRoundData;
  onChange: (data: Partial<VoltageRoundData>) => void;
}

export default function StationSetup({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Stasjonsinformasjon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Stasjonsnavn</Label>
              <Input
                placeholder="F.eks. MARKA"
                value={data.stationName}
                onChange={(e) => onChange({ stationName: e.target.value })}
              />
            </div>
            <div>
              <Label>Spenningsnivå (kV)</Label>
              <Select value={data.voltageLevel} onValueChange={(v) => onChange({ voltageLevel: v })}>
                <SelectTrigger><SelectValue placeholder="Velg" /></SelectTrigger>
                <SelectContent>
                  {VOLTAGE_LEVELS.map((v) => (
                    <SelectItem key={v} value={v}>{v} kV</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sekundærspenning (Uf)</Label>
              <Select
                value={String(data.secondaryVoltage)}
                onValueChange={(v) => onChange({ secondaryVoltage: Number(v) })}
              >
                <SelectTrigger><SelectValue placeholder="Velg" /></SelectTrigger>
                <SelectContent>
                  {UF_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Dato</Label>
              <Input
                type="date"
                value={data.date}
                onChange={(e) => onChange({ date: e.target.value })}
              />
            </div>
            <div>
              <Label>Signatur(er)</Label>
              <Input
                placeholder="Navn"
                value={data.signNames}
                onChange={(e) => onChange({ signNames: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Referanseinstrument</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Fabrikat</Label>
              <Input
                value={data.refInstrument.brand}
                onChange={(e) =>
                  onChange({ refInstrument: { ...data.refInstrument, brand: e.target.value } })
                }
              />
            </div>
            <div>
              <Label className="text-xs">Type</Label>
              <Input
                value={data.refInstrument.type}
                onChange={(e) =>
                  onChange({ refInstrument: { ...data.refInstrument, type: e.target.value } })
                }
              />
            </div>
            <div>
              <Label className="text-xs">Serienr.</Label>
              <Input
                value={data.refInstrument.serial}
                onChange={(e) =>
                  onChange({ refInstrument: { ...data.refInstrument, serial: e.target.value } })
                }
              />
            </div>
            <div>
              <Label className="text-xs">Kalibreringsdato</Label>
              <Input
                type="date"
                value={data.refInstrument.calibrationDate}
                onChange={(e) =>
                  onChange({ refInstrument: { ...data.refInstrument, calibrationDate: e.target.value } })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Måleinstrument</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Fabrikat</Label>
              <Input
                value={data.measInstrument.brand}
                onChange={(e) =>
                  onChange({ measInstrument: { ...data.measInstrument, brand: e.target.value } })
                }
              />
            </div>
            <div>
              <Label className="text-xs">Type</Label>
              <Input
                value={data.measInstrument.type}
                onChange={(e) =>
                  onChange({ measInstrument: { ...data.measInstrument, type: e.target.value } })
                }
              />
            </div>
            <div>
              <Label className="text-xs">Serienr.</Label>
              <Input
                value={data.measInstrument.serial}
                onChange={(e) =>
                  onChange({ measInstrument: { ...data.measInstrument, serial: e.target.value } })
                }
              />
            </div>
            <div>
              <Label className="text-xs">Kalibreringsdato</Label>
              <Input
                type="date"
                value={data.measInstrument.calibrationDate}
                onChange={(e) =>
                  onChange({ measInstrument: { ...data.measInstrument, calibrationDate: e.target.value } })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
