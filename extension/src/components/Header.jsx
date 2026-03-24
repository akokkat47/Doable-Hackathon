import { EMOTION_COLORS, EMOTION_EMOJI } from '../App';

const TABS = [
  { id: 'transcript', label: 'Transcript' },
  { id: 'summary',    label: 'Summary' },
  { id: 'chart',      label: 'Chart' },
];

export default function Header({ videoId, status, activeTab, onTabChange, summary }) {
  const dominant = summary?.dominantEmotion;

  return (
    <div style={{
      background: 'var(--bg2)',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0,
    }}>
      {/* Brand row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px 8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 800,
          }}>T</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, letterSpacing: '-0.3px' }}>
            ToneTrack
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {dominant && (
            <span style={{
              fontSize: 11, fontFamily: 'var(--font-mono)',
              color: EMOTION_COLORS[dominant] || 'var(--text-muted)',
              background: (EMOTION_COLORS[dominant] || '#9e9eb8') + '18',
              border: `1px solid ${(EMOTION_COLORS[dominant] || '#9e9eb8')}40`,
              padding: '2px 8px', borderRadius: 20,
            }}>
              {EMOTION_EMOJI[dominant]} {dominant}
            </span>
          )}
          <StatusDot status={status} />
        </div>
      </div>

      {/* Video ID chip */}
      {videoId && (
        <div style={{ padding: '0 16px 8px' }}>
          <span style={{
            fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
            background: 'var(--bg3)', padding: '2px 8px', borderRadius: 4,
            border: '1px solid var(--border)',
          }}>
            youtube.com/watch?v={videoId}
          </span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', padding: '0 16px', gap: 4 }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              flex: 1, padding: '7px 0',
              background: activeTab === tab.id ? 'var(--bg3)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id
                ? '2px solid var(--accent)'
                : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--text)' : 'var(--text-muted)',
              fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 600,
              cursor: 'pointer', borderRadius: '6px 6px 0 0',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function StatusDot({ status }) {
  const colors = {
    idle:    '#6b6b88',
    loading: '#f9d849',
    ready:   '#43e97b',
    error:   '#ff4d6d',
  };
  return (
    <div style={{
      width: 8, height: 8, borderRadius: '50%',
      background: colors[status] || '#6b6b88',
      boxShadow: status === 'ready' ? '0 0 6px #43e97b' :
                 status === 'loading' ? '0 0 6px #f9d849' : 'none',
      animation: status === 'loading' ? 'pulse 1s infinite' : 'none',
    }} />
  );
}
