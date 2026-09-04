import React from 'react';
import { Play, Pause, Mic, ShieldCheck, Heart, Sparkles, CheckCircle2 } from './Icons';
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
}

const UN_THEMES: { label: UNTheme | 'ALL'; desc: string; badgeClass: string }[] = [
  { label: 'ALL', desc: 'All Community Needs', badgeClass: 'badge-equity' },
  { label: 'Equity & Inclusion', desc: 'Disability & Accessibility', badgeClass: 'badge-equity' },
  { label: 'Climate & Poverty', desc: 'Disaster & Resilience', badgeClass: 'badge-climate' },
  { label: 'Youth Leadership', desc: 'Next-Gen Education', badgeClass: 'badge-youth' },
  { label: 'Ethical Giving', desc: 'Zero Waste & Food', badgeClass: 'badge-ethical' },
  { label: 'Tech-Driven Giving', desc: 'Fast Mutual Aid', badgeClass: 'badge-tech' }
];

export const HeroBanner: React.FC<HeroBannerProps> = ({
  totalGrantsSOL,
  totalStories,
  totalDeliveredItems,
  selectedTheme,
  onSelectTheme,
  onPlaySpotlight,
  isPlayingSpotlight,
  onOpenVoiceModal
}) => {
  return (
    <section style={{
      maxWidth: 1300,
      margin: '0 auto',
      padding: '40px 24px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 32
    }}>
      {/* Top Banner Hero Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 28,
        alignItems: 'center'
      }}>
        {/* Left Column: Vision & Pitch */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span className="badge" style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(236, 72, 153, 0.2))',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#FDE68A',
              padding: '6px 12px',
              fontSize: '0.8rem'
            }}>
              <Sparkles size={14} color="#F59E0B" />
              Built for DEV Weekend Challenge: Generosity Edition
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.3rem, 5vw, 3.4rem)',
            lineHeight: 1.12,
            letterSpacing: '-0.03em'
          }}>
            When a neighbor speaks, <br />
            <span className="gradient-text-gold">kindness echoes.</span>
          </h1>

          <p style={{
            fontSize: '1.08rem',
            color: 'var(--text-secondary)',
            maxWidth: 580,
            lineHeight: 1.65
          }}>
            Traditional charity is bogged down by paperwork and cold forms. 
            <strong> EchoKind</strong> empowers grassroots communities to speak their needs out loud. 
            <strong> ElevenLabs</strong> breathes human empathy into audio stories, 
            <strong> Google Gemini AI</strong> structures and verifies delivery proof, and 
            <strong> Solana</strong> powers instant, zero-middleman micro-grants in escrow.
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 6 }}>
            <button
              onClick={onOpenVoiceModal}
              className="btn btn-primary"
              style={{ padding: '12px 24px', fontSize: '1rem' }}
            >
              <Mic size={18} />
              <span>Speak a Need / Offer Aid</span>
            </button>

            <button
              onClick={onPlaySpotlight}
              className="btn btn-voice"
              style={{ padding: '12px 20px', fontSize: '0.95rem' }}
            >
              {isPlayingSpotlight ? <Pause size={18} /> : <Play size={18} />}
              <span>{isPlayingSpotlight ? 'Pause Spotlight' : 'Hear Rachel\'s Story (Audio)'}</span>
              {isPlayingSpotlight && (
                <div className="waveform-bars">
                  <div className="waveform-bar"></div>
                  <div className="waveform-bar"></div>
                  <div className="waveform-bar"></div>
                  <div className="waveform-bar"></div>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Impact Showcase Card */}
        <div className="glass-panel" style={{
          padding: 28,
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(145deg, rgba(18, 26, 43, 0.9), rgba(12, 18, 30, 0.95))',
          border: '1px solid rgba(245, 158, 11, 0.25)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#10B981',
                boxShadow: '0 0 10px #10B981'
              }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Live Generosity Ledger
              </span>
            </div>
            <span className="badge badge-tech">Solana Devnet</span>
          </div>

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 16,
            marginBottom: 24
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#14F195', marginBottom: 4 }}>
                <Heart size={16} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>SOL Micro-Grants</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#F8FAFC' }}>
                {totalGrantsSOL.toFixed(2)} <span style={{ fontSize: '1rem', color: '#14F195' }}>SOL</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                ≈ ${(totalGrantsSOL * 145).toLocaleString()} USD distributed
              </span>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#FB7185', marginBottom: 4 }}>
                <Mic size={16} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Spoken Stories</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#F8FAFC' }}>
                {totalStories}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Narrated via ElevenLabs
              </span>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#F59E0B', marginBottom: 4 }}>
                <CheckCircle2 size={16} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Aid Delivered</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#F8FAFC' }}>
                {totalDeliveredItems}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Essential packages & items
              </span>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#60A5FA', marginBottom: 4 }}>
                <ShieldCheck size={16} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>VisionGuard Proof</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#F8FAFC' }}>
                100%
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Gemini Multimodal Verified
              </span>
            </div>
          </div>

          {/* Quick Pillar Highlights */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: 16,
            fontSize: '0.8rem',
            color: 'var(--text-secondary)'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#F59E0B' }}>●</span> Google AI
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#FB7185' }}>●</span> ElevenLabs
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#14F195' }}>●</span> Solana Escrow
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#38BDF8' }}>●</span> UN Themes
            </span>
          </div>
        </div>
      </div>

      {/* UN Theme Quick Filters Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        overflowX: 'auto',
        paddingBottom: 6,
        scrollbarWidth: 'none'
      }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap', marginRight: 4 }}>
          Filter by UN Theme:
        </span>
        {UN_THEMES.map((theme) => {
          const isSelected = selectedTheme === theme.label;
          return (
            <button
              key={theme.label}
              onClick={() => onSelectTheme(theme.label)}
              style={{
                padding: '7px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: 600,
                border: isSelected ? '1px solid var(--primary-amber)' : '1px solid var(--border-subtle)',
                background: isSelected ? 'rgba(245, 158, 11, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                color: isSelected ? '#FDE68A' : 'var(--text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {theme.label === 'ALL' ? '🌍 All Themes' : theme.label}
            </button>
          );
        })}
      </div>
    </section>
  );
};
