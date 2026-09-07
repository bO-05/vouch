import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Volume2, Sparkles, Globe } from './Icons';
import { AVAILABLE_VOICES, ElevenLabsService } from '../services/elevenlabsService';

interface AudioPlayerBarProps {
  isPlaying: boolean;
  currentTitle: string;
  currentNarrator: string;
  selectedVoiceId: string;
  onSelectVoice: (voiceId: string) => void;
  onTogglePlay: () => void;
  onStop: () => void;
  audioLangMode?: 'original' | 'english';
  onToggleLangMode?: (mode: 'original' | 'english') => void;
  hasTranslation?: boolean;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  isPlaying,
  currentTitle,
  currentNarrator,
  selectedVoiceId,
  onSelectVoice,
  onTogglePlay,
  onStop,
  audioLangMode = 'original',
  onToggleLangMode,
  hasTranslation = true
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [engine, setEngine] = useState<'elevenlabs' | 'webspeech' | 'idle'>(ElevenLabsService.getActiveEngine());
  const [voiceLabel, setVoiceLabel] = useState<string>(ElevenLabsService.getActiveVoiceLabel() || currentNarrator);
  const scrubberRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleProgress = (e: any) => {
      if (typeof e.detail?.progress === 'number') {
        setProgress(e.detail.progress);
      }
    };

    const handleStateChange = (e: any) => {
      if (e.detail) {
        if (e.detail.engine) setEngine(e.detail.engine);
        if (e.detail.voiceLabel) setVoiceLabel(e.detail.voiceLabel);
      }
    };

    window.addEventListener('echokind-audio-progress', handleProgress);
    window.addEventListener('echokind-audio-state', handleStateChange);
    return () => {
      window.removeEventListener('echokind-audio-progress', handleProgress);
      window.removeEventListener('echokind-audio-state', handleStateChange);
    };
  }, []);

  useEffect(() => {
    const activeLabel = ElevenLabsService.getActiveVoiceLabel();
    const currentVoice = AVAILABLE_VOICES.find(v => v.elevenLabsVoiceId === selectedVoiceId);
    setVoiceLabel(activeLabel || currentVoice?.name || currentNarrator);
    setEngine(ElevenLabsService.getActiveEngine());
  }, [currentNarrator, selectedVoiceId, isPlaying]);

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubberRef.current) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const percent = Math.round((clickX / rect.width) * 100);
    setProgress(percent);
    ElevenLabsService.seekAudio(percent);
  };

  if (!currentTitle) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'min(94%, 900px)',
      background: 'rgba(14, 19, 31, 0.96)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid var(--border-medium)',
      borderRadius: 'var(--radius-lg)',
      padding: '12px 20px',
      boxShadow: '0 16px 40px -10px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      zIndex: 90,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      {/* Top Row: Info, Dialect Toggle, Voice Selector, Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap'
      }}>
        {/* Left info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-md)',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Volume2 size={18} color="var(--brand-amber)" />
          </div>

          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: engine === 'webspeech' ? '#38BDF8' : 'var(--brand-amber)',
                background: engine === 'webspeech' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                border: `1px solid ${engine === 'webspeech' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                {engine === 'webspeech' ? 'Web Speech API' : 'ElevenLabs Multilingual v2'}
              </span>
            </div>
            <p style={{
              fontSize: '0.86rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: '#F8FAFC',
              marginTop: 2
            }}>
              {currentTitle}
            </p>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Voice: {voiceLabel || (AVAILABLE_VOICES.find(v => v.elevenLabsVoiceId === selectedVoiceId)?.name) || currentNarrator}
            </span>
          </div>
        </div>

        {/* Dialect Switcher: Native Dialect vs English Translation */}
        {hasTranslation && onToggleLangMode && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: 'var(--radius-full)',
            padding: 3,
            border: '1px solid var(--border-subtle)',
            gap: 2
          }}>
            <button
              onClick={() => onToggleLangMode('original')}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: audioLangMode === 'original' ? 'var(--brand-amber)' : 'transparent',
                color: audioLangMode === 'original' ? '#080A0F' : 'var(--text-muted)'
              }}
              title="Play in authentic native spoken dialect"
            >
              Native
            </button>
            <button
              onClick={() => onToggleLangMode('english')}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: audioLangMode === 'english' ? 'var(--brand-emerald)' : 'transparent',
                color: audioLangMode === 'english' ? '#080A0F' : 'var(--text-muted)'
              }}
              title="Play in English translation"
            >
              English
            </button>
          </div>
        )}

        {/* Voice Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={13} color="var(--text-muted)" />
          <select
            value={selectedVoiceId}
            onChange={(e) => onSelectVoice(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: '#F8FAFC',
              fontSize: '0.76rem',
              padding: '5px 10px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {AVAILABLE_VOICES.map((v) => (
              <option key={v.elevenLabsVoiceId} value={v.elevenLabsVoiceId} style={{ background: '#0E131F', color: '#FFFFFF' }}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        {/* Play/Stop Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={onTogglePlay}
            className="btn"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--brand-amber)',
              color: '#080A0F',
              padding: 0,
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.35)'
            }}
            title={isPlaying ? 'Pause' : 'Resume'}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} fill="#080A0F" />}
          </button>

          <button
            onClick={onStop}
            className="btn btn-secondary"
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              padding: 0
            }}
            title="Stop Audio"
          >
            <Square size={13} />
          </button>
        </div>
      </div>

      {/* Bottom Row: Interactive Waveform Scrubber */}
      <div
        ref={scrubberRef}
        onClick={handleScrub}
        style={{
          width: '100%',
          height: 4,
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: 2,
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden'
        }}
        title={`Waveform Timeline: ${progress}% - Click to scrub position`}
      >
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: 'linear-gradient(90deg, var(--brand-amber), #34D399)',
          borderRadius: 2,
          transition: 'width 0.15s linear'
        }} />
      </div>
    </div>
  );
};
