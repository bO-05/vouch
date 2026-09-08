import { apiUrl } from '../config/api';

export interface VoiceOption {
  id: string;
  name: string;
  elevenLabsVoiceId: string;
  description: string;
  language?: string;
}

export const AVAILABLE_VOICES: VoiceOption[] = [
  {
    id: 'empathetic-rachel',
    name: 'Rachel (Empathetic Storyteller)',
    elevenLabsVoiceId: '21m00Tcm4TlvDq8ikWAM',
    description: 'Nurturing, compassionate tone ideal for community storytelling (English)',
    language: 'English'
  },
  {
    id: 'grounded-adam',
    name: 'Adam (Crisis & Disaster Lead)',
    elevenLabsVoiceId: 'pNInz6obpgDQGcFmaJgB',
    description: 'Deep, trustworthy voice for disaster relief and emergency alerts',
    language: 'English'
  },
  {
    id: 'marcela-spanish',
    name: 'Marcela (Español Solidario)',
    elevenLabsVoiceId: 'AZnzlk1XvdvUeBnXmlld',
    description: 'Warm, heartfelt Latin American Spanish voice for mutual aid pleas',
    language: 'Spanish'
  },
  {
    id: 'olena-ukrainian',
    name: 'Olena (Український Голос)',
    elevenLabsVoiceId: 'ThT5KcBeYPX3keUQqHPh',
    description: 'Resilient, emotional Eastern European voice for winter & civilian relief',
    language: 'Ukrainian'
  },
  {
    id: 'youth-antoni',
    name: 'Antoni (Youth & Tech Solidarity)',
    elevenLabsVoiceId: 'ErXwobaYiN019PkySvjV',
    description: 'Inspiring, energetic tone for youth empowerment and educational aid',
    language: 'Multilingual'
  }
];

export class ElevenLabsService {
  private static apiKey: string = localStorage.getItem('echokind_elevenlabs_key') || '';
  private static currentAudio: HTMLAudioElement | null = null;
  private static activeUtterance: SpeechSynthesisUtterance | null = null;
  private static cachedVoices: SpeechSynthesisVoice[] = [];
  private static activeEngine: 'elevenlabs' | 'webspeech' | 'idle' = 'idle';
  private static activeVoiceLabel: string = 'Rachel (Empathetic Storyteller)';
  private static currentProgress: number = 0;
  private static activeText: string = '';
  private static activeVoiceId: string = '21m00Tcm4TlvDq8ikWAM';
  private static activeLangCode: string = 'en-US';
  private static activeMatchedVoice: SpeechSynthesisVoice | null = null;
  private static activeRate: number = 0.95;
  private static activePitch: number = 1.0;
  private static estimatedDurationMs: number = 10000;
  private static tickerTimer: any = null;
  private static activeSessionId: number = 0;
  private static activeAbortController: AbortController | null = null;

