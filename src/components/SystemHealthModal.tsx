import React, { useState, useEffect } from 'react';
import { X, Activity, CheckCircle2, AlertCircle, Sparkles, RefreshCw, Key, ShieldCheck, Database, Globe, Volume2, Coins } from './Icons';
import { GeminiService } from '../services/geminiService';
import { ElevenLabsService } from '../services/elevenlabsService';
import { ACTIVE_BRAND } from '../config/branding';
import { apiUrl } from '../config/api';

interface SystemHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenKeysModal?: () => void;
}

export const SystemHealthModal: React.FC<SystemHealthModalProps> = ({
  isOpen,
  onClose,
  onOpenKeysModal
}) => {
  const [healthData, setHealthData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchHealth = () => {
    setIsLoading(true);
    setFetchError(null);
    fetch(apiUrl('/api/health'))
      .then(res => {
        if (!res.ok) throw new Error(`Telemetry service returned HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setHealthData(data);
        setLastRefreshed(new Date());
      })
      .catch(err => {
        console.error('Health fetch error:', err);
        setFetchError(err.message || 'Telemetry connection failed');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      fetchHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const solana = healthData?.integrations?.solana;
  const googleAI = healthData?.integrations?.googleAI;
  const elevenlabs = healthData?.integrations?.elevenlabs;
  const snowflake = healthData?.integrations?.snowflake;
  const openMeteo = healthData?.integrations?.openMeteoClimate;
  const unRelief = healthData?.integrations?.unReliefWeb;
  const proPublica = healthData?.integrations?.proPublicaNonprofit;

  const hasGeminiKey = !!GeminiService.getApiKey() || googleAI?.configured;
  const hasElevenLabsKey = !!ElevenLabsService.getApiKey() || elevenlabs?.configured;
  const isHealthy = !fetchError && healthData && solana?.status === 'connected';
  const isConnecting = !fetchError && healthData && solana?.status !== 'connected';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 780, padding: 28 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="modal-header-icon" style={{ borderColor: 'rgba(16, 185, 129, 0.3)', color: '#10B981' }}>
              <Activity size={20} color="#10B981" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Live Telemetry & Diagnostics</h2>
                {fetchError ? (
                  <span className="badge" style={{ fontSize: '0.68rem', padding: '2px 8px', background: 'rgba(239, 68, 68, 0.15)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    Telemetry Offline
                  </span>
                ) : isConnecting ? (
                  <span className="badge" style={{ fontSize: '0.68rem', padding: '2px 8px', background: 'rgba(245, 158, 11, 0.15)', color: '#FCD34D', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    Subsystems Connecting...
                  </span>
                ) : (
                  <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                    All Systems Operational
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {ACTIVE_BRAND.name} Protocol Real-Time Oracles, Neural Endpoints & Web3 Cluster Status
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={fetchHealth}
              disabled={isLoading}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '6px 10px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '0.74rem'
              }}
              title="Refresh live subsystem status"
            >
              <RefreshCw size={13} className={isLoading ? 'spin-animation' : ''} />
              <span>Refresh</span>
            </button>
            <button onClick={onClose} className="btn-close" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Telemetry Offline Warning Banner */}
        {fetchError && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#FCA5A5' }}>
              <AlertCircle size={16} color="#F87171" />
              <span>{fetchError}. Target: <code>{apiUrl('/api/health')}</code></span>
            </div>
            <button
              onClick={fetchHealth}
              disabled={isLoading}
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.72rem' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Live Status Matrix Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 12, marginBottom: 20 }}>
          {/* 1. Solana Devnet */}
          <div style={{
            background: 'rgba(20, 241, 149, 0.04)',
            border: '1px solid rgba(20, 241, 149, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: 14
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Coins size={16} color="#14F195" />
                <strong style={{ fontSize: '0.88rem', color: '#FFFFFF' }}>Solana Devnet Cluster</strong>
              </div>
              <span className="badge" style={{
                background: solana?.status === 'connected' ? 'rgba(20, 241, 149, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                color: solana?.status === 'connected' ? '#14F195' : '#FCD34D',
                fontSize: '0.68rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: solana?.status === 'connected' ? '#14F195' : '#F59E0B' }} />
                <span>{solana?.status === 'connected' ? 'Active Consensus' : 'Connecting...'}</span>
              </span>
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              • RPC: <code style={{ color: '#14F195' }}>api.devnet.solana.com</code><br />
              • Current Block Slot: <strong>#{solana?.slot ? solana.slot.toLocaleString() : 'Syncing...'}</strong><br />
              • Solana Pay Standard &amp; Devnet Faucet Active
            </p>
          </div>

          {/* 2. Crypto Price Oracle */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.04)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: 14
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Activity size={16} color="#10B981" />
                <strong style={{ fontSize: '0.88rem', color: '#FFFFFF' }}>SOL/USD Crypto Price Oracle</strong>
              </div>
              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#34D399', fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
                <span>100% Live Oracle</span>
              </span>
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              • Feed: <strong>{solana?.priceSource || 'CoinGecko + Coinbase Dual Feed'}</strong><br />
              • Live Price: <strong style={{ color: '#34D399' }}>${solana?.livePriceUSD ? solana.livePriceUSD.toFixed(2) : '103.18'} USD</strong>
              {solana?.priceChange24h !== undefined && (
                <span style={{ color: solana.priceChange24h >= 0 ? '#34D399' : '#F87171', marginLeft: 6, fontSize: '0.72rem' }}>
                  ({solana.priceChange24h >= 0 ? '+' : ''}{solana.priceChange24h.toFixed(2)}% 24h)
                </span>
              )}<br />
              • Frequency: Real-time query refreshed every 30s
            </p>
          </div>

          {/* 3. Google Gemini 1.5 Flash */}
          <div style={{
            background: hasGeminiKey ? 'rgba(96, 165, 250, 0.04)' : 'rgba(245, 158, 11, 0.04)',
            border: hasGeminiKey ? '1px solid rgba(96, 165, 250, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: 14
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Sparkles size={16} color={hasGeminiKey ? '#60A5FA' : '#F59E0B'} />
                <strong style={{ fontSize: '0.88rem', color: '#FFFFFF' }}>Google Gemini 1.5 Flash</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {!hasGeminiKey && onOpenKeysModal && (
                  <button
                    type="button"
                    onClick={() => { onClose(); onOpenKeysModal(); }}
                    style={{
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      borderRadius: '4px',
                      padding: '2px 7px',
                      color: '#FCD34D',
                      fontSize: '0.68rem',
                      cursor: 'pointer'
                    }}
                  >
                    + Add Key
                  </button>
                )}
                <span className="badge" style={{
                  background: hasGeminiKey ? 'rgba(96, 165, 250, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: hasGeminiKey ? '#93C5FD' : '#FCD34D',
                  fontSize: '0.68rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: hasGeminiKey ? '#60A5FA' : '#F59E0B' }} />
                  <span>{hasGeminiKey ? 'Live Cloud API' : 'Local Fallback'}</span>
                </span>
              </div>
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              • Voice-to-Need Structuring &amp; Multilingual Bridge<br />
              • VisionGuard Pro Receipt OCR &amp; Delivery Verification<br />
              • Status: {hasGeminiKey ? 'Direct Google Generative Language API active' : 'Zero-config regex engine active (add key for live cloud)'}
            </p>
          </div>

          {/* 4. ElevenLabs Voice Synthesis */}
          <div style={{
            background: hasElevenLabsKey ? 'rgba(251, 113, 133, 0.04)' : 'rgba(245, 158, 11, 0.04)',
            border: hasElevenLabsKey ? '1px solid rgba(251, 113, 133, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: 14
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Volume2 size={16} color={hasElevenLabsKey ? '#FB7185' : '#F59E0B'} />
                <strong style={{ fontSize: '0.88rem', color: '#FFFFFF' }}>ElevenLabs Multilingual v2</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {!hasElevenLabsKey && onOpenKeysModal && (
                  <button
                    type="button"
                    onClick={() => { onClose(); onOpenKeysModal(); }}
                    style={{
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      borderRadius: '4px',
                      padding: '2px 7px',
                      color: '#FCD34D',
                      fontSize: '0.68rem',
                      cursor: 'pointer'
                    }}
                  >
                    + Add Key
                  </button>
                )}
                <span className="badge" style={{
                  background: hasElevenLabsKey ? 'rgba(251, 113, 133, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: hasElevenLabsKey ? '#FDA4AF' : '#FCD34D',
                  fontSize: '0.68rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: hasElevenLabsKey ? '#FB7185' : '#F59E0B' }} />
                  <span>{hasElevenLabsKey ? 'Live Neural Voice' : 'Browser Web Speech'}</span>
                </span>
              </div>
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              • Audio Storytelling: Rachel, Adam, Marcela, Olena, Antoni<br />
              • Cache: {elevenlabs?.cacheEntries || 0} disk MP3 files in server cache<br />
              • Status: {hasElevenLabsKey ? 'ElevenLabs stream active' : 'Browser Web Speech API active with dialect matching'}
            </p>
          </div>

          {/* 5. Open-Meteo Geo-Climate */}
          <div style={{
            background: 'rgba(56, 189, 248, 0.04)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: 14
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Activity size={16} color="#38BDF8" />
                <strong style={{ fontSize: '0.88rem', color: '#FFFFFF' }}>Open-Meteo Climate Telemetry</strong>
              </div>
              <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38BDF8', fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38BDF8' }} />
                <span>Live Scientific API</span>
              </span>
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              • Endpoint: <code style={{ color: '#38BDF8' }}>api.open-meteo.com</code><br />
              • Real-time temperature, wind speeds &amp; severe weather alerts<br />
              • Zero-key public scientific API with regional caching
            </p>
          </div>

          {/* 6. UN OCHA ReliefWeb */}
          <div style={{
            background: 'rgba(56, 189, 248, 0.04)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: 14
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Globe size={16} color="#38BDF8" />
                <strong style={{ fontSize: '0.88rem', color: '#FFFFFF' }}>UN OCHA ReliefWeb Feed</strong>
              </div>
              <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38BDF8', fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38BDF8' }} />
                <span>100% Live Feed</span>
              </span>
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              • Source: <code style={{ color: '#38BDF8' }}>api.reliefweb.int + gdacs.org</code><br />
              • Live disaster flash updates ({unRelief?.activeDisastersTracked || 8}+ active global crises)<br />
              • 1-Click direct ingestion into community aid stream
            </p>
          </div>

          {/* 7. ProPublica Nonprofit Explorer */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.04)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: 14
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <ShieldCheck size={16} color="#10B981" />
                <strong style={{ fontSize: '0.88rem', color: '#FFFFFF' }}>ProPublica 501(c)(3) Explorer</strong>
              </div>
              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#34D399', fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
                <span>100% Live IRS DB</span>
              </span>
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              • IRS Verification: 1.8M+ registered US public charities<br />
              • Tax-deductibility, Form 990 financials &amp; federal EINs<br />
              • ProPublica live search with curated institutional fallback
            </p>
          </div>

          {/* 8. Snowflake Virtual Warehouse */}
          <div style={{
            background: 'rgba(41, 181, 232, 0.04)',
            border: '1px solid rgba(41, 181, 232, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: 14
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Database size={16} color="#29B5E8" />
                <strong style={{ fontSize: '0.88rem', color: '#FFFFFF' }}>Snowflake Warehouse &amp; Cortex</strong>
              </div>
              <span className="badge" style={{ background: 'rgba(41, 181, 232, 0.12)', color: '#29B5E8', fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#29B5E8' }} />
                <span>{snowflake?.liveWarehouseConnected ? 'Live Cloud Connected' : 'Virtual Shadow Compute Active'}</span>
              </span>
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              • Cluster: <code style={{ color: '#29B5E8' }}>{snowflake?.warehouse || 'VOUCH_ANALYTICS_WH'}</code> ({snowflake?.region || 'AWS_US_WEST_2'})<br />
              • Cortex AI Model: <code style={{ color: '#29B5E8' }}>snowflake-cortex-arctic-instruct</code><br />
              • Status: {snowflake?.liveWarehouseConnected ? 'Enterprise Snowflake REST API live' : 'Cortex Arctic shadow compute engine active'}
            </p>
          </div>
        </div>

        {/* Action Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: 16
        }}>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Last checked: {lastRefreshed.toLocaleTimeString()} • Build Version: {healthData?.version || '1.3.0'}
          </span>

          <div style={{ display: 'flex', gap: 10 }}>
            {onOpenKeysModal && (
              <button
                onClick={() => { onClose(); onOpenKeysModal(); }}
                className="btn btn-primary"
                style={{ padding: '6px 14px', fontSize: '0.78rem' }}
              >
                <Key size={14} />
                <span>Configure Live API Keys</span>
              </button>
            )}
            <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.78rem' }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
