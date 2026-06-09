import { AudioRecorder } from "@/lib/realtime/audioRecorder";
import { AudioStreamer } from "@/lib/realtime/audioStreamer";
import { TypedEmitter } from "@/lib/realtime/emitter";
import {
  combineInt16Chunks,
  computeAudioMetrics,
  encodeWavBase64
} from "@/lib/scoring/audioMetrics";
import {
  createRealtimeLog,
  type RealtimeEventPayloads
} from "@/lib/realtime/realtimeEvents";
import {
  buildGeminiLiveSetup,
  USER_SILENCE_DURATION_MS,
  type RealtimeSessionInput
} from "@/lib/realtime/sessionConfig";

type ClientEvents = RealtimeEventPayloads;

type ConnectOptions = RealtimeSessionInput;
const INPUT_SAMPLE_RATE = 16000;

type GeminiServerMessage = {
  setupComplete?: unknown;
  serverContent?: {
    modelTurn?: {
      parts?: Array<{
        inlineData?: {
          data?: string;
        };
      }>;
    };
    interrupted?: boolean;
    turnComplete?: boolean;
    inputTranscription?: {
      text?: string;
    };
    outputTranscription?: {
      text?: string;
    };
  };
};

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function readWebSocketMessageData(data: MessageEvent["data"]): Promise<string> {
  if (typeof data === "string") return data;
  if (data instanceof Blob) return data.text();
  if (data instanceof ArrayBuffer) return new TextDecoder().decode(data);
  if (ArrayBuffer.isView(data)) return new TextDecoder().decode(data as Uint8Array);
  return String(data);
}

export class GeminiLiveClient extends TypedEmitter<ClientEvents> {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private recorder = new AudioRecorder();
  private streamer = new AudioStreamer();
  private acceptingUserAudio = false;
  private transcriptBuffer = "";
  private examinerTranscriptBuffer = "";
  private transcriptDoneTimer: number | null = null;
  private userSpeechActive = false;
  private candidateAudioChunks: Int16Array[] = [];

