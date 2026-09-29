import { WORKLET_CODE } from './workletProcessor';

export interface PCMRecorderOptions {
  onAudioData: (base64Pcm: string) => void;
  onVolumeChange?: (volume: number) => void;
  onError?: (err: Error) => void;
}

export class PCMRecorder {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private isRecording: boolean = false;
  private options: PCMRecorderOptions;

  constructor(options: PCMRecorderOptions) {
    this.options = options;
  }

  async start(): Promise<void> {
    if (this.isRecording) return;

    try {
      // 1. Get microphone media stream with echo cancellation
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // 2. Initialize AudioContext at 24 kHz for AssemblyAI Voice Agent standard
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx({ sampleRate: 24000 });

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // 3. Load AudioWorklet from inline Blob
      const blob = new Blob([WORKLET_CODE], { type: 'application/javascript' });
      const workletUrl = URL.createObjectURL(blob);
      await this.audioContext.audioWorklet.addModule(workletUrl);
      URL.revokeObjectURL(workletUrl);

      // 4. Create source and worklet nodes
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.workletNode = new AudioWorkletNode(this.audioContext, 'pcm-processor');

      // 5. Handle audio buffers from worklet
      this.workletNode.port.onmessage = (event: MessageEvent) => {
        if (!this.isRecording) return;

        const arrayBuffer = event.data as ArrayBuffer;
        const int16Array = new Int16Array(arrayBuffer);

        // Compute volume level for visualizer
        if (this.options.onVolumeChange) {
          let sum = 0;
          for (let i = 0; i < int16Array.length; i++) {
            sum += Math.abs(int16Array[i]);
          }
          const avg = sum / int16Array.length;
          const normalizedVol = Math.min(1, avg / 8000);
          this.options.onVolumeChange(normalizedVol);
        }

        // Convert Int16 ArrayBuffer to Base64 string
        const base64Audio = arrayBufferToBase64(arrayBuffer);
        this.options.onAudioData(base64Audio);
      };

      // Connect nodes
      this.sourceNode.connect(this.workletNode);
      this.isRecording = true;
    } catch (err: any) {
      this.stop();
      if (this.options.onError) {
        this.options.onError(err);
      } else {
        throw err;
      }
    }
  }

  stop(): void {
    this.isRecording = false;

    if (this.workletNode) {
      this.workletNode.port.onmessage = null;
      this.workletNode.disconnect();
      this.workletNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }

  get active(): boolean {
    return this.isRecording;
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
