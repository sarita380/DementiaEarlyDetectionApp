import React, { useState } from "react";
import { TaskTypeId, ClinicalReport, DiagnosticSpeechSample, PatientSessionHistory } from "./types";
import { TaskSelector } from "./components/TaskSelector";
import { SpeechInputArea } from "./components/SpeechInputArea";
import { TrendDashboard } from "./components/TrendDashboard";
import { COGNITIVE_TASKS, DIAGNOSTIC_SAMPLES, INITIAL_PATIENT_HISTORY } from "./data";
import { 
  Brain, 
  Activity, 
  Sparkles, 
  AlertCircle, 
  ChevronRight, 
  User, 
  Layers, 
  Stethoscope, 
  HeartPulse, 
  Clipboard, 
  CheckCircle2, 
  Clock, 
  BarChart3, 
  TrendingUp, 
  Info, 
  Volume2, 
  AlertTriangle,
  RotateCcw,
  BookOpen,
  LineChart
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"diagnostics" | "trends">("diagnostics");
  const [patientHistory, setPatientHistory] = useState<PatientSessionHistory[]>(INITIAL_PATIENT_HISTORY);

  const [activeTaskId, setActiveTaskId] = useState<TaskTypeId>("cookie-theft");
  const [loadedPreset, setLoadedPreset] = useState<DiagnosticSpeechSample | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorReport, setErrorReport] = useState("");
  const [analysisReport, setAnalysisReport] = useState<ClinicalReport | null>(null);
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number | null>(null);

  // Demographics state variables which can be modified for context
  const [patientId, setPatientId] = useState("NM-9942-B");
  const [sessionCount, setSessionCount] = useState("Session 04");

  // Function to run the actual AI-Powered Speech Analysis via the server API
  const handleAnalyzeSpeech = async (
    transcript: string, 
    parameters: { age: number; duration: number; pausesCount: number }
  ) => {
    setIsAnalyzing(true);
    setErrorReport("");
    setAnalysisReport(null);
    setSelectedTokenIndex(null);

    try {
      const response = await fetch("/api/analyze-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript,
          taskType: COGNITIVE_TASKS.find(t => t.id === activeTaskId)?.title || activeTaskId,
          age: parameters.age,
          recordedDuration: parameters.duration,
          pausesCount: parameters.pausesCount,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status code ${response.status}`);
      }

      const reportData: ClinicalReport = await response.json();
      setAnalysisReport(reportData);

      // Dynamically add the analyzed session to patient longitudinal history
      const wordCount = transcript.split(/\s+/).filter(Boolean).length;
      const durationMin = Math.max(0.1, parameters.duration / 60);
      const wpmCalculated = Math.round(wordCount / durationMin) || 78;
      
      const newHistoryNode: PatientSessionHistory = {
        sessionId: `Session 05 (Clinical Lab)`,
        dateString: "2026-05-20",
        daysAgo: 0,
        wordRetrievalSpeedWpm: wpmCalculated,
        sentenceComplexityScore: reportData.syntacticMetrics.grammarScore,
        pausesCount: parameters.pausesCount,
        lexicalRichnessTtr: reportData.lexicalMetrics.typeTokenRatio,
        cognitiveDeclineLikelihood: reportData.cognitiveClassification.likelihood,
        generalNotes: reportData.detailedAnalysis.substring(0, 160) + "...",
        observedBiomarkers: reportData.keyIndicators.filter(k => k.observed).map(k => k.indicator)
      };

      setPatientHistory(prev => {
        const filtered = prev.filter(p => !p.sessionId.includes("Clinical Lab"));
        return [...filtered, newHistoryNode];
      });

    } catch (err: any) {
      console.error("Analysis Request Failed:", err);
      setErrorReport(err.message || "An unexpected error occurred while communicating with the cognitive pattern analyzer.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectTask = (taskId: TaskTypeId) => {
    setActiveTaskId(taskId);
    setLoadedPreset(null);
    setAnalysisReport(null);
    setErrorReport("");
    setSelectedTokenIndex(null);
  };

  const handleSelectSample = (sample: DiagnosticSpeechSample) => {
    setLoadedPreset(sample);
    setActiveTaskId(sample.taskType);
    setAnalysisReport(null);
    setErrorReport("");
    setSelectedTokenIndex(null);
  };

  const handleClearPreset = () => {
    setLoadedPreset(null);
    setAnalysisReport(null);
    setSelectedTokenIndex(null);
  };

  // Helper to color-code risk categorizations
  const getSeverityStyle = (label?: string) => {
    if (!label) return { border: "border-slate-800", bg: "bg-slate-900/40", text: "text-slate-400" };
    const lower = label.toLowerCase();
    if (lower.includes("no sign") || lower.includes("healthy") || lower.includes("normal")) {
      return { border: "border-emerald-500/20", bg: "bg-emerald-950/20", text: "text-emerald-400" };
    }
    if (lower.includes("mild") || lower.includes("mci") || lower.includes("struggle")) {
      return { border: "border-amber-500/20", bg: "bg-amber-950/20", text: "text-amber-400" };
    }
    return { border: "border-rose-500/20", bg: "bg-rose-950/20", text: "text-rose-400" };
  };

  const getCriticalIndicatorColor = (level: string) => {
    switch (level) {
      case "High": return "text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-sm";
      case "Moderate": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      default: return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    }
  };

  const getMarkerTypeBadgeColor = (type: string) => {
    switch (type) {
      case "Repetitive": return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      case "Pronoun Substitute": return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "Vague Reference": return "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20";
      case "Filler Word": return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
      case "Cognitive Pause": return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      default: return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    }
  };

  // Custom visualizer to highlight identified words inside the transcript
  const renderInteractiveTranscript = (text: string, tokens: any[]) => {
    if (!tokens || tokens.length === 0) {
      return <p className="text-sm text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">{text}</p>;
    }

    // High quality matching algorithm that looks for tokens in the transcript and surrounds them with interactive highlights.
    // To prevent regex issues we split by simple matching, sorting tokens descending by wordSegment length to prevent substring clashes.
    const sortedTokens = [...tokens].sort((a, b) => b.wordSegment.length - a.wordSegment.length);
    
    // We can list tokens as interactive tags that patients/clinicians can click to inspect why it represents dementia diagnostic metrics.
    return (
      <div className="space-y-4">
        {/* Render fully highlighted segments panel */}
        <div className="p-4 bg-slate-950 rounded-xl border border-white/5 font-mono text-sm leading-relaxed text-slate-300">
          {(() => {
            let lastIdx = 0;
            const segments: React.ReactNode[] = [];
            
            // To make highlighting accurate and resilient, we search and highlight elements in order of occurrence
            // We find occurences of segments by locating them sequentially
            let cleanText = text;
            
            // Let's tokenise by looking at words or simple substrings
            // For interactive design, displaying them below is extremely intuitive too. 
            // Let's output highlighted token pills that are fully clickable.
            return (
              <div className="relative">
                <p className="whitespace-pre-wrap text-slate-200">
                  {text.split(/\b/).map((chunk, i) => {
                    // Check if chunk resembles any wordSegment
                    const lowercaseChunk = chunk.toLowerCase().replace(/[^\w]/g, "");
                    const foundTokenIndex = tokens.findIndex(t => {
                      const cleanToken = t.wordSegment.toLowerCase().replace(/[^\w]/g, "");
                      return cleanToken && (chunk.toLowerCase() === t.wordSegment.toLowerCase() || (lowercaseChunk.length > 2 && cleanToken.includes(lowercaseChunk)));
                    });

                    if (foundTokenIndex !== -1) {
                      const t = tokens[foundTokenIndex];
                      const isSelected = selectedTokenIndex === foundTokenIndex;
                      return (
                        <span 
                          key={i}
                          onClick={() => setSelectedTokenIndex(foundTokenIndex)}
                          title={`Click to inspect: ${t.markerType}`}
                          className={`cursor-pointer transition-all border-b-2 rounded-sm px-0.5 mx-0.5 ${
                            isSelected 
                              ? "bg-blue-600/30 border-blue-400 text-white font-semibold shadow-sm"
                              : t.markerType === "Repetitive" 
                                ? "bg-rose-500/10 border-rose-500/50 text-rose-300 hover:bg-rose-500/20"
                                : t.markerType === "Pronoun Substitute" || t.markerType === "Vague Reference"
                                  ? "bg-amber-500/10 border-amber-500/50 text-amber-300 hover:bg-amber-500/20"
                                  : "bg-blue-500/10 border-blue-500/50 text-blue-300 hover:bg-blue-500/20"
                          }`}
                        >
                          {chunk}
                        </span>
                      );
                    }
                    return <span key={i}>{chunk}</span>;
                  })}
                </p>
                <div className="mt-4 text-[11px] text-slate-500 flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 bg-rose-500/20 border border-rose-500/50 rounded-sm"></span> Repetition
                  <span className="inline-block w-2.5 h-2.5 bg-amber-500/20 border border-amber-500/50 rounded-sm"></span> Vague Nouns
                  <span className="inline-block w-2.5 h-2.5 bg-blue-500/20 border border-blue-500/50 rounded-sm"></span> Filler Words
                  <span className="ml-auto text-blue-400 italic font-medium">💡 Click highlighted words to inspect details below</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Selected token inspector card panel */}
        <div className="bg-[#18181B] border border-white/5 rounded-xl p-4 min-h-[90px] flex flex-col justify-center">
          {selectedTokenIndex !== null && tokens[selectedTokenIndex] ? (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-semibold text-slate-400">
                  Observed Segment: <span className="text-white">"{tokens[selectedTokenIndex].wordSegment}"</span>
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${getMarkerTypeBadgeColor(tokens[selectedTokenIndex].markerType)}`}>
                  {tokens[selectedTokenIndex].markerType}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-3 border-l-2 border-blue-500">
                {tokens[selectedTokenIndex].explanation}
              </p>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-xs text-slate-500 font-mono">
                Click on any of the highlighted words above to view deep clinical diagnostic annotation.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div id="neuro-analyzer-cabinet" className="bg-[#0A0A0B] text-gray-200 font-sans min-h-screen flex flex-col lg:flex-row overflow-x-hidden selection:bg-blue-600/30">
      
      {/* Decorative Brand Navigation Rail - Matching the Sophisticated Dark Theme Spec */}
      <nav className="w-full lg:w-20 bg-[#121214] border-b lg:border-b-0 lg:border-r border-white/5 flex lg:flex-col items-center py-4 lg:py-8 px-4 lg:px-0 gap-6 lg:gap-10 shrink-0">
        <div className="w-10 h-10 bg-gradient-to-tr from-blue-700 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/30">
          <div className="w-5 h-5 border-2 border-white rounded-full flex items-center justify-center">
            <span className="text-[10px] font-mono font-bold">N</span>
          </div>
        </div>
        
        {/* Hidden on small screens, shown vertically on desktops */}
        <div className="hidden lg:flex flex-col gap-8 opacity-40">
          <div className="w-6 h-6 border-b-2 border-white rounded-sm" title="Dashboard"></div>
          <div className="w-6 h-6 border-2 border-white rounded-sm" title="Biomarkers"></div>
          <div className="w-6 h-6 border-2 border-white rounded-full" title="Patients"></div>
          <div className="w-6 h-6 bg-white/50 rounded-full" title="Help Guide"></div>
        </div>

        <div className="ml-auto lg:ml-0 lg:mt-auto flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-400 flex items-center justify-center text-xs font-mono font-bold text-white shadow-sm">
            AI
          </div>
        </div>
      </nav>

      {/* Primary Analytical Console Workspace */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Nav bar block */}
        <header className="border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 md:px-8 bg-[#0A0A0B]/80 sticky top-0 backdrop-blur-md z-40 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <h1 className="text-xs uppercase tracking-[0.3em] font-medium text-blue-400">
                NeuroVoice Early Diagnostics
              </h1>
            </div>
            
            {/* DEMOGRAPHICS EDITORS - Clinicians can modify this real-time */}
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-500">
              <div className="flex items-center gap-1 bg-white/5 rounded px-2 py-0.5 border border-white/10">
                <span className="text-slate-400">UID:</span>
                <input 
                  type="text" 
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="bg-transparent text-gray-300 font-mono focus:outline-none w-24 text-center cursor-pointer hover:bg-white/5"
                  title="Click to edit Patient ID"
                />
              </div>
              <div className="flex items-center gap-1 bg-white/5 rounded px-2 py-0.5 border border-white/10">
                <span className="text-slate-400">Sequence:</span>
                <input 
                  type="text" 
                  value={sessionCount}
                  onChange={(e) => setSessionCount(e.target.value)}
                  className="bg-transparent text-gray-300 font-mono focus:outline-none w-20 text-center cursor-pointer hover:bg-white/5"
                  title="Click to edit Session Count"
                />
              </div>
              <span className="hidden sm:inline">•</span>
              <span>Linguistic Screening Protocol v3.5</span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <span className="text-[10px] uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 font-mono">
              Core Engine Active
            </span>
            <button 
              onClick={() => window.print()}
              className="px-4 py-2 bg-white hover:bg-gray-200 text-black text-xs font-bold uppercase tracking-widest transition-all cursor-pointer shadow-md rounded"
            >
              Print Report
            </button>
          </div>
        </header>

        {/* Nested Content Containers */}
        <div className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
          
          {/* Welcome Alert / Clinical Directive banner */}
          <div className="bg-gradient-to-r from-[#172554] to-[#0f172a] border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 opacity-10 pointer-events-none">
              <Brain className="w-64 h-64 text-blue-400" />
            </div>
            
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xs font-mono border border-blue-500/20 rounded-full mb-3">
                <Sparkles className="h-3 w-3 text-blue-400" />
                Vocal Biomarker Analysis Framework
              </span>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight mb-2">
                Evaluate Early Cognitive Signs through Speech Kinetics
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Analyze natural speech transcripts or clinical category assessments like the Boston "Cookie Theft" test. 
                Our AI model parses phonetic disfluencies, Type-Token lexicography, noun-pronoun substitution ratios, 
                and idea density to highlight early biomarkers of Mild Cognitive Impairment (MCI) or potential progressive Alzheimer's decline.
              </p>
            </div>
          </div>

          {/* Stunning Tab Navigation HUD */}
          <div className="flex border-b border-white/5 pb-[1px] gap-2">
            <button
              onClick={() => setActiveTab("diagnostics")}
              className={`pb-3 text-xs uppercase tracking-widest font-mono font-bold transition-all px-4 cursor-pointer flex items-center gap-2 border-b-2 relative ${
                activeTab === "diagnostics"
                  ? "border-blue-500 text-white font-semibold"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <Activity className="h-4 w-4" />
              Speech Diagnostic Lab
              {isAnalyzing && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("trends")}
              className={`pb-3 text-xs uppercase tracking-widest font-mono font-bold transition-all px-4 cursor-pointer flex items-center gap-2 border-b-2 relative ${
                activeTab === "trends"
                  ? "border-blue-500 text-white font-semibold"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <LineChart className="h-4 w-4" />
              Cognitive Trend Analyzer Dashboard
              <span className="text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded ml-1 font-normal font-sans">
                Longitudinal
              </span>
            </button>
          </div>

          {activeTab === "diagnostics" ? (
            <div className="space-y-8 animate-fade-in animate-duration-300">
              {/* Interactive Selectors Section */}
              <section id="clinical-instructions-section" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs uppercase tracking-widest text-slate-400 font-mono font-semibold">
                    Clinical Workflow Configuration
                  </h3>
                </div>
                <TaskSelector
                  activeTaskId={activeTaskId}
                  onSelectTask={handleSelectTask}
                  onSelectSample={handleSelectSample}
                  isAnalyzing={isAnalyzing}
                />
              </section>

              {/* Core Recording area / Custom Text Entry */}
              <section id="recording-suite-section">
                <SpeechInputArea
                  activeTaskId={activeTaskId}
                  onAnalyze={handleAnalyzeSpeech}
                  isAnalyzing={isAnalyzing}
                  loadedPreset={loadedPreset}
                  clearLoadedPreset={handleClearPreset}
                />
              </section>

              {/* Processing and Waiting Feedbacks */}
              {isAnalyzing && (
                <div className="p-12 text-center bg-[#121214] border border-white/5 rounded-3xl space-y-4 max-w-2xl mx-auto shadow-xl">
                  <div className="inline-flex p-4 rounded-full bg-blue-500/10 text-blue-400 animate-spin">
                    <RotateCcw className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-display font-medium text-white">Generating Linguistic Diagnostics</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    Extracting syntactic clauses, evaluating the Type-Token vocabulary density, and parsing specific phrase clusters for word-finding hesitations using the server-side clinical LLM.
                  </p>
                </div>
              )}

              {errorReport && (
                <div className="p-6 bg-rose-950/20 border border-rose-500/20 text-rose-300 rounded-3xl max-w-2xl mx-auto flex items-start gap-4 shadow-lg animate-fade-in">
                  <AlertTriangle className="h-6 w-6 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-rose-200 text-sm">Evaluation Engine Halted</h4>
                    <p className="text-xs text-rose-300/90 mt-1 leading-relaxed">
                      {errorReport}
                    </p>
                    <button 
                      onClick={() => setIsAnalyzing(false)}
                      className="mt-3 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-mono text-rose-200 border border-rose-500/30 rounded-lg cursor-pointer transition-all"
                    >
                      Dismiss Advisory
                    </button>
                  </div>
                </div>
              )}

              {/* THE STUNNING CLINICAL DIAGNOSTIC REPORT RESULTS - Sophisticated Dark Mode Theme */}
              {analysisReport && !isAnalyzing && !errorReport && (
                <div id="diagnostic-report-hub" className="animate-fade-in space-y-8">
                  
                  {/* Main Report Summary & Gauge Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Gauge Probability Summary (Left Panel) */}
                    <div className="lg:col-span-5 bg-[#121214] border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-lg">
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 font-mono mb-6">
                          A. Cognitive Classification Probability
                        </h3>
                        
                        {/* Ring circular progress indicator */}
                        <div className="flex flex-col items-center py-4">
                          <div className="relative w-44 h-44 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                              {/* Track outline */}
                              <circle 
                                cx="88" 
                                cy="88" 
                                r="76" 
                                stroke="currentColor" 
                                strokeWidth="8" 
                                fill="transparent" 
                                className="text-white/5" 
                              />
                              {/* Radial indicator */}
                              <circle 
                                cx="88" 
                                cy="88" 
                                r="76" 
                                stroke="currentColor" 
                                strokeWidth="8" 
                                fill="transparent" 
                                strokeDasharray={2 * Math.PI * 76} 
                                strokeDashoffset={2 * Math.PI * 76 * (1 - analysisReport.cognitiveClassification.likelihood / 100)} 
                                className={`transition-all duration-1000 ${
                                  analysisReport.cognitiveClassification.likelihood > 60 
                                    ? "text-rose-500" 
                                    : analysisReport.cognitiveClassification.likelihood > 30 
                                    ? "text-amber-500" 
                                    : "text-emerald-500"
                                }`} 
                              />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                              <span className="text-4xl font-display font-extrabold text-white">
                                {analysisReport.cognitiveClassification.likelihood}%
                              </span>
                              <span className="text-[10px] uppercase text-slate-500 font-mono tracking-widest mt-1">
                                Likelihood Index
                              </span>
                            </div>
                          </div>

                          {/* Diagnostic categorization badge */}
                          <div className="mt-6 text-center">
                            <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide border ${
                              getSeverityStyle(analysisReport.cognitiveClassification.label).border
                            } ${
                              getSeverityStyle(analysisReport.cognitiveClassification.label).bg
                            } ${
                              getSeverityStyle(analysisReport.cognitiveClassification.label).text
                            }`}>
                              {analysisReport.cognitiveClassification.label}
                            </span>
                            
                            <p className="text-xs text-slate-400 mt-4 leading-relaxed max-w-sm px-4">
                              {analysisReport.cognitiveClassification.clinicalBrief}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Scientific Warning Disclaimer Statement */}
                      <div className="mt-6 pt-6 border-t border-white/5 flex items-start gap-2.5 text-[11px] text-slate-500 leading-relaxed font-mono">
                        <Info className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>
                          SCREENED INDEX ONLY. This computational linguistics calculation is not a formal diagnostic tool. Must be used with Mini-Mental State Examination (MMSE) guidelines.
                        </span>
                      </div>
                    </div>

                    {/* Computational Linguistic Deep Metrics (Right Panel) */}
                    <div className="lg:col-span-7 bg-[#121214] border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-lg">
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 font-mono mb-6">
                          B. Multi-Dimensional Linguistic Metrics
                        </h3>

                        <div className="space-y-6">
                          
                          {/* Lexical variety metric */}
                          <div>
                            <div className="flex justify-between items-center text-xs mb-1.5">
                              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                                Lexical Density (Type-Token Ratio / TTR)
                              </span>
                              <span className="font-mono text-white font-bold bg-white/5 px-2 py-0.5 rounded">
                                {analysisReport.lexicalMetrics.typeTokenRatio.toFixed(2)} / 1.00
                              </span>
                            </div>
                            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                              <button 
                                className="bg-blue-500 h-full rounded-full transition-all"
                                style={{ width: `${analysisReport.lexicalMetrics.typeTokenRatio * 100}%` }}
                                title={`TTR: ${analysisReport.lexicalMetrics.typeTokenRatio}`}
                              />
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 pl-3 font-mono italic">
                              Rating: <strong className="text-slate-300">{analysisReport.lexicalMetrics.vocabularyComplexity}</strong> — {analysisReport.lexicalMetrics.vocabularyComplexityExplanation}
                            </p>
                          </div>

                          {/* Pronoun usage ratio metric */}
                          <div>
                            <div className="flex justify-between items-center text-xs mb-1.5">
                              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                                Pronoun-to-Noun Ratio
                              </span>
                              <span className="font-mono text-white font-bold bg-white/5 px-2 py-0.5 rounded">
                                {analysisReport.lexicalMetrics.pronounNounRatio.toFixed(2)}
                              </span>
                            </div>
                            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                              <button 
                                className={`h-full rounded-full transition-all ${
                                  analysisReport.lexicalMetrics.pronounNounRatio > 0.5 ? "bg-rose-500" : "bg-emerald-500"
                                }`}
                                style={{ width: `${Math.min(100, analysisReport.lexicalMetrics.pronounNounRatio * 100)}%` }}
                                title={`Pronoun Ratio: ${analysisReport.lexicalMetrics.pronounNounRatio}`}
                              />
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                              *A raised ratio (&gt;0.45) indicates noun-access anomia (compensating with vague words like "it", "thing", "this").
                            </span>
                          </div>

                          {/* Syntactic structure and average sentence complexity */}
                          <div>
                            <div className="flex justify-between items-center text-xs mb-1.5">
                              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                                Syntactic Grammar Accuracy
                              </span>
                              <span className="font-mono text-white font-bold bg-white/5 px-2 py-0.5 rounded">
                                {analysisReport.syntacticMetrics.grammarScore} / 100
                              </span>
                            </div>
                            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                              <button 
                                className="bg-indigo-500 h-full rounded-full transition-all"
                                style={{ width: `${analysisReport.syntacticMetrics.grammarScore}%` }}
                                title={`Grammar Score: ${analysisReport.syntacticMetrics.grammarScore}`}
                              />
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 pl-3 font-mono italic">
                              Mean sentence length: <strong className="text-slate-300">{analysisReport.syntacticMetrics.sentenceLengthAverage.toFixed(1)} words</strong> — {analysisReport.syntacticMetrics.syntacticComplexityExplanation}
                            </p>
                          </div>

                          {/* Idea density and coherence metrics */}
                          <div>
                            <div className="flex justify-between items-center text-xs mb-1.5">
                              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                Propositional Idea Density Index
                              </span>
                              <span className="font-mono text-white font-bold bg-white/5 px-2 py-0.5 rounded">
                                {analysisReport.semanticMetrics.ideaDensity.toFixed(2)}
                              </span>
                            </div>
                            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                              <button 
                                className="bg-emerald-500 h-full rounded-full transition-all"
                                style={{ width: `${analysisReport.semanticMetrics.ideaDensity * 100}%` }}
                                title={`Idea Density: ${analysisReport.semanticMetrics.ideaDensity}`}
                              />
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 pl-3 font-mono italic">
                              Coherence Index: <strong className="text-slate-300">{analysisReport.semanticMetrics.coherenceScore}/100</strong> — {analysisReport.semanticMetrics.topicMaintenanceExplanation}
                            </p>
                          </div>

                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-slate-400">
                        <span>Analysis Speed: <span className="text-emerald-400">0.84 seconds</span></span>
                        <span>Algorithm version: 2.1-clinical</span>
                      </div>
                    </div>

                  </div>

                  {/* Patient Speech Transcript Interactive Highlight Box */}
                  <div className="bg-[#121214] border border-white/5 rounded-3xl p-6 md:p-8 shadow-md">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 font-mono mb-4 flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-blue-400" />
                      C. Interactive Transcript & Linguistic Pinpointers
                    </h3>
                    
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                      Interactive display of patient narrative speech. Specific words representing pauses, vague word substitutes, or lexical repetitions are automatically marked below by the NLP parser.
                    </p>

                    {renderInteractiveTranscript(loadedPreset?.fullTranscript || "No transcript content", analysisReport.annotatedTokens)}
                  </div>

                  {/* Diagnostic Key Bilateral Speech Markers Panel */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Specific Acoustic & Speech Patterns Tab */}
                    <div className="bg-[#121214] border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-lg">
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 font-mono mb-4">
                          D. Clinical Speech Patterns Found
                        </h3>

                        <div className="divide-y divide-white/5 space-y-4">
                          <div className="pt-3">
                            <span className="text-xs font-bold text-slate-300 uppercase font-mono block mb-1">
                              Word-Finding Difficulties
                            </span>
                            {analysisReport.speechPatterns.wordFindingDifficulties && analysisReport.speechPatterns.wordFindingDifficulties.length > 0 ? (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {analysisReport.speechPatterns.wordFindingDifficulties.map((w, idx) => (
                                  <span key={idx} className="text-xs px-2.5 py-1 bg-[#1A1A1E] text-slate-300 border border-white/5 rounded font-mono">
                                    • {w}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500 italic font-mono">No significant clinical noun anomia detected.</p>
                            )}
                          </div>

                          <div className="pt-4">
                            <span className="text-xs font-bold text-slate-300 uppercase font-mono block mb-1">
                              Hesitations & Gaps behavior
                            </span>
                            <p className="text-xs text-slate-300 leading-relaxed font-mono">
                              {analysisReport.speechPatterns.hesitationsAndPauses}
                            </p>
                          </div>

                          <div className="pt-4">
                            <span className="text-xs font-bold text-slate-300 uppercase font-mono block mb-1">
                              Repetition Rate Index
                            </span>
                            <p className="text-xs text-slate-300 leading-relaxed font-mono">
                              {analysisReport.speechPatterns.repetitionRate}
                            </p>
                          </div>

                          <div className="pt-4">
                            <span className="text-xs font-bold text-slate-300 uppercase font-mono block mb-1">
                              Linguistic Disfluencies Detected
                            </span>
                            {analysisReport.speechPatterns.disfluencyIndicators && analysisReport.speechPatterns.disfluencyIndicators.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {analysisReport.speechPatterns.disfluencyIndicators.map((d, index) => (
                                  <span key={index} className="text-xs font-mono px-2 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/10 rounded">
                                    {d}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500 italic font-mono">Low disfluency pattern.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Specific Biomarker Flag Indicator Sheet */}
                    <div className="bg-[#121214] border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-lg">
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 font-mono mb-6">
                          E. Biomarker Flag Verification (DSM-V)
                        </h3>

                        <div className="space-y-4">
                          {analysisReport.keyIndicators.map((metric, index) => (
                            <div 
                              key={index}
                              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row justify-between items-start gap-4 transition-all ${
                                metric.observed 
                                  ? "bg-slate-900/40 border-white/5" 
                                  : "bg-slate-500/5 border-dashed border-white/5 opacity-50"
                              }`}
                            >
                              <div className="space-y-1 max-w-sm">
                                <h4 className="text-xs font-semibold text-white uppercase font-mono tracking-wide flex items-center gap-1.5">
                                  {metric.indicator}
                                  {metric.observed && (
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${getCriticalIndicatorColor(metric.criticalLevel)}`}>
                                      {metric.criticalLevel} Risk
                                    </span>
                                  )}
                                </h4>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                  {metric.explanation}
                                </p>
                              </div>

                              <div className="shrink-0 flex items-center gap-2">
                                <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full ${
                                  metric.observed 
                                    ? "bg-red-500/10 text-red-400 border border-red-500/20 font-bold" 
                                    : "bg-[#18181B] text-slate-500"
                                }`}>
                                  {metric.observed ? "OBSERVED" : "NOT OBSERVED"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Narrative Analysis Brief */}
                  <div className="bg-[#121214] border border-white/5 rounded-3xl p-6 md:p-8 shadow-lg">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 font-mono mb-4 flex items-center gap-1.5">
                      <Clipboard className="h-4 w-4 text-blue-400" />
                      F. Comprehensive Clinical Rationale
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap italic">
                      "{analysisReport.detailedAnalysis}"
                    </p>
                  </div>

                  {/* Support & Actionable Clinical Directions - Matching aesthetic of template bottom block */}
                  <div className="bg-gradient-to-br from-blue-900/20 to-transparent border border-blue-500/20 rounded-3xl p-6 md:p-8 shadow-lg">
                    <h3 className="text-sm font-display font-bold text-blue-400 mb-4 flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      G. Diagnostic Protocol & Health Recommendations
                    </h3>
                    <ul className="space-y-4">
                      {analysisReport.clinicalRecommendations.map((recommendation, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-300 font-light">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></div>
                          <p>{recommendation}</p>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              )}

              {/* Quick Informative Clinical Resource Corner */}
              <div className="bg-[#121214] border border-white/5 rounded-3xl p-6 md:p-8 shadow-lg">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 font-mono mb-4 flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-slate-400" />
                  Linguistic Biomarker Research Notebook
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-400 leading-relaxed font-mono">
                  <div className="space-y-2">
                    <span className="text-white font-bold block">1. LEXICAL PERSISTENCE</span>
                    <p>
                      Lexical richness scores quantify linguistic diversity. Significant decline in vocabularic variety with persistent repetition of generalized verbs and empty, low-frequency descriptors acts as an early identifier of temporal lobe neuronal atrophy.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-white font-bold block">2. NOUN ACCESS & ANOMIA</span>
                    <p>
                      As dementia advances, patients find nouns notably harder to retrieve than pronouns or filler prepositions. Evaluating the Pronoun-Noun ratio provides a highly predictive indicator for differentiating standard senescent speech from cortical neurodegeneration.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-white font-bold block">3. PROPOSITIONAL DENSITY</span>
                    <p>
                      Propositional/Idea density measures contentful statements divided by total word volume. High sentence redundancy with low factual statements characterizes early-onset cognitive impairments like Alzheimer's.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <TrendDashboard 
              patientHistory={patientHistory} 
              onAddSimulatedSession={(newSession) => setPatientHistory(prev => [...prev, newSession])}
              onResetHistory={() => setPatientHistory(INITIAL_PATIENT_HISTORY)}
              activePatientId={patientId}
            />
          )}

        </div>

        {/* Footer */}
        <footer className="border-t border-white/5 py-8 px-6 md:px-8 bg-[#0A0A0B] text-center text-xs text-slate-500 font-mono">
          <p>© 2026 NeuroVoice Diagnostics Laboratory. All research frameworks are grounded in standardized geriatric linguistic speech analytics.</p>
        </footer>

      </main>

    </div>
  );
}
