import { TaskConfig, DiagnosticSpeechSample, PatientSessionHistory } from "./types";

export const COGNITIVE_TASKS: TaskConfig[] = [
  {
    id: "cookie-theft",
    title: "Boston Cookie Theft Picture Description",
    category: "Linguistic & Noun Retrieval Test",
    description: "The classic Boston Diagnostic Aphasia Examination picture description stimulus.",
    instructions: "Look at the standard kitchen scene below or visualize it: A mother drying dishes at a sink that is overflowing onto the floor; a boy on a wobbling three-legged stool reaching into a high cookie jar, slipping a cookie to his sister who is reaching up. Describe everything you see happening in this scene.",
    stimulusPrompt: "Describe the overflowing sink, the tipping stool, the siblings sneaking cookies from the high shelf, and the mother drying dishes.",
    suggestedDurationSeconds: 60,
  },
  {
    id: "verbal-fluency",
    title: "Category Verbal Fluency Assessment",
    category: "Executive & Semantic Cluster Test",
    description: "A standard cognitive speed test checking category-based word retrieval.",
    instructions: "You will have 30 seconds to speak or type as many unique animals as you can think of. Clumping (e.g., farm animals, Arctic animals) and processing speed are evaluated.",
    stimulusPrompt: "Name as many animals as possible in 30 seconds (e.g., dog, cat, elephant, tiger...)",
    suggestedDurationSeconds: 30,
  },
  {
    id: "autobiographical",
    title: "Autobiographical Memory Narrative",
    category: "Episodic & Coherence Assessment",
    description: "An open personal history recall assessing chronological narrative coherence and memory retrieval.",
    instructions: "Tell or write a detailed story about a highly memorable childhood vacation, your wedding day, or your first day of school. Aim to describe the atmosphere, sounds, colors, and specific events of that day.",
    stimulusPrompt: "Describe a vivid personal childhood memory with as many structural details as possible.",
    suggestedDurationSeconds: 120,
  },
  {
    id: "procedural",
    title: "Procedural Speech Sequence Task",
    category: "Executive Function & Assembly Logic",
    description: "Assesses step-by-step logic, sequence planning, and semantic structure.",
    instructions: "Describe the exact, step-by-step manual sequence of how to safely brew a standard cup of hot black tea, or change a flat tire. Assume you are explaining this to an automated system that needs precise instructions.",
    stimulusPrompt: "Explain the step-by-step procedural sequence block of brewing hot tea or performing a structured daily chore.",
    suggestedDurationSeconds: 60,
  },
  {
    id: "free-talk",
    title: "Unstructured Conversational Speech",
    category: "Naturalistic Language Screening",
    description: "Evaluates casual verbal patterns, speech velocities, and subconscious linguistic disfluencies.",
    instructions: "Simply share your thoughts on what you have been doing today, what your hobbies are, or talk about a recent book or movie you thoroughly enjoyed. Keep the conversation natural.",
    stimulusPrompt: "Talk naturally for 1 to 2 minutes about your day, hobbies, or general preferences.",
    suggestedDurationSeconds: 120,
  }
];

