import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import statnettLogo from "@/assets/statnett-logo.png";
import {
  TransformerField,
  MeasurementData,
  PHASES,
  PHASE_LABELS,
  Phase,
  calculateDeviations,
  getDeviationLimit,
  InstrumentInfo,
  createEmptyInstrument,
} from "@/components/voltage-round/types";

interface RoundRow {
  id: string;
  station_name: string;
  voltage_level: string;
  secondary_voltage: number;
  date: string;
  sign_names: string | null;
  ref_instrument: InstrumentInfo;
  meas_instrument: InstrumentInfo;
  transformers: TransformerField[];
  measurements: MeasurementData;
  comments: string | null;
  status: string;
  created_at: string;
}

export default function VoltageRoundPrint() {
  const { roundId } = useParams<{ roundId: string }>();
  const navigate = useNavigate();
  const [round, setRound] = useState<RoundRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Spenningsrunde – Utskrift";
  }, []);

  useEffect(() => {
    if (!roundId) return;
    (async () => {
      const { data } = await supabase
        .from("voltage_rounds")
        .select("*")
        .eq("id", roundId)
        .single();
      if (data) {
        const r = data as any;
        setRound({
          id: r.id,
          station_name: r.station_name,
          voltage_level: r.voltage_level,
          secondary_voltage: Number(r.secondary_voltage),
          date: r.date,
          sign_names: r.sign_names,
          ref_instrument: r.ref_instrument ?? createEmptyInstrument(),
          meas_instrument: r.meas_instrument ?? createEmptyInstrument(),
          transformers: r.transformers ?? [],
          measurements: r.measurements ?? {},
          comments: r.comments,
          status: r.status,
          created_at: r.created_at,
        });
      }
      setLoading(false);
    })();
  }, [roundId]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><p>Laster...</p></div>;
  }

  if (!round) {
    return <div className="flex items-center justify-center min-h-screen"><p>Fant ikke spenningsrunden.</p></div>;
  }

  const transformers = round.transformers;
  const measurements = round.measurements;
  const deviations = calculateDeviations(transformers, measurements, round.secondary_voltage);
  const limit = getDeviationLimit(round.secondary_voltage);
  const hasIssues = deviations.some((d) => !d.acceptable);

  const formatDate = (d: string) => {
    const parts = d.split("-");
    if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
    return d;
  };

  const formatInstrument = (inst: InstrumentInfo) => {
    const parts = [inst.brand, inst.type, inst.serial].filter(Boolean);
    if (parts.length === 0) return "–";
    let text = parts.join(" / ");
    if (inst.calibrationDate) text += ` (Kal: ${inst.calibrationDate})`;
    return text;
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Screen-only toolbar */}
      <div className="print:hidden border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-6 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-800">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-sm font-bold flex-1">Forhåndsvisning – {round.station_name}</h1>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Printer className="h-4 w-4" /> Skriv ut / Lagre PDF
          </button>
        </div>
      </div>

      {/* Print content */}
      <div className="mx-auto max-w-4xl px-6 py-8 print:px-0 print:py-4 print:max-w-none">
        {/* Statnett header */}
        <div className="mb-6 flex items-center justify-between rounded-lg bg-[hsl(155,100%,15%)] px-6 py-4 print:rounded-none print:-mx-0 print:mb-6 print:px-8 print:py-5">
          <img src={statnettLogo} alt="Statnett" className="h-6 print:h-7" />
          <span className="font-display text-xs font-bold uppercase tracking-widest text-white/80">Spenningsrunde</span>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-lg font-semibold">{round.station_name}</h2>
        </div>

        {/* Metadata table */}
        <table className="w-full text-sm border border-gray-300 mb-6">
          <tbody>
            <tr className="border-b border-gray-300">
              <td className="px-3 py-2 font-semibold bg-gray-50 w-1/4 border-r border-gray-300">Dato</td>
              <td className="px-3 py-2 w-1/4 border-r border-gray-300">{formatDate(round.date)}</td>
              <td className="px-3 py-2 font-semibold bg-gray-50 w-1/4 border-r border-gray-300">Utført av</td>
              <td className="px-3 py-2 w-1/4">{round.sign_names || "–"}</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="px-3 py-2 font-semibold bg-gray-50 border-r border-gray-300">Spenningsnivå</td>
              <td className="px-3 py-2 border-r border-gray-300">{round.voltage_level} kV</td>
              <td className="px-3 py-2 font-semibold bg-gray-50 border-r border-gray-300">Uf (sekundær)</td>
              <td className="px-3 py-2">{round.secondary_voltage.toFixed(2)} V</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="px-3 py-2 font-semibold bg-gray-50 border-r border-gray-300">Referanseinstrument</td>
              <td className="px-3 py-2" colSpan={3}>{formatInstrument(round.ref_instrument)}</td>
            </tr>
            <tr>
              <td className="px-3 py-2 font-semibold bg-gray-50 border-r border-gray-300">Måleinstrument</td>
              <td className="px-3 py-2" colSpan={3}>{formatInstrument(round.meas_instrument)}</td>
            </tr>
          </tbody>
        </table>

        {/* Transformer overview */}
        <h3 className="text-sm font-bold uppercase tracking-wide mb-2">Transformatorer / Felt</h3>
        <table className="w-full text-xs border border-gray-300 mb-6">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-300">
              <th className="px-3 py-2 text-left font-semibold border-r border-gray-300">Felt</th>
              <th className="px-3 py-2 text-center font-semibold border-r border-gray-300">Samleskinne</th>
              <th className="px-3 py-2 text-left font-semibold">Tegningsref.</th>
            </tr>
          </thead>
          <tbody>
            {transformers.map((t) => (
              <tr key={t.id} className="border-b border-gray-200">
                <td className="px-3 py-1.5 border-r border-gray-300 font-medium">{t.name}</td>
                <td className="px-3 py-1.5 text-center border-r border-gray-300">{t.busbar}</td>
                <td className="px-3 py-1.5">{t.drawingRef || "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Measurements per busbar */}
        {["A", "B"].map((busbar) => {
          const bt = transformers.filter((t) => t.busbar === busbar);
          if (bt.length < 1) return null;
          return (
            <div key={busbar} className="mb-6">
              <h3 className="text-sm font-bold uppercase tracking-wide mb-2">
                Målinger – Samleskinne {busbar}
              </h3>
              <table className="w-full text-xs border border-gray-300">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-300">
                    <th className="px-3 py-2 text-left font-semibold border-r border-gray-300 w-20">Fase</th>
                    {bt.map((t) => (
                      <th key={t.id} className="px-2 py-2 text-center font-semibold border-r border-gray-300" colSpan={3}>
                        {t.name}
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-gray-50 border-b border-gray-300 text-[10px]">
                    <th className="border-r border-gray-300"></th>
                    {bt.map((t) => (
                      <React.Fragment key={t.id}>
                        <th className="px-1 py-1 text-center border-r border-gray-200">Kl.</th>
                        <th className="px-1 py-1 text-center border-r border-gray-200">Ref.</th>
                        <th className="px-1 py-1 text-center border-r border-gray-300">Mål.</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PHASES.map((phase) => (
                    <tr key={phase} className="border-b border-gray-200">
                      <td className="px-3 py-1.5 font-medium border-r border-gray-300">{PHASE_LABELS[phase]}</td>
                      {bt.map((t) => {
                        const m = measurements[t.id]?.[phase];
                        return (
                          <React.Fragment key={t.id}>
                            <td className="px-1 py-1.5 text-center font-mono border-r border-gray-200 text-[10px] text-gray-500">
                              {m?.terminal || "–"}
                            </td>
                            <td className="px-1 py-1.5 text-center font-mono border-r border-gray-200">
                              {m?.refValue != null ? m.refValue.toFixed(2) : "–"}
                            </td>
                            <td className="px-1 py-1.5 text-center font-mono border-r border-gray-300">
                              {m?.measValue != null ? m.measValue.toFixed(2) : "–"}
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}

        {/* Deviation analysis */}
        {deviations.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wide mb-2">Avviksanalyse</h3>
            <p className="text-xs text-gray-600 mb-2">
              Akseptabelt avvik (Klasse 0,2): ±{limit.toFixed(2)} V
            </p>

            {["A", "B"].map((busbar) => {
              const busbarDevs = deviations.filter((d) => d.busbar === busbar);
              if (busbarDevs.length === 0) return null;
              return (
                <div key={busbar} className="mb-4">
                  <p className="text-xs font-semibold mb-1">Samleskinne {busbar}</p>
                  <table className="w-full text-xs border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-300">
                        <th className="px-3 py-2 text-left font-semibold border-r border-gray-300">Fase</th>
                        {busbarDevs[0]?.values.map((v) => (
                          <th key={v.transformerId} className="px-2 py-2 text-center font-semibold border-r border-gray-300">
                            {v.transformerName}
                          </th>
                        ))}
                        <th className="px-2 py-2 text-center font-semibold border-r border-gray-300">Avvik</th>
                        <th className="px-2 py-2 text-center font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {busbarDevs.map((d) => (
                        <tr key={d.phase} className="border-b border-gray-200">
                          <td className="px-3 py-1.5 font-medium border-r border-gray-300">{PHASE_LABELS[d.phase]}</td>
                          {d.values.map((v) => (
                            <td key={v.transformerId} className="px-2 py-1.5 text-center font-mono border-r border-gray-300">
                              {v.measValue.toFixed(2)}
                            </td>
                          ))}
                          <td className={`px-2 py-1.5 text-center font-mono font-bold border-r border-gray-300 ${
                            d.acceptable ? "text-green-700" : "text-red-600"
                          }`}>
                            {d.maxDeviation.toFixed(2)}
                          </td>
                          <td className={`px-2 py-1.5 text-center font-bold ${
                            d.acceptable ? "text-green-700" : "text-red-600"
                          }`}>
                            {d.acceptable ? "OK" : "AVVIK"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}

        {/* Overall result */}
        <div className={`border-2 rounded-lg px-4 py-3 mb-6 ${hasIssues ? "border-red-500 bg-red-50" : "border-green-500 bg-green-50"}`}>
          <p className={`text-sm font-bold ${hasIssues ? "text-red-700" : "text-green-700"}`}>
            {hasIssues ? "⚠ AVVIK FUNNET" : "✓ ALLE MÅLINGER OK"}
          </p>
          <p className="text-xs mt-1 text-gray-700">
            {hasIssues
              ? `Differanser større enn akseptabelt avvik (${limit.toFixed(2)} V) er oppdaget.`
              : `Alle differanser er innenfor akseptabelt avvik (${limit.toFixed(2)} V).`}
          </p>
        </div>

        {/* Comments */}
        {round.comments && round.comments.trim() !== "" && (
          <div className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wide mb-2">Kommentarer</h3>
            <p className="text-xs border border-gray-300 rounded px-3 py-2 whitespace-pre-wrap">{round.comments}</p>
          </div>
        )}

        {/* Signature area */}
        <div className="mt-10 pt-6 border-t border-gray-300">
          <div className="flex justify-between">
            <div className="w-2/5">
              <div className="border-b border-gray-400 mb-1 h-8"></div>
              <p className="text-xs text-gray-600">Dato og signatur, utførende</p>
            </div>
            <div className="w-2/5">
              <div className="border-b border-gray-400 mb-1 h-8"></div>
              <p className="text-xs text-gray-600">Dato og signatur, kontrollør</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 15mm; size: A4 landscape; }
        }
      `}</style>
    </div>
  );
}
