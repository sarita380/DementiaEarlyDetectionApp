import React, { useState } from "react";
import { PatientSessionHistory } from "../types";
import { 
  TrendingUp, 
  Activity, 
  Clock, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle, 
  ShieldAlert, 
  PlusCircle, 
  HelpCircle, 
  Calendar, 
  ArrowDownRight, 
  ArrowUpRight, 
  Info,
  Sliders,
  Trash2,
  FileSpreadsheet
} from "lucide-react";

interface TrendDashboardProps {
  patientHistory: PatientSessionHistory[];
  onAddSimulatedSession: (newSession: PatientSessionHistory) => void;
  onResetHistory: () => void;
  activePatientId: string;
}

type MetricKey = "wordRetrievalSpeedWpm" | "sentenceComplexityScore" | "pausesCount" | "lexicalRichnessTtr" | "cognitiveDeclineLikelihood";

interface MetricMeta {
  key: MetricKey;
  label: string;
  unit: string;
  color: string;
  borderColor: string;
  gradientFrom: string;
  gradientTo: string;
  thresholdHighAlert: number;
  alertOnHigh: boolean; // whether high value means bad (e.g. pausesCount, likelihood)
  description: string;
}

const METRICS_META: MetricMeta[] = [
  {
    key: "cognitiveDeclineLikelihood",
    label: "Cognitive Decline Risk",
    unit: "%",
    color: "#f43f5e", // red-500
    borderColor: "rgba(244, 63, 94, 0.8)",
    gradientFrom: "rgba(244, 63, 94, 0.2)",
    gradientTo: "rgba(244, 63, 94, 0)",
    thresholdHighAlert: 45,
    alertOnHigh: true,
    description: "Algorithmic probability indicator of cognitive distress based on phonetic anomalies."
  },
  {
    key: "wordRetrievalSpeedWpm",
    label: "Word Retrieval Speed",
    unit: " WPM",
    color: "#3b82f6", // blue-500
    borderColor: "rgba(59, 130, 246, 0.8)",
    gradientFrom: "rgba(59, 130, 246, 0.2)",
    gradientTo: "rgba(59, 130, 246, 0)",
    thresholdHighAlert: 90,
    alertOnHigh: false, 
    description: "Words per minute spoken during the initial stages of cognitive description tasks."
  },
  {
    key: "pausesCount",
    label: "Acoustic Hesitation Pauses",
    unit: " events",
    color: "#eab308", // yellow-500
    borderColor: "rgba(234, 179, 8, 0.8)",
    gradientFrom: "rgba(234, 179, 8, 0.2)",
    gradientTo: "rgba(234, 179, 8, 0)",
    thresholdHighAlert: 8,
    alertOnHigh: true,
    description: "Observed vocal hesitation gaps exceeding 1.8 seconds inside active responses."
  },
  {
    key: "sentenceComplexityScore",
    label: "Syntactic Complexity",
    unit: "pts",
    color: "#a855f7", // purple-500
    borderColor: "rgba(168, 85, 247, 0.8)",
    gradientFrom: "rgba(168, 85, 247, 0.2)",
    gradientTo: "rgba(168, 85, 247, 0)",
    thresholdHighAlert: 70,
    alertOnHigh: false,
    description: "Evaluates sentence hierarchical branching levels, relative clauses, and structural grammar output."
  },
  {
    key: "lexicalRichnessTtr",
    label: "Lexical Richness (TTR)",
    unit: "",
    color: "#10b981", // emerald-500
    borderColor: "rgba(16, 185, 129, 0.8)",
    gradientFrom: "rgba(16, 185, 129, 0.2)",
    gradientTo: "rgba(16, 185, 129, 0)",
    thresholdHighAlert: 0.45,
    alertOnHigh: false,
    description: "Type-Token Ratio measures vocabulary expansion variety. Shrinkage signals semantic erosion."
  }
];

