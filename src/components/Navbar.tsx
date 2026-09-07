import React from 'react';
import { Volume2, PlusCircle, GraphicEq, Globe, SnowflakeIcon, MapIcon, Sparkles, Bolt, Activity } from './Icons';
import { SolanaService, WalletState } from '../services/solanaService';
import { SolanaPriceData } from '../types';
import { ACTIVE_BRAND } from '../config/branding';

interface NavbarProps {
  wallet: WalletState;
  solanaPrice?: SolanaPriceData | null;
  viewMode?: 'stream' | 'map';
  onToggleViewMode?: (mode: 'stream' | 'map') => void;
  onOpenVoiceModal: () => void;
  onOpenUNModal: () => void;
  onOpenSnowflakeModal?: () => void;
  onOpenJudgeModal?: () => void;
  onOpenHealthModal?: () => void;
  onListenFeed: () => void;
  isAudioPlaying: boolean;
  onAirdrop: () => void;
  onConnectWallet?: (wallet: WalletState) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  wallet,
  solanaPrice,
  viewMode = 'stream',
  onToggleViewMode,
  onOpenVoiceModal,
  onOpenUNModal,
  onOpenSnowflakeModal,
  onOpenJudgeModal,
  onOpenHealthModal,
  onListenFeed,
  isAudioPlaying,
  onAirdrop,
  onConnectWallet
}) => {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(8, 10, 15, 0.88)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '10px 24px'
    }}>
      <div style={{
        maxWidth: 1300,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16
      }}>
        {/* Left: Brand Identity & Subtitle */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flexShrink: 0 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          role="banner"
        >
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.16), rgba(16, 185, 129, 0.05))',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10B981',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}>
            <GraphicEq size={20} color="#10B981" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.025em', color: '#F8FAFC' }}>
                {ACTIVE_BRAND.name}
              </span>
              <span className="nav-brand-pill" style={{
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                color: '#34D399',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.22)',
                fontWeight: 600
              }}>
                Mutual Aid Ledger
              </span>
            </div>
            <p className="nav-subtitle" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', letterSpacing: '0.01em' }}>
              Spoken Need · Cryptographic Escrow
            </p>
          </div>
        </div>

        {/* Center: View Mode Segmented Switcher & Live Price Oracle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {/* Segmented View Switcher */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-full)',
            padding: 3,
            gap: 2
          }}>
            <button
              onClick={() => onToggleViewMode?.('stream')}
              style={{
                background: viewMode === 'stream' ? '#F8FAFC' : 'transparent',
                border: 'none',
                color: viewMode === 'stream' ? '#080A0F' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <span>Feed Stream</span>
            </button>
            <button
              onClick={() => onToggleViewMode?.('map')}
              style={{
                background: viewMode === 'map' ? '#F8FAFC' : 'transparent',
                border: 'none',
                color: viewMode === 'map' ? '#080A0F' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <MapIcon size={12} color={viewMode === 'map' ? '#080A0F' : 'currentColor'} />
              <span>Radar Map</span>
            </button>
          </div>

          {/* Live Crypto Price Oracle Pill */}
          {solanaPrice && (
            <div
              className="nav-price-pill"
              title={`Live Solana Price Oracle: $${solanaPrice.priceUSD} USD (${solanaPrice.source})`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 11px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.74rem',
                fontFamily: 'var(--font-mono)'
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>SOL</span>
              <span style={{ color: '#F8FAFC', fontWeight: 800 }}>${solanaPrice.priceUSD.toFixed(2)}</span>
              <span style={{ color: solanaPrice.change24h >= 0 ? '#34D399' : '#FB7185', fontSize: '0.68rem', fontWeight: 600 }}>
                {solanaPrice.change24h >= 0 ? `+${solanaPrice.change24h}%` : `${solanaPrice.change24h}%`}
              </span>
            </div>
          )}
        </div>

        {/* Right: Actions, Wallet, & CTA */}
        <div className="horizontal-touch-ribbon" style={{ justifyContent: 'flex-end', flex: 1 }}>
          {/* Hands-free Audio Feed Reader */}
          <button
            onClick={onListenFeed}
            className="btn btn-secondary"
            title="Listen to community stories sequentially with ElevenLabs audio"
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              borderColor: isAudioPlaying ? 'var(--brand-amber)' : 'var(--border-subtle)',
              color: isAudioPlaying ? 'var(--brand-amber-light)' : 'var(--text-primary)',
              background: isAudioPlaying ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.03)',
              flexShrink: 0
            }}
          >
            <Volume2 size={14} color={isAudioPlaying ? '#F59E0B' : '#94A3B8'} />
            <span>{isAudioPlaying ? 'Pause Audio' : 'Listen Feed'}</span>
          </button>

          {/* UN ReliefWeb Trigger */}
          <button
            onClick={onOpenUNModal}
            className="btn btn-secondary"
            title="Connect to live UN OCHA ReliefWeb disaster reports"
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              flexShrink: 0
            }}
          >
            <Globe size={13} color="#38BDF8" />
            <span>ReliefWeb</span>
          </button>

          {/* Snowflake Cortex Trigger */}
          {onOpenSnowflakeModal && (
            <button
              onClick={onOpenSnowflakeModal}
              className="btn btn-secondary"
              title="Open Snowflake Generosity Data Warehouse & Cortex AI Analytics"
              style={{
                padding: '6px 12px',
                fontSize: '0.78rem',
                flexShrink: 0
              }}
            >
              <SnowflakeIcon size={13} color="#29B5E8" />
              <span>Cortex WH</span>
            </button>
          )}

          {/* Solana Devnet Wallet Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '4px 10px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-full)',
            flexShrink: 0
          }}>
            {wallet.walletType === 'phantom' && wallet.isConnected ? (
              <div
                title={`Connected to Phantom: ${wallet.publicKey} (Solana Devnet)`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  color: '#C084FC',
                  fontSize: '0.70rem',
                  fontWeight: 700
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
                <span>Phantom {wallet.publicKey.slice(0, 4)}..{wallet.publicKey.slice(-4)}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  if (SolanaService.hasPhantomWallet()) {
                    const connected = await SolanaService.connectPhantomWallet();
                    if (connected) onConnectWallet?.(connected);
                  } else {
                    window.open('https://phantom.app/', '_blank');
                  }
                }}
                title={SolanaService.hasPhantomWallet() ? "Connect Phantom wallet extension" : "Phantom wallet not detected. Click to install."}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  borderRadius: 4,
                  padding: '2px 7px',
                  cursor: 'pointer'
                }}
              >
                Connect Phantom
              </button>
            )}

            {!(wallet.walletType === 'phantom' && wallet.isConnected) && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.68rem',
                  color: '#34D399',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700
                }}
                title="Vouch Devnet Sponsor Relayer — Gasless execution for zero-friction evaluation"
              >
                <Bolt size={10} color="#10B981" />
                <span>Sponsored</span>
              </span>
            )}

            <span style={{ fontSize: '0.80rem', fontWeight: 800, color: '#F8FAFC', fontFamily: 'var(--font-mono)' }}>
              {wallet.balanceSOL.toFixed(2)} SOL
            </span>

            <button
              onClick={onAirdrop}
              title="Request +1.0 SOL Devnet Faucet Airdrop"
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.28)',
                color: '#34D399',
                fontSize: '0.68rem',
                fontWeight: 700,
                borderRadius: 4,
                padding: '2px 6px',
                cursor: 'pointer'
              }}
            >
              +1 SOL
            </button>
          </div>

          {/* 1-Click Judge Walkthrough Trigger */}
          {onOpenJudgeModal && (
            <button
              onClick={onOpenJudgeModal}
              className="btn btn-secondary"
              title="Open 60-second interactive sponsor showcase walkthrough dock for judges"
              style={{
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 'var(--radius-full)',
                flexShrink: 0
              }}
            >
              <Sparkles size={13} color="#C084FC" />
              <span>Judge Tour</span>
            </button>
          )}

          {/* Protocol Telemetry Trigger */}
          {onOpenHealthModal && (
            <button
              onClick={onOpenHealthModal}
              className="btn btn-secondary"
              title="View live subsystem health & telemetry diagnostics"
              style={{
                padding: '6px 10px',
                fontSize: '0.76rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 'var(--radius-full)',
                flexShrink: 0
              }}
            >
              <Activity size={13} color="#10B981" />
              <span>Telemetry</span>
            </button>
          )}

          {/* Speak / Request Aid Button (Primary CTA) */}
          <button
            onClick={onOpenVoiceModal}
            className="btn btn-primary"
            style={{ padding: '7px 16px', fontSize: '0.82rem', flexShrink: 0 }}
          >
            <PlusCircle size={14} />
            <span>Speak a Need</span>
          </button>
        </div>
      </div>
    </header>
  );
};
