import React, { useState } from 'react';
import { X, Heart, ExternalLink, ShieldCheck, Check, Sparkles, Loader2 } from './Icons';
import { SolanaService } from '../services/solanaService';
import { AidRequest, MicroGrant } from '../types';

interface MicroGrantModalProps {
  isOpen: boolean;
  request: AidRequest | null;
  onClose: () => void;
  onGrantCompleted: (grant: MicroGrant) => void;
}

const PRESET_AMOUNTS = [
  { sol: 0.05, usd: '7.25' },
  { sol: 0.10, usd: '14.50' },
  { sol: 0.25, usd: '36.25' },
  { sol: 0.50, usd: '72.50' }
];

export const MicroGrantModal: React.FC<MicroGrantModalProps> = ({
  isOpen,
  request,
  onClose,
  onGrantCompleted
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(0.10);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [donorName, setDonorName] = useState<string>('Generous Neighbor');
  const [message, setMessage] = useState<string>('Standing in solidarity with you.');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [completedGrant, setCompletedGrant] = useState<MicroGrant | null>(null);

  if (!isOpen || !request) return null;

  const currentSOL = customAmount ? parseFloat(customAmount) || 0 : selectedAmount;

  const handleSendGrant = async () => {
    if (currentSOL <= 0) return;
    setIsProcessing(true);
    try {
      const grant = await SolanaService.sendMicroGrant(
        request.id,
        request.title,
        currentSOL,
        donorName.trim() || 'Anonymous Giver',
        message
      );
      setCompletedGrant(grant);
      onGrantCompleted(grant);
    } catch (err) {
      console.error('Failed to send grant:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetAndClose = () => {
    setCompletedGrant(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleResetAndClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540, padding: 28 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #14F195, #9945FF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Heart size={20} color="#0F172A" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.28rem', fontWeight: 700 }}>Send Solana Micro-Grant</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Instant Devnet Settlement • Milestone Escrow Protected
              </p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              color: 'var(--text-secondary)',
              borderRadius: '8px',
              padding: 8,
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Successful Grant Confirmation State */}
        {completedGrant ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 16,
            padding: '16px 0'
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(20, 241, 149, 0.15)',
              border: '2px solid #14F195',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 25px rgba(20, 241, 149, 0.4)'
            }}>
              <Check size={32} color="#14F195" />
            </div>

            <div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }} className="gradient-text-solana">
                Generosity Recorded On-Chain!
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                You pledged <strong style={{ color: '#14F195' }}>{completedGrant.amountSOL} SOL</strong> (≈${completedGrant.amountUSD}) to {request.authorName}.
              </p>
            </div>

            {/* Escrow note */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 14,
              width: '100%',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#38BDF8', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>
                <ShieldCheck size={14} />
                <span>Protected by EchoKind Milestone Escrow</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Funds will be unlocked to the organizer when photographic proof of delivery is verified by Google Gemini VisionGuard.
              </p>

              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                  Solana Devnet Signature:
                </span>
                <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#CBD5E1', wordBreak: 'break-all' }}>
                  {completedGrant.txSignature}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 8 }}>
              <a
                href={SolanaService.getExplorerUrl(completedGrant.txSignature)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
                style={{ flex: 1, padding: '10px 14px', fontSize: '0.85rem' }}
              >
                <ExternalLink size={15} />
                <span>View on Solana Explorer</span>
              </a>
              <button onClick={handleResetAndClose} className="btn btn-primary" style={{ flex: 1 }}>
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form State */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Target Request Snapshot */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: 12
            }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Recipient Initiative
              </span>
              <p style={{ fontSize: '0.92rem', fontWeight: 700, marginTop: 2, color: '#FFFFFF' }}>
                {request.title}
              </p>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Organized by {request.authorName} • {request.location}
              </span>
            </div>

            {/* Micro-Grant Preset Buttons */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
                Select Micro-Grant Amount:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {PRESET_AMOUNTS.map((p) => {
                  const isSelected = selectedAmount === p.sol && !customAmount;
                  return (
                    <button
                      key={p.sol}
                      type="button"
                      onClick={() => { setSelectedAmount(p.sol); setCustomAmount(''); }}
                      style={{
                        background: isSelected ? 'rgba(20, 241, 149, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                        border: isSelected ? '1px solid #14F195' : '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        padding: '10px 6px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: isSelected ? '#14F195' : '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                        {p.sol} SOL
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        ≈${p.usd}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Amount */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Or Custom SOL Amount
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 0.02"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  color: '#FFFFFF',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            {/* Donor Name & Message */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Your Display Name
                </label>
                <input
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#FFFFFF',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Encouragement Note
                </label>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#FFFFFF',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
            </div>

            {/* Send Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
              <button onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleSendGrant}
                disabled={isProcessing || currentSOL <= 0}
                className="btn btn-solana"
                style={{ padding: '10px 24px', fontSize: '0.92rem' }}
              >
                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                <span>{isProcessing ? 'Confirming On-Chain...' : `Grant ${currentSOL} SOL (≈$${(currentSOL * 145).toFixed(2)})`}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
