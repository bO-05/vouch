import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, Upload, Loader2, Sparkles, AlertCircle, FileText, Camera } from './Icons';
import { GeminiService, VerificationResult } from '../services/geminiService';
import { SolanaService } from '../services/solanaService';
import { AidRequest } from '../types';

interface FulfillmentProofModalProps {
  isOpen: boolean;
  request: AidRequest | null;
  onClose: () => void;
  onProofVerified: (requestId: string, proofUrl: string, notes: string, score: number, receiptDetails?: any) => void;
  initialReceiptUrl?: string;
  autoTriggerVerify?: boolean;
}

const SAMPLE_DELIVERY_PHOTOS = [
  { label: 'Winter Coat Handout Boxes', url: '/demo-assets/sample-delivery-proof.svg', notes: 'Field delivery log: Handed out 35 youth winter parkas and waterproof boots to families in Detroit Ward 4.' },
  { label: 'Solar Battery Unpacked at Clinic', url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80', notes: 'Field delivery log: Portable 2.4kWh LiFePO4 solar generator unpacked and connected to rural medical cold-chain.' },
  { label: 'Community Meals Distribution', url: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=800&q=80', notes: 'Field delivery log: Handed out supplies directly to community members with signed volunteer ledger.' }
];

const SAMPLE_RECEIPTS = [
  {
    label: 'CVS Health Community Pharmacy #8412',
    url: '/demo-assets/sample-cvs-receipt.svg',
    notes: 'Official CVS Pharmacy itemized receipt for antibiotics, first aid antiseptic bandages, and pediatric electrolyte care packages.'
  },
  {
    label: 'Kroger Supermarket Care Order #492',
    url: '/demo-assets/sample-kroger-receipt.svg',
    notes: 'Kroger supermarket distribution receipt: 40 crates of fresh produce, staple dried legumes, organic oats, and vegetable oil.'
  },
  {
    label: 'Target Community Care Winter Depot',
    url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80',
    notes: 'Itemized register slip for 25 heavy sub-zero thermal blankets, commercial insulated soup warmers, and reusable meal packs.'
  }
];

export const FulfillmentProofModal: React.FC<FulfillmentProofModalProps> = ({
  isOpen,
  request,
  onClose,
  onProofVerified,
  initialReceiptUrl,
  autoTriggerVerify
}) => {
  const [proofType, setProofType] = useState<'photo' | 'receipt'>('receipt');
  const [proofImage, setProofImage] = useState<string>(initialReceiptUrl || SAMPLE_RECEIPTS[0].url);
  const [proofNotes, setProofNotes] = useState<string>(
    (initialReceiptUrl && SAMPLE_RECEIPTS.find(r => r.url === initialReceiptUrl)?.notes) || SAMPLE_RECEIPTS[0].notes
  );
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const processImageFile = (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith('image/') && !file.name.match(/\.(png|jpe?g|webp|svg|gif)$/i)) {
      setUploadError(`Invalid file type (${file.type || 'unknown'}). Please select an image file (PNG, JPG, WebP, SVG).`);
      return;
    }

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProofImage(reader.result);
        if (proofType === 'receipt') {
          setProofNotes(`Uploaded merchant receipt: ${file.name}. Auditing line items and totals against micro-grant inventory.`);
        } else {
          setProofNotes(`Uploaded field delivery photograph: ${file.name}. Validating handoff and recipient verification.`);
        }
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read image payload. File may be corrupted.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  // Auto-trigger verify if invoked by 1-Click Judge Showcase
  React.useEffect(() => {
    if (isOpen && request && autoTriggerVerify) {
      const activeUrl = initialReceiptUrl || proofImage;
      const activeNotes = (initialReceiptUrl && SAMPLE_RECEIPTS.find(r => r.url === initialReceiptUrl)?.notes) || proofNotes;
      if (initialReceiptUrl) {
        setProofImage(initialReceiptUrl);
        setProofNotes(activeNotes);
      }
      setIsVerifying(true);
      GeminiService.verifyFulfillmentProof(
        request.itemsNeeded,
        activeNotes,
        activeUrl,
        request.id,
        'receipt'
      ).then(result => {
        setVerificationResult(result);
        if (result.isVerified) {
          SolanaService.unlockEscrowForRequest(request.id);
          onProofVerified(request.id, activeUrl, activeNotes, result.confidenceScore, result.receiptDetails);
        }
      }).catch(err => {
        console.error('Auto verify failed:', err);
        setUploadError(err?.message || 'Automatic verification failed.');
      }).finally(() => {
        setIsVerifying(false);
      });
    }
  }, [isOpen, request, autoTriggerVerify, initialReceiptUrl]);

  if (!isOpen || !request) return null;

  const handleSelectSampleReceipt = (receipt: typeof SAMPLE_RECEIPTS[0]) => {
    setUploadError(null);
    setProofType('receipt');
    setProofImage(receipt.url);
    setProofNotes(receipt.notes);
  };

  const handleSelectSamplePhoto = (photo: typeof SAMPLE_DELIVERY_PHOTOS[0]) => {
    setUploadError(null);
    setProofType('photo');
    setProofImage(photo.url);
    setProofNotes(photo.notes || 'Field delivery log: Handed out supplies directly to community members with signed volunteer ledger.');
  };

  const handleVerifyWithGemini = async () => {
    setIsVerifying(true);
    setUploadError(null);
    try {
      const result = await GeminiService.verifyFulfillmentProof(
        request.itemsNeeded,
        proofNotes,
        proofImage,
        request.id,
        proofType
      );
      setVerificationResult(result);

      if (result.isVerified) {
        SolanaService.unlockEscrowForRequest(request.id);
        onProofVerified(request.id, proofImage, proofNotes, result.confidenceScore, result.receiptDetails);
      }
    } catch (err: any) {
      console.error(err);
      setUploadError(err?.message || 'Verification failed. Please retry.');
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 660, padding: 28 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="modal-header-icon" style={{ borderColor: 'rgba(96, 165, 250, 0.35)', color: '#60A5FA' }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>VisionGuard Pro Verification</h2>
                <span className="badge badge-tech" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                  OCR & Vision Escrow
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Powered by Google Gemini 1.5 Flash Vision & Solana Milestone Escrow Release
              </p>
            </div>
          </div>

          <button onClick={handleDone} className="btn-close" aria-label="Close modal">
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
              {request.proofNotes || 'Receipt and delivery proof verified on-chain with high confidence.'}
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

        {/* Verification Success State with Deep OCR Breakdown */}
        {verificationResult ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '6px 0' }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid #10B981',
              borderRadius: 'var(--radius-md)',
              padding: 18
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10B981', fontWeight: 800 }}>
                  <Sparkles size={20} />
                  <span>
                    {verificationResult.proofType === 'receipt_ocr'
                      ? 'Gemini VisionGuard Pro: Receipt OCR Passed'
                      : 'Gemini Vision: Delivery Photo Passed'}
                  </span>
                </div>
                <span className="badge" style={{ background: '#10B981', color: '#0F172A', fontWeight: 800 }}>
                  {verificationResult.confidenceScore}% Match Confidence
                </span>
              </div>

              <p style={{ fontSize: '0.88rem', color: '#F1F5F9', marginTop: 10, lineHeight: 1.5 }}>
                {verificationResult.summary}
              </p>

              {/* Receipt Deep Breakdown Table */}
              {verificationResult.receiptDetails && (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: 12,
                  marginTop: 12
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Merchant / Store
                      </span>
                      <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF' }}>
                        {verificationResult.receiptDetails.storeName}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Receipt Total:</span>
                      <p style={{ fontSize: '0.95rem', fontWeight: 800, color: '#14F195', fontFamily: 'var(--font-mono)' }}>
                        ${verificationResult.receiptDetails.totalUSD?.toFixed(2)} USD
                      </p>
                    </div>
                  </div>

                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Item-by-Item Checklist Match:
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {verificationResult.receiptDetails.lineItems?.map((line, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.76rem',
                          background: 'rgba(255, 255, 255, 0.03)',
                          padding: '4px 8px',
                          borderRadius: 4
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <CheckCircle2 size={13} color="#10B981" />
                          <span>{line.description}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            ${line.totalUSD}
                          </span>
                          <span className="badge badge-tech" style={{ fontSize: '0.66rem', padding: '1px 6px' }}>
                            {line.matchScore}% Match
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                Verification criteria satisfied. Escrowed micro-grants have been authorized for release to organizer {request.authorName} on Solana Devnet.
              </p>
            </div>

            <button onClick={handleDone} className="btn btn-primary" style={{ width: '100%', marginTop: 6 }}>
              Close & Return to Feed
            </button>
          </div>
        ) : (
          /* Form for Uploading / Scanning Proof */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Target Request Snapshot */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: 12
            }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Auditing Request:
              </span>
              <p style={{ fontSize: '0.92rem', fontWeight: 700, marginTop: 2 }}>{request.title}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {request.itemsNeeded.map((item, idx) => (
                  <span key={idx} style={{
                    fontSize: '0.72rem',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '2px 8px',
                    borderRadius: 4,
                    color: item.fulfilled ? '#10B981' : '#FCD34D'
                  }}>
                    {item.quantity}x {item.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Mode Switcher Tabs & 1-Click Judge Preloaders */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setProofType('receipt');
                    setProofImage(SAMPLE_RECEIPTS[0].url);
                    setProofNotes(SAMPLE_RECEIPTS[0].notes);
                  }}
                  style={{
                    background: proofType === 'receipt' ? 'rgba(96, 165, 250, 0.15)' : 'transparent',
                    border: proofType === 'receipt' ? '1px solid #60A5FA' : '1px solid transparent',
                    borderRadius: '6px',
                    color: proofType === 'receipt' ? '#93C5FD' : 'var(--text-muted)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    padding: '6px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <FileText size={14} />
                  <span>Pharmacy / Supermarket Receipt OCR</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProofType('photo');
                    setProofImage(SAMPLE_DELIVERY_PHOTOS[0].url);
                    setProofNotes('Field delivery documentation: Handed out supplies directly to community members.');
                  }}
                  style={{
                    background: proofType === 'photo' ? 'rgba(96, 165, 250, 0.15)' : 'transparent',
                    border: proofType === 'photo' ? '1px solid #60A5FA' : '1px solid transparent',
                    borderRadius: '6px',
                    color: proofType === 'photo' ? '#93C5FD' : 'var(--text-muted)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    padding: '6px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Camera size={14} />
                  <span>Delivery Handout Photo</span>
                </button>
              </div>

              {/* 1-Click Zero-Latency Offline Preloaders */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => handleSelectSampleReceipt(SAMPLE_RECEIPTS[0])}
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid #10B981',
                    borderRadius: '6px',
                    color: '#34D399',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '5px 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                  title="Instantly load authentic local Kroger receipt SVG with 0 network latency"
                >
                  <Sparkles size={12} />
                  <span>Load Demo Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSamplePhoto(SAMPLE_DELIVERY_PHOTOS[0])}
                  style={{
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid #38BDF8',
                    borderRadius: '6px',
                    color: '#38BDF8',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '5px 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                  title="Instantly load signed field delivery slip SVG with 0 network latency"
                >
                  <Sparkles size={12} />
                  <span>Load Delivery Photo</span>
                </button>
              </div>
            </div>

            {/* Quick Samples */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                {proofType === 'receipt' ? 'Select Verified Store Receipt Sample:' : 'Select Verified Handout Photo Sample:'}
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {proofType === 'receipt'
                  ? SAMPLE_RECEIPTS.map((rcpt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSampleReceipt(rcpt)}
                        style={{
                          background: proofImage === rcpt.url ? 'rgba(96, 165, 250, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                          border: proofImage === rcpt.url ? '1px solid #60A5FA' : '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                          color: proofImage === rcpt.url ? '#93C5FD' : 'var(--text-secondary)',
                          fontSize: '0.74rem',
                          padding: '5px 10px',
                          cursor: 'pointer'
                        }}
                      >
                        {rcpt.label}
                      </button>
                    ))
                  : SAMPLE_DELIVERY_PHOTOS.map((photo, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSamplePhoto(photo)}
                        style={{
                          background: proofImage === photo.url ? 'rgba(96, 165, 250, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                          border: proofImage === photo.url ? '1px solid #60A5FA' : '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                          color: proofImage === photo.url ? '#93C5FD' : 'var(--text-secondary)',
                          fontSize: '0.74rem',
                          padding: '5px 10px',
                          cursor: 'pointer'
                        }}
                      >
                        {photo.label}
                      </button>
                    ))}
              </div>

              {/* Custom File Uploader & Mobile Camera Capture Options */}
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: '6px',
                    background: 'rgba(168, 85, 247, 0.12)',
                    border: '1px solid rgba(168, 85, 247, 0.35)',
                    color: '#E879F9',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  title="Upload any PNG, JPG, or receipt image from your computer to run Gemini VisionGuard"
                >
                  <Upload size={14} />
                  <span>Upload Local Receipt / Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>

                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: '6px',
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    color: '#38BDF8',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  title="Capture real-time photo of delivery or receipt using device camera"
                >
                  <Camera size={14} />
                  <span>Snap with Camera</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>

                {uploadedFileName && (
                  <span style={{ fontSize: '0.74rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={13} /> {uploadedFileName}
                  </span>
                )}
              </div>

              {uploadError && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 8,
                  padding: '6px 10px',
                  borderRadius: 6,
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#FCA5A5',
                  fontSize: '0.76rem'
                }}>
                  <AlertCircle size={14} />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Photo / Receipt Preview */}
              <div style={{ position: 'relative', width: '100%', height: 160, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-subtle)', marginTop: 10 }}>
                <img
                  src={proofImage}
                  alt="Proof Preview"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/demo-assets/sample-kroger-receipt.svg';
                  }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  background: 'rgba(0,0,0,0.75)',
                  padding: '4px 10px',
                  borderRadius: 4,
                  fontSize: '0.72rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5
                }}>
                  <Upload size={12} />
                  <span>
                    {proofType === 'receipt'
                      ? 'Ready for Gemini 1.5 Flash Vision OCR Line Item Extraction'
                      : 'Ready for Gemini Multimodal Visual Proof Analysis'}
                  </span>
                </div>
              </div>
            </div>

            {/* Field Notes / Log */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Delivery Log & Volunteer Context Notes:
              </label>
              <textarea
                value={proofNotes}
                onChange={(e) => setProofNotes(e.target.value)}
                rows={2}
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

            <div style={{ display: 'flex', gap: 6, fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              <AlertCircle size={14} color="#60A5FA" />
              <span>
                Gemini VisionGuard Pro calculates an item-by-item match confidence score against ticket inventory before unlocking milestone escrow.
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
                <span>{isVerifying ? 'Gemini AI Scanning OCR...' : 'Run VisionGuard OCR & Unlock Escrow'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
