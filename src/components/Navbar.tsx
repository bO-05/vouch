import React from 'react';
import { Volume2, Sparkles, PlusCircle, Coins, Eye } from './Icons';
import { WalletState } from '../services/solanaService';

interface NavbarProps {
  wallet: WalletState;
  onOpenVoiceModal: () => void;
  onOpenSandboxModal: () => void;
  onOpenDevPostModal: () => void;
  onListenFeed: () => void;
  isAudioPlaying: boolean;
  onAirdrop: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  wallet,
  onOpenVoiceModal,
  onOpenSandboxModal,
  onOpenDevPostModal,
  onListenFeed,
  isAudioPlaying,
  onAirdrop
}) => {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(8, 12, 20, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '14px 24px'
    }}>
      <div style={{
        maxWidth: 1300,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #F59E0B, #EC4899, #8B5CF6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(245, 158, 11, 0.35)'
          }}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              <path d="M12 9v6M9 11v2M15 10v4" />
            </svg>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.03em' }} className="gradient-text-gold">
                EchoKind
              </span>
              <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#FCD34D', border: '1px solid rgba(245, 158, 11, 0.3)', fontSize: '0.68rem', padding: '2px 8px' }}>
                DEV Weekend Challenge
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', letterSpacing: '0.01em' }}>
              Multimodal Voice-First Mutual Aid & Solana Micro-Grants
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Hands-free Audio Feed Reader */}
          <button
            onClick={onListenFeed}
            className="btn btn-secondary"
            title="Read active community stories aloud with ElevenLabs voice"
            style={{
              padding: '8px 14px',
              fontSize: '0.85rem',
              borderColor: isAudioPlaying ? 'var(--primary-amber)' : 'var(--border-subtle)',
              color: isAudioPlaying ? 'var(--primary-amber-light)' : 'var(--text-secondary)'
            }}
          >
            <Volume2 size={16} color={isAudioPlaying ? '#F59E0B' : '#94A3B8'} />
            <span>{isAudioPlaying ? 'Pause Voice' : 'Listen to Feed'}</span>
            {isAudioPlaying && (
              <div className="waveform-bars" style={{ height: 14 }}>
                <div className="waveform-bar" style={{ width: 2 }}></div>
                <div className="waveform-bar" style={{ width: 2 }}></div>
                <div className="waveform-bar" style={{ width: 2 }}></div>
              </div>
            )}
          </button>

          {/* Solana Devnet Wallet Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            background: 'rgba(20, 241, 149, 0.08)',
            border: '1px solid rgba(20, 241, 149, 0.3)',
            borderRadius: 'var(--radius-full)'
          }}>
            <Coins size={15} color="#14F195" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#14F195', fontFamily: 'var(--font-mono)' }}>
                {wallet.balanceSOL.toFixed(2)} SOL
              </span>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                Devnet ({wallet.publicKey.slice(0, 4)}...{wallet.publicKey.slice(-4)})
              </span>
            </div>
            <button
              onClick={onAirdrop}
              title="Request 1.0 SOL Devnet Airdrop for testing"
              style={{
                background: 'rgba(20, 241, 149, 0.2)',
                border: 'none',
                color: '#14F195',
                fontSize: '0.7rem',
                fontWeight: 700,
                borderRadius: '6px',
                padding: '3px 7px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              +1 SOL
            </button>
          </div>

          {/* Judge Sandbox Console */}
          <button
            onClick={onOpenSandboxModal}
            className="btn btn-secondary"
            title="Inspect Google AI, ElevenLabs, and Solana architecture"
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
          >
            <Sparkles size={16} color="#A855F7" />
            <span>Judge Sandbox</span>
          </button>

          {/* DEV.to Submission Template */}
          <button
            onClick={onOpenDevPostModal}
            className="btn btn-secondary"
            title="View pre-written DEV.to submission post"
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
          >
            <Eye size={16} color="#38BDF8" />
            <span>DEV Post Draft</span>
          </button>

          {/* Speak / Request Aid Button */}
          <button
            onClick={onOpenVoiceModal}
            className="btn btn-primary"
            style={{ padding: '8px 18px', fontSize: '0.88rem' }}
          >
            <PlusCircle size={17} />
            <span>Speak a Need</span>
          </button>
        </div>
      </div>
    </header>
  );
};
