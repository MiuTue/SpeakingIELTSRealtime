import { bandGuardrails } from "@/lib/ielts/bandDescriptors";
import {
  buildPlannedQuestions,
  type PlannedQuestion,
  type PracticeMode
} from "@/lib/ielts/sessionMachine";
import {
  AUDIO_ANALYSIS_VERSION,
  formatSpeakingBandAnchors,
  IELTS_SPEAKING_RUBRIC_VERSION,
  SCORING_SCHEMA_VERSION,
  scoringGuardrails
} from "@/lib/scoring/rubric";

type PromptInput = {
  mode: string;
  part?: string;
  topic: string;
  targetBand: number;
};

const behavior = [
  "You are a professional, friendly IELTS Speaking examiner.",
  "You control the live IELTS Speaking flow after the app starts the session.",
  "The app will not send individual questions after the session starts. Ask the next examiner prompt yourself after each candidate answer.",
  "Ask exactly one examiner prompt per speaking turn, then stop speaking immediately and wait for the candidate's response.",
  "Use the provided question plan in order. You may lightly adapt wording for natural examiner delivery, but do not skip ahead, repeat a prompt, or ask multiple questions in one turn.",
  "Keep your speaking turns short and direct. Do not give scores, corrections, or detailed feedback during the conversation.",
  "Use natural examiner language and low-latency conversation.",
  "CRITICAL: You must ONLY speak the examiner's part. Under no circumstances should you answer the question yourself, simulate the candidate's response, or write/speak both sides of the dialogue.",
  "CRITICAL: Never repeat a prompt just because the app UI may still be updating. Continue the test naturally from the candidate's latest answer."
];

export function buildRealtimeInstructions(input: PromptInput) {
  const modeGuide = getModeGuide(input.mode, input.topic);
  const questionPlan = formatQuestionPlan(buildPlannedQuestions(input.mode as PracticeMode, input.topic));

  return [
    ...behavior,
    `Mode: ${input.mode}. Current part: ${input.part ?? "PART1"}.`,
    `Topic: ${input.topic}. Learner target band: ${input.targetBand}.`,
    modeGuide,
    "When all prompts for the selected mode have been completed, say: \"That is the end of the speaking test. Thank you.\" Then stop.",
    "Question plan:",
    questionPlan,
    "When the learner interrupts, stop speaking and listen."
  ].join("\n");
}

export function buildEvaluatorPrompt(input: PromptInput & { question: string }) {
  return [
    "You are a calibrated IELTS Speaking evaluator. Score conservatively from observable evidence.",
    `Mode: ${input.mode}. Part: ${input.part}. Topic: ${input.topic}.`,
    `Assessment scope: ${input.question}`,
    `Rubric version: ${IELTS_SPEAKING_RUBRIC_VERSION}. Audio analysis version: ${AUDIO_ANALYSIS_VERSION}. Schema version: ${SCORING_SCHEMA_VERSION}.`,
    "First select one whole-number descriptor band for each of the four criteria independently. The application will calculate the equally weighted overall score.",
    "Never infer a higher score from effort, confidence, accent type, topic knowledge, or the learner's desired score.",
    "For every criterion, cite concrete evidence from a turn, transcript excerpt, audio behavior, or supplied metric. Do not invent phoneme errors or exact pauses that are not observable.",
    "Treat attached audio as the primary evidence for what was spoken and the transcript as a supporting aid. Do not penalize a likely transcription error as a language error.",
    "Every mistake correction must quote an actual learner phrase. Do not fabricate an error merely to fill the mistakes array.",
    "The better answer must answer one of the actual examiner questions, preserve the learner's main ideas where possible, and model performance about 0.5 band above the observed level.",
    "Coaching must be specific and actionable, preferably referencing a turn or repeated pattern rather than generic advice.",
    "Return a two-layer report: concise IELTS-style feedback plus detailed coaching.",
    "For FULL_TEST, include Part 1, Part 2, and Part 3 diagnostics when evidence exists, but do not describe them as official IELTS part band scores.",
    "For pronunciation, use audio evidence when available. If audio is unavailable, explicitly state that pronunciation is limited/estimated.",
    "For fluency, use transcript development and local metrics such as WPM, pause ratio, long pauses, and speech coverage when provided.",
    "Official descriptor anchors, paraphrased for calibration:",
    formatSpeakingBandAnchors(),
    ...bandGuardrails,
    ...scoringGuardrails,
    "Return only JSON matching the requested schema."
  ].join("\n");
}

function getModeGuide(mode: string, topic: string) {
  if (mode === "PART2") {
    return `Part 2: present one cue card about "${topic}", allow preparation, then invite a 1-2 minute answer without interrupting.`;
  }

  if (mode === "PART3") {
    return `Part 3: ask abstract discussion questions about "${topic}" and follow up based on the learner answer, one prompt per turn.`;
  }

  if (mode === "FULL_TEST") {
    return "Full test: move from identity check to Part 1, Part 2, and Part 3 in order. Do not ask the next part until the candidate has answered the current prompt.";
  }

  return `Part 1: ask short, personal, natural questions about "${topic}", one prompt per turn.`;
}

function formatQuestionPlan(questions: PlannedQuestion[]) {
  if (questions.length === 0) {
    return "- PART1: Ask a short, personal IELTS Speaking question.";
  }

  return questions
    .map((question, index) => {
      const prompt = question.cueCard ?? question.question;
      return `${index + 1}. ${question.part}: ${prompt}`;
    })
    .join("\n");
}