  connect(options: ConnectOptions): Promise<void> {
    return new Promise(async (resolve, reject) => {
      this.emit("log", createRealtimeLog("connect.start", "system", options));

      try {
        await this.streamer.unlock();

        // 1. Get ephemeral token from backend
        const sessionResponse = await fetch("/api/realtime/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(options)
        });

        if (!sessionResponse.ok) {
          const errorMsg = await sessionResponse.text();
          reject(new Error(`Failed to provision Gemini realtime session: ${errorMsg}`));
          return;
        }

        const { token, isRawKey } = (await sessionResponse.json()) as {
          token?: string;
          isRawKey?: boolean;
        };

        if (!token) {
          reject(new Error("Gemini realtime session did not return an auth token."));
          return;
        }

        // 2. Establish WebSocket connection
        const encodedToken = encodeURIComponent(token);
        const wsUrl = isRawKey
          ? `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${encodedToken}`
          : `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${encodedToken}`;
        const ws = new WebSocket(wsUrl);
        ws.binaryType = "arraybuffer";
        this.ws = ws;

        ws.onopen = () => {
          this.emit("log", createRealtimeLog("ws.open", "system"));

          // Send setup config
          const setupMessage = buildGeminiLiveSetup(options);
          ws.send(JSON.stringify(setupMessage));
          this.emit("log", createRealtimeLog("setup", "client", setupMessage));
        };

        ws.onerror = (event) => {
          console.error("Gemini Live WebSocket error:", event);
          const err = new Error("Gemini Live connection error");
          this.emit("error", err);
          reject(err);
        };

        ws.onclose = (event) => {
          this.emit("log", createRealtimeLog("ws.close", "system", event));
          this.emit("disconnected", undefined);
        };

        ws.onmessage = async (messageEvent) => {
          try {
            const messageText = await readWebSocketMessageData(messageEvent.data);
            const data = JSON.parse(messageText) as GeminiServerMessage;
            this.emit("log", createRealtimeLog(data.serverContent ? "serverContent" : "serverEvent", "server", data));

            // Handle Setup Complete
            if (data.setupComplete) {
              this.emit("connected", undefined);

              // Start capturing mic audio once setup is complete
              await this.startAudioCapture();
              resolve();
            }

            // Handle Server Content (Audio output)
            if (data.serverContent) {
              const { modelTurn, interrupted, turnComplete, inputTranscription, outputTranscription } = data.serverContent;

              if (interrupted) {
                this.streamer.clearQueue();
                this.clearExaminerTranscriptBuffer();
                this.acceptingUserAudio = true;
                this.emit("interrupted", undefined);
              }

              if (inputTranscription?.text) {
                this.handleInputTranscription(inputTranscription.text);
              }

              if (outputTranscription?.text) {
                this.handleOutputTranscription(outputTranscription.text);
              }

              if (modelTurn?.parts) {
                for (const part of modelTurn.parts) {
                  if (part.inlineData?.data) {
                    this.handleModelOutputStarted();
                    // Audio data from model is 24kHz PCM
                    const base64Data = part.inlineData.data;
                    const binaryString = atob(base64Data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                      bytes[i] = binaryString.charCodeAt(i);
                    }
                    this.emit("log", createRealtimeLog("audio.output", "server", { bytes: bytes.byteLength }));
                    await this.streamer.addPCM16(bytes);
                    this.emit("examiner_speaking", undefined);
                  }
                }
              }

              if (turnComplete) {
                const examinerTranscript = this.flushExaminerTranscript();
                if (examinerTranscript) {
                  this.emit("examiner_turn_done", { transcript: examinerTranscript });
                }
                this.acceptingUserAudio = true;
                this.emit("response_done", undefined);
                this.emit("listening", undefined);
              }
            }
          } catch (error) {
            console.error("Error parsing Gemini WebSocket message:", error);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private async startAudioCapture() {
    try {
      const stream = await this.recorder.start();

      // Resample microphone audio directly to 16kHz
      const audioContext = new AudioContext({ sampleRate: INPUT_SAMPLE_RATE });
      this.audioContext = audioContext;

      this.source = audioContext.createMediaStreamSource(stream);
      this.processor = audioContext.createScriptProcessor(2048, 1, 1);

      this.source.connect(this.processor);
      this.processor.connect(audioContext.destination);

      this.processor.onaudioprocess = (e) => {
        if (!this.acceptingUserAudio) return;

        const inputData = e.inputBuffer.getChannelData(0);

        // Convert Float32Array (-1.0 to 1.0) to 16-bit PCM (Int16Array)
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        this.candidateAudioChunks.push(pcm16);

        const base64 = bufferToBase64(pcm16.buffer);

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          const message = {
            realtimeInput: {
              audio: {
                mimeType: "audio/pcm;rate=16000",
                data: base64
              }
            }
          };
          this.ws.send(JSON.stringify(message));
        }
      };
    } catch (error) {
      console.error("Failed to start audio capture:", error);
      this.emit("error", error instanceof Error ? error : new Error("Failed to start microphone"));
    }
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;

    this.processor?.disconnect();
    this.source?.disconnect();
    if (this.audioContext) {
      void this.audioContext.close();
    }
    this.processor = null;
    this.source = null;
    this.audioContext = null;

    this.recorder.stop();
    this.streamer.clearQueue();
    this.clearTranscriptBuffer();
    this.clearExaminerTranscriptBuffer();
    this.clearCandidateAudioBuffer();
    this.acceptingUserAudio = false;
    this.emit("disconnected", undefined);
  }

  interrupt() {
    this.streamer.clearQueue();
    this.clearExaminerTranscriptBuffer();
    this.clearCandidateAudioBuffer();
    this.acceptingUserAudio = true;
    this.emit("interrupted", undefined);
  }

  setMuted(muted: boolean) {
    this.recorder.setMuted(muted);
  }

  getVolume() {
    return this.recorder.readVolume();
  }

  startExam() {
    this.acceptingUserAudio = false;
    this.clearTranscriptBuffer();
    this.clearExaminerTranscriptBuffer();
    this.clearCandidateAudioBuffer();

    this.sendRealtimeText(
      "Begin the IELTS Speaking session now. Ask only the first examiner prompt from the plan, then stop speaking and wait for the candidate.",
      "exam.start"
    );
  }

  askQuestion(question: string, cueCard?: string) {
    this.acceptingUserAudio = false;
    this.clearTranscriptBuffer();
    this.clearCandidateAudioBuffer();

    const text = cueCard
      ? `Read the following Cue Card prompt word-for-word, exactly as written. Do NOT add any extra greetings, transitions, or conversational filler words:\n\n${cueCard}`
      : `Ask the candidate the following question word-for-word, exactly as written. Do NOT add any extra greetings, transitions, or conversational filler words:\n\n${question}`;

    this.sendRealtimeText(text, "realtimeInput.text");
  }

  private sendRealtimeText(text: string, logType: string) {
    const message = {
      realtimeInput: {
        text
      }
    };
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      this.emit("log", createRealtimeLog(logType, "client", message));
    }
  }

  private handleInputTranscription(text: string) {
    if (!this.acceptingUserAudio) {
      this.emit("log", createRealtimeLog("transcript.ignored", "server", { reason: "examiner_speaking" }));
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) return;

    if (!this.userSpeechActive) {
      this.userSpeechActive = true;
      this.emit("user_speech_started", undefined);
    }

    const delta = this.transcriptBuffer ? ` ${trimmed}` : trimmed;
    this.transcriptBuffer += delta;
    this.emit("transcript_delta", { delta });

    this.clearTranscriptTimer();
    this.transcriptDoneTimer = window.setTimeout(() => {
      this.flushInputTranscript();
    }, USER_SILENCE_DURATION_MS);
  }

  private handleOutputTranscription(text: string) {
    this.handleModelOutputStarted();

    const trimmed = text.trim();
    if (!trimmed) return;

    this.examinerTranscriptBuffer += this.examinerTranscriptBuffer ? ` ${trimmed}` : trimmed;
    this.emit("log", createRealtimeLog("examiner.transcript", "server", { text: trimmed }));
  }

  private handleModelOutputStarted() {
    this.acceptingUserAudio = false;
    this.flushInputTranscript();
    this.emit("examiner_speaking", undefined);
  }

  private flushInputTranscript() {
    this.clearTranscriptTimer();
    const transcript = this.transcriptBuffer.trim();
    this.transcriptBuffer = "";

    if (this.userSpeechActive) {
      this.userSpeechActive = false;
      this.emit("user_speech_stopped", undefined);
    }

    if (transcript) {
      this.emit("transcript_done", {
        transcript,
        audio: this.buildCandidateAudio(transcript)
      });
    } else {
      this.clearCandidateAudioBuffer();
    }
  }

  private flushExaminerTranscript() {
    const transcript = this.examinerTranscriptBuffer.trim();
    this.examinerTranscriptBuffer = "";
    return transcript;
  }

  private clearTranscriptTimer() {
    if (this.transcriptDoneTimer !== null) {
      window.clearTimeout(this.transcriptDoneTimer);
      this.transcriptDoneTimer = null;
    }
  }

  private clearTranscriptBuffer() {
    this.clearTranscriptTimer();
    this.transcriptBuffer = "";
    this.userSpeechActive = false;
  }

  private clearExaminerTranscriptBuffer() {
    this.examinerTranscriptBuffer = "";
  }

  private buildCandidateAudio(transcript: string) {
    if (this.candidateAudioChunks.length === 0) return undefined;

    const samples = combineInt16Chunks(this.candidateAudioChunks);
    this.clearCandidateAudioBuffer();
    if (samples.length === 0) return undefined;

    const metrics = computeAudioMetrics(samples, INPUT_SAMPLE_RATE, transcript);
    return {
      mimeType: "audio/wav" as const,
      data: encodeWavBase64(samples, INPUT_SAMPLE_RATE),
      sampleRate: INPUT_SAMPLE_RATE,
      durationMs: metrics.durationMs,
      metrics
    };
  }

  private clearCandidateAudioBuffer() {
    this.candidateAudioChunks = [];
  }
}
