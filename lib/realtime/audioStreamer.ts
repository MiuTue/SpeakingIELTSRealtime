export type StreamerState = "idle" | "playing";

export class AudioStreamer {
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private queue: Float32Array[] = [];
  private scheduleTimer: number | null = null;
  private scheduledTime = 0;
  state: StreamerState = "idle";

  async unlock() {
    await this.ensureContext();
    await this.resumeContext();
  }

  async addPCM16(chunk: Uint8Array) {
    await this.ensureContext();
    await this.resumeContext();
    this.gain?.gain.setValueAtTime(1, this.context?.currentTime ?? 0);
    const buffer = this.toFloat32(chunk);
    if (!buffer.length) return;

    this.queue.push(buffer);
    if (this.state === "idle") {
      this.scheduledTime = Math.max(this.scheduledTime, (this.context?.currentTime ?? 0) + 0.05);
      this.state = "playing";
    }

    this.schedule();
  }

  clearQueue() {
    this.clearScheduleTimer();
    this.queue = [];
    this.scheduledTime = this.context?.currentTime ?? 0;
    this.state = "idle";
    this.gain?.gain.setTargetAtTime(0, this.context?.currentTime ?? 0, 0.03);
  }

  private async ensureContext() {
    if (this.context) return;
    this.context = new AudioContext({ sampleRate: 24000 });
    this.gain = this.context.createGain();
    this.gain.connect(this.context.destination);
  }

  private async resumeContext() {
    if (this.context?.state === "suspended") {
      await this.context.resume();
    }
  }

  private schedule() {
    if (!this.context || !this.gain) return;
    this.clearScheduleTimer();

    while (this.queue.length && this.scheduledTime < this.context.currentTime + 0.25) {
      const audioData = this.queue.shift();
      if (!audioData) break;
      const buffer = this.context.createBuffer(1, audioData.length, 24000);
      buffer.getChannelData(0).set(audioData);
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.connect(this.gain);
      const start = Math.max(this.scheduledTime, this.context.currentTime);
      source.start(start);
      this.scheduledTime = start + buffer.duration;
    }

    if (this.queue.length) {
      this.scheduleTimer = window.setTimeout(() => this.schedule(), 60);
    } else {
      const idleDelayMs = Math.max(120, (this.scheduledTime - this.context.currentTime) * 1000 + 80);
      this.scheduleTimer = window.setTimeout(() => {
        this.scheduleTimer = null;
        if (this.queue.length) {
          this.schedule();
          return;
        }
        this.state = "idle";
      }, idleDelayMs);
    }
  }

  private clearScheduleTimer() {
    if (this.scheduleTimer !== null) {
      window.clearTimeout(this.scheduleTimer);
      this.scheduleTimer = null;
    }
  }

  private toFloat32(chunk: Uint8Array) {
    const out = new Float32Array(chunk.length / 2);
    const view = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
    for (let index = 0; index < out.length; index += 1) {
      out[index] = view.getInt16(index * 2, true) / 32768;
    }
    return out;
  }
}