  static {
    // Pre-cache available voices in modern browsers
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        ElevenLabsService.cachedVoices = window.speechSynthesis.getVoices();
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  public static setApiKey(key: string) {
    this.apiKey = key;
    localStorage.setItem('echokind_elevenlabs_key', key);
  }

  public static getApiKey(): string {
    return this.apiKey;
  }

  public static getActiveEngine(): 'elevenlabs' | 'webspeech' | 'idle' {
    return this.activeEngine;
  }

  public static getActiveVoiceLabel(): string {
    return this.activeVoiceLabel;
  }

  public static getPlaybackProgress(): number {
    return this.currentProgress;
  }

  public static getActiveVoiceId(): string {
    return this.activeVoiceId;
  }

  public static getActiveText(): string {
    return this.activeText;
  }

  public static getActiveLangCode(): string {
    return this.activeLangCode;
  }

  public static notifyStateChange(isPlaying: boolean) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('echokind-audio-state', {
        detail: {
          isPlaying,
          engine: this.activeEngine,
          voiceLabel: this.activeVoiceLabel,
          voiceId: this.activeVoiceId
        }
      }));
    }
  }

  /**
   * Speak narrative text using Backend ElevenLabs stream/cache if available,
   * otherwise fallback gracefully to native Web Speech API with multilingual dialect matching.
   */
  public static async playNarration(
    text: string,
    voiceId: string = '21m00Tcm4TlvDq8ikWAM',
    onStart?: () => void,
    onEnded?: () => void,
    onError?: (err: any) => void,
    langCode?: string
  ): Promise<void> {
    this.stopAudio();
    const sessionId = ++ElevenLabsService.activeSessionId;
    const abortController = new AbortController();
    ElevenLabsService.activeAbortController = abortController;

    this.currentProgress = 0;
    this.activeText = text;
    this.activeVoiceId = voiceId;
    this.activeLangCode = langCode || 'en-US';

    // 1. Try Backend Audio Synthesis endpoint
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (this.apiKey) {
        headers['x-elevenlabs-key'] = this.apiKey;
      }

      const res = await fetch(apiUrl('/api/elevenlabs/synthesize'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ text, voiceId }),
        signal: abortController.signal
      });

      if (sessionId !== ElevenLabsService.activeSessionId || abortController.signal.aborted) {
        return;
      }

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('audio')) {
        const blob = await res.blob();
        if (sessionId !== ElevenLabsService.activeSessionId || abortController.signal.aborted) {
          return;
        }
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        this.currentAudio = audio;
        this.activeEngine = 'elevenlabs';
        const vMatch = AVAILABLE_VOICES.find(v => v.elevenLabsVoiceId === voiceId);
        this.activeVoiceLabel = vMatch ? `ElevenLabs: ${vMatch.name}` : 'ElevenLabs Multilingual v2';

        audio.onplay = () => {
          onStart?.();
          this.notifyStateChange(true);
        };
        audio.ontimeupdate = () => {
          if (audio.duration) {
            const pct = Math.min(100, Math.round((audio.currentTime / audio.duration) * 100));
            this.currentProgress = pct;
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('echokind-audio-progress', { detail: { progress: pct } }));
            }
          }
        };
        audio.onended = () => {
          URL.revokeObjectURL(url);
          this.currentAudio = null;
          this.activeEngine = 'idle';
          this.currentProgress = 100;
          this.notifyStateChange(false);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('echokind-audio-progress', { detail: { progress: 100 } }));
          }
          onEnded?.();
        };
        audio.onerror = (e) => {
          console.error('Audio playback error', e);
          this.activeEngine = 'idle';
          this.notifyStateChange(false);
          onError?.(e);
        };

        if (sessionId !== ElevenLabsService.activeSessionId || abortController.signal.aborted) {
          URL.revokeObjectURL(url);
          return;
        }

        await audio.play();
        return;
      }
    } catch (e: any) {
      if (sessionId !== ElevenLabsService.activeSessionId || abortController.signal.aborted) {
        return;
      }
      console.info('Backend audio synthesize not reachable, attempting client options.');
    }

    // 2. Direct client call if user entered ElevenLabs API key
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
              model_id: 'eleven_multilingual_v2',
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75
              }
            }),
            signal: abortController.signal
          }
        );

        if (sessionId !== ElevenLabsService.activeSessionId || abortController.signal.aborted) {
          return;
        }

        if (response.ok) {
          const blob = await response.blob();
          if (sessionId !== ElevenLabsService.activeSessionId || abortController.signal.aborted) {
            return;
          }
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          this.currentAudio = audio;
          this.activeEngine = 'elevenlabs';
          const vMatch = AVAILABLE_VOICES.find(v => v.elevenLabsVoiceId === voiceId);
          this.activeVoiceLabel = vMatch ? `ElevenLabs: ${vMatch.name}` : 'ElevenLabs Multilingual v2';

          audio.onplay = () => {
            onStart?.();
            this.notifyStateChange(true);
          };
          audio.ontimeupdate = () => {
            if (audio.duration) {
              const pct = Math.min(100, Math.round((audio.currentTime / audio.duration) * 100));
              this.currentProgress = pct;
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('echokind-audio-progress', { detail: { progress: pct } }));
              }
            }
          };
          audio.onended = () => {
            URL.revokeObjectURL(url);
            this.currentAudio = null;
            this.activeEngine = 'idle';
            this.currentProgress = 100;
            this.notifyStateChange(false);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('echokind-audio-progress', { detail: { progress: 100 } }));
            }
            onEnded?.();
          };
          audio.onerror = (e) => {
            console.error('Audio playback error', e);
            this.activeEngine = 'idle';
            this.notifyStateChange(false);
            onError?.(e);
          };

          if (sessionId !== ElevenLabsService.activeSessionId || abortController.signal.aborted) {
            URL.revokeObjectURL(url);
            return;
          }

          await audio.play();
          return;
        }
      } catch (err: any) {
        if (sessionId !== ElevenLabsService.activeSessionId || abortController.signal.aborted) {
          return;
        }
        console.warn('Direct ElevenLabs API request failed, falling back to Web Speech synthesis:', err);
      }
    }

    if (sessionId !== ElevenLabsService.activeSessionId || abortController.signal.aborted) {
      return;
    }

    // 3. Multilingual Web Speech Fallback for zero-friction judge evaluation
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      this.activeUtterance = utterance;
      this.activeEngine = 'webspeech';

      const normLang = (langCode || 'en-US').toLowerCase();
      utterance.lang = langCode || 'en-US';

      // Select natural sounding voice in requested language
      const allVoices = this.cachedVoices.length > 0 ? this.cachedVoices : window.speechSynthesis.getVoices();
      let matchedVoice: SpeechSynthesisVoice | undefined = undefined;
      let chosenRate = 0.95;
      let chosenPitch = 1.0;
      let personaLabel = '';

      // Multilingual voice matching when requesting native dialect
      if (!normLang.startsWith('en')) {
        const langPrefix = normLang.slice(0, 2);
        matchedVoice = allVoices.find(v => v.lang.toLowerCase().startsWith(langPrefix)) ||
                       allVoices.find(v => v.name.toLowerCase().includes(
                         langPrefix === 'fr' ? 'french' :
                         langPrefix === 'ar' ? 'arabic' :
                         langPrefix === 'hi' ? 'hindi' :
                         langPrefix === 'es' ? 'spanish' : 'ukrain'
                       ));
        if (matchedVoice) {
          if (langPrefix === 'fr') personaLabel = `Web Speech · Native French (${matchedVoice.name})`;
          else if (langPrefix === 'ar') personaLabel = `Web Speech · Native Arabic (${matchedVoice.name})`;
          else if (langPrefix === 'hi') personaLabel = `Web Speech · Native Hindi (${matchedVoice.name})`;
          else if (langPrefix === 'es') personaLabel = `Web Speech · Marcela / Spanish (${matchedVoice.name})`;
          else if (langPrefix === 'uk') personaLabel = `Web Speech · Olena / Ukrainian (${matchedVoice.name})`;
          else personaLabel = `Web Speech · Native (${matchedVoice.name})`;
          chosenRate = 0.95;
          chosenPitch = 1.0;
        }
      }

      // Determine distinct audio profile and voice persona by voiceId if not already set by native language
      if (!matchedVoice) {
        if (voiceId === 'pNInz6obpgDQGcFmaJgB') {
          // 1. ADAM (Crisis & Disaster Lead): Calm, authoritative baritone male voice
          matchedVoice = allVoices.find(v => 
            v.lang.toLowerCase().startsWith('en') &&
            (v.name.toLowerCase().includes('david') ||
             v.name.toLowerCase().includes('mark') ||
             v.name.toLowerCase().includes('guy') ||
             v.name.toLowerCase().includes('george') ||
             v.name.toLowerCase().includes('james') ||
             v.name.toLowerCase().includes('male'))
          ) || allVoices.find(v => v.lang.toLowerCase().startsWith('en')) || allVoices[0];
          chosenRate = 0.88;
          chosenPitch = 0.70;
          personaLabel = matchedVoice ? `Web Speech · Adam (${matchedVoice.name})` : 'Web Speech · Adam (Crisis Baritone)';
        } else if (voiceId === 'AZnzlk1XvdvUeBnXmlld') {
          // 2. MARCELA (Español Solidario): Heartfelt Spanish / Latin American voice
          matchedVoice = allVoices.find(v => 
            v.lang.toLowerCase().startsWith('es') ||
            v.name.toLowerCase().includes('spanish') ||
            v.name.toLowerCase().includes('monica') ||
            v.name.toLowerCase().includes('paulina') ||
            v.name.toLowerCase().includes('laura') ||
            v.name.toLowerCase().includes('helena') ||
            v.name.toLowerCase().includes('jorge') ||
            v.name.toLowerCase().includes('diego')
          ) || allVoices.find(v => 
            v.name.toLowerCase().includes('zira') ||
            v.name.toLowerCase().includes('samantha') ||
            v.name.toLowerCase().includes('female')
          ) || allVoices[0];
          chosenRate = 0.96;
          chosenPitch = 1.02;
          personaLabel = matchedVoice ? `Web Speech · Marcela (${matchedVoice.name})` : 'Web Speech · Marcela (Español Solidario)';
        } else if (voiceId === 'ThT5KcBeYPX3keUQqHPh') {
          // 3. OLENA (Ukrainian Voice): Resilient Eastern European / Ukrainian voice
          matchedVoice = allVoices.find(v => 
            v.lang.toLowerCase().includes('uk') || 
            v.name.toLowerCase().includes('ukrain') ||
            v.name.toLowerCase().includes('lesya') ||
            v.name.toLowerCase().includes('polina')
          ) || allVoices.find(v => 
            v.name.toLowerCase().includes('zira') ||
            v.name.toLowerCase().includes('samantha') ||
            v.name.toLowerCase().includes('female')
          ) || allVoices[0];
          chosenRate = 0.90;
          chosenPitch = 1.05;
          personaLabel = matchedVoice ? `Web Speech · Olena (${matchedVoice.name})` : 'Web Speech · Olena (Український Голос)';
        } else if (voiceId === 'ErXwobaYiN019PkySvjV') {
          // 4. ANTONI (Youth & Tech Solidarity): Energetic, inspiring young male voice
          matchedVoice = allVoices.find(v => 
            v.lang.toLowerCase().startsWith('en') &&
            (v.name.toLowerCase().includes('alex') ||
             v.name.toLowerCase().includes('daniel') ||
             v.name.toLowerCase().includes('fred') ||
             v.name.toLowerCase().includes('tom') ||
             v.name.toLowerCase().includes('david'))
          ) || allVoices.find(v => v.lang.toLowerCase().startsWith('en')) || allVoices[0];
          chosenRate = 1.10;
          chosenPitch = 1.25;
          personaLabel = matchedVoice ? `Web Speech · Antoni (${matchedVoice.name})` : 'Web Speech · Antoni (Youth & Tech)';
        } else {
          // 5. RACHEL (Empathetic Storyteller): Default warm, nurturing female voice
          matchedVoice = allVoices.find(v => 
            v.lang.toLowerCase().startsWith('en') && 
            (v.name.toLowerCase().includes('samantha') ||
             v.name.toLowerCase().includes('jenny') ||
             v.name.toLowerCase().includes('zira') ||
             v.name.toLowerCase().includes('victoria') ||
             v.name.toLowerCase().includes('karen') ||
             v.name.toLowerCase().includes('female'))
          ) || allVoices.find(v => v.lang.toLowerCase().startsWith('en')) || allVoices[0];
          chosenRate = 0.95;
          chosenPitch = 1.12;
          personaLabel = matchedVoice ? `Web Speech · Rachel (${matchedVoice.name})` : 'Web Speech · Rachel (Empathetic Storyteller)';
        }
      }

      if (matchedVoice) {
        utterance.voice = matchedVoice;
        utterance.lang = matchedVoice.lang;
      }
      utterance.rate = chosenRate;
      utterance.pitch = chosenPitch;
      this.activeVoiceLabel = personaLabel;
      this.activeMatchedVoice = matchedVoice || null;
      this.activeRate = utterance.rate;
      this.activePitch = utterance.pitch;

      // Scrub Bar and Word Boundary synchronization
      utterance.onboundary = (e: SpeechSynthesisEvent) => {
        if (text.length > 0 && e.charIndex !== undefined) {
          const pct = Math.min(100, Math.round((e.charIndex / text.length) * 100));
          this.currentProgress = pct;
          window.dispatchEvent(new CustomEvent('echokind-audio-progress', { detail: { progress: pct, charIndex: e.charIndex } }));
        }
      };

      utterance.onstart = () => {
        onStart?.();
        this.activeText = text;
        this.activeVoiceId = voiceId;
        this.activeLangCode = langCode || 'en-US';
        this.notifyStateChange(true);

        if (this.tickerTimer) {
          clearInterval(this.tickerTimer);
        }
        const totalWords = text.split(/\s+/).length;
        const estimatedDurationMs = Math.max(3500, (totalWords / 2.6) * 1000);
        this.estimatedDurationMs = estimatedDurationMs;
        const startTime = Date.now();

        this.tickerTimer = setInterval(() => {
          if (this.activeEngine !== 'webspeech') {
            clearInterval(this.tickerTimer);
            this.tickerTimer = null;
            return;
          }
          const elapsed = Date.now() - startTime;
          const calcPct = Math.min(96, Math.round((elapsed / estimatedDurationMs) * 100));
          if (calcPct > this.currentProgress) {
            this.currentProgress = calcPct;
            window.dispatchEvent(new CustomEvent('echokind-audio-progress', { detail: { progress: calcPct } }));
          }
        }, 200);

        window.dispatchEvent(new CustomEvent('echokind-audio-progress', { detail: { progress: 5 } }));
      };

      utterance.onend = () => {
        if (this.tickerTimer) {
          clearInterval(this.tickerTimer);
          this.tickerTimer = null;
        }
        this.activeUtterance = null;
        this.activeEngine = 'idle';
        this.currentProgress = 100;
        this.notifyStateChange(false);
        window.dispatchEvent(new CustomEvent('echokind-audio-progress', { detail: { progress: 100 } }));
        onEnded?.();
      };

      utterance.onerror = (e) => {
        if (this.tickerTimer) {
          clearInterval(this.tickerTimer);
          this.tickerTimer = null;
        }
        this.activeUtterance = null;
        this.activeEngine = 'idle';
        this.notifyStateChange(false);
        onError?.(e);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Speech synthesis not supported on this browser.');
      this.activeEngine = 'idle';
      this.notifyStateChange(false);
      onEnded?.();
    }
  }

  public static stopAudio() {
    ElevenLabsService.activeSessionId++;
    if (ElevenLabsService.activeAbortController) {
      try {
        ElevenLabsService.activeAbortController.abort();
      } catch (e) {}
      ElevenLabsService.activeAbortController = null;
    }
    if (this.tickerTimer) {
      clearInterval(this.tickerTimer);
      this.tickerTimer = null;
    }
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.activeUtterance = null;
    }
    this.activeEngine = 'idle';
    this.currentProgress = 0;
    this.notifyStateChange(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('echokind-audio-progress', { detail: { progress: 0 } }));
    }
  }

  public static isAudioPlaying(): boolean {
    return (this.currentAudio !== null && !this.currentAudio.paused) || 
           (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking);
  }

  public static seekAudio(percent: number) {
    const clamped = Math.max(0, Math.min(100, percent));
    this.currentProgress = clamped;
    if (this.currentAudio && this.currentAudio.duration) {
      this.currentAudio.currentTime = (clamped / 100) * this.currentAudio.duration;
    } else if (this.activeEngine === 'webspeech' && this.activeText && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (clamped < 92) {
        // Word boundary slicing to prevent broken syllables
        const rawIndex = Math.floor((clamped / 100) * this.activeText.length);
        let cleanIndex = rawIndex;
        if (cleanIndex > 0 && cleanIndex < this.activeText.length && this.activeText[cleanIndex] !== ' ') {
          const prevSpace = this.activeText.lastIndexOf(' ', cleanIndex);
          if (prevSpace !== -1 && cleanIndex - prevSpace < 12) {
            cleanIndex = prevSpace + 1;
          }
        }
        const remainingText = this.activeText.slice(cleanIndex);
        if (remainingText.trim().length > 0) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(remainingText);
          utterance.lang = this.activeLangCode;
          if (this.activeMatchedVoice) {
            utterance.voice = this.activeMatchedVoice;
          }
          utterance.rate = this.activeRate;
          utterance.pitch = this.activePitch;
          this.activeUtterance = utterance;

          // Re-attach word boundary tracking with global charIndex calculation
          utterance.onboundary = (e: SpeechSynthesisEvent) => {
            if (this.activeText.length > 0 && e.charIndex !== undefined) {
              const globalChar = cleanIndex + e.charIndex;
              const pct = Math.min(100, Math.round((globalChar / this.activeText.length) * 100));
              this.currentProgress = pct;
              window.dispatchEvent(new CustomEvent('echokind-audio-progress', { detail: { progress: pct, charIndex: globalChar } }));
            }
          };

          // Re-synchronize ticker timer offset from the scrubbed position
          if (this.tickerTimer) {
            clearInterval(this.tickerTimer);
            this.tickerTimer = null;
          }
          const seekStartTime = Date.now() - (clamped / 100) * this.estimatedDurationMs;
          this.tickerTimer = setInterval(() => {
            if (this.activeEngine !== 'webspeech') {
              clearInterval(this.tickerTimer);
              this.tickerTimer = null;
              return;
            }
            const elapsed = Date.now() - seekStartTime;
            const calcPct = Math.min(96, Math.round((elapsed / this.estimatedDurationMs) * 100));
            if (calcPct > this.currentProgress) {
              this.currentProgress = calcPct;
              window.dispatchEvent(new CustomEvent('echokind-audio-progress', { detail: { progress: calcPct } }));
            }
          }, 200);

          utterance.onend = () => {
            this.stopAudio();
          };
          utterance.onerror = () => {
            this.stopAudio();
          };
          window.speechSynthesis.speak(utterance);
        }
      } else {
        this.stopAudio();
      }
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('echokind-audio-progress', { detail: { progress: clamped } }));
    }
  }
}
