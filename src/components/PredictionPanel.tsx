import { useState, useEffect, FormEvent } from "react";
import { BrainCircuit, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { TrafficRecord } from "../types";

interface PredictionPanelProps {
  junctions: TrafficRecord[];
  selectedJunction: TrafficRecord | null;
  isDark: boolean;
}

export default function PredictionPanel({
  junctions,
  selectedJunction,
  isDark,
}: PredictionPanelProps) {
  const [targetJunctionId, setTargetJunctionId] = useState<string>("");
  const [operatorNotes, setOperatorNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [prediction, setPrediction] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (selectedJunction) {
      setTargetJunctionId(selectedJunction.id.toString());
    } else if (junctions.length > 0 && !targetJunctionId) {
      setTargetJunctionId(junctions[0].id.toString());
    }
  }, [selectedJunction, junctions]);

  const handlePredict = async (e: FormEvent) => {
    e.preventDefault();
    if (!targetJunctionId) {
      setError("Please select a junction first.");
      return;
    }

    setLoading(true);
    setError("");
    setPrediction("");

    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          junctionId: Number(targetJunctionId),
          factor: operatorNotes,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate AI predictions");
      }

      setPrediction(data.prediction);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Safe custom Markdown-to-HTML parser function to style the Gemini output natively
  const renderMarkdownText = (text: string) => {
    if (!text) return null;

    const lines = text.split("\n");
    return lines.map((line, index) => {
      let trimmed = line.trim();

      // Headers
      if (trimmed.startsWith("###")) {
        return (
          <h4 key={`md-${index}`} className={`text-base font-bold mt-4 mb-2 flex items-center gap-1.5 ${isDark ? "text-indigo-400" : "text-indigo-800"}`}>
            {parseBoldText(trimmed.replace(/^###\s*/, ""))}
          </h4>
        );
      }
      if (trimmed.startsWith("##")) {
        return (
          <h3 key={`md-${index}`} className={`text-lg font-bold mt-5 mb-2.5 flex items-center gap-1.5 border-b pb-1 ${isDark ? "border-slate-850 text-slate-100" : "border-slate-200 text-slate-800"}`}>
            {parseBoldText(trimmed.replace(/^##\s*/, ""))}
          </h3>
        );
      }
      if (trimmed.startsWith("#")) {
        return (
          <h2 key={`md-${index}`} className={`text-xl font-extrabold mt-6 mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>
            {parseBoldText(trimmed.replace(/^#\s*/, ""))}
          </h2>
        );
      }

      // Bullet lists
      if (trimmed.startsWith("*") || trimmed.startsWith("-")) {
        return (
          <div key={`md-${index}`} className="flex items-start gap-2 ml-4 my-1.5 text-sm">
            <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${isDark ? "bg-pink-400" : "bg-pink-600"}`} />
            <p className={isDark ? "text-slate-300" : "text-slate-700"}>
              {parseBoldText(trimmed.replace(/^[*-\s]+/, ""))}
            </p>
          </div>
        );
      }

      // Empty Lines
      if (!trimmed) {
        return <div key={`md-${index}`} className="h-2" />;
      }

      // Standard paragraphs
      return (
        <p key={`md-${index}`} className={`text-sm my-1 leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700"}`}>
          {parseBoldText(trimmed)}
        </p>
      );
    });
  };

  // Utility to handle bold replacement: **text**
  const parseBoldText = (text: string) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, i) => {
      // Every odd element is captured within bold asterisks
      if (i % 2 === 1) {
        return <strong key={`bold-${i}`} className="font-extrabold text-indigo-400">{part}</strong>;
      }
      return part;
    });
  };

  const selectedJunctionData = junctions.find(j => j.id.toString() === targetJunctionId);

  return (
    <div className={`p-6 rounded-3xl border transition-all duration-300 ${
      isDark ? "bg-slate-900/40 border-slate-800/80" : "bg-white/80 border-slate-200"
    } backdrop-blur-md shadow-xl`} id="ai-prediction-panel">
      
      {/* Panel Header */}
      <div className="flex items-center gap-3 border-b pb-4 mb-5" id="prediction-header">
        <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-500">
          <BrainCircuit className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h2 className={`text-xl font-bold flex items-center gap-1.5 ${isDark ? "text-white" : "text-slate-800"}`}>
            AI Copilot Traffic Forecasting
            <span className="text-[10px] bg-pink-500/10 text-pink-500 px-2 py-0.5 rounded-full font-medium">Gemini Pro</span>
          </h2>
          <p className="text-xs text-slate-400">Adaptive signaling predictive modeling based on real-time SQL feeds</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="prediction-layout-grid">
        {/* Left Side: Setup Parameters */}
        <form onSubmit={handlePredict} className="lg:col-span-4 flex flex-col gap-4" id="prediction-parameters-form">
          {/* Junction Selection Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              Target Telemetry Signal
            </label>
            <select
              value={targetJunctionId}
              onChange={(e) => setTargetJunctionId(e.target.value)}
              className={`w-full p-2.5 rounded-xl text-sm border focus:ring-1 focus:ring-pink-500/50 focus:border-pink-500 transition-all ${
                isDark ? "bg-slate-950 border-slate-800/85 text-white" : "bg-white border-slate-200 text-slate-800"
              }`}
              id="predict-junction-select"
            >
              <option value="" disabled>Select active junction...</option>
              {junctions.map((j) => (
                <option key={`opt-pred-${j.id}`} value={j.id.toString()}>
                  {j.junction_name} ({j.area_name})
                </option>
              ))}
            </select>
          </div>

          {/* Forecast Scenarios Field */}
          <div className="flex flex-col gap-1.5">
            <label className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              Macro Scenario Adjustments
            </label>
            <textarea
              value={operatorNotes}
              onChange={(e) => setOperatorNotes(e.target.value)}
              placeholder="e.g. Heavy rainfall, Diwali festival holiday exit, IPL stadium cricket match, complete signal box malfunction..."
              className={`w-full h-32 p-3 rounded-xl text-sm border focus:ring-1 focus:ring-pink-500/50 focus:border-pink-500 transition-all resize-none ${
                isDark ? "bg-slate-950 border-slate-800/85 text-white placeholder-slate-600" : "bg-white border-slate-200 text-slate-800 placeholder-slate-400"
              }`}
              id="predict-notes-textarea"
            />
            <p className="text-[10px] text-slate-500 italic">Adds custom variables to the smart AI prediction prompt.</p>
          </div>

          <button
            type="submit"
            disabled={loading || !targetJunctionId}
            className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
              loading 
                ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                : "bg-gradient-to-r from-pink-600 to-indigo-600 text-white hover:from-pink-500 hover:to-indigo-500 hover:shadow-pink-500/20 active:scale-95"
            }`}
            id="trigger-predict-btn"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-pink-400" />
                Modeling Telemetry Matrix...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-pink-300" />
                Generate AI Prediction Report
              </>
            )}
          </button>
        </form>

        {/* Right Side: Prediction Output Report Display */}
        <div className="lg:col-span-8 flex flex-col min-h-[300px]" id="prediction-output-display">
          {error && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {!prediction && !loading && (
            <div className={`flex flex-col items-center justify-center flex-1 p-8 rounded-3xl border-2 border-dashed text-center ${
              isDark ? "border-slate-850 bg-slate-950/20" : "border-slate-200 bg-slate-50/50"
            }`}>
              <BrainCircuit className="w-12 h-12 text-slate-500 mb-3 animate-pulse" />
              <p className={`text-sm font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Ready to compile traffic model.
              </p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                {selectedJunctionData 
                  ? `Click below to let Gemini analyze "${selectedJunctionData.junction_name}" with current load density of ${selectedJunctionData.traffic_density}%.`
                  : "Select a signal node from the menu or map to run the predictive grid neural simulator."}
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
              <Loader2 className="w-10 h-10 text-pink-500 animate-spin mb-4" />
              <p className={`text-sm font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                Interrogating Tamil Nadu GIS Database...
              </p>
              <p className="text-xs text-slate-500 max-w-xs mt-1 animate-pulse">
                Fetching relative area vectors, calculating peak queuing flow, and drafting signal recommendations via Gemini API.
              </p>
            </div>
          )}

          {prediction && !loading && (
            <div className={`flex-1 p-5 rounded-3xl border overflow-y-auto max-h-[420px] transition-all scrollbar-thin ${
              isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-100"
            }`} id="prediction-report-markdown-view">
              <div className="border-b border-slate-800 pb-3 mb-4 flex justify-between items-center">
                <span className="text-xs font-bold text-pink-500 tracking-wider uppercase flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-pink-400" /> AI GENERATED FORECAST MATRIX
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Calculated: {new Date().toLocaleTimeString()}
                </span>
              </div>
              
              {/* Parsed Custom Markdown */}
              <div className="space-y-2 text-justify">
                {renderMarkdownText(prediction)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
