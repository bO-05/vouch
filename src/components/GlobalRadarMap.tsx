import React, { useState, useEffect, useRef } from 'react';
import { AidRequest } from '../types';
import { 
  Play, Pause, Volume2, Coins, MapPin, MapIcon,
  ShieldCheck, Thermometer, ArrowRight, ExternalLink, Sparkles, Activity,
  Maximize2, RotateCcw, ZoomIn, ZoomOut, Globe, Award, FileText, CheckCircle2, X
} from './Icons';
import { 
  NATURAL_EARTH_PATHS, 
  EQUIRECTANGULAR_PATHS, 
  projectCoords, 
  geocodeLocation 
} from '../data/worldMapPaths';
import { ElevenLabsService } from '../services/elevenlabsService';

interface GlobalRadarMapProps {
  requests: AidRequest[];
  selectedRequestId: string | null;
  onSelectRequest: (req: AidRequest) => void;
  onPlayAudio: (req: AidRequest, langMode?: 'original' | 'english') => void;
  isPlayingAudio: boolean;
  activePlayingId: string | null;
  onOpenDonateModal: (req: AidRequest, presetSOL?: number) => void;
  onOpenNonprofitModal: (req: AidRequest) => void;
  onOpenProofModal?: (req: AidRequest) => void;
  onOpenCertificateModal?: (req: AidRequest) => void;
  recentGrantArc?: { from: { lat: number; lng: number; label: string }; to: { lat: number; lng: number; label: string } } | null;
}

