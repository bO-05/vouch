import React, { useState } from 'react';
import { Play, Pause, CheckCircle2, Mic, Bolt, Share2, ShieldCheck, Globe, FileText, Thermometer, Award, ExternalLink, Check } from './Icons';
import { AidRequest } from '../types';
import { SolanaService, PROTOCOL_ESCROW_VAULT } from '../services/solanaService';

interface AidCardProps {
  request: AidRequest;
  isPlayingAudio: boolean;
  onPlayAudio: (langMode?: 'original' | 'english') => void;
  onOpenDonateModal: (customAmountSOL?: number) => void;
  onOpenProofModal: () => void;
  onToggleItemFulfilled: (itemId: string) => void;
  onOpenNonprofitModal?: (req: AidRequest) => void;
  onOpenCertificateModal?: (req: AidRequest) => void;
}

const PRESET_SOL_AMOUNTS = [
  { sol: 0.05, label: '+0.05' },
  { sol: 0.10, label: '+0.10' },
  { sol: 0.25, label: '+0.25' },
  { sol: -1, label: 'Custom' }
];

export const AidCard: React.FC<AidCardProps> = ({
  request,
  isPlayingAudio,
  onPlayAudio,
  onOpenDonateModal,
  onOpenProofModal,
  onToggleItemFulfilled,
  onOpenNonprofitModal,
  onOpenCertificateModal
}) => {
  const [selectedPresetSOL, setSelectedPresetSOL] = useState<number>(0.10);
  const [copiedLink, setCopiedLink] = useState(false);
  const [audioLangMode, setAudioLangMode] = useState<'original' | 'english'>('english');
  const [audioProgress, setAudioProgress] = useState<number>(0);

  React.useEffect(() => {
    if (!isPlayingAudio) {
      setAudioProgress(0);
      return;
    }
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ progress: number }>;
      if (custom.detail?.progress !== undefined) {
        setAudioProgress(custom.detail.progress);
      }
    };
    window.addEventListener('vouch-audio-progress', handler);
    window.addEventListener('echokind-audio-progress', handler);
    return () => {
      window.removeEventListener('vouch-audio-progress', handler);
      window.removeEventListener('echokind-audio-progress', handler);
    };
  }, [isPlayingAudio]);

  const percentFunded = Math.min(100, Math.round((request.raisedAmountSOL / request.targetAmountSOL) * 100));
  const remainingSOL = Math.max(0, Number((request.targetAmountSOL - request.raisedAmountSOL).toFixed(2)));

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePresetClick = (sol: number) => {
    if (sol === -1) {
      onOpenDonateModal();
    } else {
      setSelectedPresetSOL(sol);
    }
  };

  const handleInstantPledge = () => {
    onOpenDonateModal(selectedPresetSOL);
  };

  const latestGrant = React.useMemo(() => {
    try {
      const grants = SolanaService.getAllGrants();
      return grants.find(g => g.requestId === request.id);
    } catch {
      return undefined;
    }
  }, [request.id, request.raisedAmountSOL, request.donorCount]);

  const hasMultilingual = !!request.originalLanguage && request.originalLanguage !== 'en-US';

  return (
    <article
      id={`aid-card-${request.id}`}
      className="glass-panel glass-panel-hover"
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: 22,
        gap: 16,
        position: 'relative'
      }}
    >
      {/* 1. Header: Neighbor Avatar, Identity, and Urgency Badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Avatar with subtle ring */}
          <div style={{
            position: 'relative',
            width: 44,
            height: 44,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '1px solid var(--border-medium)',
            flexShrink: 0
          }}>
            <img
              src={request.imageUrl}
              alt={request.authorName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.01em' }}>
                {request.authorName}
              </h2>

              {/* Verified Badge */}
              <span className="badge badge-verified">
                <CheckCircle2 size={11} color="#34D399" />
                <span>Verified</span>
              </span>

              {/* Category Badge (Single occurrence) */}
              {request.category && (
                <span style={{
                  fontSize: '0.68rem',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontWeight: 600
                }}>
                  {request.category}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {request.location} · {request.authorRole}
              </span>

              {/* Verified On-Chain Solana Recipient Vault */}
              {(() => {
                const rawWallet = request.recipientWallet;
                const isDeadKey = !rawWallet || rawWallet.startsWith('A6hC') || rawWallet.startsWith('2CKY') || rawWallet.startsWith('2iqY') || rawWallet.startsWith('84Lu');
                const vaultAddr = isDeadKey ? PROTOCOL_ESCROW_VAULT : rawWallet;
                return (
                  <a
                    href={`https://explorer.solana.com/address/${vaultAddr}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '0.68rem',
                      fontFamily: 'var(--font-mono)',
                      color: '#34D399',
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.22)',
                      borderRadius: 'var(--radius-full)',
                      padding: '2px 8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      textDecoration: 'none'
                    }}
                    title={`Recipient Solana Vault: ${vaultAddr}`}
                  >
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981' }} />
                    <span>Vault: {vaultAddr.slice(0, 4)}..{vaultAddr.slice(-4)}</span>
                    <ExternalLink size={9} />
                  </a>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Urgency Status Badge */}
        {request.status === 'fulfilled' ? (
          <span className="badge badge-fulfilled">
            <CheckCircle2 size={12} />
            <span>Fulfilled</span>
          </span>
        ) : (
          <span className="badge badge-urgent">
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--brand-amber)' }} />
            <span>{request.urgency === 'urgent' ? 'Immediate' : 'Priority'}</span>
          </span>
        )}
      </div>

      {/* Secondary Tags Row: UN, IRS 501(c)(3), Climate */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {/* UN ReliefWeb Badge */}
        {(request.isUnCrisis || request.tags?.includes('UN-OCHA')) && (
          <span className="badge badge-climate">
            <Globe size={11} color="#38BDF8" />
            <span>UN ReliefWeb</span>
          </span>
        )}

        {/* IRS 501(c)(3) Transparency Badge */}
        {request.is501c3Verified && (
          <button
            type="button"
            onClick={() => onOpenNonprofitModal?.(request)}
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 'var(--radius-full)',
              padding: '2px 8px',
              color: '#34D399',
              fontSize: '0.68rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer'
            }}
            title="Inspect IRS Form 990 filing on ProPublica Nonprofit Explorer"
          >
            <ShieldCheck size={11} />
            <span>IRS 501(c)(3)</span>
          </button>
        )}

        {/* Live Geo-Climate Telemetry */}
        {request.climateData && (
          <span style={{
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
            background: request.climateData.temperatureC <= 0 ? 'rgba(56, 189, 248, 0.12)' : 'rgba(245, 158, 11, 0.12)',
            border: `1px solid ${request.climateData.temperatureC <= 0 ? 'rgba(56, 189, 248, 0.28)' : 'rgba(245, 158, 11, 0.28)'}`,
            color: request.climateData.temperatureC <= 0 ? '#38BDF8' : '#FBBF24',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4
          }}>
            <Thermometer size={10} />
            <span>{request.climateData.temperatureC}°C · {request.climateData.alertBadge || request.climateData.weatherCondition}</span>
          </span>
        )}
      </div>

      {/* 2. Spoken Story Excerpt */}
      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 6 }}>
          {request.title}
        </h3>
        <blockquote style={{
          fontSize: '0.88rem',
          color: '#CBD5E1',
          lineHeight: 1.55,
          fontStyle: 'italic',
          borderLeft: '2px solid rgba(245, 158, 11, 0.4)',
          paddingLeft: 12,
          margin: 0
        }}>
          “{request.description}”
        </blockquote>

        {/* Original Dialect Transcript if Multilingual */}
        {hasMultilingual && request.originalTranscript && (
          <div style={{
            marginTop: 8,
            padding: '6px 10px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '2px solid #38BDF8',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)'
          }}>
            <span style={{ fontSize: '0.68rem', color: '#38BDF8', fontWeight: 700, textTransform: 'uppercase', display: 'block', letterSpacing: '0.04em' }}>
              Original Tongue ({request.originalLanguageLabel || request.originalLanguage}):
            </span>
            "{request.originalTranscript}"
          </div>
        )}
      </div>

      {/* 3. In-Card Voice Note Player Bar */}
      <div style={{
        background: 'rgba(8, 10, 15, 0.7)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }}>
        {/* Top bar: Voice note label + Multilingual Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', fontFamily: 'var(--font-mono)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
            <Mic size={13} color="var(--brand-amber)" />
            <span style={{ color: '#F8FAFC', fontWeight: 600 }}>
              {request.authorName.split(' ')[0]}'s Spoken Story
            </span>
          </div>

          {/* Multilingual Switcher if available */}
          {hasMultilingual ? (
            <div style={{ display: 'flex', gap: 3, background: 'rgba(255, 255, 255, 0.05)', padding: 2, borderRadius: 'var(--radius-sm)' }}>
              <button
                type="button"
                onClick={() => setAudioLangMode('original')}
                style={{
                  background: audioLangMode === 'original' ? 'var(--brand-amber)' : 'transparent',
                  color: audioLangMode === 'original' ? '#080A0F' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: 3,
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  cursor: 'pointer'
                }}
              >
                Native
              </button>
              <button
                type="button"
                onClick={() => setAudioLangMode('english')}
                style={{
                  background: audioLangMode === 'english' ? 'var(--brand-emerald)' : 'transparent',
                  color: audioLangMode === 'english' ? '#080A0F' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: 3,
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  cursor: 'pointer'
                }}
              >
                English
              </button>
            </div>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>
              0:{request.audioDurationSec < 10 ? `0${request.audioDurationSec}` : request.audioDurationSec}
            </span>
          )}
        </div>

        {/* Playback Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => onPlayAudio(audioLangMode)}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: isPlayingAudio ? 'var(--brand-amber)' : '#F8FAFC',
              color: '#080A0F',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.5)',
              transition: 'all 0.15s ease'
            }}
            title={isPlayingAudio ? 'Pause Voice Story' : `Play (${audioLangMode.toUpperCase()})`}
          >
            {isPlayingAudio ? <Pause size={15} color="#080A0F" /> : <Play size={15} color="#080A0F" fill="#080A0F" />}
          </button>

          {/* Waveform Scrubber */}
          <div
            onClick={() => onPlayAudio(audioLangMode)}
            style={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1, height: 22, cursor: 'pointer' }}
            title="Click to Listen"
          >
            {[10, 16, 22, 14, 20, 18, 12, 16, 22, 15, 9, 14, 11, 17, 20, 13, 10, 15, 18, 12].map((height, i) => {
              const totalBars = 20;
              const playedBars = isPlayingAudio ? Math.max(1, Math.round((audioProgress / 100) * totalBars)) : 4;
              const isPlayed = i < playedBars;
              const isCurrentBar = isPlayingAudio && i === playedBars - 1;
              return (
                <span
                  key={i}
                  style={{
                    width: 3,
                    height: isPlayingAudio ? (isCurrentBar ? 22 : Math.max(6, (height + (i % 3) * 3))) : height,
                    borderRadius: 9999,
                    background: isPlayed ? (audioLangMode === 'original' ? 'var(--brand-amber)' : 'var(--brand-emerald)') : '#2D3748',
                    transition: 'all 0.15s ease'
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Bottom Status Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.70rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          paddingTop: 4,
          borderTop: '1px solid rgba(255, 255, 255, 0.04)'
        }}>
          <span>{request.unTheme}</span>
          <span style={{ color: request.status === 'fulfilled' ? '#34D399' : 'var(--brand-amber-light)' }}>
            {request.status === 'fulfilled' ? 'Escrow Released' : 'Milestone Escrow Locked'}
          </span>
        </div>
      </div>

      {/* 4. Fulfilled Photo / Receipt Proof Showcase */}
      {request.status === 'fulfilled' && (
        <div style={{
          position: 'relative',
          width: '100%',
          height: 140,
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: '1px solid var(--border-medium)',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)'
        }}>
          <img
            src={request.verifiedProofImageUrl || request.imageUrl}
            alt="Delivery proof"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(8, 10, 15, 0.85) 0%, rgba(8, 10, 15, 0.1) 60%, transparent 100%)'
          }} />
          <div style={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            right: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(8, 10, 15, 0.92)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 'var(--radius-full)',
            padding: '5px 12px'
          }}>
            <span style={{ color: '#34D399', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {request.receiptDetails ? <FileText size={12} color="#10B981" /> : <CheckCircle2 size={12} color="#10B981" />}
              {request.receiptDetails
                ? `OCR Verified: ${request.receiptDetails.storeName.slice(0, 18)}`
                : 'Delivery confirmed'}
            </span>
            <span style={{ fontWeight: 700, color: '#F8FAFC', fontSize: '0.74rem', fontFamily: 'var(--font-mono)' }}>
              {request.targetAmountSOL} SOL total
            </span>
          </div>
        </div>
      )}

      {/* 5. Requested Items Checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          <span>Needed Items</span>
          <span>Click item to toggle</span>
        </div>
        {request.itemsNeeded.map((item) => (
          <div
            key={item.id}
            onClick={() => onToggleItemFulfilled(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.82rem',
              padding: '6px 8px',
              borderRadius: 'var(--radius-sm)',
              background: item.fulfilled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.02)',
              border: item.fulfilled ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid transparent',
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                border: item.fulfilled ? 'none' : '1px solid rgba(255, 255, 255, 0.3)',
                background: item.fulfilled ? 'var(--brand-emerald)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {item.fulfilled && <CheckCircle2 size={11} color="#080A0F" />}
              </div>
              <span style={{
                textDecoration: item.fulfilled ? 'line-through' : 'none',
                color: item.fulfilled ? 'var(--text-muted)' : '#F8FAFC',
                fontWeight: item.fulfilled ? 400 : 500
              }}>
                {item.quantity} {item.unit} {item.name}
              </span>
            </div>
            {item.estimatedCostUSD && (
              <span style={{ fontSize: '0.72rem', color: item.fulfilled ? 'var(--text-muted)' : 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                ≈${item.estimatedCostUSD}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* 6. Funding Progress & Neighbors Pooled */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#F8FAFC' }}>
              {request.raisedAmountSOL.toFixed(2)} SOL
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              of {request.targetAmountSOL.toFixed(1)} SOL
            </span>
          </div>
          <span style={{ fontSize: '0.78rem', color: '#34D399', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            {remainingSOL > 0 ? `${remainingSOL} SOL remaining` : 'Fully Funded'}
          </span>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: 6, borderRadius: 9999, background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
          <div style={{
            width: `${percentFunded}%`,
            height: '100%',
            background: 'linear-gradient(90deg, var(--brand-amber), var(--brand-emerald))',
            borderRadius: 9999,
            transition: 'width 0.4s ease'
          }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          <span>{request.donorCount} neighbors pooled</span>
          <span>{percentFunded}% complete</span>
        </div>
      </div>

      {/* Live Devnet Confirmed Chip (if active grant exists) */}
      {latestGrant && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.70rem',
          padding: '5px 10px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          color: '#34D399'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981' }} />
            <span style={{ fontWeight: 700, color: '#F8FAFC' }}>Devnet Slot:</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: '#34D399', fontWeight: 800 }}>
              #{latestGrant.slot || '494513996'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a
              href={`https://explorer.solana.com/tx/${latestGrant.txSignature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#34D399', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}
            >
              <span>Explorer</span>
              <ExternalLink size={9} />
            </a>
            <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
            <a
              href={`https://solscan.io/tx/${latestGrant.txSignature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#38BDF8', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}
            >
              <span>Solscan</span>
              <ExternalLink size={9} />
            </a>
          </div>
        </div>
      )}

      {/* 7. Inline Micro-Grant Action Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
        {/* Preset Amount Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {PRESET_SOL_AMOUNTS.map((p) => {
            const isActive = selectedPresetSOL === p.sol;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => handlePresetClick(p.sol)}
                className={`preset-btn ${isActive ? 'active' : ''}`}
              >
                {p.label} SOL
              </button>
            );
          })}
        </div>

        {/* Action Buttons Row */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleInstantPledge}
            className="btn btn-emerald"
            style={{ flex: 1, padding: '10px 16px', fontSize: '0.86rem' }}
            title="1-Click Sponsored Devnet Micro-Grant"
          >
            <Bolt size={15} fill="#080A0F" />
            <span>Pool {selectedPresetSOL > 0 ? `${selectedPresetSOL} SOL` : ''} Micro-Grant</span>
          </button>

          <button
            onClick={handleShare}
            aria-label="Share story"
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              color: copiedLink ? '#34D399' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title={copiedLink ? 'Link Copied!' : 'Share Story'}
          >
            <Share2 size={15} />
          </button>

          {/* VisionGuard Proof Trigger */}
          <button
            onClick={onOpenProofModal}
            title="Upload Delivery Proof / Scan Receipt with Gemini Vision"
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              color: '#38BDF8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <ShieldCheck size={16} />
          </button>

          {/* Proof Certificate Trigger if fulfilled */}
          {request.status === 'fulfilled' && (
            <button
              onClick={() => onOpenCertificateModal?.(request)}
              title="Inspect SHA-256 Proof of Generosity Certificate"
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                color: 'var(--brand-amber)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Award size={16} />
            </button>
          )}
        </div>

        {/* Quiet, Dignified Trust Reassurance Note */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', padding: '0 2px' }}>
          <span style={{ color: '#34D399', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Check size={11} color="#34D399" />
            <span>Sponsored 1-Click Execution</span>
          </span>
          <span>No wallet extension required</span>
        </div>
      </div>
    </article>
  );
};
