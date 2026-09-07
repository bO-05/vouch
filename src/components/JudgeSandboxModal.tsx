import React, { useState } from 'react';
import { X, Sparkles, Key, Info, Coins, SnowflakeIcon, FileText, Volume2, Activity } from './Icons';
import { GeminiService } from '../services/geminiService';
import { ElevenLabsService } from '../services/elevenlabsService';
import { SolanaService } from '../services/solanaService';
import { ACTIVE_BRAND } from '../config/branding';

interface JudgeSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAirdrop: () => void;
  onTriggerSnowflake?: () => void;
  onTriggerVisionOCR?: () => void;
  onTriggerMultilingualVoice?: () => void;
  onTriggerClimateRadar?: () => void;
  onTriggerMicroGrant?: () => void;
}

export const JudgeSandboxModal: React.FC<JudgeSandboxModalProps> = ({
  isOpen,
  onClose,
  onAirdrop,
  onTriggerSnowflake,
  onTriggerVisionOCR,
  onTriggerMultilingualVoice,
  onTriggerClimateRadar,
  onTriggerMicroGrant
}) => {
  const [geminiKey, setGeminiKey] = useState(GeminiService.getApiKey());
  const [elevenLabsKey, setElevenLabsKey] = useState(ElevenLabsService.getApiKey());
  const [saveMessage, setSaveMessage] = useState('');

  if (!isOpen) return null;

  const handleSaveKeys = () => {
    GeminiService.setApiKey(geminiKey.trim());
    ElevenLabsService.setApiKey(elevenLabsKey.trim());
    setSaveMessage('API Keys saved! Live endpoints will be used.');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleQuickAirdrop = async () => {
    await SolanaService.requestAirdrop(1.0);
    onAirdrop();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 760, padding: 30 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="modal-header-icon" style={{ borderColor: 'rgba(192, 132, 252, 0.3)', color: '#C084FC' }}>
              <Sparkles size={20} color="#C084FC" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Judge Quick Showcase & Architecture</h2>
                <span className="badge badge-tech" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                  &lt; 60s Tour
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                DEV Weekend Challenge • Sponsor Category Interactive Tour & Live Telemetry
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn-close" aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        {/* 1-Click Sponsor Verification Scenarios (Evaluate in Under 60 Seconds) */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: 16,
          marginBottom: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={15} color="#C084FC" />
              <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#F8FAFC' }}>
                1-Click Sponsor Category Demos (Zero-Friction Evaluation)
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Interactive Sandbox
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 10 }}>
            {/* Button 1 (Snowflake) */}
            <button
              type="button"
              onClick={() => { onClose(); onTriggerSnowflake?.(); }}
              style={{
                background: 'rgba(41, 181, 232, 0.08)',
                border: '1px solid rgba(41, 181, 232, 0.35)',
                borderRadius: 8,
                padding: 12,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#29B5E8', fontWeight: 700, fontSize: '0.86rem' }}>
                <SnowflakeIcon size={16} color="#29B5E8" />
                <span>1. Snowflake Cortex Anomaly Query</span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                Opens warehouse modal, highlights cluster <code style={{ color: '#29B5E8' }}>VOUCH_ANALYTICS_WH</code>, and auto-executes Cortex SQL anomaly query.
              </p>
            </button>

            {/* Button 2 (Gemini VisionGuard) */}
            <button
              type="button"
              onClick={() => { onClose(); onTriggerVisionOCR?.(); }}
              style={{
                background: 'rgba(96, 165, 250, 0.08)',
                border: '1px solid rgba(96, 165, 250, 0.35)',
                borderRadius: 8,
                padding: 12,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#93C5FD', fontWeight: 700, fontSize: '0.86rem' }}>
                <FileText size={16} color="#60A5FA" />
                <span>2. Gemini Supermarket Receipt OCR</span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                Opens VisionGuard modal, loads local grocery receipt SVG, extracts line items, and unlocks smart escrow at 98% match.
              </p>
            </button>

            {/* Button 3 (ElevenLabs) */}
            <button
              type="button"
              onClick={() => { onClose(); onTriggerMultilingualVoice?.(); }}
              style={{
                background: 'rgba(251, 113, 133, 0.08)',
                border: '1px solid rgba(251, 113, 133, 0.35)',
                borderRadius: 8,
                padding: 12,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#FDA4AF', fontWeight: 700, fontSize: '0.86rem' }}>
                <Volume2 size={16} color="#FB7185" />
                <span>3. Multilingual Voice &amp; Dialect Story</span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                Jumps to East LA Spanish solidarity kitchen plea or Ukrainian request with authentic spoken native dialect audio.
              </p>
            </button>

            {/* Button 4 (Open-Meteo) */}
            <button
              type="button"
              onClick={() => { onClose(); onTriggerClimateRadar?.(); }}
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: 8,
                padding: 12,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#38BDF8', fontWeight: 700, fontSize: '0.86rem' }}>
                <Activity size={16} color="#38BDF8" />
                <span>4. Trigger Climate Emergency Radar</span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                Switches to Global Radar Map, targets Kharkiv (-14.2°C freeze) or Kentucky flood watch, and activates alert halo.
              </p>
            </button>

            {/* Button 5 (Solana Sponsor Relayer) */}
            <button
              type="button"
              onClick={() => { onClose(); onTriggerMicroGrant?.(); }}
              style={{
                background: 'rgba(20, 241, 149, 0.08)',
                border: '1px solid rgba(20, 241, 149, 0.35)',
                borderRadius: 8,
                padding: 12,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#14F195', fontWeight: 700, fontSize: '0.86rem' }}>
                <Coins size={16} color="#14F195" />
                <span>5. Gasless Devnet Sponsor Relayer</span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                1-Click micro-grant broadcast to Ukraine Winter Emergency. No Phantom or faucet needed; generates confirmed on-chain Devnet slot &amp; signature.
              </p>
            </button>
          </div>
        </div>

        {/* Informative Note for Protocol Telemetry */}
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: 14,
          display: 'flex',
          gap: 12,
          marginBottom: 20
        }}>
          <Info size={20} color="#F59E0B" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: '0.84rem', color: '#FDE68A', lineHeight: 1.5 }}>
            <strong>Zero-Configuration Mode Active:</strong> {ACTIVE_BRAND.name} is designed to run completely friction-free.
            Multimodal AI structuring, voice narration, and Solana Devnet escrow queries are fully functional out-of-the-box.
            You can optionally insert custom third-party API credentials below to verify live production endpoints.
          </div>
        </div>

        {/* 3 Sponsor Tech Tabs / Explanations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
          {/* 1. Google AI Studio */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#60A5FA' }}>1. Google AI Studio (Gemini 1.5 Flash)</span>
                <span className="badge" style={{ background: 'rgba(96, 165, 250, 0.15)', color: '#93C5FD' }}>Target Category</span>
              </div>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              • <strong>Voice-to-Need Extraction</strong>: Converts unstructured spoken pleas into structured tickets with itemized quantities, urgency, and UN themes.<br />
              • <strong>VisionGuard Multimodal Verifier</strong>: Analyzes delivery proof photos against ticket criteria to automatically unlock smart escrow.
            </p>
            <div style={{ marginTop: 8 }}>
              <input
                type="password"
                placeholder="Optional: Enter Gemini API Key (AIzaSy...)"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 6,
                  padding: '7px 10px',
                  color: '#FFFFFF',
                  fontSize: '0.78rem'
                }}
              />
            </div>
          </div>

          {/* 2. ElevenLabs */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#FB7185' }}>2. ElevenLabs Voice Synthesis</span>
                <span className="badge" style={{ background: 'rgba(251, 113, 133, 0.15)', color: '#FDA4AF' }}>Target Category</span>
              </div>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              • <strong>Empathetic Audio Storytelling</strong>: Converts cold donation appeals into moving voice stories with human inflection (Rachel, Adam, Antoni).<br />
              • <strong>Hands-Free Feed Reader</strong>: Enables visually impaired and elderly donors to listen to community requests by clicking "Listen to Feed".
            </p>
            <div style={{ marginTop: 8 }}>
              <input
                type="password"
                placeholder="Optional: Enter ElevenLabs API Key (sk_...)"
                value={elevenLabsKey}
                onChange={(e) => setElevenLabsKey(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 6,
                  padding: '7px 10px',
                  color: '#FFFFFF',
                  fontSize: '0.78rem'
                }}
              />
            </div>
          </div>

          {/* 3. Solana Web3 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#14F195' }}>3. Solana Micro-Grants & Escrow</span>
                <span className="badge" style={{ background: 'rgba(20, 241, 149, 0.15)', color: '#14F195' }}>Target Category</span>
              </div>
              <button
                onClick={handleQuickAirdrop}
                className="btn btn-solana"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                <Coins size={14} /> Request 1.0 SOL Devnet Airdrop
              </button>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              • <strong>Instant Micro-Donations</strong>: Negligible fees allow donors to give as little as 0.05 SOL ($7) without losing 30% to credit card processors.<br />
              • <strong>Milestone Escrow</strong>: Donated funds remain safely in escrow until Gemini Vision verifies photographic delivery proof.<br />
              • <strong>Public Explorer & Verifiable Ledger</strong>: Connect Phantom to broadcast live on-chain Devnet transactions viewable on Solana Explorer, or test in zero-config Judge Sponsor Relayer mode where real on-chain Devnet transactions are broadcast and verified without requiring Phantom or personal Devnet tokens (<code>POST /api/solana/broadcast-grant</code> &amp; <code>GET /api/solana/verify-tx/:sig</code>).
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
          <span style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 600 }}>{saveMessage}</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} className="btn btn-secondary">
              Close
            </button>
            <button onClick={handleSaveKeys} className="btn btn-primary" style={{ padding: '8px 20px' }}>
              <Key size={15} />
              <span>Save API Keys</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
