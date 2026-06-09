export type AudioMetrics = {
  durationMs: number;
  wordCount: number;
  estimatedWpm: number;
  pauseRatio: number;
  longPauseCount: number;
  longestPauseMs: number;
  speechCoverage: number;
};

export type CandidateTurnAudio = {
  mimeType: "audio/wav";
  data: string;
  sampleRate: number;
  durationMs: number;
  metrics: AudioMetrics;
};

const LONG_PAUSE_MS = 700;
const FRAME_MS = 50;
const MIN_SPEECH_RMS = 180;

export function computeAudioMetrics(samples: Int16Array, sampleRate: number, transcript: string): AudioMetrics {
  const rawDurationMs = samples.length > 0 ? Math.round(samples.length / sampleRate * 1000) : 0;
  const wordCount = countWords(transcript);

  if (samples.length === 0) {
    return {
      durationMs: 0,
      wordCount,
      estimatedWpm: 0,
      pauseRatio: 1,
      longPauseCount: 0,
      longestPauseMs: 0,
      speechCoverage: 0
    };
  }

  const frameSize = Math.max(1, Math.round(sampleRate * FRAME_MS / 1000));
  const frameLevels: number[] = [];

  for (let offset = 0; offset < samples.length; offset += frameSize) {
    const end = Math.min(samples.length, offset + frameSize);
    let squareSum = 0;
    for (let index = offset; index < end; index++) {
      const sample = samples[index] ?? 0;
      squareSum += sample * sample;
    }
    frameLevels.push(Math.sqrt(squareSum / Math.max(1, end - offset)));
  }

  const sortedLevels = [...frameLevels].sort((a, b) => a - b);
  const peakLevel = percentile(sortedLevels, 0.9);
  const lowLevel = percentile(sortedLevels, 0.2);
  const noiseFloor = lowLevel < peakLevel * 0.45 ? lowLevel : 0;
  const speechThreshold = Math.max(MIN_SPEECH_RMS, noiseFloor + (peakLevel - noiseFloor) * 0.18);
  const speechFrames = bridgeShortGaps(frameLevels.map((level) => level >= speechThreshold));
  const firstSpeechFrame = speechFrames.indexOf(true);
  const lastSpeechFrame = speechFrames.lastIndexOf(true);

  if (firstSpeechFrame < 0 || lastSpeechFrame < 0) {
    return {
      durationMs: rawDurationMs,
      wordCount,
      estimatedWpm: rawDurationMs > 0 ? round(wordCount / (rawDurationMs / 60000), 1) : 0,
      pauseRatio: 1,
      longPauseCount: 0,
      longestPauseMs: rawDurationMs,
      speechCoverage: 0
    };
  }

  const activeFrames = speechFrames.slice(firstSpeechFrame, lastSpeechFrame + 1);
  const durationMs = activeFrames.length * FRAME_MS;
  let silentFrames = 0;
  let voicedFrames = 0;
  let currentPauseFrames = 0;
  let longestPauseFrames = 0;
  let longPauseCount = 0;

  for (const speaking of activeFrames) {
    if (!speaking) {
      silentFrames++;
      currentPauseFrames++;
      longestPauseFrames = Math.max(longestPauseFrames, currentPauseFrames);
    } else {
      voicedFrames++;
      const pauseMs = currentPauseFrames * FRAME_MS;
      if (pauseMs >= LONG_PAUSE_MS) longPauseCount++;
      currentPauseFrames = 0;
    }
  }

  const totalFrames = silentFrames + voicedFrames;
  const pauseRatio = totalFrames > 0 ? silentFrames / totalFrames : 1;
  const speechCoverage = totalFrames > 0 ? voicedFrames / totalFrames : 0;
  const estimatedWpm = durationMs > 0 ? round(wordCount / (durationMs / 60000), 1) : 0;

  return {
    durationMs,
    wordCount,
    estimatedWpm,
    pauseRatio: round(pauseRatio, 2),
    longPauseCount,
    longestPauseMs: longestPauseFrames * FRAME_MS,
    speechCoverage: round(speechCoverage, 2)
  };
}

export function combineInt16Chunks(chunks: Int16Array[]) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const combined = new Int16Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }
  return combined;
}

export function encodeWavBase64(samples: Int16Array, sampleRate: number) {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 8 * bytesPerSample, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (const sample of samples) {
    view.setInt16(offset, sample, true);
    offset += bytesPerSample;
  }

  return arrayBufferToBase64(buffer);
}

function countWords(transcript: string) {
  return transcript.trim().split(/\s+/).filter(Boolean).length;
}

function percentile(sortedValues: number[], ratio: number) {
  if (sortedValues.length === 0) return 0;
  const index = Math.min(sortedValues.length - 1, Math.max(0, Math.floor((sortedValues.length - 1) * ratio)));
  return sortedValues[index] ?? 0;
}

function bridgeShortGaps(frames: boolean[]) {
  const bridged = [...frames];
  let index = 0;

  while (index < bridged.length) {
    if (bridged[index]) {
      index++;
      continue;
    }

    const gapStart = index;
    while (index < bridged.length && !bridged[index]) index++;
    const gapLength = index - gapStart;
    const surroundedBySpeech = gapStart > 0 && index < bridged.length && bridged[gapStart - 1] && bridged[index];
    if (surroundedBySpeech && gapLength <= 3) {
      bridged.fill(true, gapStart, index);
    }
  }

  return bridged;
}

function round(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function writeString(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index++) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let index = 0; index < bytes.byteLength; index++) {
    binary += String.fromCharCode(bytes[index] ?? 0);
  }

  if (typeof btoa === "function") return btoa(binary);
  return Buffer.from(bytes).toString("base64");
}
