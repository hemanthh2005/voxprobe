export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private nextStartTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private sampleRate: number = 24000;

  constructor(sampleRate: number = 24000) {
    this.sampleRate = sampleRate;
  }

  private initAudioContext() {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx({ sampleRate: this.sampleRate });
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
  }

  /**
   * Play base64 PCM16 audio chunk from AssemblyAI reply.audio
   */
  playChunk(base64Audio: string): void {
    if (!base64Audio) return;

    try {
      this.initAudioContext();
      if (!this.audioContext) return;

      // 1. Convert base64 string to Int16Array
      const binaryString = window.atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const int16Array = new Int16Array(bytes.buffer);
      if (int16Array.length === 0) return;

      // 2. Convert Int16Array to Float32Array [-1.0, 1.0]
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / (int16Array[i] < 0 ? 32768 : 32767);
      }

      // 3. Create AudioBuffer
      const buffer = this.audioContext.createBuffer(1, float32Array.length, this.sampleRate);
      buffer.getChannelData(0).set(float32Array);

      // 4. Create Source Node
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);

      // 5. Schedule playback seamlessly
      const now = this.audioContext.currentTime;
      const startTime = Math.max(now, this.nextStartTime);
      source.start(startTime);
      this.nextStartTime = startTime + buffer.duration;

      this.activeSources.push(source);

      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        if (idx !== -1) {
          this.activeSources.splice(idx, 1);
        }
      };
    } catch (err) {
      console.error('Failed to play PCM16 audio chunk:', err);
    }
  }

  /**
   * Instant Barge-in: Stops all playing sources & flushes playback queue
   */
  stopAndFlush(): void {
    this.activeSources.forEach((source) => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Source may already be stopped
      }
    });
    this.activeSources = [];
    if (this.audioContext) {
      this.nextStartTime = this.audioContext.currentTime;
    }
  }

  close(): void {
    this.stopAndFlush();
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }
}
