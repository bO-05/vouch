import React, { useState, useEffect, useRef } from 'react';
import { Mic, Move } from './Icons';

interface FloatingVoiceFabProps {
  onOpenVoiceModal: () => void;
  isAudioPlaying?: boolean;
}

interface Position {
  x: number;
  y: number;
}

export const FloatingVoiceFab: React.FC<FloatingVoiceFabProps> = ({
  onOpenVoiceModal,
  isAudioPlaying = false
}) => {
  const [position, setPosition] = useState<Position | null>(() => {
    try {
      const saved = localStorage.getItem('echokind_fab_position');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch (e) {}
    return null;
  });

  const [isDragging, setIsDragging] = useState(false);
  const [showDragHint, setShowDragHint] = useState(false);

  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    hasMoved: boolean;
  } | null>(null);

  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Keep within bounds on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        if (!prev) return null;
        const btnWidth = 58;
        const btnHeight = 58;
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

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    // Only respond to primary mouse button or touch
    if (e.button !== 0) return;

    const btn = buttonRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: rect.left,
      initialY: rect.top,
      hasMoved: false
    };

    btn.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragStartRef.current) return;

    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;

    if (!dragStartRef.current.hasMoved && Math.hypot(dx, dy) > 5) {
      dragStartRef.current.hasMoved = true;
      setIsDragging(true);
    }

    if (dragStartRef.current.hasMoved) {
      const btnWidth = 58;
      const btnHeight = 58;
      const margin = 12;
      const maxX = window.innerWidth - btnWidth - margin;
      const maxY = window.innerHeight - btnHeight - margin;

      const rawX = dragStartRef.current.initialX + dx;
      const rawY = dragStartRef.current.initialY + dy;

      const newPos = {
        x: Math.max(margin, Math.min(maxX, rawX)),
        y: Math.max(margin, Math.min(maxY, rawY))
      };

      setPosition(newPos);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragStartRef.current) return;

    const hasMoved = dragStartRef.current.hasMoved;
    const btn = buttonRef.current;
    if (btn && btn.hasPointerCapture(e.pointerId)) {
      btn.releasePointerCapture(e.pointerId);
    }

    setIsDragging(false);

    if (!hasMoved) {
      // Tap/Click detected: open voice recorder
      dragStartRef.current = null;
      onOpenVoiceModal();
    } else {
      // Drag ended: persist to localStorage
      dragStartRef.current = null;
      if (position) {
        try {
          localStorage.setItem('echokind_fab_position', JSON.stringify(position));
        } catch (e) {}
      }
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    const btn = buttonRef.current;
    if (btn && btn.hasPointerCapture(e.pointerId)) {
      btn.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
    dragStartRef.current = null;
  };

  // Double click resets position to default bottom-right
  const handleDoubleClick = () => {
    setPosition(null);
    try {
      localStorage.removeItem('echokind_fab_position');
    } catch (e) {}
  };

  // Determine container styling:
  // If custom position is set, position via left/top.
  // Otherwise, use default bottom-right styling with audio offset.
  const containerStyle: React.CSSProperties = position
    ? {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 95,
        touchAction: 'none',
        userSelect: 'none'
      }
    : {
        position: 'fixed',
        right: '24px',
        bottom: isAudioPlaying ? '134px' : '24px',
        zIndex: 95,
        transition: 'bottom 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        touchAction: 'none',
        userSelect: 'none'
      };

  return (
    <div
      className="floating-fab-container"
      style={containerStyle}
      onMouseEnter={() => setShowDragHint(true)}
      onMouseLeave={() => setShowDragHint(false)}
    >
      {/* Sleek contextual drag hint badge */}
      {showDragHint && !isDragging && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            right: 0,
            marginBottom: 8,
            background: 'rgba(9, 13, 22, 0.94)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 'var(--radius-full)',
            padding: '4px 10px',
            fontSize: '0.68rem',
            color: '#A7F3D0',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <Move size={11} color="#10B981" />
          <span>Click to Speak • Drag to Move</span>
        </div>
      )}

      <button
        ref={buttonRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onDoubleClick={handleDoubleClick}
        className="fab-mic-btn"
        title="Click to record voice mutual aid request · Drag to reposition · Double-click to reset"
        aria-label="Record voice mutual aid request"
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          transform: isDragging ? 'scale(1.10)' : undefined,
          boxShadow: isDragging
            ? '0 20px 40px -4px rgba(0, 0, 0, 0.85), inset 0 1px 1px rgba(255, 255, 255, 0.4)'
            : undefined,
          transition: isDragging ? 'none' : 'transform 0.15s ease, box-shadow 0.15s ease'
        }}
      >
        <Mic size={24} color="#080A0F" strokeWidth={2.4} />

        {/* Tiny reposition grip indicator badge */}
        <div
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#080A0F',
            border: '1.5px solid #10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.9
          }}
          title="Draggable FAB"
        >
          <Move size={9} color="#10B981" />
        </div>
      </button>
    </div>
  );
};
