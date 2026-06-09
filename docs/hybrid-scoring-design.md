# Hybrid IELTS Speaking Scoring Design

## Understanding Summary

- Build a hybrid IELTS Speaking scoring pipeline that uses transcript plus candidate audio.
- The goal is to score all four IELTS Speaking criteria more credibly: Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, and Pronunciation.
- The feature is for IELTS practice users who need both a band estimate and coaching on how to speak better.
- Transcript evidence is used mainly for grammar, vocabulary, coherence, and content organization.
- Audio evidence is used for pronunciation, intelligibility, stress, rhythm, intonation, pause behavior, and delivery fluency.
- Full Test reports include Part 1, Part 2, and Part 3 diagnostics, but only the overall score is presented as the main IELTS-style estimate.
- Practice modes are scored after the session ends, not after every answer, so scoring has enough speech sample and does not interrupt speaking flow.

## Assumptions

- Gemini remains the main evaluator for v1, using `gemini-2.5-flash-lite` by default to control cost.
- No dedicated speech service is added in v1.
- Audio is retained temporarily for 24 hours for retry/debug, then cleaned up.
- Report target latency is 5-10 seconds, with an upper bound of about 45 seconds before fallback/retry UI.
- Current expected scale is small: about 1-2 concurrent users.
- Pronunciation and overall bands are AI estimates, not official IELTS results.
- Rubric, prompts, schemas, and scoring rules are versioned in code and covered by tests.

## Non-Goals

- Do not claim to provide an official IELTS score.
- Do not store candidate audio permanently in v1.
- Do not build a large queue/worker infrastructure for the initial 1-2 user scale.
- Do not use part diagnostics as official IELTS part band scores.
- Do not add Google Cloud Speech-to-Text or another dedicated speech service in v1.

## Decision Log

| Decision | Alternatives | Rationale |
| --- | --- | --- |
| Use hybrid transcript + audio scoring. | Transcript-only, audio-first. | Transcript-only cannot reliably score pronunciation/intonation; audio-first is harder to debug. |
| Retain audio temporarily for 24 hours. | No audio retention, long-term audio retention. | Allows retry/debug while limiting privacy and storage risk. |
| Use two feedback layers. | Concise-only, detailed-only. | Default report stays readable while detailed coaching supports pronunciation/fluency practice. |
| For Full Test, score each part diagnostically and aggregate overall. | Overall-only, per-turn scoring. | Helps users identify weak parts while keeping overall as the main IELTS-style estimate. |
| For practice modes, score after session end. | Score each turn, mode-specific scoring. | More stable scoring and less disruption to speaking flow. |
| Use local audio metrics plus Gemini analysis. | Gemini audio-only, dedicated speech service. | Gives objective evidence without adding heavy external speech infrastructure. |
| Target report latency 5-10s, max about 45s. | Hard 10s timeout, unlimited background wait. | Balances quality and user experience. |
| Optimize for 1-2 concurrent users. | Production-scale queueing and storage. | Avoids premature infrastructure complexity. |
| Use versioned rubric + tests. | Single prompt, admin-editable rubric. | Improves debuggability and maintainability without overbuilding. |
| Choose Two-Pass Hybrid Scoring. | Three-pass scoring, single multimodal report. | Best balance of quality, speed, reliability, and maintenance for this app. |

## Recommended Architecture

Use Two-Pass Hybrid Scoring.

1. Capture candidate transcript and candidate audio for each answer or turn.
2. Compute local delivery metrics from the candidate audio/session timing.
3. Send transcript, audio references, metrics, and versioned rubric instructions to Gemini.
4. Validate Gemini structured JSON with Zod.
5. Store the final report and clean up temporary audio within 24 hours.

Local metrics do not directly determine the band. They provide evidence for the evaluator and make fluency/pronunciation feedback more consistent and debuggable.

## Data Flow

1. During live speaking, each turn stores:
   - examiner question
   - candidate transcript
   - speaking part
   - candidate audio reference or blob
   - answer start/end metadata

