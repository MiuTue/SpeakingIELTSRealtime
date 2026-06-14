import { Buffer } from "buffer";
import {
  addExpoTwoWayAudioEventListener,
  initialize,
  playPCMData,
  requestMicrophonePermissionsAsync,
  tearDown,
  toggleRecording
} from "@speechmatics/expo-two-way-audio";
import { buildCandidateAudio, resamplePCM16, type CandidateAudio } from "@/lib/audio";

const USER_SILENCE_MS = 1500;

type GeminiSetup = {
  setup: Record<string, unknown>;
};

type ServerMessage = {
  setupComplete?: unknown;
  serverContent?: {
    modelTurn?: {
      parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }>;
    };
    interrupted?: boolean;
    turnComplete?: boolean;
    inputTranscription?: { text?: string };
    outputTranscription?: { text?: string };
  };
};

export type LiveCallbacks = {
  onConnected: () => void;
  onExaminerSpeaking: () => void;
  onExaminerTurn: (transcript: string) => void;
  onListening: () => void;
  onCandidateTranscript: (transcript: string) => void;
  onCandidateTurn: (transcript: string, audio?: CandidateAudio) => void;
  onVolume: (volume: number) => void;
  onDisconnected: () => void;
  onError: (error: Error) => void;
};

export class MobileGeminiLiveClient {
  private websocket: WebSocket | null = null;
  private microphoneSubscription: { remove: () => void } | null = null;
  private volumeSubscription: { remove: () => void } | null = null;
  private acceptingCandidateAudio = false;
  private candidateTranscript = "";
  private examinerTranscript = "";
  private candidateChunks: Uint8Array[] = [];
  private transcriptTimer: ReturnType<typeof setTimeout> | null = null;
  private lastExaminerTurn = "";

  constructor(private readonly callbacks: LiveCallbacks) {}

  async connect(input: {
    websocketUrl: string;
    token: string;
    setup: GeminiSetup;
  }) {
    const permission = await requestMicrophonePermissionsAsync();
    if (!permission.granted) {
      throw new Error("Microphone permission is required for live practice.");
    }
    await initialize();
    this.bindAudioEvents();

    await new Promise<void>((resolve, reject) => {
      const separator = input.websocketUrl.includes("?") ? "&" : "?";
      const websocket = new WebSocket(
        `${input.websocketUrl}${separator}access_token=${encodeURIComponent(input.token)}`
      );
      this.websocket = websocket;

      websocket.onopen = () => {
        websocket.send(JSON.stringify(input.setup));
      };
      websocket.onerror = () => {
        const error = new Error("Gemini Live connection failed.");
        this.callbacks.onError(error);
        reject(error);
      };
      websocket.onclose = () => {
        this.acceptingCandidateAudio = false;
        toggleRecording(false);
        this.callbacks.onDisconnected();
      };
      websocket.onmessage = (event) => {
        void this.handleMessage(event.data, resolve);
      };
    });
  }

  startExam() {
    this.acceptingCandidateAudio = false;
    toggleRecording(false);
    this.sendText(
      "Begin the IELTS Speaking session now. Ask only the first examiner prompt from the plan, then stop speaking and wait for the candidate."
    );
  }

  resumeListening() {
    this.acceptingCandidateAudio = true;
    this.candidateChunks = [];
    toggleRecording(true);
    this.callbacks.onListening();
  }

  setMuted(muted: boolean) {
    toggleRecording(!muted && this.acceptingCandidateAudio);
  }

  disconnect() {
    this.flushCandidateTurn();
    this.acceptingCandidateAudio = false;
    this.clearTranscriptTimer();
    toggleRecording(false);
    this.websocket?.close();
    this.websocket = null;
    this.microphoneSubscription?.remove();
    this.volumeSubscription?.remove();
    this.microphoneSubscription = null;
    this.volumeSubscription = null;
    void tearDown();
  }

  private bindAudioEvents() {
    this.microphoneSubscription?.remove();
    this.volumeSubscription?.remove();
    this.microphoneSubscription = addExpoTwoWayAudioEventListener(
      "onMicrophoneData",
      ({ data }) => {
        if (!this.acceptingCandidateAudio) return;
        const chunk = new Uint8Array(data);
        this.candidateChunks.push(chunk);
        if (this.websocket?.readyState === WebSocket.OPEN) {
          this.websocket.send(
            JSON.stringify({
              realtimeInput: {
                audio: {
                  mimeType: "audio/pcm;rate=16000",
                  data: Buffer.from(chunk).toString("base64")
                }
              }
            })
          );
        }
      }
    );
    this.volumeSubscription = addExpoTwoWayAudioEventListener(
      "onInputVolumeLevelData",
      ({ data }) => this.callbacks.onVolume(data)
    );
  }