export const DIAGNOSTIC_SAMPLES: DiagnosticSpeechSample[] = [
  {
    id: "healthy-control",
    caseName: "Healthy Control (Age 75) - Linear description",
    age: 75,
    label: "Healthy / Age-Appropriate",
    taskType: "cookie-theft",
    snippet: "Well, I see a kitchen. The mother is drying dishes beside a sink, but she's distracted, and the water is overflowing...",
    fullTranscript: "Well, I can see a kitchen with several things going on. In the center, there is a mother drying dishes beside a sink, but she seems quite distracted looking out the open window, because the water is overflowing onto her feet and the floor. Meanwhile, on the left side, there's a boy who has climbed up onto a three-legged stool to steal cookies from the cookie jar on the top shelf, but the stool is tipping over to the right. He's handing one of the cookies down to his sister, who is laughing and reaching up to receive it.",
    estimatedPauses: 2,
    notes: "High lexical richness, precise nouns used, structured compound sentences, no word-finding hesitation or repetitive pronoun substitutions."
  },
  {
    id: "early-mci",
    caseName: "Mild Cognitive Impairment (Age 79) - Early struggles",
    age: 79,
    label: "Mild Cognitive Impairment (MCI)",
    taskType: "cookie-theft",
    snippet: "There is... um, a lady. She is washing the, uh, things in the water sink, but the water is spilling out...",
    fullTranscript: "Okay, let's see. There is... um, a lady or mother. She is washing the, uh, things in the water sink, but she is looking out there, and the water is spilling onto the... onto the floor. Beside her, there are two young children, or rather, there is a boy on a... on a stool, but it is tipping over, yes, it looks very wobbly. He is reaching inside of the jar on the high shelf to get those... those round cakes, or cookies, yes, cookies. He is giving one to the little girl who is standing there holding her hand up.",
    estimatedPauses: 8,
    notes: "Noticeable word-finding pauses (e.g., 'washing the, uh, things'), minor circumlocution ('round cakes' instead of 'cookies' initially), moderate sentence simplicity."
  },
  {
    id: "alzheimers-ad",
    caseName: "Probable Early Alzheimer's (Age 83) - Semantic erosion",
    age: 83,
    label: "Potential Early-Stage Cognitive Decline",
    taskType: "cookie-theft",
    snippet: "And this helper is, oh, he is on that thing... the round stool, and it's tipping over. He is taking that thing...",
    fullTranscript: "And this helper is, oh, he is on that thing... the round stool, and it is tipping over, it's falling. He is taking that thing there, the round thing, the food from the glass thing. He is reaching to get some, sneak some, and he's giving it to that one... the other child, the girl. And she is waiting for it. And she is laughing, see, because they're taking it. And the water is spilling, oh dear, from the tub. The lady is standing there doing that... doing the wiping, but she doesn't see it spilling. The window is open, she's clean, but she's not looking.",
    estimatedPauses: 14,
    notes: "Pronoun-to-noun ratio is highly elevated. Frequent replacements of concrete nouns ('stool', 'cookie jar', 'cookie', 'sink') with vague terms ('that thing', 'the glass thing', 'tub', 'round thing'). Heavy circumlocution and repetitive syntactic clauses."
  },
  {
    id: "fluency-healthy",
    caseName: "Healthy Category Fluency - Diverse semantic clustering",
    age: 72,
    label: "Healthy / Age-Appropriate",
    taskType: "verbal-fluency",
    snippet: "Dog, cat, horse, cow, pig, sheep. Then wild ones: lion, tiger, bear, giraffe, elephant...",
    fullTranscript: "Dog, cat, horse, cow, pig, sheep. Then wild ones: lion, tiger, bear, giraffe, elephant, monkey, zebra. Aquatic ones: dolphin, whale, shark, sea otter. Birds: eagle, hawk, sparrow, robin.",
    estimatedPauses: 1,
    notes: "Excellent retrieval. Clear evidence of semantic clustering (domestic -> wild -> aquatic -> birds). Total of 21 unique animal concepts with minimal cognitive delay."
  },
  {
    id: "fluency-dementia",
    caseName: "Dementia Category Fluency - Rigid repetition & word-struggling",
    age: 81,
    label: "Potential Early-Stage Cognitive Decline",
    taskType: "verbal-fluency",
    snippet: "Dog, cat, mouse... a dog... um... horse... what is the large gray one with the big nose? ...um... elephant...",
    fullTranscript: "Dog, cat, mouse. A dog... yes. Um... horse. And... what else is there... what is the large gray one with the big nose? Yes, a camel, no, animal with a big trunk, an elephant, yes, elephant. And... dog. Did I say dog? Yes. Um... kitty cat, dog, monkey.",
    estimatedPauses: 9,
    notes: "Severe retrieval slowing (9 pauses). Word repetition ('dog' named thrice, 'cat'/'kitty cat' named twice). Highly simplified vocabulary, semantic searching indicators ('animal with a big trunk'). Total of only 5 unique words in 30 seconds."
  }
];

export const INITIAL_PATIENT_HISTORY: PatientSessionHistory[] = [
  {
    sessionId: "Session 01",
    dateString: "2025-07-15",
    daysAgo: 310,
    wordRetrievalSpeedWpm: 125,
    sentenceComplexityScore: 92,
    pausesCount: 1,
    lexicalRichnessTtr: 0.58,
    cognitiveDeclineLikelihood: 12,
    generalNotes: "Patient NM-9942-B demonstrates fluent narrative sequencing, high lexical variability, and clear syntactic hierarchy during free narrative recall.",
    observedBiomarkers: []
  },
  {
    sessionId: "Session 02",
    dateString: "2025-10-18",
    daysAgo: 215,
    wordRetrievalSpeedWpm: 112,
    sentenceComplexityScore: 88,
    pausesCount: 3,
    lexicalRichnessTtr: 0.53,
    cognitiveDeclineLikelihood: 21,
    generalNotes: "Slight hesitation before complex nouns. Grammatical structures remain fully sound and intact.",
    observedBiomarkers: ["Hesitation / Micro-pauses"]
  },
  {
    sessionId: "Session 03",
    dateString: "2026-02-05",
    daysAgo: 105,
    wordRetrievalSpeedWpm: 94,
    sentenceComplexityScore: 74,
    pausesCount: 7,
    lexicalRichnessTtr: 0.44,
    cognitiveDeclineLikelihood: 48,
    generalNotes: "Clear emergence of noun vocabulary limitations. Mild pronoun substitutions noticed over target clinical picture details.",
    observedBiomarkers: ["Hesitation / Micro-pauses", "Noun Anomia / Vague Sub", "Syntactic Simplification"]
  },
  {
    sessionId: "Session 04",
    dateString: "2026-05-20",
    daysAgo: 0,
    wordRetrievalSpeedWpm: 78,
    sentenceComplexityScore: 58,
    pausesCount: 14,
    lexicalRichnessTtr: 0.38,
    cognitiveDeclineLikelihood: 72,
    generalNotes: "Moderate cognitive-linguistic deterioration with marked noun seeking circumlocutions. Substantial drop in overall lexical density.",
    observedBiomarkers: ["Hesitation / Micro-pauses", "Noun Anomia / Vague Sub", "Syntactic Simplification", "Repetitive Phrasing / Loop"]
  }
];
