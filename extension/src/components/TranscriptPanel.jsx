import { useEffect, useRef } from 'react';
import { EMOTION_COLORS, EMOTION_EMOJI } from '../App';

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function IntensityBar({ intensity = 0.5, color }) {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center', marginTop: 4 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{
          width: 14, height: 3, borderRadius: 2,
          background: i < Math.round(intensity * 5) ? color : 'rgba(255,255,255,0.08)',
          transition: 'background 0.3s',
        }} />
      ))}
    </div>
  );
}

export default function TranscriptPanel({ transcript, highlightIndex, currentTime }) {
  const containerRef = useRef(null);
  const activeRef = useRef(null);

  // Auto-scroll to keep active segment visible
  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [highlightIndex]);

  if (!transcript.length) return null;

  return (
    <div
      ref={containerRef}
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '12px 0',
      }}
    >
      {transcript.map((seg, idx) => {
        const isActive = idx === highlightIndex;
        const isPast = idx < highlightIndex;
        const color = EMOTION_COLORS[seg.emotion] || 'var(--tone-neutral)';
        const emoji = EMOTION_EMOJI[seg.emotion] || '😐';

        return (
          <div
            key={idx}
            ref={isActive ? activeRef : null}
            style={{
              padding: '10px 16px',
              borderLeft: `3px solid ${isActive ? color : 'transparent'}`,
              background: isActive
                ? color + '12'
                : isPast
                ? 'transparent'
                : 'transparent',
              opacity: isPast ? 0.45 : 1,
              transition: 'all 0.3s ease',
              cursor: 'default',
            }}
          >
            {/* Timestamp + emotion badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)',
                minWidth: 36,
              }}>
                {formatTime(seg.start)}
              </span>
              <span style={{
                fontSize: 10, fontFamily: 'var(--font-mono)',
                color: color,
                background: color + '20',
                border: `1px solid ${color}40`,
                padding: '1px 7px', borderRadius: 20,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                {emoji} {seg.emotion}
              </span>
              {isActive && (
                <span style={{
                  fontSize: 9, color: color, fontFamily: 'var(--font-mono)',
                  animation: 'fadeIn 0.3s ease',
                }}>
                  ▶ NOW
                </span>
              )}
            </div>

            {/* Transcript text */}
            <p style={{
              fontSize: 13,
              lineHeight: 1.65,
              color: isActive ? 'var(--text)' : 'var(--text-muted)',
              fontFamily: 'var(--font-display)',
              fontWeight: isActive ? 500 : 400,
              transition: 'color 0.3s',
            }}>
              {seg.text}
            </p>

            {/* Intensity bar */}
            <IntensityBar intensity={seg.intensity || 0.5} color={color} />

            {/* Context tooltip on active */}
            {isActive && seg.context && (
              <div style={{
                marginTop: 8,
                padding: '8px 10px',
                background: 'var(--bg3)',
                borderRadius: 6,
                border: `1px solid ${color}30`,
                animation: 'slideDown 0.25s ease',
              }}>
                <p style={{
                  fontSize: 11, color: color,
                  fontFamily: 'var(--font-mono)', lineHeight: 1.5,
                }}>
                  💬 {seg.context}
                </p>
              </div>
            )}
          </div>
        );
      })}

      <style>{`
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-4px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}