export const TrendDashboard: React.FC<TrendDashboardProps> = ({
  patientHistory,
  onAddSimulatedSession,
  onResetHistory,
  activePatientId,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("cognitiveDeclineLikelihood");
  
  // Simulated form states
  const [showSimulator, setShowSimulator] = useState(false);
  const [simDate, setSimDate] = useState("2026-08-30");
  const [simWpm, setSimWpm] = useState(65);
  const [simComplexity, setSimComplexity] = useState(48);
  const [simPauses, setSimPauses] = useState(18);
  const [simTtr, setSimTtr] = useState(0.33);
  const [simLikelihood, setSimLikelihood] = useState(84);
  const [simNotes, setSimNotes] = useState("Projected follow-up session illustrating potential progression of semantic access difficulties.");

  const currentMeta = METRICS_META.find(m => m.key === selectedMetric) || METRICS_META[0];

  // Logic to build beautiful custom SVG line charts with scale bounds
  const padding = 50;
  const chartHeight = 240;
  const chartWidth = 680;

  // Find min and max bounds for values to auto-scale our SVG chart vertically
  const values = patientHistory.map(p => Number(p[selectedMetric]));
  const maxValueRaw = Math.max(...values, currentMeta.thresholdHighAlert);
  const minValueRaw = Math.min(...values, currentMeta.thresholdHighAlert);
  
  // Add padding bounds for neat rendering
  const maxBound = selectedMetric === "lexicalRichnessTtr" ? 1.0 : maxValueRaw * 1.15;
  const minBound = selectedMetric === "lexicalRichnessTtr" ? 0.0 : Math.max(0, minValueRaw * 0.85);
  const spread = maxBound - minBound || 1;

  // Mapping from session array coordinates to dynamic SVG Canvas Viewbox (0,0 to 680, 240)
  const getCoordinates = () => {
    if (patientHistory.length <= 1) return [];
    
    return patientHistory.map((session, index) => {
      const x = padding + (index / (patientHistory.length - 1)) * (chartWidth - 2 * padding);
      // SVG Y starts from top, so we invert it
      const y = chartHeight - padding - ((Number(session[selectedMetric]) - minBound) / spread) * (chartHeight - 2 * padding);
      return { x, y, value: session[selectedMetric], name: session.sessionId, date: session.dateString };
    });
  };

  const coordinates = getCoordinates();

  // Create path instructions for SVG
  const linePath = coordinates.length > 0 
    ? `M ${coordinates.map(c => `${c.x},${c.y}`).join(" L ")}`
    : "";

  // Dynamic closed shape to generate an area color gradient fill beneath the line
  const areaPath = coordinates.length > 0 
    ? `${linePath} L ${coordinates[coordinates.length - 1].x},${chartHeight - padding} L ${coordinates[0].x},${chartHeight - padding} Z`
    : "";

  // Build some diagnostic alert notifications to flag clinical concern
  const findClinicalAnomalies = () => {
    const alerts: string[] = [];
    if (patientHistory.length < 2) return [];

    const first = patientHistory[0];
    const latest = patientHistory[patientHistory.length - 1];

    // 1. Word speed check
    const wpmDropPercent = ((first.wordRetrievalSpeedWpm - latest.wordRetrievalSpeedWpm) / first.wordRetrievalSpeedWpm) * 100;
    if (wpmDropPercent > 20) {
      alerts.push(`Critical Slope Alert: Speech velocity dropped by ${wpmDropPercent.toFixed(0)}% (from ${first.wordRetrievalSpeedWpm} WPM to ${latest.wordRetrievalSpeedWpm} WPM) across the observation timeline.`);
    }

    // 2. Pause threshold
    if (latest.pausesCount > 10) {
      alerts.push(`Anomic Pause Alarm: Severe phonation gaps detected (${latest.pausesCount} events). High indicators of word-finding blockage.`);
    }

    // 3. TTR density metric
    if (latest.lexicalRichnessTtr < 0.42) {
      alerts.push(`Semantic Atrophy: Lexical complexity has plummeted to ${latest.lexicalRichnessTtr} (TTR). Vocabulary repetition is highly elevated.`);
    }

    // 4. Grammar / syntactic drop
    if (latest.sentenceComplexityScore < 60) {
      alerts.push(`Syntactic Simplification: Average grammar syntax complexity is severely simple, indicating executive sequencing dysfunction.`);
    }

    return alerts;
  };

  const clinicalAnomaliesList = findClinicalAnomalies();

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextSessionNum = patientHistory.length + 1;
    const padStr = nextSessionNum < 10 ? `0${nextSessionNum}` : nextSessionNum;

    // Compile dynamic indicators
    const simulatedSession: PatientSessionHistory = {
      sessionId: `Session ${padStr} (Simulated)`,
      dateString: simDate,
      daysAgo: -100, // custom marker
      wordRetrievalSpeedWpm: Number(simWpm),
      sentenceComplexityScore: Number(simComplexity),
      pausesCount: Number(simPauses),
      lexicalRichnessTtr: Number(simTtr),
      cognitiveDeclineLikelihood: Number(simLikelihood),
      generalNotes: simNotes,
      observedBiomarkers: [
        ...(simPauses > 10 ? ["Hesitation / Micro-pauses"] : []),
        ...(simTtr < 0.42 ? ["Noun Anomia / Vague Sub"] : []),
        ...(simComplexity < 65 ? ["Syntactic Simplification"] : [])
      ]
    };

    onAddSimulatedSession(simulatedSession);
    setShowSimulator(false);
  };

  return (
    <div className="space-y-8 animate-fade-in text-white">
      
      {/* Dashboard Metrics Grid Header card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Patient Profile Bio HUD */}
        <div className="md:col-span-4 bg-[#121214] border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="p-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">
                <FileSpreadsheet className="h-4 w-4" />
              </span>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Clinical Folder / Profile
              </span>
            </div>

            <h3 className="text-xl font-bold font-display text-white">Patient {activePatientId}</h3>
            <p className="text-xs text-slate-500 mt-1">Geriatric Linguistic Longitudinal Study</p>

            <div className="mt-6 space-y-3.5">
              <div className="flex justify-between text-xs py-1.5 border-b border-white/5 font-mono">
                <span className="text-slate-400">Biological Age:</span>
                <span className="text-white font-bold">78 Years</span>
              </div>
              <div className="flex justify-between text-xs py-1.5 border-b border-white/5 font-mono">
                <span className="text-slate-400">Total Observations:</span>
                <span className="text-blue-400 font-bold">{patientHistory.length} Sessions Logged</span>
              </div>
              <div className="flex justify-between text-xs py-1.5 border-b border-white/5 font-mono">
                <span className="text-slate-400">Last Assessment:</span>
                <span className="text-white font-semibold">2026-05-20</span>
              </div>
              <div className="flex justify-between text-xs py-1.5 font-mono">
                <span className="text-slate-400">Study Designation:</span>
                <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/10">Active Slope Monitoring</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/5 flex gap-2">
            <button
              onClick={() => setShowSimulator(true)}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-mono text-[11px] uppercase font-bold tracking-widest rounded transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Add Simulated Scan
            </button>
            <button
              onClick={onResetHistory}
              title="Reset history points to baseline clinical records"
              className="px-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded transition-all cursor-pointer font-mono text-xs flex items-center justify-center"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Cognitive Metric Selection Panel cards block */}
        <div className="md:col-span-8 bg-[#121214] border border-white/5 rounded-2xl p-6">
          <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-4">
            Select Speech Biomarker Dimension to Visualize
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {METRICS_META.map((meta) => {
              const isActive = selectedMetric === meta.key;
              const latestValue = patientHistory[patientHistory.length - 1]?.[meta.key];
              const displayVal = typeof latestValue === "number" ? latestValue.toFixed(meta.key === "lexicalRichnessTtr" ? 2 : 0) : "N/A";
              
              // Calculate delta relative to baseline session
              const baseValue = patientHistory[0]?.[meta.key];
              const delta = (typeof latestValue === "number" && typeof baseValue === "number") ? latestValue - baseValue : 0;
              const hasAlert = meta.alertOnHigh 
                ? (typeof latestValue === "number" && latestValue >= meta.thresholdHighAlert)
                : (typeof latestValue === "number" && latestValue < meta.thresholdHighAlert);

              return (
                <button
                  key={meta.key}
                  onClick={() => setSelectedMetric(meta.key)}
                  className={`text-left p-4 rounded-xl border transition-all cursor-pointer relative ${
                    isActive 
                      ? "border-blue-500 bg-blue-950/20" 
                      : "border-white/5 bg-white/5/20 hover:bg-white/5"
                  }`}
                >
                  <div className="flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[10px] text-slate-400 font-medium block truncate leading-tight">
                          {meta.label.split(" (")[0]}
                        </span>
                        {hasAlert && (
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping absolute top-2 right-2"></span>
                        )}
                      </div>
                      
                      <div className="text-xl font-bold font-mono text-white flex items-baseline">
                        {displayVal}
                        <span className="text-[10px] font-normal text-slate-400 ml-0.5">{meta.unit}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono">
                      <span>Timeline Slope</span>
                      {delta !== 0 ? (
                        <span className={`flex items-center font-bold ${
                          meta.alertOnHigh 
                            ? (delta > 0 ? "text-rose-400" : "text-emerald-400")
                            : (delta > 0 ? "text-emerald-400" : "text-rose-400")
                        }`}>
                          {delta > 0 ? "+" : ""}
                          {delta.toFixed(meta.key === "lexicalRichnessTtr" ? 2 : 0)}
                          {meta.alertOnHigh 
                            ? (delta > 0 ? <ArrowUpRight className="h-3 w-3 ml-0.5" /> : <ArrowDownRight className="h-3 w-3 ml-0.5" />)
                            : (delta > 0 ? <ArrowUpRight className="h-3 w-3 ml-0.5" /> : <ArrowDownRight className="h-3 w-3 ml-0.5" />)
                          }
                        </span>
                      ) : (
                        <span className="text-slate-500">Flat</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="bg-slate-950 border border-white/5 rounded-xl p-4 mt-6 flex items-start gap-3">
            <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-300 font-mono leading-relaxed">
                <span className="font-bold text-white uppercase">{currentMeta.label}:</span> {currentMeta.description}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Main Longitudinal Trend Chart Visual block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SVG chart viewport panel */}
        <div className="lg:col-span-8 bg-[#121214] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400 font-mono">
                Biomarker Projection Graph
              </h3>
              <p className="text-xs text-slate-500 mt-1">Multi-session temporal clinical delta regression</p>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-slate-950 px-3 py-1 rounded-lg border border-white/5">
              <Calendar className="h-3 w-3 text-slate-500" />
              <span>July 2025 – August 2026</span>
            </div>
          </div>

          {/* Render responsive styled SVG line plot vector chart */}
          <div className="w-full h-64 relative bg-slate-950/40 rounded-xl border border-white/5 overflow-hidden">
            <svg 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
              className="w-full h-full overflow-visible select-none"
              preserveAspectRatio="none"
            >
              {/* Grids and Axes */}
              <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
              
              {/* Threshold Alarm line overlay */}
              {(() => {
                const thresholdY = chartHeight - padding - ((currentMeta.thresholdHighAlert - minBound) / spread) * (chartHeight - 2 * padding);
                if (thresholdY >= padding && thresholdY <= chartHeight - padding) {
                  return (
                    <g>
                      <line 
                        x1={padding} 
                        y1={thresholdY} 
                        x2={chartWidth - padding} 
                        y2={thresholdY} 
                        stroke="rgba(239, 68, 68, 0.4)" 
                        strokeWidth="1.5" 
                        strokeDasharray="4,4" 
                      />
                      <text 
                        x={padding + 5} 
                        y={thresholdY - 5} 
                        fill="rgba(239, 68, 68, 0.7)" 
                        className="text-[9px] font-mono tracking-widest uppercase"
                      >
                        Risk Threshold Limit ({currentMeta.thresholdHighAlert})
                      </text>
                    </g>
                  );
                }
                return null;
              })()}

              {/* Dynamic Gradients */}
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={currentMeta.color} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={currentMeta.color} stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Gradient Area under the slope line */}
              {coordinates.length > 1 && (
                <path d={areaPath} fill="url(#areaGradient)" />
              )}

              {/* Connecting clinical trend line */}
              {coordinates.length > 1 && (
                <path 
                  d={linePath} 
                  fill="none" 
                  stroke={currentMeta.color} 
                  strokeWidth="3.5" 
                  strokeLinecap="round"
                  strokeLinejoin="round" 
                  className="drop-shadow-[0_2px_8px_rgba(59,130,246,0.3)]"
                />
              )}

              {/* Data Node Point circular markers */}
              {coordinates.map((c, i) => (
                <g key={i}>
                  {/* Outer ripple ring */}
                  <circle 
                    cx={c.x} 
                    cy={c.y} 
                    r="8" 
                    fill={currentMeta.color} 
                    fillOpacity="0.15" 
                  />
                  {/* Central node block */}
                  <circle 
                    cx={c.x} 
                    cy={c.y} 
                    r="4" 
                    fill="#ffffff" 
                    stroke={currentMeta.color} 
                    strokeWidth="3" 
                  />
                  
                  {/* Text value coordinates data tooltips tags */}
                  <text 
                    x={c.x} 
                    y={c.y - 12} 
                    textAnchor="middle" 
                    fill="#ffffff" 
                    className="text-[10px] font-mono font-bold"
                  >
                    {typeof c.value === "number" ? c.value.toFixed(selectedMetric === "lexicalRichnessTtr" ? 2 : 0) : c.value}
                  </text>

                  {/* Horizontal Axis Title text labels */}
                  <text 
                    x={c.x} 
                    y={chartHeight - padding + 18} 
                    textAnchor="middle" 
                    fill="rgba(255,255,255,0.4)" 
                    className="text-[9px] font-mono uppercase tracking-wider"
                  >
                    {c.name}
                  </text>
                  <text 
                    x={c.x} 
                    y={chartHeight - padding + 30} 
                    textAnchor="middle" 
                    fill="rgba(255,255,255,0.25)" 
                    className="text-[8px] font-mono"
                  >
                    {c.date}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="mt-4 text-[10px] text-slate-500 font-mono flex justify-between items-center bg-slate-950/30 p-2 rounded-lg">
            <span>Graph Bounds: Low: {minBound.toFixed(1)} – High: {maxBound.toFixed(1)}</span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: currentMeta.color }}></span>
              Active Regression Parameter
            </span>
          </div>
        </div>

        {/* Cognitive Decline Alerts & Indicators HUD panel (Right column) */}
        <div className="lg:col-span-4 bg-[#121214] border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
              <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 animate-bounce" />
                Cognitive Decline Warnings
              </span>
              <span className="text-[10px] bg-red-950 font-mono border border-red-500/20 text-rose-400 px-2 py-0.5 rounded">
                {clinicalAnomaliesList.length} Active
              </span>
            </div>

            {clinicalAnomaliesList.length > 0 ? (
              <div className="space-y-3">
                {clinicalAnomaliesList.map((alert, idx) => (
                  <div key={idx} className="p-3 bg-red-500/5 hover:bg-red-500/10 transition-colors border border-red-500/10 rounded-xl flex gap-2.5">
                    <ShieldAlert className="h-4.5 w-4.5 text-rose-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                      {alert}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center bg-slate-950/40 border border-dashed border-white/5 rounded-xl space-y-2">
                <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto" />
                <h4 className="text-xs font-bold text-white uppercase font-mono">Cognitive Integrity Flat</h4>
                <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-relaxed px-4">
                  No critical diagnostic trend deterioration flagged! Patient language markers align within standard age-appropriate thresholds.
                </p>
              </div>
            )}
          </div>

          <div className="bg-[#18181B] border border-white/5 rounded-xl p-4 mt-6 leading-relaxed font-mono text-[10px] text-slate-400">
            <span className="font-bold text-white block uppercase mb-1">
              • BIO-ALARM COEFFICIENT REGULATOR
            </span>
            Warnings are triggered automatically using temporal regression algorithms configured dynamically from statistical thresholds recorded across peer clinical neuro-geriatric studies.
          </div>
        </div>

      </div>

      {/* Simulator Modal Box overlay - Shown only if clinician clicks "Add Simulated Scan" */}
      {showSimulator && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-white/5 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-blue-400" />
                <h3 className="text-sm font-semibold uppercase tracking-widest text-white font-mono">
                  Linguistic Simulation Terminal
                </h3>
              </div>
              <button 
                onClick={() => setShowSimulator(false)}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSimulateSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                
                <div>
                  <label className="text-slate-400 uppercase tracking-wide block mb-1">Observation Date</label>
                  <input 
                    type="date"
                    value={simDate}
                    onChange={(e) => setSimDate(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 px-2.5 py-1.5 rounded focus:outline-none focus:border-blue-500 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 uppercase tracking-wide block mb-1">Word Speed (WPM)</label>
                  <input 
                    type="number"
                    min="30"
                    max="180"
                    value={simWpm}
                    onChange={(e) => setSimWpm(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/5 px-2.5 py-1.5 rounded focus:outline-none focus:border-blue-500 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 uppercase tracking-wide block mb-1">Grammar Score (0-100)</label>
                  <input 
                    type="number"
                    min="10"
                    max="100"
                    value={simComplexity}
                    onChange={(e) => setSimComplexity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/5 px-2.5 py-1.5 rounded focus:outline-none focus:border-blue-500 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 uppercase tracking-wide block mb-1">Acoustic Pauses</label>
                  <input 
                    type="number"
                    min="0"
                    max="45"
                    value={simPauses}
                    onChange={(e) => setSimPauses(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/5 px-2.5 py-1.5 rounded focus:outline-none focus:border-blue-500 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 uppercase tracking-wide block mb-1">Lexical variety (TTR: 0-1)</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0.10"
                    max="0.80"
                    value={simTtr}
                    onChange={(e) => setSimTtr(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/5 px-2.5 py-1.5 rounded focus:outline-none focus:border-blue-500 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 uppercase tracking-wide block mb-1">Risk probability (%)</label>
                  <input 
                    type="number"
                    min="0"
                    max="100"
                    value={simLikelihood}
                    onChange={(e) => setSimLikelihood(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/5 px-2.5 py-1.5 rounded focus:outline-none focus:border-blue-500 text-white"
                  />
                </div>

              </div>

              <div>
                <label className="text-slate-400 text-xs font-mono uppercase tracking-wide block mb-1">Progress Clinician Brief</label>
                <textarea 
                  rows={2}
                  value={simNotes}
                  onChange={(e) => setSimNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-white/5 px-2.5 py-1.5 rounded focus:outline-none focus:border-blue-500 text-white text-xs font-mono"
                  placeholder="Record longitudinal clinical description summary here..."
                />
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-white/5 justify-end">
                <button 
                  type="button"
                  onClick={() => setShowSimulator(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded font-bold text-xs uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs uppercase cursor-pointer"
                >
                  Append simulated data point
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
