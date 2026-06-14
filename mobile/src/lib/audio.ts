import { Buffer } from "buffer";

export type CandidateAudio = {
  mimeType: "audio/wav";
  data: string;
  sampleRate: number;
  durationMs: number;
  metrics: {
    durationMs: number;
    wordCount: number;
    estimatedWpm: number;
    pauseRatio: number;
    longPauseCount: number;
    longestPauseMs: number;
    speechCoverage: number;
  };
};

const INPUT_SAMPLE_RATE = 16_000;

export function combinePCMChunks(chunks: Uint8Array[]) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

export function resamplePCM16(
  input: Uint8Array,
  inputRate: number,
  outputRate: number
) {
  if (inputRate === outputRate) return input;
  const source = new Int16Array(
    input.buffer,
    input.byteOffset,
    Math.floor(input.byteLength / 2)
  );
  const outputLength = Math.floor(source.length * (outputRate / inputRate));
  const output = new Int16Array(outputLength);
  const ratio = inputRate / outputRate;

  for (let index = 0; index < outputLength; index += 1) {
    const sourcePosition = index * ratio;
    const left = Math.floor(sourcePosition);
    const right = Math.min(left + 1, source.length - 1);
    const fraction = sourcePosition - left;
    output[index] = Math.round(
      source[left] * (1 - fraction) + source[right] * fraction
    );
  }
  return new Uint8Array(output.buffer);
}

export function buildCandidateAudio(
  chunks: Uint8Array[],
  transcript: string
): CandidateAudio | undefined {
  const pcm = combinePCMChunks(chunks);
  if (!pcm.byteLength) return undefined;
  const samples = new Int16Array(
    pcm.buffer,
    pcm.byteOffset,
    Math.floor(pcm.byteLength / 2)
  );
  const durationMs = Math.round((samples.length / INPUT_SAMPLE_RATE) * 1000);
  const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
  const estimatedWpm =
    durationMs > 0 ? Math.round(wordCount / (durationMs / 60_000)) : 0;
  const windowSize = Math.max(1, Math.floor(INPUT_SAMPLE_RATE * 0.05));
  let silentWindows = 0;
  let currentSilentMs = 0;
  let longestPauseMs = 0;
  let longPauseCount = 0;

  for (let offset = 0; offset < samples.length; offset += windowSize) {
    let energy = 0;
    const end = Math.min(offset + windowSize, samples.length);
    for (let index = offset; index < end; index += 1) {
      const normalized = samples[index] / 32768;
      energy += normalized * normalized;
    }
    const rms = Math.sqrt(energy / Math.max(end - offset, 1));
    if (rms < 0.015) {
      silentWindows += 1;
      currentSilentMs += 50;
    } else if (currentSilentMs) {
      if (currentSilentMs >= 600) longPauseCount += 1;
      longestPauseMs = Math.max(longestPauseMs, currentSilentMs);
      currentSilentMs = 0;
    }
  }
  if (currentSilentMs) {
    if (currentSilentMs >= 600) longPauseCount += 1;
    longestPauseMs = Math.max(longestPauseMs, currentSilentMs);
  }
  const windowCount = Math.ceil(samples.length / windowSize);
  const pauseRatio = windowCount ? silentWindows / windowCount : 0;
  const metrics = {
    durationMs,
    wordCount,
    estimatedWpm,
    pauseRatio,
    longPauseCount,
    longestPauseMs,
    speechCoverage: 1 - pauseRatio
  };

  return {
    mimeType: "audio/wav",
    data: encodeWav(pcm, INPUT_SAMPLE_RATE),
    sampleRate: INPUT_SAMPLE_RATE,
    durationMs,
    metrics
  };
}

function encodeWav(pcm: Uint8Array, sampleRate: number) {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + pcm.byteLength, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, pcm.byteLength, true);
  return Buffer.concat([Buffer.from(header), Buffer.from(pcm)]).toString("base64");
}

function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}
