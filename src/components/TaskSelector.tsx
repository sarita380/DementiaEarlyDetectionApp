import React from "react";
import { TaskConfig, DiagnosticSpeechSample, TaskTypeId } from "../types";
import { COGNITIVE_TASKS, DIAGNOSTIC_SAMPLES } from "../data";
import { Brain, FileText, CheckCircle, HelpCircle, Activity, ChevronRight, Sparkles, User, AlertTriangle } from "lucide-react";

interface TaskSelectorProps {
  activeTaskId: TaskTypeId;
  onSelectTask: (taskId: TaskTypeId) => void;
  onSelectSample: (sample: DiagnosticSpeechSample) => void;
  isAnalyzing: boolean;
}

export const TaskSelector: React.FC<TaskSelectorProps> = ({
  activeTaskId,
  onSelectTask,
  onSelectSample,
  isAnalyzing,
}) => {
  const activeTask = COGNITIVE_TASKS.find((t) => t.id === activeTaskId) || COGNITIVE_TASKS[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Task Description & Stimulus Visual Block */}
      <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg text-white">
              <Brain className="h-5 w-5" />
            </span>
            <div className="text-xs uppercase tracking-wider font-mono text-slate-400">
              Diagnostic Task
            </div>
          </div>

          <h3 className="text-xl font-display font-bold text-white leading-tight mb-2">
            {activeTask.title}
          </h3>
          <span className="inline-block text-xs font-mono px-2.5 py-1 bg-slate-800 border border-slate-700 text-blue-400 rounded-full mb-4">
            {activeTask.category}
          </span>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            {activeTask.instructions}
          </p>

          {activeTask.id === "cookie-theft" && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-4">
              <div className="text-xs font-mono text-slate-500 mb-2 uppercase flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-yellow-500" />
                Diagnostic Reference Scene
              </div>
              <div className="text-xs text-slate-400 leading-relaxed space-y-1">
                <p>• Children stealing cookies (stool tipping over, sister laughing)</p>
                <p>• Mother drying dishes at a sink overflowing with spilling water</p>
                <p>• Window looking out into a peaceful backyard garden</p>
              </div>
            </div>
          )}

          {activeTask.id === "verbal-fluency" && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-4">
              <div className="text-xs font-mono text-slate-500 mb-2 uppercase flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-red-500" />
                Linguistic Metrics Measured
              </div>
              <div className="text-xs text-slate-400 leading-relaxed space-y-1">
                <p>• Clustering speed & semantic switching</p>
                <p>• Syllable repetitions & conceptual loops</p>
                <p>• Word list sizing in 30 seconds</p>
              </div>
            </div>
          )}
        </div>

        <div className="text-xs font-mono text-slate-500 mt-4 border-t border-slate-800 pt-4 flex items-center justify-between">
          <span>Target Duration:</span>
          <span className="text-slate-300">{activeTask.suggestedDurationSeconds}s</span>
        </div>
      </div>

      {/* Cognitive Assessment Task Deck */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        <div id="task-selection-scroller" className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-600" />
            1. Select Screening Task
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {COGNITIVE_TASKS.map((task) => {
              const isSelected = task.id === activeTaskId;
              return (
                <button
                  key={task.id}
                  id={`btn-task-${task.id}`}
                  onClick={() => onSelectTask(task.id)}
                  disabled={isAnalyzing}
                  className={`text-left p-4 rounded-xl border transition-all relative ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/50 shadow-sm"
                      : "border-slate-100 bg-slate-50/30 hover:bg-slate-100/50 hover:border-slate-200"
                  } ${isAnalyzing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className="flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                          isSelected ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                        }`}>
                          {task.id === "cookie-theft" ? "Gold Standard" : "Screening"}
                        </span>
                        {isSelected && <div className="h-2 w-2 rounded-full bg-blue-600" />}
                      </div>
                      <h4 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 leading-tight">
                        {task.title.replace("Picture Description", "").replace("Assessment", "")}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                        {task.description}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-[11px] font-mono whitespace-nowrap text-slate-400">
                      <span>{task.suggestedDurationSeconds}s timer</span>
                      <ChevronRight className={`h-3 w-3 ${isSelected ? "text-blue-600" : "text-slate-300"}`} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Diagnostic Presets Deck */}
        <div id="historical-presets" className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="text-base font-display font-semibold text-slate-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              2. Or Load Clinical Case Baseline Sample
            </h2>
            <span className="text-[11px] font-mono bg-yellow-50 text-yellow-800 border border-yellow-100 px-3 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-yellow-600" />
              Demo Reference Presets
            </span>
          </div>

          <p className="text-xs text-slate-500 mb-4">
            Don't want to record your microphone? Load standard transcipts from patients involved in dementia clinical speech studies to see exact differences in linguistic markers.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {DIAGNOSTIC_SAMPLES.map((sample) => {
              const isSampleForActiveTask = sample.taskType === activeTaskId;
              return (
                <button
                  key={sample.id}
                  id={`btn-sample-${sample.id}`}
                  onClick={() => onSelectSample(sample)}
                  disabled={isAnalyzing}
                  className={`text-left p-4 rounded-xl border transition-all relative group flex flex-col justify-between ${
                    isSampleForActiveTask
                      ? "border-indigo-100 bg-indigo-50/20 hover:border-indigo-300 hover:bg-indigo-50/40"
                      : "border-slate-100 bg-slate-50/10 hover:border-slate-200 hover:bg-slate-50/40 opacity-75"
                  } ${isAnalyzing ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1.5 mb-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        sample.label.includes("Healthy")
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : sample.label.includes("MCI")
                          ? "bg-amber-50 text-amber-700 border border-amber-100"
                          : "bg-rose-50 text-rose-700 border border-rose-100"
                      }`}>
                        {sample.label.split(" ")[0]}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">Age {sample.age}</span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 line-clamp-1">
                      {sample.caseName.split(" - ")[0]}
                    </h4>

                    <p className="text-[11px] text-slate-500 italic mt-2 line-clamp-2 border-l border-slate-200 pl-2">
                      "{sample.snippet}"
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {sample.taskType === "cookie-theft" ? "Cookie Theft" : "Category Fluency"}
                    </span>
                    <span className="text-indigo-600 group-hover:translate-x-0.5 transition-transform">Load Preset →</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
