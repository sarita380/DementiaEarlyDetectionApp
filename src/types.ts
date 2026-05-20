export type TaskTypeId = "cookie-theft" | "verbal-fluency" | "autobiographical" | "procedural" | "free-talk";

export interface TaskConfig {
  id: TaskTypeId;
  title: string;
  category: string;
  description: string;
  instructions: string;
  stimulusPrompt: string;
  suggestedDurationSeconds: number;
}

export interface CognitiveClassification {
  label: string;
  likelihood: number;
  clinicalBrief: string;
}

export interface LexicalMetrics {
  typeTokenRatio: number;
  pronounNounRatio: number;
  vocabularyComplexity: string;
  vocabularyComplexityExplanation: string;
}

export interface SyntacticMetrics {
  sentenceLengthAverage: number;
  grammarScore: number;
  syntacticComplexity: string;
  syntacticComplexityExplanation: string;
}

export interface SemanticMetrics {
  ideaDensity: number;
  coherenceScore: number;
  topicMaintenance: string;
  topicMaintenanceExplanation: string;
}

export interface SpeechPatterns {
  wordFindingDifficulties: string[];
  hesitationsAndPauses: string;
  repetitionRate: string;
  disfluencyIndicators: string[];
}

export interface KeyIndicator {
  indicator: string;
  observed: boolean;
  criticalLevel: "Low" | "Moderate" | "High";
  explanation: string;
}

export interface AnnotatedToken {
  wordSegment: string;
  markerType: "Repetitive" | "Pronoun Substitute" | "Vague Reference" | "Filler Word" | "Cognitive Pause" | "Grammatical Error";
  explanation: string;
}

export interface ClinicalReport {
  cognitiveClassification: CognitiveClassification;
  lexicalMetrics: LexicalMetrics;
  syntacticMetrics: SyntacticMetrics;
  semanticMetrics: SemanticMetrics;
  speechPatterns: SpeechPatterns;
  detailedAnalysis: string;
  keyIndicators: KeyIndicator[];
  annotatedTokens: AnnotatedToken[];
  clinicalRecommendations: string[];
}

export interface PatientSessionHistory {
  sessionId: string;
  dateString: string;
  daysAgo: number;
  wordRetrievalSpeedWpm: number;
  sentenceComplexityScore: number;
  pausesCount: number;
  lexicalRichnessTtr: number;
  cognitiveDeclineLikelihood: number;
  generalNotes: string;
  observedBiomarkers: string[];
}

export interface DiagnosticSpeechSample {
  id: string;
  caseName: string;
  age: number;
  label: string;
  taskType: TaskTypeId;
  snippet: string;
  fullTranscript: string;
  estimatedPauses: number;
  notes: string;
}
