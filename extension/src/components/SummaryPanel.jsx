import { EMOTION_COLORS, EMOTION_EMOJI } from '../App';

export default function SummaryPanel({ summary, transcript }) {
  if (!summary) return null;

  const { text, keyPoints = [], dominantEmotion, emotionBreakdown = {}, emotionTimeline = [] } = summary;

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '16px' }}>

      {/* Overall summary */}
      <Section title="📝 Overview">
        <p style={{
          fontSize: 13, lineHeight: 1.7, color: 'var(--text-muted)',
          fontFamily: 'var(--font-display)',
        }}>
          {text}
        </p>
      </Section>

      {/* Dominant emotion */}
      {dominantEmotion && (
        <Section title="🎭 Overall Tone">
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 14px',
            background: (EMOTION_COLORS[dominantEmotion] || '#9e9eb8') + '15',
            border: `1px solid ${(EMOTION_COLORS[dominantEmotion] || '#9e9eb8')}35`,
            borderRadius: 8,
          }}>
            <span style={{ fontSize: 28 }}>{EMOTION_EMOJI[dominantEmotion]}</span>
            <div>
              <div style={{
                fontSize: 16, fontWeight: 700,
                color: EMOTION_COLORS[dominantEmotion] || 'var(--text)',
                fontFamily: 'var(--font-display)',
                textTransform: 'capitalize',
              }}>
                {dominantEmotion}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                primary emotion detected
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* Key points */}
      {keyPoints.length > 0 && (
        <Section title="✨ Key Points">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {keyPoints.map((kp, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                padding: '9px 12px',
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                borderRadius: 7,
              }}>
                <span style={{
                  fontSize: 10, fontFamily: 'var(--font-mono)',
                  color: 'var(--accent)',
                  background: 'var(--accent)20',
                  padding: '2px 6px', borderRadius: 4,
                  minWidth: 24, textAlign: 'center', marginTop: 1,
                }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                    {kp.point}
                  </p>
                  {kp.emotion && (
                    <span style={{
                      fontSize: 10, color: EMOTION_COLORS[kp.emotion] || 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)', marginTop: 3, display: 'block',
                    }}>
                      {EMOTION_EMOJI[kp.emotion]} {kp.emotion}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Emotion breakdown */}
      {Object.keys(emotionBreakdown).length > 0 && (
        <Section title="📊 Emotion Breakdown">
          <EmotionBreakdown breakdown={emotionBreakdown} />
        </Section>
      )}

      {/* Emotional arc */}
      {emotionTimeline.length > 0 && (
        <Section title="〰 Emotional Arc">
          <EmotionalArc timeline={emotionTimeline} />
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
        color: 'var(--text-muted)', textTransform: 'uppercase',
        fontFamily: 'var(--font-mono)', marginBottom: 10,
      }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function EmotionBreakdown({ breakdown }) {
  const sorted = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
  const max = sorted[0]?.[1] || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {sorted.map(([emotion, pct]) => {
        const color = EMOTION_COLORS[emotion] || 'var(--tone-neutral)';
        return (
          <div key={emotion} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', width: 80, textAlign: 'right' }}>
              {EMOTION_EMOJI[emotion]} {emotion}
            </span>
            <div style={{ flex: 1, background: 'var(--bg3)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${(pct / max) * 100}%`,
                background: color,
                borderRadius: 4,
                transition: 'width 0.8s cubic-bezier(.4,0,.2,1)',
              }} />
            </div>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', width: 32 }}>
              {Math.round(pct)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

function EmotionalArc({ timeline }) {
  // timeline: [{label, emotion}]
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {timeline.map((item, i) => {
        const color = EMOTION_COLORS[item.emotion] || 'var(--tone-neutral)';
        return (
          <div key={i} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: '6px 8px', background: color + '18',
            border: `1px solid ${color}35`, borderRadius: 6,
            minWidth: 52,
          }}>
            <span style={{ fontSize: 16 }}>{EMOTION_EMOJI[item.emotion]}</span>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textAlign: 'center' }}>
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
