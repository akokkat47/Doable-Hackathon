import { useMemo } from 'react';
import { EMOTION_COLORS, EMOTION_EMOJI } from '../App';

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function EmotionChart({ transcript, currentTime }) {
  const total = useMemo(() => {
    if (!transcript.length) return 0;
    const last = transcript[transcript.length - 1];
    return last.start + (last.duration || 5);
  }, [transcript]);

  // Group emotion counts
  const emotionCounts = useMemo(() => {
    const counts = {};
    transcript.forEach(s => {
      counts[s.emotion] = (counts[s.emotion] || 0) + 1;
    });
    return counts;
  }, [transcript]);

  const progressPct = total > 0 ? Math.min((currentTime / total) * 100, 100) : 0;

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '16px' }}>

      {/* Playhead timeline strip */}
      <h3 style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
        color: 'var(--text-muted)', textTransform: 'uppercase',
        fontFamily: 'var(--font-mono)', marginBottom: 12,
      }}>
        〰 Emotion Timeline
      </h3>

      <TimelineStrip transcript={transcript} currentTime={currentTime} total={total} />

      {/* Progress */}
      <div style={{ marginTop: 8, marginBottom: 20 }}>
        <div style={{
          width: '100%', height: 3, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${progressPct}%`,
            background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
            borderRadius: 2, transition: 'width 0.3s',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            {formatTime(currentTime)}
          </span>
          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            {formatTime(total)}
          </span>
        </div>
      </div>

      {/* Emotion distribution ring */}
      <h3 style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
        color: 'var(--text-muted)', textTransform: 'uppercase',
        fontFamily: 'var(--font-mono)', marginBottom: 12,
      }}>
        🎭 Distribution
      </h3>

      <EmotionPieChart counts={emotionCounts} total={transcript.length} />

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
        {Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]).map(([emotion, count]) => (
          <div key={emotion} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 9px',
            background: (EMOTION_COLORS[emotion] || '#9e9eb8') + '18',
            border: `1px solid ${(EMOTION_COLORS[emotion] || '#9e9eb8')}35`,
            borderRadius: 20, fontSize: 11, fontFamily: 'var(--font-mono)',
            color: EMOTION_COLORS[emotion] || 'var(--text-muted)',
          }}>
            {EMOTION_EMOJI[emotion]} {emotion}
            <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>
              {Math.round((count / transcript.length) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Timeline strip: coloured band per segment ──────── */
function TimelineStrip({ transcript, currentTime, total }) {
  if (!total) return null;

  return (
    <div style={{
      width: '100%', height: 44, borderRadius: 6, overflow: 'hidden',
      display: 'flex', position: 'relative',
      background: 'var(--bg3)', border: '1px solid var(--border)',
    }}>
      {transcript.map((seg, i) => {
        const left = (seg.start / total) * 100;
        const width = ((seg.duration || 5) / total) * 100;
        const color = EMOTION_COLORS[seg.emotion] || 'var(--tone-neutral)';
        const isActive = seg.start <= currentTime && (seg.start + (seg.duration || 5)) > currentTime;

        return (
          <div
            key={i}
            title={`${seg.emotion}: ${seg.text?.slice(0, 60)}…`}
            style={{
              position: 'absolute',
              left: `${left}%`,
              width: `${Math.max(width, 0.3)}%`,
              height: '100%',
              background: color,
              opacity: isActive ? 1 : 0.55,
              transition: 'opacity 0.3s',
              cursor: 'default',
            }}
          />
        );
      })}

      {/* Playhead */}
      <div style={{
        position: 'absolute',
        left: `${Math.min((currentTime / total) * 100, 100)}%`,
        top: 0, bottom: 0, width: 2,
        background: '#fff',
        boxShadow: '0 0 6px #fff',
        transition: 'left 0.3s',
        zIndex: 2,
      }} />
    </div>
  );
}

/* ── SVG Donut chart ────────────────────────────────── */
function EmotionPieChart({ counts, total }) {
  const SIZE = 160;
  const R = 60;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const STROKE = 22;

  const segments = useMemo(() => {
    let cumulative = 0;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([emotion, count]) => {
        const pct = count / total;
        const seg = { emotion, pct, start: cumulative };
        cumulative += pct;
        return seg;
      });
  }, [counts, total]);

  function describeArc(start, end) {
    const startAngle = start * 2 * Math.PI - Math.PI / 2;
    const endAngle = end * 2 * Math.PI - Math.PI / 2;
    const x1 = CX + R * Math.cos(startAngle);
    const y1 = CY + R * Math.sin(startAngle);
    const x2 = CX + R * Math.cos(endAngle);
    const y2 = CY + R * Math.sin(endAngle);
    const largeArc = (end - start) > 0.5 ? 1 : 0;
    return `M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2}`;
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {segments.map((seg, i) => {
          const color = EMOTION_COLORS[seg.emotion] || '#9e9eb8';
          if (seg.pct < 0.005) return null;
          return (
            <path
              key={i}
              d={describeArc(seg.start, seg.start + seg.pct)}
              fill="none"
              stroke={color}
              strokeWidth={STROKE}
              strokeLinecap="butt"
              opacity={0.85}
            />
          );
        })}
        {/* Center label */}
        <text
          x={CX} y={CY - 6}
          textAnchor="middle"
          fill="var(--text)"
          fontSize="22"
          fontFamily="Syne, sans-serif"
          fontWeight="800"
        >
          {Object.keys(counts).length}
        </text>
        <text
          x={CX} y={CY + 12}
          textAnchor="middle"
          fill="#6b6b88"
          fontSize="9"
          fontFamily="Space Mono, monospace"
        >
          EMOTIONS
        </text>
      </svg>
    </div>
  );
}