export const GlobalRadarMap: React.FC<GlobalRadarMapProps> = ({
  requests,
  selectedRequestId,
  onSelectRequest,
  onPlayAudio,
  isPlayingAudio,
  activePlayingId,
  onOpenDonateModal,
  onOpenNonprofitModal,
  onOpenProofModal,
  onOpenCertificateModal,
  recentGrantArc
}) => {
  const cleanId = (id: string | null) => {
    if (!id || id === 'spotlight') return null;
    return id.replace(/-original|-english/g, '');
  };

  const initialId = cleanId(selectedRequestId) || (requests[0]?.id ?? null);
  const [activePinId, setActivePinId] = useState<string | null>(initialId);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [projectionMode, setProjectionMode] = useState<'naturalEarth' | 'equirectangular'>('naturalEarth');
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredReqId, setHoveredReqId] = useState<string | null>(null);
  const [animatedArc, setAnimatedArc] = useState<{
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    fromLabel: string;
    toLabel: string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const activePaths = projectionMode === 'naturalEarth' ? NATURAL_EARTH_PATHS : EQUIRECTANGULAR_PATHS;

  // Sync selected request from parent (e.g. 1-Click Judge Climate Radar trigger or audio playback)
  useEffect(() => {
    const cleaned = cleanId(selectedRequestId);
    if (cleaned) {
      setActivePinId(cleaned);
    }
  }, [selectedRequestId]);

  const displayedRequests = requests.filter(req => {
    if (selectedLanguage === 'all') return true;
    if (selectedLanguage === 'en') {
      return !req.originalLanguage || req.originalLanguage.startsWith('en');
    }
    return req.originalLanguage && req.originalLanguage.toLowerCase().startsWith(selectedLanguage.toLowerCase());
  });

  const getLanguageTag = (req: AidRequest): string | null => {
    if (req.originalLanguage) {
      const code = req.originalLanguage.split('-')[0].toUpperCase();
      if (code !== 'EN') return code;
    }
    return null;
  };

  // Active request - fallback to first request if not found
  const activeReq = (activePinId ? displayedRequests.find(r => r.id === activePinId) : null) || displayedRequests[0] || requests[0];

  // Helper to project coordinates with automatic fallback geocoding
  const getCoordinatesForRequest = (req: AidRequest) => {
    if (req.coordinates && !(req.coordinates.lat === 30 && req.coordinates.lng === 0)) {
      return req.coordinates;
    }
    return geocodeLocation(req.location);
  };

  // Sync recent grant arcs
  useEffect(() => {
    if (recentGrantArc) {
      const fromPt = projectCoords(recentGrantArc.from.lat, recentGrantArc.from.lng, projectionMode);
      const toPt = projectCoords(recentGrantArc.to.lat, recentGrantArc.to.lng, projectionMode);
      setAnimatedArc({
        fromX: fromPt.x,
        fromY: fromPt.y,
        toX: toPt.x,
        toY: toPt.y,
        fromLabel: recentGrantArc.from.label,
        toLabel: recentGrantArc.to.label
      });
    }
  }, [recentGrantArc, projectionMode]);

  // Simulate cross-border grant arc
  const handleSimulateGrantArc = (targetReq?: AidRequest) => {
    if (!targetReq) return;
    const donorCoords = { lat: 37.7749, lng: -122.4194, label: 'San Francisco, CA (Donor Wallet)' };
    const targetCoords = getCoordinatesForRequest(targetReq);
    if (!targetCoords) return;
    const fromPt = projectCoords(donorCoords.lat, donorCoords.lng, projectionMode);
    const toPt = projectCoords(targetCoords.lat, targetCoords.lng, projectionMode);
    setAnimatedArc({
      fromX: fromPt.x,
      fromY: fromPt.y,
      toX: toPt.x,
      toY: toPt.y,
      fromLabel: donorCoords.label,
      toLabel: targetReq.location
    });
  };

  const getThemeColor = (theme: string) => {
    switch (theme) {
      case 'Climate & Poverty': return '#38BDF8';
      case 'Youth Leadership': return '#A855F7';
      case 'Equity & Inclusion': return '#F59E0B';
      case 'Ethical Giving': return '#10B981';
      case 'Tech-Driven Giving': return '#6366F1';
      default: return '#E2E8F0';
    }
  };

  // Zoom handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.35, 3.5));
  const handleZoomOut = () => {
    setZoom(prev => {
      const next = Math.max(prev - 0.35, 1.0);
      if (next === 1.0) setPan({ x: 0, y: 0 });
      return next;
    });
  };
  const handleResetView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  // Pan dragging handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1.0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Mobile Touch Pan Drag Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoom <= 1.0 || e.touches.length !== 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPan({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => setIsDragging(false);

  return (
    <div id="global-radar-map-container" className="glass-panel" style={{ padding: 24, borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
      {/* Map Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="modal-header-icon" style={{ borderColor: 'rgba(14, 165, 233, 0.35)', color: '#0EA5E9' }}>
            <Activity size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Global Generosity Radar</h3>
              <span className="badge badge-verified" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                Natural Earth Vector Telemetry
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Real-world geographic continents, 177 sovereign national borders, and real-time Open-Meteo climate alert beacons
            </p>
          </div>
        </div>

        {/* Legend & Projection Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          {/* Projection Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: 3,
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              onClick={() => setProjectionMode('naturalEarth')}
              style={{
                background: projectionMode === 'naturalEarth' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                border: projectionMode === 'naturalEarth' ? '1px solid rgba(56, 189, 248, 0.4)' : 'none',
                color: projectionMode === 'naturalEarth' ? '#38BDF8' : 'var(--text-muted)',
                borderRadius: 'var(--radius-full)',
                padding: '3px 10px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Switch to Natural Earth 1 curved globe projection"
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Globe size={12} color="currentColor" />
                <span>Natural Earth</span>
              </span>
            </button>
            <button
              onClick={() => setProjectionMode('equirectangular')}
              style={{
                background: projectionMode === 'equirectangular' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                border: projectionMode === 'equirectangular' ? '1px solid rgba(56, 189, 248, 0.4)' : 'none',
                color: projectionMode === 'equirectangular' ? '#38BDF8' : 'var(--text-muted)',
                borderRadius: 'var(--radius-full)',
                padding: '3px 10px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Switch to Equirectangular rectangular projection"
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <MapIcon size={12} color="currentColor" />
                <span>Equirectangular</span>
              </span>
            </button>
          </div>

          {/* Multilingual Radar Language Filter */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: 3,
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
            gap: 2
          }}>
            {[
              { id: 'all', label: 'All Dialects' },
              { id: 'es', label: 'Español' },
              { id: 'uk', label: 'Українська' },
              { id: 'fr', label: 'Français' },
              { id: 'ar', label: 'العربية' },
              { id: 'hi', label: 'हिन्दी' },
              { id: 'en', label: 'English' }
            ].map(lang => (
              <button
                key={lang.id}
                onClick={() => {
                  setSelectedLanguage(lang.id);
                  ElevenLabsService.stopAudio();
                }}
                style={{
                  background: selectedLanguage === lang.id ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
                  border: selectedLanguage === lang.id ? '1px solid rgba(168, 85, 247, 0.45)' : 'none',
                  color: selectedLanguage === lang.id ? '#C084FC' : 'var(--text-muted)',
                  borderRadius: 'var(--radius-full)',
                  padding: '3px 9px',
                  fontSize: '0.70rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title={`Filter radar to ${lang.label} beacons`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          {/* Theme Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#38BDF8' }} />
              Climate
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
              Equity
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#A855F7' }} />
              Youth
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
              Ethical
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Map Canvas Container */}
      <div 
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: projectionMode === 'naturalEarth' ? '1000/520' : '2/1',
          minHeight: 380,
          maxHeight: 560,
          background: 'radial-gradient(ellipse at center, #0B132B 0%, #050811 100%)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          cursor: zoom > 1.0 ? (isDragging ? 'grabbing' : 'grab') : 'default'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <svg
          viewBox={`0 0 ${activePaths.width} ${activePaths.height}`}
          style={{ 
            width: '100%', 
            height: '100%', 
            display: 'block',
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: '50% 50%',
            transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <defs>
            {/* Graticule Grid Pattern */}
            <pattern id="radarGridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(56, 189, 248, 0.04)" strokeWidth="0.5" />
            </pattern>

            {/* Glowing Gradient for Trajectory Arc */}
            <linearGradient id="arcGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#F59E0B" stopOpacity="1" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.9" />
            </linearGradient>

            {/* Radar Sweep Rotating Gradient */}
            <linearGradient id="radarSweepGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.18" />
              <stop offset="60%" stopColor="#0EA5E9" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid Background */}
          <rect width={activePaths.width} height={activePaths.height} fill="url(#radarGridPattern)" />

          {/* Ocean Sphere Outline */}
          {activePaths.outline && (
            <path
              d={activePaths.outline}
              fill="rgba(8, 14, 26, 0.75)"
              stroke="rgba(56, 189, 248, 0.25)"
              strokeWidth="1.2"
            />
          )}

          {/* Real Geographic Graticule Latitude & Longitude Meridians */}
          {activePaths.graticule && (
            <path
              d={activePaths.graticule}
              fill="none"
              stroke="rgba(56, 189, 248, 0.08)"
              strokeWidth="0.6"
              strokeDasharray="2 3"
            />
          )}

          {/* Continuous Animated Radar Sweep Beam */}
          <g style={{
            transformOrigin: `${activePaths.width / 2}px ${activePaths.height / 2}px`,
            animation: 'spin 12s linear infinite',
            pointerEvents: 'none'
          }}>
            <line 
              x1={activePaths.width / 2} 
              y1={activePaths.height / 2} 
              x2={activePaths.width / 2} 
              y2={15} 
              stroke="rgba(56, 189, 248, 0.5)" 
              strokeWidth="1.5" 
            />
            <path
              d={`M ${activePaths.width / 2} ${activePaths.height / 2} L ${activePaths.width / 2} 15 A ${activePaths.height / 2 - 15} ${activePaths.height / 2 - 15} 0 0 1 ${activePaths.width / 2 + 160} ${activePaths.height / 2 - 120} Z`}
              fill="url(#radarSweepGradient)"
            />
          </g>

          {/* Real High-Precision World Continents (Natural Earth Vector Geometry) */}
          <path
            d={activePaths.land}
            fill="#0F172A"
            stroke="rgba(56, 189, 248, 0.45)"
            strokeWidth="0.85"
            style={{
              transition: 'fill 0.2s ease'
            }}
          />

          {/* Real Sovereign National Borders (177 Countries) */}
          <path
            d={activePaths.borders}
            fill="none"
            stroke="rgba(148, 163, 184, 0.14)"
            strokeWidth="0.55"
            strokeDasharray="1.5 1.5"
          />

          {/* Equator Line Indicator */}
          <line
            x1="30"
            y1={activePaths.height / 2}
            x2={activePaths.width - 30}
            y2={activePaths.height / 2}
            stroke="rgba(56, 189, 248, 0.15)"
            strokeWidth="0.8"
            strokeDasharray="4 4"
          />

          {/* Prime Meridian Indicator */}
          <line
            x1={activePaths.width / 2}
            y1="25"
            x2={activePaths.width / 2}
            y2={activePaths.height - 25}
            stroke="rgba(56, 189, 248, 0.15)"
            strokeWidth="0.8"
            strokeDasharray="4 4"
          />

          {/* Animated Trajectory Arc (if active) */}
          {animatedArc && (
            <g>
              <path
                d={`M ${animatedArc.fromX} ${animatedArc.fromY} Q ${(animatedArc.fromX + animatedArc.toX) / 2} ${Math.min(animatedArc.fromY, animatedArc.toY) - 75} ${animatedArc.toX} ${animatedArc.toY}`}
                fill="none"
                stroke="url(#arcGlow)"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                style={{
                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))'
                }}
              />
              <circle cx={animatedArc.toX} cy={animatedArc.toY} r="6" fill="#10B981">
                <animate attributeName="r" values="4;9;4" dur="1.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.9;0.2;0.9" dur="1.4s" repeatCount="indefinite" />
              </circle>
            </g>
          )}

          {/* Real Geographic Beacon Pins for Community Requests */}
          {displayedRequests.map((req) => {
            const coords = getCoordinatesForRequest(req);
            const { x, y } = projectCoords(coords.lat, coords.lng, projectionMode);
            const isSelected = req.id === activePinId;
            const isHovered = req.id === hoveredReqId;
            const themeColor = getThemeColor(req.unTheme);
            const isFreeze = req.climateData?.alertLevel === 'cold_freeze' || (req.climateData?.temperatureC ?? 10) <= 0;
            const langTag = getLanguageTag(req);

            return (
              <g
                key={req.id}
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  if (activePinId !== req.id) {
                    ElevenLabsService.stopAudio();
                  }
                  setActivePinId(req.id);
                  onSelectRequest(req);
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  if (activePinId !== req.id) {
                    ElevenLabsService.stopAudio();
                  }
                  setActivePinId(req.id);
                  onSelectRequest(req);
                }}
                onMouseEnter={() => setHoveredReqId(req.id)}
                onMouseLeave={() => setHoveredReqId(null)}
              >
                {/* Touch Hit Target */}
                <circle cx={x} cy={y} r="22" fill="transparent" style={{ pointerEvents: 'all' }} />

                {/* Outer Expanding Radar Ripple */}
                <circle cx={x} cy={y} r={isSelected ? 24 : 15} fill="none" stroke={themeColor} strokeWidth="1.2" opacity="0.45">
                  <animate attributeName="r" values="8;26;8" dur="2.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.85;0;0.85" dur="2.2s" repeatCount="indefinite" />
                </circle>

                {/* Sub-zero Freeze Frost Halo */}
                {isFreeze && (
                  <circle cx={x} cy={y} r="19" fill="none" stroke="#38BDF8" strokeWidth="1" strokeDasharray="3 3" opacity="0.8">
                    <animateTransform attributeName="transform" type="rotate" from={`0 ${x} ${y}`} to={`360 ${x} ${y}`} dur="6s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Core Beacon Pin */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 7.5 : 5.5}
                  fill={themeColor}
                  stroke="#FFFFFF"
                  strokeWidth={isSelected ? 2 : 1.2}
                  style={{
                    filter: `drop-shadow(0 ${isSelected ? 3 : 2}px ${isSelected ? 6 : 3}px rgba(0, 0, 0, 0.75))`,
                    transition: 'all 0.2s ease'
                  }}
                />

                {/* Inner Jewel Pulse */}
                <circle cx={x} cy={y} r={isSelected ? 3 : 2} fill="#FFFFFF" />

                {/* City Label & Language Tag */}
                <text
                  x={x}
                  y={y - 12}
                  textAnchor="middle"
                  fill="#F8FAFC"
                  fontSize={isSelected ? '9.5' : '8'}
                  fontWeight={isSelected ? '800' : '600'}
                  style={{
                    pointerEvents: 'none',
                    textShadow: '0 2px 4px rgba(0,0,0,0.95)',
                    letterSpacing: '0.02em'
                  }}
                >
                  {req.location.split(',')[0]} {langTag ? `[${langTag}]` : ''}
                </text>

                {/* Live Temperature Tag */}
                {req.climateData && (
                  <text
                    x={x}
                    y={y + 16}
                    textAnchor="middle"
                    fill={req.climateData.temperatureC <= 0 ? '#38BDF8' : '#FCD34D'}
                    fontSize="7.2"
                    fontWeight="800"
                    style={{ 
                      pointerEvents: 'none', 
                      textShadow: '0 2px 4px rgba(0,0,0,0.95)' 
                    }}
                  >
                    {req.climateData.temperatureC}°C
                  </text>
                )}
              </g>
            );
          })}

          {/* Hover Tooltip Overlay */}
          {(() => {
            const hoveredReq = hoveredReqId ? requests.find(r => r.id === hoveredReqId) : null;
            if (!hoveredReq) return null;
            const coords = getCoordinatesForRequest(hoveredReq);
            const { x, y } = projectCoords(coords.lat, coords.lng, projectionMode);
            const tooltipWidth = 180;
            const tooltipHeight = 44;
            const tx = Math.max(10, Math.min(x - tooltipWidth / 2, activePaths.width - tooltipWidth - 10));
            const ty = y > 60 ? y - 56 : y + 22;
            const themeCol = getThemeColor(hoveredReq.unTheme);

            return (
              <g style={{ pointerEvents: 'none' }}>
                <rect
                  x={tx}
                  y={ty}
                  width={tooltipWidth}
                  height={tooltipHeight}
                  rx="6"
                  fill="rgba(10, 15, 30, 0.96)"
                  stroke={themeCol}
                  strokeWidth="1.2"
                  style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.85))' }}
                />
                <text x={tx + 8} y={ty + 16} fill="#F8FAFC" fontSize="8.5" fontWeight="700">
                  {hoveredReq.title.length > 26 ? hoveredReq.title.slice(0, 26) + '…' : hoveredReq.title}
                </text>
                <text x={tx + 8} y={ty + 32} fill="#94A3B8" fontSize="7.5">
                  {hoveredReq.location.split(',')[0]} • {hoveredReq.raisedAmountSOL}/{hoveredReq.targetAmountSOL} SOL
                </text>
              </g>
            );
          })()}
        </svg>

        {/* Empty State Overlay */}
        {requests.length === 0 && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(15, 23, 42, 0.94)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px 32px',
            textAlign: 'center',
            color: '#E2E8F0',
            backdropFilter: 'blur(10px)',
            pointerEvents: 'none'
          }}>
            <Globe size={36} color="#94A3B8" style={{ margin: '0 auto 10px', opacity: 0.8 }} />
            <p style={{ fontWeight: 700, fontSize: '0.96rem' }}>No active crisis beacons match filter</p>
            <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: 4 }}>Try clearing search or selecting "All Needs"</p>
          </div>
        )}

        {/* Floating Zoom & View Navigation Controls (Top Right) */}
        <div style={{
          position: 'absolute',
          top: 14,
          right: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          zIndex: 10
        }}>
          <button
            onClick={handleZoomIn}
            className="btn btn-secondary"
            style={{
              width: 32,
              height: 32,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(9, 14, 26, 0.9)',
              borderColor: 'rgba(56, 189, 248, 0.3)',
              color: '#FFFFFF'
            }}
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={handleZoomOut}
            className="btn btn-secondary"
            style={{
              width: 32,
              height: 32,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(9, 14, 26, 0.9)',
              borderColor: 'rgba(56, 189, 248, 0.3)',
              color: '#FFFFFF'
            }}
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={handleResetView}
            className="btn btn-secondary"
            style={{
              width: 32,
              height: 32,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(9, 14, 26, 0.9)',
              borderColor: 'rgba(56, 189, 248, 0.3)',
              color: '#FFFFFF'
            }}
            title="Reset Zoom & Pan"
            aria-label="Reset View"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Bottom Left Actions: Simulate Arc & Live Status */}
        <div style={{ position: 'absolute', bottom: 14, left: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => activeReq && handleSimulateGrantArc(activeReq)}
            disabled={!activeReq}
            className="btn btn-secondary"
            style={{
              fontSize: '0.72rem',
              padding: '6px 12px',
              background: 'rgba(7, 10, 18, 0.88)',
              opacity: !activeReq ? 0.5 : 1,
              cursor: !activeReq ? 'not-allowed' : 'pointer'
            }}
            title="Simulate cross-border grant trajectory from donor to this beacon"
          >
            <Sparkles size={13} color="var(--primary-amber)" />
            <span>Simulate Solana Grant Arc</span>
          </button>

          <span style={{
            fontSize: '0.7rem',
            color: '#94A3B8',
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 'var(--radius-full)',
            padding: '4px 10px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
            <span>{requests.length} Verified Global Beacons</span>
          </span>
        </div>
      </div>

      {/* Selected Beacon Radar HUD Card */}
      {activeReq && (
        <div style={{
          marginTop: 18,
          padding: 18,
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
          alignItems: 'center'
        }}>
          {/* Left Column: Story details */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <span className={`badge badge-${activeReq.unTheme === 'Climate & Poverty' ? 'climate' : activeReq.unTheme === 'Youth Leadership' ? 'youth' : 'amber'}`}>
                {activeReq.unTheme}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={12} color="var(--primary-amber)" />
                {activeReq.location}
              </span>
              {activeReq.originalLanguageLabel && (
                <span style={{
                  background: 'rgba(168, 85, 247, 0.14)',
                  border: '1px solid rgba(168, 85, 247, 0.35)',
                  color: '#C084FC',
                  fontSize: '0.68rem',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <Globe size={11} />
                  <span>Spoken in: {activeReq.originalLanguageLabel}</span>
                </span>
              )}
              {activeReq.is501c3Verified && (
                <button
                  onClick={() => onOpenNonprofitModal(activeReq)}
                  style={{
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#34D399',
                    fontSize: '0.68rem',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer'
                  }}
                  title="View IRS 501(c)(3) Form 990 public verification"
                >
                  <ShieldCheck size={12} />
                  <span>IRS 501(c)(3) Verified</span>
                </button>
              )}
            </div>

            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 4 }}>
              {activeReq.title}
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {activeReq.description}
            </p>
            {activeReq.originalTranscript && (
              <div style={{
                marginTop: 6,
                padding: '4px 8px',
                background: 'rgba(168, 85, 247, 0.08)',
                borderLeft: '2px solid #A855F7',
                borderRadius: '0 4px 4px 0',
                fontSize: '0.76rem',
                color: '#CBD5E1',
                fontStyle: 'italic',
                lineHeight: 1.3
              }}>
                "{activeReq.originalTranscript}"
              </div>
            )}
          </div>

          {/* Middle Column: Live Climate Pill & Audio Player */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Live Climate Badge */}
            {activeReq.climateData && (
              <div style={{
                background: activeReq.climateData.temperatureC <= 0 ? 'rgba(56, 189, 248, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                border: `1px solid ${activeReq.climateData.temperatureC <= 0 ? 'rgba(56, 189, 248, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                padding: '6px 12px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '0.78rem'
              }}>
                <Thermometer size={16} color={activeReq.climateData.temperatureC <= 0 ? '#38BDF8' : '#F59E0B'} />
                <div>
                  <span style={{ fontWeight: 800, color: '#FFFFFF' }}>
                    {activeReq.climateData.temperatureC}°C ({activeReq.climateData.temperatureF}°F)
                  </span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>
                    • {activeReq.climateData.alertBadge || activeReq.climateData.weatherCondition}
                  </span>
                </div>
              </div>
            )}

            {/* In-Radar Spoken Audio Button (Touch Friendly) */}
            {activeReq.originalTranscript || (activeReq.originalLanguage && !activeReq.originalLanguage.startsWith('en')) ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => onPlayAudio(activeReq, 'original')}
                  className="btn btn-secondary"
                  style={{
                    flex: 1,
                    minHeight: 44,
                    justifyContent: 'center',
                    fontSize: '0.76rem',
                    padding: '8px 10px',
                    background: activePlayingId === `${activeReq.id}-original` && isPlayingAudio ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    borderColor: activePlayingId === `${activeReq.id}-original` && isPlayingAudio ? '#A855F7' : 'var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: '#C084FC'
                  }}
                  title={`Listen in ${activeReq.originalLanguageLabel || 'Native Tongue'}`}
                >
                  {activePlayingId === `${activeReq.id}-original` && isPlayingAudio ? (
                    <>
                      <Pause size={14} color="#A855F7" />
                      <span>Pause Native</span>
                    </>
                  ) : (
                    <>
                      <Volume2 size={14} color="#A855F7" />
                      <span>{activeReq.originalLanguageLabel || 'Native Tongue'}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => onPlayAudio(activeReq, 'english')}
                  className="btn btn-secondary"
                  style={{
                    flex: 1,
                    minHeight: 44,
                    justifyContent: 'center',
                    fontSize: '0.76rem',
                    padding: '8px 10px',
                    background: (activePlayingId === `${activeReq.id}-english` || activePlayingId === activeReq.id) && isPlayingAudio ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    borderColor: (activePlayingId === `${activeReq.id}-english` || activePlayingId === activeReq.id) && isPlayingAudio ? 'var(--primary-amber)' : 'var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                  title="Listen in English Narration"
                >
                  {(activePlayingId === `${activeReq.id}-english` || activePlayingId === activeReq.id) && isPlayingAudio ? (
                    <>
                      <Pause size={14} color="var(--primary-amber)" />
                      <span>Pause English</span>
                    </>
                  ) : (
                    <>
                      <Play size={14} color="var(--primary-amber)" />
                      <span>English Voice</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={() => onPlayAudio(activeReq, 'english')}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  minHeight: 44,
                  justifyContent: 'center',
                  fontSize: '0.82rem',
                  padding: '10px 14px',
                  background: activePlayingId === activeReq.id && isPlayingAudio ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  borderColor: activePlayingId === activeReq.id && isPlayingAudio ? 'var(--primary-amber)' : 'var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                {activePlayingId === activeReq.id && isPlayingAudio ? (
                  <>
                    <Pause size={16} color="var(--primary-amber)" />
                    <span>Pause Spoken Story</span>
                  </>
                ) : (
                  <>
                    <Play size={16} color="var(--primary-amber)" />
                    <span>Listen to Spoken Story ({activeReq.audioDurationSec}s)</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Right Column: Funding Progress & 1-Click Micro-Grant */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-amber)' }}>
                {activeReq.raisedAmountSOL} / {activeReq.targetAmountSOL} SOL
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {activeReq.donorCount} community micro-grants logged
              </div>
            </div>

            {activeReq.status === 'fulfilled' ? (
              <button
                onClick={() => onOpenCertificateModal?.(activeReq)}
                className="btn btn-emerald"
                style={{ width: '100%', minHeight: 44, justifyContent: 'center', fontSize: '0.84rem', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}
                title="View on-chain cryptographic proof of generosity certificate"
              >
                <Award size={16} />
                <span>View Proof Certificate</span>
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => onOpenDonateModal(activeReq, 0.10)}
                  className="btn btn-primary"
                  style={{ flex: 1, minHeight: 44, justifyContent: 'center', fontSize: '0.84rem', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <Coins size={16} />
                  <span>Send 0.10 SOL</span>
                </button>
                {activeReq.raisedAmountSOL > 0 && onOpenProofModal && (
                  <button
                    onClick={() => onOpenProofModal(activeReq)}
                    title="Upload Delivery Proof / Scan Receipt to Release Escrow"
                    className="btn btn-secondary"
                    style={{ minHeight: 44, padding: '10px 12px', borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38BDF8', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <ShieldCheck size={16} />
                    <span>Proof</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
