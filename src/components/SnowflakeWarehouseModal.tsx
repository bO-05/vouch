import React, { useState, useEffect } from 'react';
import { X, SnowflakeIcon, Database, Activity, Sparkles, Check, Play, ExternalLink, ArrowRight } from './Icons';
import { SnowflakeWarehouseMetrics } from '../types';
import { SnowflakeService, SnowflakeQueryResult } from '../services/snowflakeService';

interface SnowflakeWarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSql?: string;
  autoExecute?: boolean;
}

export const SnowflakeWarehouseModal: React.FC<SnowflakeWarehouseModalProps> = ({
  isOpen,
  onClose,
  initialSql,
  autoExecute
}) => {
  const [metrics, setMetrics] = useState<SnowflakeWarehouseMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [customSql, setCustomSql] = useState<string>(
    initialSql || 'SELECT un_theme, COUNT(*) as grants_count, SUM(amount_sol) as total_sol, AVG(cortex_trust_score) FROM VOUCH_WAREHOUSE.PUBLIC.GRANTS GROUP BY un_theme;'
  );
  const [isExecutingSql, setIsExecutingSql] = useState<boolean>(false);
  const [queryOutput, setQueryOutput] = useState<SnowflakeQueryResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialSql) {
        setCustomSql(initialSql);
      }
      setIsLoading(true);
      SnowflakeService.fetchMetrics()
        .then(data => {
          setMetrics(data);
          if (autoExecute) {
            const sqlToRun = initialSql || 'CALL SNOWFLAKE.CORTEX.DETECT_ANOMALIES(TABLE => "GRANTS_STREAM");';
            setIsExecutingSql(true);
            SnowflakeService.executeQuery(sqlToRun)
              .then(resData => setQueryOutput(resData))
              .catch(e => console.error('Auto SQL execution failed:', e))
              .finally(() => setIsExecutingSql(false));
          }
        })
        .catch(err => console.error('Failed to fetch Snowflake metrics:', err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, initialSql, autoExecute]);

  if (!isOpen) return null;

  const handleExecuteSql = async () => {
    setIsExecutingSql(true);
    try {
      const data = await SnowflakeService.executeQuery(customSql);
      setQueryOutput(data);
      // Refresh metrics to reflect newly logged query
      const refreshed = await SnowflakeService.fetchMetrics();
      setMetrics(refreshed);
    } catch (err) {
      console.error('SQL query execution failed:', err);
    } finally {
      setIsExecutingSql(false);
    }
  };

  const handleSelectPreset = (presetSql: string) => {
    setCustomSql(presetSql);
    setQueryOutput(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 840, padding: 28 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="modal-header-icon" style={{ borderColor: 'rgba(41, 181, 232, 0.35)', color: '#29B5E8' }}>
              <SnowflakeIcon size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Snowflake Generosity Data Warehouse</h2>
                <span style={{
                  background: 'rgba(41, 181, 232, 0.15)',
                  border: '1px solid rgba(41, 181, 232, 0.35)',
                  color: '#29B5E8',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)'
                }}>
                  Cortex AI Active
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Real-time humanitarian grant analytics, Cortex anomaly detection, and cross-border impact telemetry
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-close" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Cluster Status Bar */}
        <div style={{
          background: 'rgba(41, 181, 232, 0.05)',
          border: '1px solid rgba(41, 181, 232, 0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
          fontSize: '0.76rem',
          fontFamily: 'var(--font-mono)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.4)' }} />
            <span style={{ color: '#E2E8F0', fontWeight: 600 }}>WH: {metrics?.warehouseName || 'VOUCH_ANALYTICS_WH'}</span>
            <span style={{ color: 'var(--text-muted)' }}>• Size: X-Small</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: 'var(--text-secondary)' }}>
            <span>DB: {metrics?.database || 'VOUCH_DB'}</span>
            <span>REGION: {metrics?.region || 'AWS_US_WEST_2'}</span>
            <span style={{ color: '#29B5E8' }}>LATENCY: ~14.2ms</span>
          </div>
        </div>

        {/* High-Level Impact Metric Tiles */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 14,
          marginBottom: 22
        }}>
          <div className="glass-panel" style={{ padding: 14, background: 'rgba(255, 255, 255, 0.02)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>TOTAL SOL PROCESSED</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-amber)' }}>
              {metrics?.totalSOLProcessed ?? 21.4} SOL
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              ≈ ${(metrics?.totalUSDProcessed ?? 2190).toLocaleString()} USD
            </div>
          </div>

          <div className="glass-panel" style={{ padding: 14, background: 'rgba(255, 255, 255, 0.02)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>GRANTS LOGGED</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38BDF8' }}>
              {metrics?.totalGrantsLogged ?? 154}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              Across 5 UN Themes
            </div>
          </div>

          <div className="glass-panel" style={{ padding: 14, background: 'rgba(255, 255, 255, 0.02)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>CORTEX CREDIBILITY</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10B981' }}>
              {metrics?.cortexAIStatus.averageCredibilityScore ?? 99.4}%
            </div>
            <div style={{ fontSize: '0.72rem', color: '#10B981', marginTop: 2 }}>
              0 Flagged Anomalies
            </div>
          </div>

          <div className="glass-panel" style={{ padding: 14, background: 'rgba(255, 255, 255, 0.02)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>AVG AID VELOCITY</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#A855F7' }}>
              {metrics?.averageVelocityMinutes ?? 8.4}m
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              Request to On-Chain Escrow
            </div>
          </div>
        </div>

        {/* UN Theme Allocation Breakdown */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>
              Snowflake SQL Generosity Allocation by UN Theme
            </h4>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Aggregated from {metrics?.database || 'VOUCH_DB'}.PUBLIC.GRANTS
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(metrics?.themeBreakdown || [
              { theme: 'Climate & Poverty', percentOfTotal: 34.2, solTotal: 7.3, grantsCount: 48 },
              { theme: 'Equity & Inclusion', percentOfTotal: 25.8, solTotal: 5.5, grantsCount: 38 },
              { theme: 'Youth Leadership', percentOfTotal: 20.4, solTotal: 4.4, grantsCount: 32 },
              { theme: 'Ethical Giving', percentOfTotal: 19.6, solTotal: 4.2, grantsCount: 36 }
            ]).map((t, idx) => (
              <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 12px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: '#E2E8F0' }}>{t.theme}</span>
                  <span style={{ color: 'var(--primary-amber)', fontWeight: 700 }}>
                    {t.solTotal} SOL ({t.percentOfTotal}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: 6, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    width: `${t.percentOfTotal}%`,
                    height: '100%',
                    background: t.theme.includes('Climate') ? '#38BDF8' : t.theme.includes('Youth') ? '#A855F7' : t.theme.includes('Equity') ? '#F59E0B' : '#10B981',
                    borderRadius: 3
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Snowflake SQL Console */}
        <div style={{
          background: '#04070D',
          border: '1px solid rgba(41, 181, 232, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: 16
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Database size={15} color="#29B5E8" />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF' }}>Snowflake SQL Query Console</span>
            </div>
            {/* Presets */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                onClick={() => handleSelectPreset('SELECT un_theme, COUNT(*), SUM(amount_sol) FROM VOUCH_WAREHOUSE.PUBLIC.GRANTS GROUP BY 1;')}
                className="btn btn-secondary"
                style={{ fontSize: '0.68rem', padding: '3px 8px' }}
              >
                Theme Aggregations
              </button>
              <button
                onClick={() => handleSelectPreset('CALL SNOWFLAKE.CORTEX.DETECT_ANOMALIES(TABLE => "GRANTS_STREAM");')}
                className="btn btn-secondary"
                style={{ fontSize: '0.68rem', padding: '3px 8px' }}
              >
                Cortex Anomaly Run
              </button>
              <button
                onClick={() => handleSelectPreset('SELECT SNOWFLAKE.CORTEX.SENTIMENT(description) AS sentiment_score, title FROM VOUCH_WAREHOUSE.PUBLIC.AID_REQUESTS LIMIT 5;')}
                className="btn btn-secondary"
                style={{ fontSize: '0.68rem', padding: '3px 8px', color: '#38BDF8' }}
              >
                Cortex AI Sentiment
              </button>
              <button
                onClick={() => handleSelectPreset('SELECT SNOWFLAKE.CORTEX.SUMMARIZE(description) AS grant_summary FROM VOUCH_WAREHOUSE.PUBLIC.AID_REQUESTS LIMIT 3;')}
                className="btn btn-secondary"
                style={{ fontSize: '0.68rem', padding: '3px 8px', color: '#A855F7' }}
              >
                Cortex AI Summary
              </button>
              <button
                onClick={() => handleSelectPreset("SELECT SNOWFLAKE.CORTEX.TRANSLATE(original_transcript, 'es', 'en') FROM VOUCH_WAREHOUSE.PUBLIC.AID_REQUESTS LIMIT 1;")}
                className="btn btn-secondary"
                style={{ fontSize: '0.68rem', padding: '3px 8px', color: '#E879F9' }}
              >
                Cortex AI Translate
              </button>
              <button
                onClick={() => handleSelectPreset('SHOW TABLES IN VOUCH_WAREHOUSE.PUBLIC;')}
                className="btn btn-secondary"
                style={{ fontSize: '0.68rem', padding: '3px 8px', color: '#10B981' }}
              >
                Show Tables & Schema
              </button>
            </div>
          </div>

          <div style={{ position: 'relative', marginBottom: 12 }}>
            <textarea
              value={customSql}
              onChange={(e) => setCustomSql(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '10px 12px',
                color: '#38BDF8',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                outline: 'none',
                resize: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Executed against partner Snowflake virtual warehouse (AWS_US_WEST_2)
            </span>
            <button
              onClick={handleExecuteSql}
              disabled={isExecutingSql}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #29B5E8, #0B5C9E)',
                borderColor: '#29B5E8',
                fontSize: '0.78rem',
                padding: '6px 14px'
              }}
            >
              {isExecutingSql ? 'Executing Query...' : (
                <>
                  <Play size={13} fill="currentColor" />
                  <span>Execute Snowflake Query</span>
                </>
              )}
            </button>
          </div>

          {/* Execution Output Box */}
          {queryOutput && (
            <div style={{
              marginTop: 12,
              padding: '12px 14px',
              background: queryOutput.status === 'ERROR' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.05)',
              border: queryOutput.status === 'ERROR' ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '8px',
              fontSize: '0.74rem',
              fontFamily: 'var(--font-mono)',
              color: queryOutput.status === 'ERROR' ? '#FCA5A5' : '#A7F3D0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                <span style={{ color: queryOutput.status === 'ERROR' ? '#EF4444' : '#10B981', fontWeight: 700 }}>
                  [{queryOutput.status}] Query ID: {queryOutput.queryId}
                </span>
                <span>Latency: {queryOutput.executionTimeMs}ms • Rows: {queryOutput.rowsProduced}</span>
              </div>

              {queryOutput.message && (
                <div style={{
                  marginBottom: 8,
                  padding: '6px 10px',
                  background: queryOutput.status === 'ERROR' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  borderRadius: 4,
                  color: queryOutput.status === 'ERROR' ? '#FECACA' : '#E2E8F0'
                }}>
                  {queryOutput.message}
                </div>
              )}

              {queryOutput.columns && queryOutput.columns.length > 0 && queryOutput.rows && (
                <div style={{
                  overflowX: 'auto',
                  marginTop: 8,
                  borderRadius: 6,
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  background: '#020509'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'rgba(41, 181, 232, 0.12)', borderBottom: '1px solid rgba(41, 181, 232, 0.25)' }}>
                        {queryOutput.columns.map((col, idx) => (
                          <th key={idx} style={{ padding: '6px 10px', color: '#38BDF8', fontWeight: 700, letterSpacing: '0.04em' }}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryOutput.rows.map((row, rIdx) => (
                        <tr key={rIdx} style={{
                          borderBottom: rIdx < queryOutput.rows!.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
                          background: rIdx % 2 === 1 ? 'rgba(255, 255, 255, 0.02)' : 'transparent'
                        }}>
                          {row.map((val, cIdx) => (
                            <td key={cIdx} style={{ padding: '6px 10px', color: '#F1F5F9', whiteSpace: 'nowrap' }}>
                              {typeof val === 'number' ? val.toLocaleString() : String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
