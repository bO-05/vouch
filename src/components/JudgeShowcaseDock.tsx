import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, SnowflakeIcon, FileText, Volume2, Thermometer, Bolt, X, Move } from './Icons';

interface JudgeShowcaseDockProps {
  onTriggerSnowflake: () => void;
  onTriggerVisionOCR: () => void;
  onTriggerMultilingualVoice: () => void;
  onTriggerClimateRadar: () => void;
  onTriggerMicroGrant?: () => void;
  onOpenJudgeModal: () => void;
  isAudioPlaying?: boolean;
}

export const JudgeShowcaseDock: React.FC<JudgeShowcaseDockProps> = ({
  onTriggerSnowflake,
  onTriggerVisionOCR,
  onTriggerMultilingualVoice,
  onTriggerClimateRadar,
  onTriggerMicroGrant,
  onOpenJudgeModal,
  isAudioPlaying = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [collapsedPos, setCollapsedPos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingCollapsed, setIsDraggingCollapsed] = useState(false);

  const collapsedDragStartRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    hasMoved: boolean;
  } | null>(null);

  const collapsedBtnRef = useRef<HTMLButtonElement | null>(null);

  // Keep collapsed launcher within bounds on window resize
  useEffect(() => {
    const handleResize = () => {
      setCollapsedPos(prev => {
        if (!prev) return null;
        const btnWidth = 160;
        const btnHeight = 40;
        const margin = 12;
        const maxX = window.innerWidth - btnWidth - margin;
        const maxY = window.innerHeight - btnHeight - margin;
        return {
          x: Math.max(margin, Math.min(maxX, prev.x)),
          y: Math.max(margin, Math.min(maxY, prev.y))
        };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCollapsedPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    const btn = collapsedBtnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    collapsedDragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: rect.left,
      initialY: rect.top,
      hasMoved: false
    };
    btn.setPointerCapture(e.pointerId);
  };

  const handleCollapsedPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!collapsedDragStartRef.current) return;
    const dx = e.clientX - collapsedDragStartRef.current.startX;
    const dy = e.clientY - collapsedDragStartRef.current.startY;

    if (!collapsedDragStartRef.current.hasMoved && Math.hypot(dx, dy) > 5) {
      collapsedDragStartRef.current.hasMoved = true;
      setIsDraggingCollapsed(true);
    }

    if (collapsedDragStartRef.current.hasMoved) {
      const btnWidth = 160;
      const btnHeight = 40;
      const margin = 12;
      const maxX = window.innerWidth - btnWidth - margin;
      const maxY = window.innerHeight - btnHeight - margin;

      const rawX = collapsedDragStartRef.current.initialX + dx;
      const rawY = collapsedDragStartRef.current.initialY + dy;

      setCollapsedPos({
        x: Math.max(margin, Math.min(maxX, rawX)),
        y: Math.max(margin, Math.min(maxY, rawY))
      });
    }
  };

  const handleCollapsedPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!collapsedDragStartRef.current) return;
    const hasMoved = collapsedDragStartRef.current.hasMoved;
    const btn = collapsedBtnRef.current;
    if (btn && btn.hasPointerCapture(e.pointerId)) {
      btn.releasePointerCapture(e.pointerId);
    }
    setIsDraggingCollapsed(false);
    collapsedDragStartRef.current = null;

    if (!hasMoved) {
      setIsCollapsed(false);
    }
  };

  const handleCollapsedPointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    const btn = collapsedBtnRef.current;
    if (btn && btn.hasPointerCapture(e.pointerId)) {
      btn.releasePointerCapture(e.pointerId);
    }
    setIsDraggingCollapsed(false);
    collapsedDragStartRef.current = null;
  };

  // If collapsed, render sleek launcher button
  if (isCollapsed) {
    const launcherStyle: React.CSSProperties = collapsedPos
      ? {
          position: 'fixed',
          left: `${collapsedPos.x}px`,
          top: `${collapsedPos.y}px`,
          zIndex: 85,
          touchAction: 'none',
          userSelect: 'none'
        }
      : {
          position: 'fixed',
          bottom: isAudioPlaying ? 134 : 24,
          left: 24,
          zIndex: 85,
          transition: 'bottom 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          touchAction: 'none',
          userSelect: 'none'
        };

    return (
      <aside
        aria-label="Judge Demo Tour Launcher"
        style={launcherStyle}
      >
        <button
          ref={collapsedBtnRef}
          onPointerDown={handleCollapsedPointerDown}
          onPointerMove={handleCollapsedPointerMove}
          onPointerUp={handleCollapsedPointerUp}
          onPointerCancel={handleCollapsedPointerCancel}
          onDoubleClick={() => setCollapsedPos(null)}
          style={{
            background: 'rgba(14, 19, 31, 0.94)',
            color: '#F8FAFC',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-full)',
            padding: '9px 16px',
            fontSize: '0.80rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.75)',
            cursor: isDraggingCollapsed ? 'grabbing' : 'grab',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            transform: isDraggingCollapsed ? 'scale(1.05)' : undefined,
            transition: isDraggingCollapsed ? 'none' : 'transform 0.15s ease'
          }}
          title="Click to open Judge 60s Demo Showcase · Drag to reposition"
        >
          <Sparkles size={14} color="#C084FC" />
          <span>Judge 60s Tour</span>
          <Move size={11} color="var(--text-muted)" style={{ marginLeft: 2 }} />
        </button>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Judge 60-Second Demo Showcase Dock"
      style={{
        position: 'fixed',
        bottom: isAudioPlaying ? 134 : 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 85,
        width: 'min(94%, 960px)',
        background: 'rgba(13, 17, 27, 0.94)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-full)',
        padding: '7px 14px 7px 18px',
        boxShadow: '0 16px 40px -10px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        transition: 'bottom 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Label and Quick Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'rgba(192, 132, 252, 0.15)',
          border: '1px solid rgba(192, 132, 252, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Sparkles size={13} color="#C084FC" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.01em' }}>
            Judge 60s Tour
          </span>
          <span style={{
            fontSize: '0.64rem',
            fontWeight: 700,
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            padding: '1px 6px',
            borderRadius: 'var(--radius-full)'
          }}>
            Evaluator
          </span>
        </div>
      </div>

      {/* Horizontal Scrollable Scenario Buttons (Zero Emojis, Pure SVG) */}
      <div 
        className="horizontal-touch-ribbon"
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 6, 
          overflowX: 'auto',
          padding: '2px 0'
        }}
      >
        {/* Scenario 1: Snowflake Cortex */}
        <button
          onClick={onTriggerSnowflake}
          style={{
            background: 'rgba(41, 181, 232, 0.08)',
            border: '1px solid rgba(41, 181, 232, 0.25)',
            borderRadius: 'var(--radius-full)',
            padding: '5px 12px',
            color: '#38BDF8',
            fontSize: '0.74rem',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'all 0.15s ease'
          }}
          title="Run Snowflake Cortex anomaly detection SQL on VOUCH_ANALYTICS_WH"
        >
          <SnowflakeIcon size={12} color="#38BDF8" />
          <span>Snowflake Cortex</span>
        </button>

        {/* Scenario 2: Gemini VisionGuard OCR */}
        <button
          onClick={onTriggerVisionOCR}
          style={{
            background: 'rgba(96, 165, 250, 0.08)',
            border: '1px solid rgba(96, 165, 250, 0.25)',
            borderRadius: 'var(--radius-full)',
            padding: '5px 12px',
            color: '#93C5FD',
            fontSize: '0.74rem',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'all 0.15s ease'
          }}
          title="Inspect supermarket grocery receipt OCR line-item extraction with Gemini VisionGuard"
        >
          <FileText size={12} color="#93C5FD" />
          <span>Vision OCR</span>
        </button>

        {/* Scenario 3: ElevenLabs Multilingual Voice */}
        <button
          onClick={onTriggerMultilingualVoice}
          style={{
            background: 'rgba(251, 113, 133, 0.08)',
            border: '1px solid rgba(251, 113, 133, 0.25)',
            borderRadius: 'var(--radius-full)',
            padding: '5px 12px',
            color: '#FDA4AF',
            fontSize: '0.74rem',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'all 0.15s ease'
          }}
          title="Listen to East LA Spanish solidarity kitchen plea with authentic dialect audio"
        >
          <Volume2 size={12} color="#FDA4AF" />
          <span>Multilingual Voice</span>
        </button>

        {/* Scenario 4: Open-Meteo Climate Radar */}
        <button
          onClick={onTriggerClimateRadar}
          style={{
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: 'var(--radius-full)',
            padding: '5px 12px',
            color: '#7DD3FC',
            fontSize: '0.74rem',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'all 0.15s ease'
          }}
          title="Jump to Global Radar Map and center freeze anomaly"
        >
          <Thermometer size={12} color="#7DD3FC" />
          <span>Climate Radar</span>
        </button>

        {/* Scenario 5: Gasless Devnet Micro-Grant */}
        {onTriggerMicroGrant && (
          <button
            onClick={onTriggerMicroGrant}
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 'var(--radius-full)',
              padding: '5px 12px',
              color: '#34D399',
              fontSize: '0.74rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.15s ease'
            }}
            title="1-Click sponsored Devnet micro-grant to Ukraine Winter Emergency"
          >
            <Bolt size={12} color="#10B981" />
            <span>1-Click Devnet Grant</span>
          </button>
        )}
      </div>

      {/* Trailing Controls: Full Sandbox & Minimize */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <button
          onClick={onOpenJudgeModal}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-full)',
            padding: '5px 10px',
            color: '#F8FAFC',
            fontSize: '0.72rem',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease'
          }}
          title="Open complete architecture and diagnostic sandbox"
        >
          <span>Architecture & Keys</span>
        </button>

        <button
          onClick={() => setIsCollapsed(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%'
          }}
          title="Minimize Judge Dock"
          aria-label="Minimize Judge Dock"
        >
          <X size={15} />
        </button>
      </div>
    </aside>
  );
};
