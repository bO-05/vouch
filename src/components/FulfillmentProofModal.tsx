import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, Upload, Loader2, Sparkles, AlertCircle } from './Icons';
import { GeminiService, VerificationResult } from '../services/geminiService';
import { SolanaService } from '../services/solanaService';
import { AidRequest } from '../types';

interface FulfillmentProofModalProps {
  isOpen: boolean;
  request: AidRequest | null;
  onClose: () => void;
  onProofVerified: (requestId: string, proofUrl: string, notes: string, score: number) => void;
}

const SAMPLE_PROOF_IMAGES = [
  { label: 'Winter Coat Handout Boxes', url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80' },
  { label: 'Solar Battery Unpacked at Clinic', url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80' },
  { label: 'Girls Coding Workshop Desks', url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80' },
  { label: 'Community Meals Distribution', url: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=800&q=80' }
];

export const FulfillmentProofModal: React.FC<FulfillmentProofModalProps> = ({
  isOpen,
  request,
  onClose,
  onProofVerified
}) => {
  const [proofImage, setProofImage] = useState<string>(SAMPLE_PROOF_IMAGES[0].url);
  const [proofNotes, setProofNotes] = useState<string>(
    'Delivered all requested supplies to the community center. Volunteers distributed them to families today with signed receipt slips.'
  );
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  if (!isOpen || !request) return null;

  const handleVerifyWithGemini = async () => {
    setIsVerifying(true);
    try {
      const result = await GeminiService.verifyFulfillmentProof(
        request.itemsNeeded,
        proofNotes,
        proofImage
      );
      setVerificationResult(result);

      if (result.isVerified) {
        // Unlock Solana Escrow
        SolanaService.unlockEscrowForRequest(request.id);
        onProofVerified(request.id, proofImage, proofNotes, result.confidenceScore);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDone = () => {
    setVerificationResult(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleDone}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620, padding: 28 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #60A5FA, #3B82F6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={20} color="#FFFFFF" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>VisionGuard Proof Verifier</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Powered by Google Gemini Vision & Solana Escrow Release
              </p>
            </div>
          </div>

          <button
            onClick={handleDone}
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

        {/* Existing Proof State */}
        {request.status === 'fulfilled' && !verificationResult && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
            marginBottom: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10B981', fontWeight: 700 }}>
              <CheckCircle2 size={18} />
              <span>Already 100% Verified & Escrow Released!</span>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: 6 }}>
              {request.proofNotes || 'All delivery photographic proof was approved on-chain with 98% confidence score.'}
            </p>
            {request.verifiedProofImageUrl && (
              <img
                src={request.verifiedProofImageUrl}
                alt="Delivery Proof"
                style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 8, marginTop: 10 }}
              />
            )}
          </div>
        )}

        {/* Verification Success State */}
        {verificationResult ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            padding: '10px 0'
          }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid #10B981',
              borderRadius: 'var(--radius-md)',
              padding: 18
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10B981', fontWeight: 800 }}>
                  <Sparkles size={20} />
                  <span>Gemini Vision Verification Passed</span>
                </div>
                <span className="badge" style={{ background: '#10B981', color: '#0F172A', fontWeight: 800 }}>
                  {verificationResult.confidenceScore}% Confidence
                </span>
              </div>

              <p style={{ fontSize: '0.9rem', color: '#F1F5F9', marginTop: 10, lineHeight: 1.5 }}>
                {verificationResult.summary}
              </p>

              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Items Confirmed Delivered:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {verificationResult.itemsMatched.map((item, idx) => (
                    <span key={idx} style={{
                      fontSize: '0.74rem',
                      background: 'rgba(255, 255, 255, 0.06)',
                      padding: '3px 8px',
                      borderRadius: 4,
                      color: '#6EE7B7'
                    }}>
                      ✓ {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Solana Escrow Unlocked Status */}
            <div style={{
              background: 'rgba(20, 241, 149, 0.08)',
              border: '1px solid rgba(20, 241, 149, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: 14
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#14F195', fontWeight: 700, fontSize: '0.88rem' }}>
                <CheckCircle2 size={16} />
                <span>Solana Micro-Grant Escrow Unlocked!</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                Funds have been released to organizer {request.authorName} on Solana Devnet. A permanent impact milestone has been written to the public ledger.
              </p>
            </div>

            <button onClick={handleDone} className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
              Close & Return to Feed
            </button>
          </div>
        ) : (
          /* Form for Uploading Proof */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: 12
            }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Request to Verify:
              </span>
              <p style={{ fontSize: '0.92rem', fontWeight: 700, marginTop: 2 }}>{request.title}</p>
            </div>

            {/* Proof Photo Selection / Upload */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Select or Upload Verification Photo:
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                {SAMPLE_PROOF_IMAGES.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setProofImage(img.url)}
                    style={{
                      background: proofImage === img.url ? 'rgba(96, 165, 250, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: proofImage === img.url ? '1px solid #60A5FA' : '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: proofImage === img.url ? '#93C5FD' : 'var(--text-secondary)',
                      fontSize: '0.74rem',
                      padding: '4px 10px',
                      cursor: 'pointer'
                    }}
                  >
                    {img.label}
                  </button>
                ))}
              </div>

              {/* Photo Preview */}
              <div style={{ position: 'relative', width: '100%', height: 160, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                <img src={proofImage} alt="Delivery Proof Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  background: 'rgba(0,0,0,0.7)',
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontSize: '0.72rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <Upload size={12} /> Ready for Gemini Multimodal Analysis
                </div>
              </div>
            </div>

            {/* Volunteer Notes */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Delivery Log & Field Notes
              </label>
              <textarea
                value={proofNotes}
                onChange={(e) => setProofNotes(e.target.value)}
                rows={3}
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

            {/* Disclaimer */}
            <div style={{ display: 'flex', gap: 6, fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              <AlertCircle size={14} color="#60A5FA" />
              <span>
                Gemini Vision cross-references images against ticket requirements to prevent fraud and automatically unlock milestone grants.
              </span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <button onClick={handleDone} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleVerifyWithGemini}
                disabled={isVerifying}
                className="btn btn-primary"
                style={{ padding: '10px 22px' }}
              >
                {isVerifying ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                <span>{isVerifying ? 'Gemini AI Verifying...' : 'Validate Proof & Unlock Escrow'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
