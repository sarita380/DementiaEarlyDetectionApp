import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));

const PORT = 3000;

// Initialize Gemini client using the recommended user-agent for AI Studio
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Primary Endpoint: Neuropsychological Speech Analysis API
app.post("/api/analyze-speech", async (req, res) => {
  try {
    const { transcript, taskType, age, recordedDuration, pausesCount } = req.body;

    if (!transcript || typeof transcript !== "string" || transcript.trim().length === 0) {
      return res.status(400).json({ error: "A valid speech transcript is required for analysis." });
    }

    const ageValue = age ? Number(age) : "unknown";
    const durationValue = recordedDuration ? `${recordedDuration} seconds` : "unknown";
    const pausesValue = pausesCount !== undefined ? Number(pausesCount) : "unknown";

    // System instruction explaining clinical research on language indicators of dementia. This prevents generic AI responses.
    const systemInstruction = `You are an expert computational clinical linguist and cognitive neuropsychologist specializing in early detection of dementia (e.g., Alzheimer's, primary progressive aphasia, vascular dementia) through speech and language analysis.

Analyze speech characteristics and pattern anomalies in transcripts. Standard assessment benchmarks indicate:
1. Lexical Richness (Type-Token Ratio / TTR): Healthy aged speech typically maintains higher lexical variety, whereas MCI/dementia exhibits vocabulary shrinkage, hyper-frequent use of vague pronouns ("this", "thing", "that", "it") over nouns, and high word repetitions.
2. Syntactic Complexity: Reduced grammatical complexity, simpler sentence structures, and shorter sentences point to executive decline.
3. Semantic & Idea Density: The information-to-word ratio is reduced in preclinical dementia. In the Boston Cookie Theft description, healthy controls name details ("girl", "stool tipping", "sink overflowing", "mother laughing"), whereas dementia patients use vague descriptions or lose track.
4. Repetition & Disfluencies: Frequent filler words ("uh", "um"), paraphasias (substituting unrelated or similar-sounding words), and repetitive phrasing.

Perform a rigorous evaluation of the patient's transcript. Provide accurate clinical indices, linguistic scores, and specific annotated feedback maps. Remember, this is a screening tool, so clearly emphasize professional medical consultation in your recommendations of outcomes. Deliver response purely match the requested JSON schema structure.`;

    const promptMessage = `Patient Demographic & Task Data:
- Task Administered: ${taskType || "General Narrative Prompt"}
- Patient Age: ${ageValue}
- Recording Duration: ${durationValue}
- Logged Pauses/Stutters during transcription: ${pausesValue}

Patient Speech Transcript to Analyze:
"${transcript}"

Provide a detailed clinical and computational-linguistic analysis of this speech sample, using standard scientific models of linguistic markers in neurodegenerative disease. Ensure you identify specific words or phrases in the transcript to annotate for word-finding difficulty, filler words, or repetitive/vague speech syntax.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptMessage,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: [
            "cognitiveClassification",
            "lexicalMetrics",
            "syntacticMetrics",
            "semanticMetrics",
            "speechPatterns",
            "detailedAnalysis",
            "keyIndicators",
            "annotatedTokens",
            "clinicalRecommendations"
          ],
          properties: {
            cognitiveClassification: {
              type: Type.OBJECT,
              properties: {
                label: {
                  type: Type.STRING,
                  description: "Categorical score: 'No Sign of Impairment', 'Mild Cognitive Impairment Indicator', or 'Potential Early-Stage Cognitive Decline'"
                },
                likelihood: {
                  type: Type.INTEGER,
                  description: "Percentage score (0 to 100) representing risk probability calculated based on biomarkers in transcript structure."
                },
                clinicalBrief: {
                  type: Type.STRING,
                  description: "A professional 2-3 sentence clinical summary explaining the categorization."
                }
              },
              required: ["label", "likelihood", "clinicalBrief"]
            },
            lexicalMetrics: {
              type: Type.OBJECT,
              properties: {
                typeTokenRatio: {
                  type: Type.NUMBER,
                  description: "Type-Token Ratio score (0.0 to 1.0) indicating lexical diversity."
                },
                pronounNounRatio: {
                  type: Type.NUMBER,
                  description: "Ratio of pronouns to nouns (typical healthy: < 0.45, early-dementia: higher ratio due to noun retrieval issues)."
                },
                vocabularyComplexity: {
                  type: Type.STRING,
                  description: "Summary phrase describing vocabulary diversity (e.g., 'Normal/Diverse Range', 'Moderately Restricted', 'Severely Restricted')."
                },
                vocabularyComplexityExplanation: {
                  type: Type.STRING,
                  description: "Brief analysis explanation of the lexical metrics."
                }
              },
              required: ["typeTokenRatio", "pronounNounRatio", "vocabularyComplexity", "vocabularyComplexityExplanation"]
            },
            syntacticMetrics: {
              type: Type.OBJECT,
              properties: {
                sentenceLengthAverage: {
                  type: Type.NUMBER,
                  description: "Mean length of utterance (MLU) in words."
                },
                grammarScore: {
                  type: Type.INTEGER,
                  description: "Overall structural and grammatical accuracy score out of 100."
                },
                syntacticComplexity: {
                  type: Type.STRING,
                  description: "Linguistic rating: 'High/Nested Sentences', 'Average/Linear', 'Simplified/Repetitive'."
                },
                syntacticComplexityExplanation: {
                  type: Type.STRING,
                  description: "Brief rationale of the grammar and syntax structure observed."
                }
              },
              required: ["sentenceLengthAverage", "grammarScore", "syntacticComplexity", "syntacticComplexityExplanation"]
            },
            semanticMetrics: {
              type: Type.OBJECT,
              properties: {
                ideaDensity: {
                  type: Type.NUMBER,
                  description: "Estimated propositional density / conceptual information-to-word ratio on a scale of 0.0 to 1.0."
                },
                coherenceScore: {
                  type: Type.INTEGER,
                  description: "Logical focus rating out of 100. Measures presence of topic drift or confusion."
                },
                topicMaintenance: {
                  type: Type.STRING,
                  description: "Rating (e.g., 'Fully Consistent', 'Occasional Deviations / Circumlocution', 'Severe Topic Drift')."
                },
                topicMaintenanceExplanation: {
                  type: Type.STRING,
                  description: "Short analysis explanation of structural semantics and topic coherence."
                }
              },
              required: ["ideaDensity", "coherenceScore", "topicMaintenance", "topicMaintenanceExplanation"]
            },
            speechPatterns: {
              type: Type.OBJECT,
              properties: {
                wordFindingDifficulties: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Target list of clinical observations of word retrieval difficulties (e.g. using generic filler nouns or struggling to name core objects)."
                },
                hesitationsAndPauses: {
                  type: Type.STRING,
                  description: "Observed temporal hesitation behavior analysis (e.g. 'Normal conversational pauses', 'Atypical micro-pauses before nouns', 'Moderate disfluency')."
                },
                repetitionRate: {
                  type: Type.STRING,
                  description: "Quantified evaluation of word, syllable, or theme repetitions (e.g., 'Low standard rate', 'Elevated pronoun perseveration')."
                },
                disfluencyIndicators: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Specific phonetic/linguistic filler cues captured (e.g., 'whoops', 'uh', 'um', 'let me think')."
                }
              },
              required: ["wordFindingDifficulties", "hesitationsAndPauses", "repetitionRate", "disfluencyIndicators"]
            },
            detailedAnalysis: {
              type: Type.STRING,
              description: "A rich, detailed paragraphs comprehensive neuropsychological rationale analyzing exact indicators, patterns, structures, and clinical rationale."
            },
            keyIndicators: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  indicator: { type: Type.STRING, description: "Name of speech biomarker (e.g. Noun Anomia, Pronoun Perseveration, Circumlocution, Syntactic Simplification)" },
                  observed: { type: Type.BOOLEAN, description: "Whether this marker is positively identified in the user transcript" },
                  criticalLevel: { type: Type.STRING, description: "High, Moderate, or Low severity risk metric for this biomarker" },
                  explanation: { type: Type.STRING, description: "Specific evidence/explanation pointing to words context in user transcript" }
                },
                required: ["indicator", "observed", "criticalLevel", "explanation"]
              }
            },
            annotatedTokens: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  wordSegment: { type: Type.STRING, description: "The precise word, phrase, or sentence string from the transcript exhibiting the characteristic." },
                  markerType: { type: Type.STRING, description: "Linguistic marker label: 'Repetitive', 'Pronoun Substitute', 'Vague Reference', 'Filler Word', 'Cognitive Pause', 'Grammatical Error'" },
                  explanation: { type: Type.STRING, description: "Linguistic explanation of why this word/phrase stands out clinical-wise (e.g., 'Vague substitute pronoun where a precise cookie theft action noun like kitchen is expected')." }
                },
                required: ["wordSegment", "markerType", "explanation"]
              },
              description: "A set of word level highlights showing exactly which parts of the transcript represent markers."
            },
            clinicalRecommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Actionable, healthy, and highly supportive guidelines for standard neurological health (e.g., consulting doctors, cognitive speech exercises, lifestyle guidelines)."
            }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json(parsedData);
  } catch (error: any) {
    console.error("Clinical Analysis Error: ", error);
    return res.status(500).json({
      error: "Cognitive analysis process encountered an internal error. Please verify network access and try again.",
      details: error.message || error
    });
  }
});

// Setup Vite Dev Server / Static Assets Server Middleware
async function bootstrapServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware mounted successfully.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving build outputs statically from dist folder.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Dementia Speech Analyzer server actively running at http://0.0.0.0:${PORT}`);
  });
}

bootstrapServer().catch((err) => {
  console.error("Failed to bootstrap server dependencies:", err);
});
