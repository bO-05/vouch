import React from 'react';
import { Play, Pause, Square, Volume2, Sparkles } from './Icons';
import { AVAILABLE_VOICES } from '../services/elevenlabsService';

interface AudioPlayerBarProps {
  isPlaying: boolean;
  currentTitle: string;
  currentNarrator: string;
  selectedVoiceId: string;
  onSelectVoice: (voiceId: string) => void;
  onTogglePlay: () => void;
  onStop: () => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  isPlaying,
  currentTitle,
  currentNarrator,
  selectedVoiceId,
  onSelectVoice,
  onTogglePlay,
  onStop
}) => {
  if (!currentTitle) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'min(92%, 850px)',
      background: 'rgba(15, 22, 38, 0.92)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(245, 158, 11, 0.35)',
      borderRadius: 'var(--radius-full)',
      padding: '10px 24px',
      boxShadow: '0 15px 40px -10px rgba(0, 0, 0, 0.8), 0 0 25px rgba(245, 158, 11, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      zIndex: 90,
      animation: 'fadeIn 0.3s ease-out'
    }}>
      {/* Left info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #F59E0B, #FB7185)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Volume2 size={18} color="#0F172A" />
        </div>

        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#FCD34D', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              ElevenLabs Audio Story
            </span>
            {isPlaying && (
              <div className="waveform-bars" style={{ height: 12 }}>
                <div className="waveform-bar" style={{ width: 2 }}></div>
                <div className="waveform-bar" style={{ width: 2 }}></div>
                <div className="waveform-bar" style={{ width: 2 }}></div>
                <div className="waveform-bar" style={{ width: 2 }}></div>
              </div>
            )}
          </div>
          <p style={{
            fontSize: '0.88rem',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: '#FFFFFF'
          }}>
            {currentTitle}
          </p>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Narrator: {currentNarrator}
          </span>
        </div>
      </div>

      {/* Middle Voice Selection */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Sparkles size={14} color="#A855F7" />
        <select
          value={selectedVoiceId}
          onChange={(e) => onSelectVoice(e.target.value)}
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-full)',
            color: '#E2E8F0',
            fontSize: '0.78rem',
            padding: '6px 12px',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          {AVAILABLE_VOICES.map((v) => (
            <option key={v.elevenLabsVoiceId} value={v.elevenLabsVoiceId} style={{ background: '#0F172A', color: '#FFFFFF' }}>
              {v.name}
            </option>
          ))}
        </select>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={onTogglePlay}
          className="btn"
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: '#F59E0B',
            color: '#0F172A',
            padding: 0,
            boxShadow: '0 0 15px rgba(245, 158, 11, 0.5)'
          }}
          title={isPlaying ? 'Pause' : 'Resume'}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} fill="#0F172A" />}
        </button>

        <button
          onClick={onStop}
          className="btn btn-secondary"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            padding: 0
          }}
          title="Stop Audio"
        >
          <Square size={14} />
        </button>
      </div>
    </div>
  );
};
