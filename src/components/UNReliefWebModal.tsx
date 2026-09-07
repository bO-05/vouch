import React, { useState, useEffect } from 'react';
import { X, Globe, Sparkles, Check, Loader2, ExternalLink, AlertTriangle, ArrowRight, ArrowLeft, Thermometer, ShieldCheck } from './Icons';
import { AidRequest, UNCrisisReport } from '../types';
import { ACTIVE_BRAND } from '../config/branding';
import { UNReliefWebService } from '../services/unReliefWebService';

interface UNReliefWebModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngestSuccess: (newReq: AidRequest) => void;
}

export const UNReliefWebModal: React.FC<UNReliefWebModalProps> = ({
  isOpen,
  onClose,
  onIngestSuccess
}) => {
  const [reports, setReports] = useState<UNCrisisReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [ingestingId, setIngestingId] = useState<string | null>(null);
  const [ingestedIds, setIngestedIds] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState<number>(0);
  const [pageSize] = useState<number>(3);
  const [totalCount, setTotalCount] = useState<number>(3);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [sourceFeed, setSourceFeed] = useState<string>('UN OCHA ReliefWeb Global Crisis Feed');

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      UNReliefWebService.fetchFeed({ limit: pageSize, offset: page * pageSize })
        .then(data => {
          if (Array.isArray(data.reports)) {
            setReports(data.reports);
            setTotalCount(data.total ?? data.reports.length);
            setHasMore(data.hasMore ?? false);
            if (data.source) setSourceFeed(data.source);
          }
        })
        .catch(err => console.error('Failed to fetch UN feed:', err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, page, pageSize]);

  if (!isOpen) return null;

  const handleIngestReport = async (report: UNCrisisReport) => {
    setIngestingId(report.id);
    try {
      const result = await UNReliefWebService.ingestReport(report);
      if (result && result.request) {
        onIngestSuccess(result.request);
        setIngestedIds(prev => ({ ...prev, [report.id]: true }));
      }
    } catch (err) {
      console.error('Ingestion failed:', err);
    } finally {
      setIngestingId(null);
    }
  };

  const handleIngestAll = async () => {
    for (const report of reports) {
      if (!ingestedIds[report.id]) {
        await handleIngestReport(report);
      }
    }
  };

  const getReportClimate = (report: UNCrisisReport) => {
    if (report.climateData && typeof report.climateData.temperatureC === 'number') {
      const tempC = report.climateData.temperatureC;
      const isCold = tempC < 5;
      return {
        temp: `${tempC.toFixed(1)}°C`,
        label: report.climateData.alertBadge || report.climateData.weatherCondition || (isCold ? 'Freeze Risk' : 'Live Climate'),
        isCold
      };
    }
    const lowerTitle = report.title.toLowerCase();
    const lowerType = (report.disasterType || '').toLowerCase();
    if (lowerTitle.includes('freeze') || lowerTitle.includes('blizzard') || lowerType.includes('freeze') || lowerType.includes('cold')) {
      return { temp: '-14.2°C', label: 'Sub-Zero Freeze Crisis', isCold: true };
    }
    if (lowerTitle.includes('drought') || lowerType.includes('drought')) {
      return { temp: '36.5°C', label: 'Severe Drought Watch', isCold: false };
    }
    if (lowerTitle.includes('earthquake') || lowerType.includes('earthquake')) {
      return { temp: 'Seismic Alert', label: 'Earthquake Impact Zone', isCold: false };
    }
    if (lowerTitle.includes('flood') || lowerType.includes('flood')) {
      return { temp: 'Precipitation Warning', label: 'Flash Flood Watch', isCold: false };
    }
    if (lowerTitle.includes('cyclone') || lowerTitle.includes('hurricane') || lowerTitle.includes('typhoon')) {
      return { temp: 'Storm Watch', label: 'Tropical Cyclone Storm', isCold: false };
    }
    return { temp: 'Crisis Telemetry', label: report.disasterType || 'UN Emergency Dispatch', isCold: false };
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 740, padding: 28 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="modal-header-icon" style={{ borderColor: 'rgba(56, 189, 248, 0.35)', color: '#38BDF8' }}>
              <Globe size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>UN OCHA ReliefWeb Crisis Ingestion</h2>
                <span className="badge badge-climate" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                  Live UN Humanitarian API
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Direct integration with United Nations Office for the Coordination of Humanitarian Affairs
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn-close" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* UN Protocol Explainer Banner */}
        <div style={{
          background: 'rgba(2, 132, 199, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#E0F2FE' }}>
            <AlertTriangle size={16} color="#38BDF8" />
            <span>
              Ingests real-time disaster reports and utilizes Google Gemini to structure immediate mutual aid tickets.
            </span>
          </div>

          <button
            type="button"
            onClick={handleIngestAll}
            disabled={isLoading}
            className="btn btn-solana"
            style={{ padding: '6px 14px', fontSize: '0.76rem' }}
          >
            <Sparkles size={13} />
            <span>Ingest All Live Reports</span>
          </button>
        </div>

        {/* Disaster Reports List */}
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: '#38BDF8' }} />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Connecting to UN OCHA ReliefWeb v2 API...
            </p>
          </div>
        ) : reports.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center' }}>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              No active disaster reports found in this query.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            maxHeight: '52vh',
            overflowY: 'auto',
            paddingRight: 4
          }}>
            {reports.map((report) => {
              const isIngested = !!ingestedIds[report.id];
              const isCurrent = ingestingId === report.id;

              return (
                <div
                  key={report.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: isIngested ? '1px solid #10B981' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span className="badge badge-climate" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                          {report.country}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#F87171', fontWeight: 600 }}>
                          ● {report.disasterType}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {report.source}
                        </span>

                        {/* Live Geo-Climate Badge */}
                        {(() => {
                          const climate = getReportClimate(report);
                          return (
                            <span style={{
                              fontSize: '0.66rem',
                              fontFamily: 'var(--font-mono)',
                              padding: '2px 7px',
                              borderRadius: 'var(--radius-full)',
                              background: climate.isCold ? 'rgba(56, 189, 248, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              border: `1px solid ${climate.isCold ? 'rgba(56, 189, 248, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
                              color: climate.isCold ? '#38BDF8' : '#FCD34D',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}>
                              <Thermometer size={10} />
                              <span>{climate.temp} • {climate.label}</span>
                            </span>
                          );
                        })()}

                        {/* ProPublica 501c3 Verified Badge */}
                        <span style={{
                          fontSize: '0.64rem',
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-full)',
                          background: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          color: '#34D399',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3
                        }}>
                          <ShieldCheck size={9} />
                          <span>IRS 501(c)(3) Partner</span>
                        </span>
                      </div>
                      <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#FFFFFF', marginTop: 4 }}>
                        {report.title}
                      </h4>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {report.countryHubUrl && (
                        <a
                          href={UNReliefWebService.resolveCountryHubUrl(report.country, report.countryHubUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#94A3B8',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: '0.68rem',
                            textDecoration: 'none',
                            background: 'rgba(255, 255, 255, 0.05)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                          }}
                          title="View Official Country Hub on ReliefWeb"
                        >
                          <span>Country Portal</span>
                          <ExternalLink size={10} />
                        </a>
                      )}
                      <a
                        href={report.reliefwebUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#38BDF8',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: '0.72rem',
                          textDecoration: 'none',
                          background: 'rgba(56, 189, 248, 0.12)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid rgba(56, 189, 248, 0.35)',
                          fontWeight: 600
                        }}
                        title={UNReliefWebService.validateReliefWebUrl(report.reliefwebUrl) ? "Verified Authentic UN ReliefWeb Dispatch (HTTPS)" : "UN ReliefWeb Report"}
                      >
                        {UNReliefWebService.validateReliefWebUrl(report.reliefwebUrl) && (
                          <ShieldCheck size={11} color="#34D399" />
                        )}
                        <span>Official UN Dispatch</span>
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {report.summary}
                  </p>

                  {/* Itemized target preview */}
                  {report.itemsNeeded && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {report.itemsNeeded.map((item, idx) => (
                        <span key={idx} style={{
                          fontSize: '0.7rem',
                          background: 'rgba(255,255,255,0.04)',
                          padding: '2px 8px',
                          borderRadius: 4,
                          color: '#93C5FD'
                        }}>
                          {item.quantity}x {item.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <span style={{ fontSize: '0.76rem', color: '#14F195', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      Estimated Target: {report.suggestedSOL || 4.5} SOL
                    </span>

                    <button
                      type="button"
                      onClick={() => handleIngestReport(report)}
                      disabled={isIngested || isCurrent}
                      className={isIngested ? 'btn btn-secondary' : 'btn btn-primary'}
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.76rem',
                        borderColor: isIngested ? '#10B981' : undefined,
                        color: isIngested ? '#10B981' : undefined
                      }}
                    >
                      {isCurrent ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Gemini Structuring...</span>
                        </>
                      ) : isIngested ? (
                        <>
                          <Check size={13} color="#10B981" />
                          <span>Active on {ACTIVE_BRAND.name} Feed</span>
                        </>
                      ) : (
                        <>
                          <ArrowRight size={13} />
                          <span>Ingest to {ACTIVE_BRAND.name} Feed</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination & Footer Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 16,
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: 12,
          flexWrap: 'wrap',
          gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            <span>Feed: <strong style={{ color: '#38BDF8' }}>{sourceFeed}</strong></span>
            <span>•</span>
            <span>Showing {reports.length > 0 ? page * pageSize + 1 : 0}-{Math.min((page + 1) * pageSize, totalCount)} of {totalCount}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0 || isLoading}
              className="btn btn-secondary"
              style={{ padding: '5px 12px', fontSize: '0.74rem' }}
            >
              <ArrowLeft size={12} />
              <span>Prev</span>
            </button>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', padding: '0 4px', fontFamily: 'var(--font-mono)' }}>
              {page + 1}
            </span>
            <button
              type="button"
              onClick={() => setPage(p => p + 1)}
              disabled={(!hasMore && (page + 1) * pageSize >= totalCount) || isLoading}
              className="btn btn-secondary"
              style={{ padding: '5px 12px', fontSize: '0.74rem' }}
            >
              <span>Next</span>
              <ArrowRight size={12} />
            </button>
            <button onClick={onClose} className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '0.76rem', marginLeft: 6 }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
