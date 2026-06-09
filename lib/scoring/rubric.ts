export const IELTS_SPEAKING_RUBRIC_VERSION = "ielts-speaking-rubric-v2";
export const AUDIO_ANALYSIS_VERSION = "audio-analysis-v2";
export const SCORING_SCHEMA_VERSION = "speaking-feedback-v3";

export const scoringGuardrails = [
  "This is an IELTS Speaking estimate, not an official IELTS result.",
  "Score all four criteria: Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, and Pronunciation.",
  "Use the whole speaking sample for the overall band, especially in FULL_TEST mode.",
  "Part diagnostics are practice diagnostics only and must not be described as official IELTS part bands.",
  "If audio is missing or timed out, pronunciation must clearly state the limitation.",
  "Use transcript evidence for vocabulary, grammar, coherence, and corrections.",
  "Use audio evidence and local metrics for delivery fluency, pauses, rhythm, stress, intonation, and intelligibility.",
  "Do not overestimate very short answers, memorized-sounding answers, or answers with weak development.",
  "Assign one whole-number descriptor band to each criterion before calculating the overall score.",
  "Do not use the learner's target band as evidence or as an anchor for any criterion score.",
  "A higher band requires the positive features of that descriptor to be sustained, not merely attempted once."
];

export const speakingBandAnchors = {
  fluency_coherence: [
    "Band 9: effortless, coherent and appropriately extended speech; hesitation is almost entirely content planning.",
    "Band 8: fluent and coherent across topics; only occasional language-search hesitation or self-correction.",
    "Band 7: sustains long turns without noticeable effort; some hesitation or repair occurs but coherence remains intact.",
    "Band 6: willing and able to speak at length, though hesitation, repetition or repair sometimes weakens coherence.",
    "Band 5: usually keeps going through slow speech, repetition or self-correction; complex ideas often disrupt fluency.",
    "Band 4: noticeable pauses, slow delivery and frequent repetition or repair; coherence breaks down at times."
  ],
  lexical_resource: [
    "Band 9: precise, flexible and natural vocabulary, including sustained idiomatic use in all contexts.",
    "Band 8: wide and flexible resource with effective paraphrase; occasional word-choice or collocation slips.",
    "Band 7: flexible vocabulary across varied topics, some less-common or idiomatic language, and effective paraphrase.",
    "Band 6: enough vocabulary to discuss topics at length; meaning remains clear despite some inappropriate choices.",
    "Band 5: adequate for familiar and unfamiliar topics but limited flexibility; paraphrase has mixed success.",
    "Band 4: basic resource mainly for familiar topics; frequent word-choice errors and little paraphrase."
  ],
  grammar_range_accuracy: [
    "Band 9: a full range of structures used precisely, with only native-like slips.",
    "Band 8: a wide flexible range; most sentences are error-free and remaining errors are non-systematic.",
    "Band 7: varied simple and complex structures; error-free sentences are frequent despite some persistent errors.",
    "Band 6: a mix of short and complex forms with limited flexibility; complex-form errors rarely block meaning.",
    "Band 5: basic forms are reasonably controlled; complex attempts are limited and usually contain errors.",
    "Band 4: short repetitive basic structures, rare subordination and frequent errors."
  ],
  pronunciation: [
    "Band 9: full and sustained control of phonological features; effortless intelligibility throughout.",
    "Band 8: wide control of rhythm, stress, intonation and connected speech; easy to understand despite occasional lapses.",
    "Band 7: all positive Band 6 features plus some Band 8 features, but advanced control is not fully sustained.",
    "Band 6: generally understandable; variable control of rhythm, stress and intonation with occasional clarity loss.",
    "Band 5: some effective features but inconsistent control; listener effort or clarity problems occur more often.",
    "Band 4: limited feature range, frequent rhythm/stress/intonation lapses and mispronunciation that requires listener effort."
  ]
} as const;

export function formatSpeakingBandAnchors() {
  return Object.entries(speakingBandAnchors)
    .map(([criterion, anchors]) => `${criterion}:\n${anchors.map((anchor) => `- ${anchor}`).join("\n")}`)
    .join("\n\n");
}
