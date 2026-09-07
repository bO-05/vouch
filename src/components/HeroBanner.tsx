import React from 'react';
import { Play, Pause, Mic, ShieldCheck, Heart, Globe, CheckCircle2 } from './Icons';
import { UNTheme } from '../types';

interface HeroBannerProps {
  totalGrantsSOL: number;
  totalStories: number;
  totalDeliveredItems: number;
  selectedTheme: UNTheme | 'ALL';
  onSelectTheme: (theme: UNTheme | 'ALL') => void;
  onPlaySpotlight: () => void;
  isPlayingSpotlight: boolean;
  onOpenVoiceModal: () => void;
  onOpenUNModal: () => void;
  onOpenSnowflakeModal?: () => void;
}

const CAUSE_FILTERS: { label: UNTheme | 'ALL'; display: string }[] = [
  { label: 'ALL', display: 'All Needs' },
  { label: 'Climate & Poverty', display: 'Climate & Freezes' },
  { label: 'Equity & Inclusion', display: 'Elder & Multilingual' },
  { label: 'Youth Leadership', display: 'Youth STEM' },
  { label: 'Ethical Giving', display: 'Solidarity Pantries' },
  { label: 'Tech-Driven Giving', display: 'Solar & Tech' }
];

export const HeroBanner: React.FC<HeroBannerProps> = ({
  totalGrantsSOL,
  totalStories,
  totalDeliveredItems,
  selectedTheme,
  onSelectTheme,
  onPlaySpotlight,
  isPlayingSpotlight,
  onOpenVoiceModal,
  onOpenUNModal
}) => {
  return (
    <section style={{
      maxWidth: 1300,
      margin: '0 auto',
      padding: '36px 24px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 28,
      width: '100%'
    }}>
      {/* Editorial Headline & Value Proposition */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 24
      }}>
        <div style={{ maxWidth: 740, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Eyebrow badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 700,
              color: 'var(--brand-amber)',
              background: 'rgba(245, 158, 11, 0.1)',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid rgba(245, 158, 11, 0.25)'
            }}>
              Direct Peer-to-Peer Philanthropy
            </span>
            <span style={{
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)'
            }}>
              Solana Devnet
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.1rem, 4.2vw, 3.1rem)',
            fontWeight: 800,
            lineHeight: 1.12,
            letterSpacing: '-0.035em',
            color: '#F8FAFC'
          }}>
            Spoken Need.<br />
            <span className="gradient-text-gold">Verified Trust.</span>
          </h1>

          <p style={{
            fontSize: '1rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: 680
          }}>
            Vulnerable neighbors speak needs in their authentic tongue. Google Gemini structures the items,
            ElevenLabs provides compassionate narration, and Solana locks milestone escrows released only upon
            receipt OCR proof.
          </p>

          {/* Primary Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
            <button
              onClick={onOpenVoiceModal}
              className="btn btn-primary"
              style={{ padding: '10px 20px', fontSize: '0.88rem' }}
            >
              <Mic size={16} />
              <span>Record Voice Need</span>
            </button>

            <button
              onClick={onPlaySpotlight}
              className="btn btn-secondary"
              style={{ padding: '10px 18px', fontSize: '0.88rem' }}
            >
              {isPlayingSpotlight ? <Pause size={16} color="var(--brand-amber)" /> : <Play size={16} />}
              <span>{isPlayingSpotlight ? 'Pause Spotlight' : "Hear Rachel's Story"}</span>
            </button>

            <button
              onClick={onOpenUNModal}
              className="btn btn-secondary"
              style={{
                padding: '10px 18px',
                fontSize: '0.88rem',
                borderColor: 'rgba(56, 189, 248, 0.3)',
                color: '#38BDF8'
              }}
            >
              <Globe size={15} color="#38BDF8" />
              <span>Live UN Crisis Feed</span>
            </button>
          </div>
        </div>

        {/* Unified Protocol Telemetry Ledger Card */}
        <div style={{
          flex: '1 1 340px',
          maxWidth: 440,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '22px 24px',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
            <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              On-Chain Ledger Telemetry
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: '#34D399', fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
              <span>Active Consensus</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Total Aid Granted</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#10B981', marginTop: 2 }}>
                {totalGrantsSOL.toFixed(2)} SOL
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Spoken Stories</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#F8FAFC', marginTop: 2 }}>
                {totalStories}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Delivered Items</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#F8FAFC', marginTop: 2 }}>
                {totalDeliveredItems}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Proof Guarantee</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#38BDF8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={18} color="#38BDF8" />
                <span>OCR Valid</span>
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            fontSize: '0.74rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid rgba(255, 255, 255, 0.04)'
          }}>
            <span>Milestone Escrow Architecture</span>
            <span style={{ color: '#34D399', fontWeight: 700 }}>100% Cryptographic</span>
          </div>
        </div>
      </div>

      {/* Cause Filter Tags */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        overflowX: 'auto',
        paddingBottom: 4,
        scrollbarWidth: 'none',
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: 16
      }}>
        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: 4, flexShrink: 0 }}>
          Filter By Need:
        </span>
        {CAUSE_FILTERS.map((cause) => {
          const isSelected = selectedTheme === cause.label;
          return (
            <button
              key={cause.display}
              onClick={() => onSelectTheme(cause.label)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                background: isSelected ? '#F8FAFC' : 'rgba(255, 255, 255, 0.04)',
                color: isSelected ? '#080A0F' : 'var(--text-secondary)',
                border: isSelected ? '1px solid #FFFFFF' : '1px solid var(--border-subtle)',
                boxShadow: isSelected ? '0 1px 4px rgba(0, 0, 0, 0.4)' : 'none'
              }}
            >
              {cause.display}
            </button>
          );
        })}
      </div>
    </section>
  );
};
