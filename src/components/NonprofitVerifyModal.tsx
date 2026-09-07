import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, ExternalLink, FileText, CheckCircle2, AlertTriangle, Loader2 } from './Icons';
import { NonprofitVerification, AidRequest } from '../types';
import { NonprofitService } from '../services/nonprofitService';

interface NonprofitVerifyModalProps {
  isOpen: boolean;
  request: AidRequest | null;
  onClose: () => void;
}

export const NonprofitVerifyModal: React.FC<NonprofitVerifyModalProps> = ({
  isOpen,
  request,
  onClose
}) => {
  const [data, setData] = useState<NonprofitVerification | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen && request) {
      setIsLoading(true);
      setErrorMessage(null);

      NonprofitService.verifyNonprofit({
        ein: request.nonprofitEin,
        query: request.nonprofitName || request.title
      })
        .then(result => {
          if (result.verified && result.verification) {
            setData(result.verification);
            setIsVerified(true);
          } else {
            setData(null);
            setIsVerified(false);
            setErrorMessage(result.error || 'Entity not found in official IRS Form 990 database.');
          }
        })
        .catch(err => {
          console.error('Failed to fetch ProPublica nonprofit data:', err);
          setIsVerified(false);
          setErrorMessage('Network connection error contacting ProPublica Explorer.');
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, request]);

  if (!isOpen || !request) return null;

  const normalizedEin = NonprofitService.normalizeEin(data?.ein || request.nonprofitEin || '');
  const deductibility = NonprofitService.getDeductibilityBadge(data);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640, padding: 28 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="modal-header-icon" style={{ borderColor: isVerified ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)', color: isVerified ? '#10B981' : '#EF4444' }}>
              <ShieldCheck size={20} color={isVerified ? '#10B981' : '#EF4444'} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>IRS 501(c)(3) Institutional Verification</h2>
                <span className={isVerified ? "badge badge-verified" : "badge badge-climate"} style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                  {isVerified ? 'ProPublica Verified' : 'Unverified Status'}
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Direct public tax filing and governance transparency via ProPublica Nonprofit Explorer
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-close" aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: '#10B981' }} />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Querying ProPublica Nonprofit Explorer & IRS Form 990 Records...
            </p>
          </div>
        ) : !isVerified ? (
          /* Unverified / Not Found State */
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 18px',
            marginBottom: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <AlertTriangle size={24} color="#EF4444" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FCA5A5', marginBottom: 4 }}>
                  Institutional Exemption Not Authenticated
                </div>
                <div style={{ fontSize: '0.78rem', color: '#F87171', lineHeight: 1.45 }}>
                  {errorMessage || `EIN ${normalizedEin.formatted || request.nonprofitEin} could not be matched against current IRS 501(c)(3) active public charities.`}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 8 }}>
                  Funds for this aid ticket remain held in escrow until independent community proof or tax documentation is provided.
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Verified State */
          <>
            {/* Verification Status Banner with Prominent Deductibility Badge */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.28)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 20,
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <CheckCircle2 size={24} color="#10B981" />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#A7F3D0' }}>
                    Tax-Exempt Entity Authenticated
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#6EE7B7' }}>
                    Official Form 990 filings and active 501(c)(3) tax exemption verified on official IRS records.
                  </div>
                </div>
              </div>

              {/* Deductibility Badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: deductibility.isDeductible ? 'rgba(16, 185, 129, 0.18)' : 'rgba(245, 158, 11, 0.18)',
                border: `1px solid ${deductibility.isDeductible ? 'rgba(16, 185, 129, 0.45)' : 'rgba(245, 158, 11, 0.45)'}`,
                color: deductibility.badgeColor,
                fontSize: '0.72rem',
                fontWeight: 700
              }}>
                <ShieldCheck size={13} />
                <span>{data?.deductibilityBadge || deductibility.text}</span>
              </div>
            </div>

            {/* Entity Profile Details */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              marginBottom: 20
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>REGISTERED CHARITABLE ENTITY</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF' }}>
                  {data?.name || request.nonprofitName || 'United Nations Humanitarian Partner'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  {data?.city || 'Washington'}, {data?.state || 'DC'}, {data?.country || 'USA'}
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 12,
                paddingTop: 12,
                borderTop: '1px solid var(--border-subtle)'
              }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>FEDERAL EIN (NORMALIZED)</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--primary-amber)' }}>
                    {normalizedEin.formatted || data?.ein || '95-1831116'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>IRS SUBSECTION</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#38BDF8' }}>
                    {data?.subsection || '501(c)(3)'} Public Charity
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>NTEE CLASSIFICATION</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#E2E8F0' }}>
                    {data?.nteeCode || 'Q30 (Humanitarian Relief)'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>FORM 990 REVENUE</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#10B981' }}>
                    ${((data?.revenueUSD || 1450000) / 1000000).toFixed(2)}M USD
                  </div>
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '10px 12px',
                borderRadius: '6px',
                fontSize: '0.76rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <FileText size={15} color="var(--primary-amber)" />
                <span>
                  <strong>Deductibility Standard:</strong> {data?.deductibility || deductibility.description}
                </span>
              </div>
            </div>
          </>
        )}

        {/* Footer actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          {isVerified && data && (
            <a
              href={data?.proPublicaUrl || `https://projects.propublica.org/nonprofits/organizations/${normalizedEin.cleanDigits || '951831116'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ fontSize: '0.76rem', padding: '6px 14px' }}
            >
              <ExternalLink size={13} />
              <span>View Public Form 990 on ProPublica</span>
            </a>
          )}

          <button onClick={onClose} className="btn btn-primary" style={{ fontSize: '0.78rem', padding: '7px 18px', marginLeft: 'auto' }}>
            Close Verification
          </button>
        </div>
      </div>
    </div>
  );
};
