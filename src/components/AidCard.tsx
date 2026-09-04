import React from 'react';
import { Play, Pause, MapPin, CheckCircle2, ShieldCheck, Heart, Sparkles, AlertCircle } from './Icons';
import { AidRequest } from '../types';

interface AidCardProps {
  request: AidRequest;
  isPlayingAudio: boolean;
  onPlayAudio: () => void;
  onOpenDonateModal: () => void;
  onOpenProofModal: () => void;
  onToggleItemFulfilled: (itemId: string) => void;
}

export const AidCard: React.FC<AidCardProps> = ({
  request,
  isPlayingAudio,
  onPlayAudio,
  onOpenDonateModal,
  onOpenProofModal,
  onToggleItemFulfilled
}) => {
  const percentFunded = Math.min(100, Math.round((request.raisedAmountSOL / request.targetAmountSOL) * 100));

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return <span className="badge badge-urgent"><AlertCircle size={12} /> Urgent Need</span>;
      case 'moderate':
        return <span className="badge badge-equity"><Sparkles size={12} /> Priority</span>;
      default:
        return <span className="badge badge-tech">Ongoing</span>;
    }
  };

  const getThemeBadge = (theme: string) => {
    switch (theme) {
      case 'Climate & Poverty': return <span className="badge badge-climate">🌱 Climate & Poverty</span>;
      case 'Youth Leadership': return <span className="badge badge-youth">⚡ Youth Leadership</span>;
      case 'Equity & Inclusion': return <span className="badge badge-equity">🤝 Equity & Inclusion</span>;
      case 'Ethical Giving': return <span className="badge badge-ethical">🍲 Ethical Giving</span>;
      default: return <span className="badge badge-tech">💡 Tech-Driven Giving</span>;
    }
  };

  return (
    <div className="glass-panel glass-panel-hover" style={{
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Top Image Banner with Voice Action Overlay */}
      <div style={{ position: 'relative', width: '100%', height: 210, overflow: 'hidden' }}>
        <img
          src={request.imageUrl}
          alt={request.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        />

        {/* Gradient Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(14, 21, 36, 0.95) 0%, rgba(14, 21, 36, 0.2) 60%, transparent 100%)'
        }} />

        {/* Badges Overlay */}
        <div style={{
          position: 'absolute',
          top: 14,
          left: 14,
          right: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8
        }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {getThemeBadge(request.unTheme)}
            {getUrgencyBadge(request.urgency)}
          </div>

          {request.status === 'fulfilled' && (
            <span className="badge" style={{
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#10B981',
              border: '1px solid rgba(16, 185, 129, 0.4)'
            }}>
              <CheckCircle2 size={12} /> 100% Fulfilled
            </span>
          )}
        </div>

        {/* Voice Play Button Overlay */}
        <div style={{
          position: 'absolute',
          bottom: 12,
          left: 14,
          right: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={onPlayAudio}
            className="btn"
            style={{
              background: isPlayingAudio
                ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                : 'rgba(8, 12, 20, 0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: isPlayingAudio ? '#0F172A' : '#FFFFFF',
              padding: '6px 14px',
              fontSize: '0.82rem',
              borderRadius: 'var(--radius-full)'
            }}
          >
            {isPlayingAudio ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
            <span>{isPlayingAudio ? 'Listening...' : 'Hear Spoken Story'}</span>
            {isPlayingAudio && (
              <div className="waveform-bars" style={{ height: 12 }}>
                <div className="waveform-bar" style={{ width: 2 }}></div>
                <div className="waveform-bar" style={{ width: 2 }}></div>
                <div className="waveform-bar" style={{ width: 2 }}></div>
              </div>
            )}
          </button>

          <span style={{
            fontSize: '0.75rem',
            color: '#E2E8F0',
            background: 'rgba(0, 0, 0, 0.6)',
            padding: '4px 8px',
            borderRadius: '6px',
            fontFamily: 'var(--font-mono)'
          }}>
            ~{request.audioDurationSec}s audio
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: 22, display: 'flex', flexDirection: 'column', flex: 1, gap: 14 }}>
        {/* Title */}
        <h3 style={{ fontSize: '1.2rem', lineHeight: 1.35, fontWeight: 700 }}>
          {request.title}
        </h3>

        {/* Author and Location Meta */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          <div>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{request.authorName}</span>
            <span style={{ color: 'var(--text-muted)' }}> • {request.authorRole}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
            <MapPin size={13} color="#F59E0B" />
            <span>{request.location.split(',')[0]}</span>
          </div>
        </div>

        {/* Description snippet */}
        <p style={{
          fontSize: '0.88rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {request.description}
        </p>

        {/* Needed Items Checklist */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Requested Items</span>
            <span>Click to mark given</span>
          </div>

          {request.itemsNeeded.map((item) => (
            <div
              key={item.id}
              onClick={() => onToggleItemFulfilled(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.84rem',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: '4px',
                background: item.fulfilled ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                transition: 'background 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 16,
                  height: 16,
                  borderRadius: '4px',
                  border: item.fulfilled ? 'none' : '1px solid var(--border-subtle)',
                  background: item.fulfilled ? '#10B981' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {item.fulfilled && <CheckCircle2 size={12} color="#FFFFFF" />}
                </div>
                <span style={{
                  textDecoration: item.fulfilled ? 'line-through' : 'none',
                  color: item.fulfilled ? 'var(--text-muted)' : 'var(--text-primary)'
                }}>
                  {item.quantity} {item.unit} {item.name}
                </span>
              </div>
              {item.estimatedCostUSD && (
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  ≈${item.estimatedCostUSD}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Solana Funding Progress Bar */}
        <div style={{ marginTop: 'auto', paddingTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <div>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#14F195' }}>
                {request.raisedAmountSOL.toFixed(2)} SOL
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {' '}of {request.targetAmountSOL.toFixed(1)} SOL
              </span>
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-accent)', fontFamily: 'var(--font-mono)' }}>
              {percentFunded}% funded
            </span>
          </div>

          {/* Progress track */}
          <div style={{
            width: '100%',
            height: 7,
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${percentFunded}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #F59E0B, #14F195)',
              borderRadius: 'var(--radius-full)',
              transition: 'width 0.4s ease-out'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span>{request.donorCount} community donors</span>
            <span>{request.status === 'fulfilled' ? 'Escrow Released' : 'Milestone Escrow Locked'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <button
            onClick={onOpenDonateModal}
            className="btn btn-solana"
            style={{ flex: 1, padding: '9px 12px', fontSize: '0.86rem' }}
          >
            <Heart size={15} />
            <span>Send Micro-Grant</span>
          </button>

          <button
            onClick={onOpenProofModal}
            className="btn btn-secondary"
            title="Upload photo proof of delivery to unlock escrow via Gemini VisionGuard"
            style={{ padding: '9px 12px', fontSize: '0.86rem' }}
          >
            <ShieldCheck size={15} color="#60A5FA" />
            <span>Verify Proof</span>
          </button>
        </div>
      </div>
    </div>
  );
};
