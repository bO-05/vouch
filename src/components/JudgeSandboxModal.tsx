import React, { useState } from 'react';
import { X, Sparkles, Key, Info, Coins } from './Icons';
import { GeminiService } from '../services/geminiService';
import { ElevenLabsService } from '../services/elevenlabsService';
import { SolanaService } from '../services/solanaService';

interface JudgeSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAirdrop: () => void;
}

export const JudgeSandboxModal: React.FC<JudgeSandboxModalProps> = ({
  isOpen,
  onClose,
  onAirdrop
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700, padding: 30 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #A855F7, #EC4899)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={22} color="#FFFFFF" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>DEV Judge Sandbox & Architecture</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Targeting Google AI, ElevenLabs, Solana & Overall Winner Tracks
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Informative Note for Judges */}
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
            <strong>Zero-Setup Sandbox Ready:</strong> You do not need to provide personal API keys or crypto funds to test EchoKind. 
            All AI multimodal flows, voice synthesis, and Solana Devnet ledger actions are pre-configured to execute smoothly. 
            You can optionally enter your personal keys below to test direct production API calls.
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
              • <strong>Public Explorer Verification</strong>: Every grant produces a live Solana Devnet transaction signature viewable on Explorer.
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
