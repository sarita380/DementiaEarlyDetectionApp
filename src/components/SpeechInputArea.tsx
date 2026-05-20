import React, { useState, useEffect, useRef } from "react";
import { TaskTypeId, DiagnosticSpeechSample } from "../types";
import { COGNITIVE_TASKS } from "../data";
import { Mic, MicOff, Square, Send, RefreshCw, AlertCircle, Sparkles, AlertTriangle, FileText, CheckCircle2, Clock } from "lucide-react";

interface SpeechInputAreaProps {
  activeTaskId: TaskTypeId;
  onAnalyze: (transcript: string, parameters: { age: number; duration: number; pausesCount: number }) => Promise<void>;
  isAnalyzing: boolean;
  loadedPreset: DiagnosticSpeechSample | null;
  clearLoadedPreset: () => void;
}

export const SpeechInputArea: React.FC<SpeechInputAreaProps> = ({
  activeTaskId,
  onAnalyze,
  isAnalyzing,
  loadedPreset,
  clearLoadedPreset,
}) => {
  const [transcript, setTranscript] = useState("");
  const [age, setAge] = useState<number>(72);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [pausesCount, setPausesCount] = useState<number>(0);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [speechError, setSpeechError] = useState("");

  const speechRecognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeTask = COGNITIVE_TASKS.find((t) => t.id === activeTaskId) || COGNITIVE_TASKS[0];

  // Update configurations when task or loaded presets change
  useEffect(() => {
    if (loadedPreset) {
      setTranscript(loadedPreset.fullTranscript);
      setAge(loadedPreset.age);
      setPausesCount(loadedPreset.estimatedPauses);
      setRecordingDuration(activeTask.suggestedDurationSeconds);
    } else {
      setTranscript("");
      setPausesCount(0);
      setRecordingDuration(0);
    }
    setTimeLeft(activeTask.suggestedDurationSeconds);
    stopRecordingActions();
    setSpeechError("");
  }, [activeTaskId, loadedPreset]);

  // Clean timers on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  const clearTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
  };

  const stopRecordingActions = () => {
    setIsRecording(false);
    clearTimers();
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
    }
  };

  const startRecording = () => {
    setSpeechError("");
    setTranscript("");
    setPausesCount(0);
    setRecordingDuration(0);
    clearLoadedPreset();

    // Check for web speech recognition API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge, or type your transcript manually.");
      setIsRecording(true);
      startFallbackTimer();
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      let lastSpeechTime = Date.now();

      recognition.onstart = () => {
        setIsRecording(true);
        // Start diagnostic test timer counting down
        setTimeLeft(activeTask.suggestedDurationSeconds);
        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              stopRecordingActions();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        // Start measurement timer of total spoken elapsed seconds
        durationTimerRef.current = setInterval(() => {
          setRecordingDuration((prev) => prev + 1);
        }, 1000);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        if (event.error === "not-allowed") {
          setSpeechError("Microphone permission denied. To record live speech, please enable microphone access in your browser settings.");
        } else {
          setSpeechError(`Speech recognition details: ${event.error}. Fell back to keyboard entry.`);
        }
        stopRecordingActions();
      };

      recognition.onend = () => {
        setIsRecording(false);
        clearTimers();
      };

      recognition.onresult = (event: any) => {
        let finalText = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript + " ";
          }
        }

        if (finalText.trim().length > 0) {
          setTranscript((prev) => {
            const separator = prev ? " " : "";
            return prev + separator + finalText.trim();
          });
        }

        // Measure silence gaps to automatically calculate speech hesitations (clinical pauses)
        const now = Date.now();
        const silentDelta = now - lastSpeechTime;
        if (silentDelta > 1800) { // Gap greater than 1.8 seconds is marked as a clinical pause
          setPausesCount((p) => p + 1);
        }
        lastSpeechTime = now;
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      setSpeechError(`Failed to bind speech listener: ${e.message}`);
      setIsRecording(true);
      startFallbackTimer();
    }
  };

  const startFallbackTimer = () => {
    // Simulated timer for typing entry fallback
    setTimeLeft(activeTask.suggestedDurationSeconds);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRecording(false);
          clearTimers();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    durationTimerRef.current = setInterval(() => {
      setRecordingDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    stopRecordingActions();
  };

  const handleAnalyze = () => {
    if (!transcript.trim()) return;
    const finalDuration = recordingDuration > 0 ? recordingDuration : activeTask.suggestedDurationSeconds;
    onAnalyze(transcript, {
      age,
      duration: finalDuration,
      pausesCount,
    });
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
            <Mic className="h-5 w-5 text-blue-600" />
            3. Speech Recording & Audio Transcription
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Perform the chosen test below using standard verbal narration, or modify a preloaded dataset.
          </p>
        </div>

        {/* Patient Demographics & Context */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl">
          <label className="text-xs font-mono font-bold text-slate-500 uppercase whitespace-nowrap">
            Patient Age:
          </label>
          <input
            id="input-patient-age"
            type="number"
            min="30"
            max="120"
            value={age}
            onChange={(e) => setAge(Math.max(30, Math.min(120, Number(e.target.value))))}
            disabled={isAnalyzing}
            className="w-16 px-2 py-1 text-center font-mono text-sm border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-blue-500 text-slate-800"
          />
        </div>
      </div>

      {speechError && (
        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs p-4 rounded-xl flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <span className="font-semibold">Speech Recognition Advisory:</span> {speechError}
          </div>
        </div>
      )}

      {/* Recording Stimulus Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="lg:col-span-3 flex flex-col gap-3">
          <div className="relative">
            <textarea
              id="speech-transcript-textarea"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              disabled={isAnalyzing || isRecording}
              placeholder={isRecording ? "Listening to speaking flow... Speak naturally. Say your description clearly matching the cognitive task." : "Click 'Start Recording' to narrate, or paste/type a Speech Transcript here to diagnose linguistics..."}
              className={`w-full min-h-[180px] p-4 text-sm font-mono leading-relaxed bg-slate-950 text-emerald-400 border rounded-2xl focus:outline-none transition-all ${
                isRecording 
                  ? "border-blue-500 ring-2 ring-blue-100 placeholder-slate-700 focus:border-blue-600" 
                  : "border-slate-800 focus:border-indigo-500"
              }`}
            />
            
            {isRecording && (
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-blue-900/60 border border-blue-500 px-3 py-1.5 rounded-full backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-mono font-medium text-blue-200 uppercase tracking-widest">
                  Live Listening
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div>
              Character Count: <span className="font-mono text-slate-700">{transcript.length}</span>
            </div>
            {loadedPreset && (
              <div className="flex items-center gap-1 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md text-indigo-700 font-mono text-[10px]">
                <FileText className="h-3 w-3" />
                Preset: {loadedPreset.caseName.split(" (")[0]}
                <button 
                  onClick={clearLoadedPreset}
                  className="ml-1.5 hover:text-indigo-900 cursor-pointer text-slate-400 hover:text-slate-700 font-bold"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Temporal / Accoustic Realtime Parameters */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-200">
              Biometric Metrics
            </h3>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5 text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w.5 text-slate-400" />
                  Clock Run:
                </span>
                <span className="font-mono text-slate-900 font-semibold">{timeLeft}s remaining</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 h-full transition-all duration-1000"
                  style={{ width: `${(timeLeft / activeTask.suggestedDurationSeconds) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-slate-500">Duration Recorded:</span>
              <span className="font-mono text-slate-900 font-semibold">{recordingDuration}s</span>
            </div>

            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-slate-500">Linguistic Pauses:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-slate-900 font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                  {pausesCount}
                </span>
                <div className="flex flex-col gap-0.5">
                  <button 
                    onClick={() => setPausesCount(p => p + 1)}
                    disabled={isAnalyzing}
                    className="text-[9px] px-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded select-none cursor-pointer"
                  >
                    +
                  </button>
                  <button 
                    onClick={() => setPausesCount(p => Math.max(0, p - 1))}
                    disabled={isAnalyzing}
                    className="text-[9px] px-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded select-none cursor-pointer"
                  >
                    -
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 text-[10px] text-slate-400 leading-relaxed font-mono">
            *Clinical Note: Hesitation counts and pauses are critical markers for Alzheimer's word-retrieval difficulties.
          </div>
        </div>
      </div>

      {/* Execution Control Station */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-150 pt-6">
        <div className="flex flex-wrap gap-2.5">
          {!isRecording ? (
            <button
              id="btn-start-record"
              onClick={startRecording}
              disabled={isAnalyzing}
              className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-medium text-sm rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Mic className="h-4 w-4" />
              Start Voice Recording
            </button>
          ) : (
            <button
              id="btn-stop-record"
              onClick={stopRecording}
              className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer animate-pulse"
            >
              <Square className="h-4 w-4 text-red-500 fill-red-500" />
              Stop Recording ({timeLeft}s)
            </button>
          )}

          {transcript.trim() && !isRecording && (
            <button
              id="btn-reset-speech-input"
              onClick={() => {
                setTranscript("");
                setPausesCount(0);
                setRecordingDuration(0);
                clearLoadedPreset();
              }}
              disabled={isAnalyzing}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Clear Text
            </button>
          )}
        </div>

        <button
          id="btn-submit-speech-analysis"
          onClick={handleAnalyze}
          disabled={isAnalyzing || isRecording || !transcript.trim()}
          className={`w-full sm:w-auto px-7 py-3 font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-100 ${
            isAnalyzing || isRecording || !transcript.trim()
              ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
              : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
          }`}
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
              Analyzing Language Patterns...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Analyze Speech for Dementia Patterns
            </>
          )}
        </button>
      </div>
    </div>
  );
};
