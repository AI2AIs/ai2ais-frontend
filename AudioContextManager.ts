// utils/AudioContextManager.ts

class AudioContextManager {
  private audioContext: AudioContext | null = null;
  private isInitialized: boolean = false;
  private userInteracted: boolean = false;

  async initialize(): Promise<boolean> {
    try {
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('❌ AudioContext not supported');
        return false;
      }

      this.audioContext = new AudioContextClass();
      
 
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.isInitialized = true;
      console.log('✅ AudioContext initialized:', this.audioContext.state);
      
      return true;
    } catch (error) {
      console.error('❌ AudioContext initialization failed:', error);
      return false;
    }
  }

  async enableAudioOnUserInteraction(): Promise<void> {
    if (this.userInteracted) return;

    const enableAudio = async () => {
      try {
        if (!this.isInitialized) {
          await this.initialize();
        }

        if (this.audioContext && this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
          console.log('🎵 Audio context resumed after user interaction');
        }

        this.userInteracted = true;
        
    
        document.removeEventListener('click', enableAudio);
        document.removeEventListener('touchstart', enableAudio);
        document.removeEventListener('keydown', enableAudio);
        
      } catch (error) {
        console.error('❌ Failed to enable audio:', error);
      }
    };

   
    document.addEventListener('click', enableAudio, { once: true });
    document.addEventListener('touchstart', enableAudio, { once: true });
    document.addEventListener('keydown', enableAudio, { once: true });
  }

  async playAudioBuffer(audioData: ArrayBuffer): Promise<void> {
    if (!this.audioContext || !this.isInitialized) {
      console.warn('❌ AudioContext not initialized');
      return;
    }

    try {
      const audioBuffer = await this.audioContext.decodeAudioData(audioData);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start(0);
      
      console.log('✅ Audio played via AudioContext');
    } catch (error) {
      console.error('❌ AudioContext playback failed:', error);
      throw error;
    }
  }

  async playAudioUrl(audioUrl: string): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      
      audio.addEventListener('canplaythrough', () => {
        audio.play()
          .then(() => {
            console.log('✅ Audio played via HTML Audio');
            resolve(audio);
          })
          .catch(reject);
      }, { once: true });

      audio.addEventListener('error', (e) => {
        console.error('❌ Audio loading failed:', e);
        reject(new Error(`Audio loading failed: ${audio.error?.message}`));
      });

      audio.load();
    });
  }

  createSilentAudioBlob(duration: number): Blob {
    try {
      // WAV header for silent audio
      const sampleRate = 44100;
      const numChannels = 1;
      const bitsPerSample = 16;
      const numSamples = Math.floor(sampleRate * duration);
      const byteRate = sampleRate * numChannels * bitsPerSample / 8;
      const blockAlign = numChannels * bitsPerSample / 8;
      const dataSize = numSamples * blockAlign;
      const fileSize = 44 + dataSize;

      const buffer = new ArrayBuffer(fileSize);
      const view = new DataView(buffer);

      // WAV header
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };

      writeString(0, 'RIFF');
      view.setUint32(4, fileSize - 8, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, byteRate, true);
      view.setUint16(32, blockAlign, true);
      view.setUint16(34, bitsPerSample, true);
      writeString(36, 'data');
      view.setUint32(40, dataSize, true);

      // Silent audio data (all zeros)
      for (let i = 44; i < fileSize; i++) {
        view.setUint8(i, 0);
      }

      return new Blob([buffer], { type: 'audio/wav' });
    } catch (error) {
      console.error('❌ Failed to create silent audio blob:', error);
      throw error;
    }
  }

  generateTestTone(frequency: number = 440, duration: number = 1.0): Blob {
    try {
      const sampleRate = 44100;
      const numChannels = 1;
      const bitsPerSample = 16;
      const numSamples = Math.floor(sampleRate * duration);
      const byteRate = sampleRate * numChannels * bitsPerSample / 8;
      const blockAlign = numChannels * bitsPerSample / 8;
      const dataSize = numSamples * blockAlign;
      const fileSize = 44 + dataSize;

      const buffer = new ArrayBuffer(fileSize);
      const view = new DataView(buffer);

      // WAV header (same as above)
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };

      writeString(0, 'RIFF');
      view.setUint32(4, fileSize - 8, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, byteRate, true);
      view.setUint16(32, blockAlign, true);
      view.setUint16(34, bitsPerSample, true);
      writeString(36, 'data');
      view.setUint32(40, dataSize, true);

      // Generate sine wave audio data
      let offset = 44;
      for (let i = 0; i < numSamples; i++) {
        const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate);
        const intSample = Math.floor(sample * 32767);
        view.setInt16(offset, intSample, true);
        offset += 2;
      }

      console.log(`✅ Generated test tone: ${frequency}Hz, ${duration}s`);
      return new Blob([buffer], { type: 'audio/wav' });
    } catch (error) {
      console.error('❌ Failed to generate test tone:', error);
      throw error;
    }
  }

  getState(): string {
    return this.audioContext?.state || 'not-initialized';
  }

  isUserInteracted(): boolean {
    return this.userInteracted;
  }
}

// Global instance
export const audioContextManager = new AudioContextManager();

// Auto-initialize on load
audioContextManager.initialize();
audioContextManager.enableAudioOnUserInteraction();