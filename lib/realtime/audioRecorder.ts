export type RecorderState = "idle" | "requesting" | "ready" | "muted" | "error";

export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  state: RecorderState = "idle";

  async start() {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.state = "error";
      throw new Error("Microphone access is not available in this browser.");
    }

    this.state = "requesting";
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.source = this.audioContext.createMediaStreamSource(this.stream);
    this.source.connect(this.analyser);
    this.state = "ready";

    return this.stream;
  }

  getStream() {
    return this.stream;
  }

  setMuted(muted: boolean) {
    this.stream?.getAudioTracks().forEach((track) => {
      track.enabled = !muted;
    });
    this.state = muted ? "muted" : "ready";
  }

  readVolume() {
    if (!this.analyser) return 0;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    const sum = data.reduce((total, value) => total + value, 0);
    return sum / data.length / 255;
  }

  stop() {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.source?.disconnect();
    void this.audioContext?.close();
    this.stream = null;
    this.audioContext = null;
    this.analyser = null;
    this.source = null;
    this.state = "idle";
  }
}