2. On session end, the app builds a scoring request:
   - mode and topic
   - all turns grouped by part
   - transcript text
   - temporary audio references
   - local audio metrics
   - `rubricVersion`
   - `audioAnalysisVersion`
   - `scoringSchemaVersion`

3. The evaluator sends a structured multimodal request to Gemini.

4. The response is parsed and validated.

5. The UI displays:
   - concise IELTS-style summary
   - estimated overall band
   - four criteria bands
   - part diagnostics
   - detailed coaching
   - pronunciation and fluency observations
   - better phrasing or better sample responses

## Components

### `audioCapture`

Captures only candidate audio, not examiner audio. Audio should be associated with the turn or part it belongs to.

### `audioMetrics`

Computes objective delivery metrics:

- `durationMs`
- `wordCount`
- `estimatedWpm`
- `pauseRatio`
- `longPauseCount`
- `longestPauseMs`
- `speechCoverage`

### `rubric`

Owns versioned IELTS Speaking scoring guidance:

- `IELTS_SPEAKING_RUBRIC_VERSION`
- criteria descriptors summary
- guardrails
- score caps
- aggregation rules
- limitations wording

### `scoringSchema`

Defines Zod schema and Gemini response schema for:

- `overall`
- `criteria.fluency_coherence`
- `criteria.lexical_resource`
- `criteria.grammar_range_accuracy`
- `criteria.pronunciation`
- `partDiagnostics`
- `audioAnalysis`
- `conciseFeedback`
- `detailedCoaching`
- `betterResponses`
- `metadata`

### `evaluator`

Builds the Gemini request from transcript, audio, metrics, and rubric versions. It validates the response and applies fallback behavior when needed.

### `audioRetention`

Stores audio temporarily and performs best-effort cleanup after scoring or after 24 hours.

## Error Handling

Scoring status should be explicit:

- `queued`
- `analyzing_audio`
- `scoring_with_rubric`
- `completed`
- `completed_with_audio_timeout`
- `failed`

If Gemini times out, returns 429, or has temporary 5xx errors, retry with light backoff inside the 45s limit.

If audio analysis exceeds 45s:

- return a transcript-first report when possible
- mark `audioAnalysis.status = "timeout"`
- clearly state pronunciation/audio limitations
- offer a retry audio analysis action

If structured output is invalid:

- validate with Zod
- retry once with a stricter JSON-only repair prompt
- if still invalid, show retryable scoring error

Audio cleanup failures should be logged but should not block the transcript report.

## Testing Strategy

### Schema Tests

- Valid reports parse successfully.
- Missing required fields fail.
- Bands outside 0-9 fail.
- Criteria without evidence or limitations fail.

### Rubric Guardrail Tests

- Very short answers cap fluency/coherence appropriately.
- Transcript-only fallback marks pronunciation as limited or estimated.
- Full Test includes part diagnostics but does not call them official IELTS part bands.
- All four IELTS criteria are always present.

### Audio Metrics Tests

- Mock speech/silence segments produce expected duration, WPM, pause ratio, long pause count, and speech coverage.
- Empty or near-empty audio produces safe fallback metrics.

### Evaluator Integration Tests

- Mock successful Gemini structured response.
- Mock timeout and transcript-first fallback.
- Mock invalid JSON and repair retry.
- Mock audio upload/delete failures and best-effort cleanup.

## Risks

- Gemini audio analysis can be inconsistent; metrics and Zod validation reduce but do not remove this risk.
- Pronunciation estimates are not official IELTS examiner judgments.
- Audio storage creates privacy risk, mitigated by 24h retention and no long-term storage.
- Full Test audio may be long enough to increase latency or hit rate/token limits.

## References

- IELTS Speaking Band Descriptors: https://ielts.org/cdn/ielts-guides/ielts-speaking-band-descriptors.pdf
- IELTS Speaking Key Assessment Criteria: https://ielts.org/cdn/ielts-guides/ielts-speaking-key-assessment-criteria.pdf
- IELTS Speaking format: https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-speaking
- Gemini audio understanding: https://ai.google.dev/gemini-api/docs/audio
- Gemini structured output: https://ai.google.dev/gemini-api/docs/structured-output
- Gemini Files API: https://ai.google.dev/api/files