  private async handleMessage(data: unknown, setupResolved: () => void) {
    try {
      const text = await readWebSocketData(data);
      const message = JSON.parse(text) as ServerMessage;
      if (message.setupComplete) {
        this.callbacks.onConnected();
        setupResolved();
      }

      const content = message.serverContent;
      if (!content) return;
      if (content.interrupted) {
        this.examinerTranscript = "";
        this.acceptingCandidateAudio = true;
        toggleRecording(true);
        this.callbacks.onListening();
      }
      if (content.inputTranscription?.text && this.acceptingCandidateAudio) {
        this.handleCandidateTranscript(content.inputTranscription.text);
      }
      if (content.outputTranscription?.text) {
        this.handleExaminerOutput(content.outputTranscription.text);
      }
      for (const part of content.modelTurn?.parts ?? []) {
        if (!part.inlineData?.data) continue;
        this.handleModelOutputStarted();
        const pcm24 = Buffer.from(part.inlineData.data, "base64");
        playPCMData(resamplePCM16(pcm24, 24_000, 16_000));
      }
      if (content.turnComplete) {
        const transcript = normalizeTranscript(this.examinerTranscript);
        this.examinerTranscript = "";
        if (transcript && transcript !== this.lastExaminerTurn) {
          this.lastExaminerTurn = transcript;
          this.callbacks.onExaminerTurn(transcript);
        }
        this.acceptingCandidateAudio = true;
        this.candidateChunks = [];
        toggleRecording(true);
        this.callbacks.onListening();
      }
    } catch {
      this.callbacks.onError(new Error("Gemini returned an unreadable message."));
    }
  }

  private handleCandidateTranscript(value: string) {
    const text = value.trim();
    if (!text) return;
    this.candidateTranscript += this.candidateTranscript ? ` ${text}` : text;
    this.callbacks.onCandidateTranscript(this.candidateTranscript);
    this.clearTranscriptTimer();
    this.transcriptTimer = setTimeout(
      () => this.flushCandidateTurn(),
      USER_SILENCE_MS
    );
  }

  private handleExaminerOutput(value: string) {
    this.handleModelOutputStarted();
    const text = value.trim();
    if (text) {
      this.examinerTranscript += this.examinerTranscript ? ` ${text}` : text;
    }
  }

  private handleModelOutputStarted() {
    if (this.acceptingCandidateAudio) this.flushCandidateTurn();
    this.acceptingCandidateAudio = false;
    toggleRecording(false);
    this.callbacks.onExaminerSpeaking();
  }

  private flushCandidateTurn() {
    this.clearTranscriptTimer();
    const transcript = normalizeTranscript(this.candidateTranscript);
    this.candidateTranscript = "";
    if (!transcript) {
      this.candidateChunks = [];
      return;
    }
    const audio = buildCandidateAudio(this.candidateChunks, transcript);
    this.candidateChunks = [];
    this.callbacks.onCandidateTurn(transcript, audio);
  }

  private clearTranscriptTimer() {
    if (this.transcriptTimer) clearTimeout(this.transcriptTimer);
    this.transcriptTimer = null;
  }

  private sendText(text: string) {
    if (this.websocket?.readyState !== WebSocket.OPEN) return;
    this.websocket.send(JSON.stringify({ realtimeInput: { text } }));
  }
}

function normalizeTranscript(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

async function readWebSocketData(data: unknown): Promise<string> {
  if (typeof data === "string") return data;
  if (data instanceof ArrayBuffer) return Buffer.from(data).toString("utf8");
  if (ArrayBuffer.isView(data)) {
    const bytes = new Uint8Array(
      data.buffer,
      data.byteOffset,
      data.byteLength
    );
    return Buffer.from(bytes).toString("utf8");
  }
  if (typeof Blob !== "undefined" && data instanceof Blob) {
    if (typeof data.text === "function") return data.text();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Could not read WebSocket blob"));
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.readAsText(data);
    });
  }
  throw new Error("Unsupported WebSocket message type");
}
