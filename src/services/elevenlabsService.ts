export interface VoiceOption {
  id: string;
  name: string;
  elevenLabsVoiceId: string;
  description: string;
}

export const AVAILABLE_VOICES: VoiceOption[] = [
  {
    id: 'empathetic-rachel',
    name: 'Rachel (Warm & Empathetic)',
    elevenLabsVoiceId: '21m00Tcm4TlvDq8ikWAM',
    description: 'Nurturing, compassionate tone ideal for community storytelling'
  },
  {
    id: 'grounded-adam',
    name: 'Adam (Gentle Elder / Steady)',
    elevenLabsVoiceId: 'pNInz6obpgDQGcFmaJgB',
    description: 'Deep, trustworthy voice for disaster relief and emergency alerts'
  },
  {
    id: 'youth-antoni',
    name: 'Antoni (Youth Leader / Dynamic)',
    elevenLabsVoiceId: 'ErXwobaYiN019PkySvjV',
    description: 'Inspiring, energetic tone for youth empowerment and tech education'
  }
];

export class ElevenLabsService {
  private static apiKey: string = localStorage.getItem('echokind_elevenlabs_key') || '';
  private static currentAudio: HTMLAudioElement | null = null;
  private static activeUtterance: SpeechSynthesisUtterance | null = null;

  public static setApiKey(key: string) {
    this.apiKey = key;
    localStorage.setItem('echokind_elevenlabs_key', key);
  }

  public static getApiKey(): string {
    return this.apiKey;
  }

  /**
   * Speak narrative text using Backend ElevenLabs stream/cache if available,
   * otherwise fallback gracefully to native Web Speech API.
   */
  public static async playNarration(
    text: string,
    voiceId: string = '21m00Tcm4TlvDq8ikWAM',
    onStart?: () => void,
    onEnded?: () => void,
    onError?: (err: any) => void
  ): Promise<void> {
    this.stopAudio();

    // 1. Try Backend Audio Synthesis endpoint
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (this.apiKey) {
        headers['x-elevenlabs-key'] = this.apiKey;
      }

      const res = await fetch('/api/elevenlabs/synthesize', {
        method: 'POST',
        headers,
        body: JSON.stringify({ text, voiceId })
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('audio')) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        this.currentAudio = audio;

        audio.onplay = () => onStart?.();
        audio.onended = () => {
          URL.revokeObjectURL(url);
          this.currentAudio = null;
          onEnded?.();
        };
        audio.onerror = (e) => {
          console.error('Audio playback error', e);
          onError?.(e);
        };

        await audio.play();
        return;
      }
    } catch (e) {
      console.info('Backend audio synthesize not reachable, attempting client options.');
    }

    // 2. Direct client call if user entered API key
    if (this.apiKey) {
      try {
        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'xi-api-key': this.apiKey
            },
            body: JSON.stringify({
              text,
              model_id: 'eleven_monolingual_v1',
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75
              }
            })
          }
        );

        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          this.currentAudio = audio;

          audio.onplay = () => onStart?.();
          audio.onended = () => {
            URL.revokeObjectURL(url);
            this.currentAudio = null;
            onEnded?.();
          };
          audio.onerror = (e) => {
            console.error('Audio playback error', e);
            onError?.(e);
          };

          await audio.play();
          return;
        }
      } catch (e) {
        console.warn('Direct ElevenLabs API request failed, falling back to Web Speech synthesis:', e);
      }
    }

    // 3. Zero-config Web Speech fallback for judges
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      this.activeUtterance = utterance;

      // Select natural sounding voice if available
      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')));
      if (naturalVoice) utterance.voice = naturalVoice;

      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onstart = () => onStart?.();
      utterance.onend = () => {
        this.activeUtterance = null;
        onEnded?.();
      };
      utterance.onerror = (e) => {
        this.activeUtterance = null;
        onError?.(e);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Speech synthesis not supported on this browser.');
      onEnded?.();
    }
  }

  public static stopAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.activeUtterance = null;
    }
  }

  public static isAudioPlaying(): boolean {
    return (this.currentAudio !== null && !this.currentAudio.paused) || 
           (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking);
  }
}
