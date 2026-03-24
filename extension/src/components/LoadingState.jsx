// LoadingState.jsx
export function LoadingState() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', gap: 20, padding: 32,
    }}>
      <SpinnerRing />
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Analysing Video</p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}>
          Fetching transcript → analysing emotions via Gemini
        </p>
      </div>
      <StepIndicator />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeStep { 0%,100%{opacity:0.3} 50%{opacity:1} }
      `}</style>
    </div>
  );
}

function SpinnerRing() {
  return (
    <div style={{
      width: 56, height: 56, borderRadius: '50%',
      border: '3px solid var(--bg3)',
      borderTop: '3px solid var(--accent)',
      borderRight: '3px solid var(--accent2)',
      animation: 'spin 1s linear infinite',
    }} />
  );
}

function StepIndicator() {
  const steps = ['Extract video ID', 'Fetch transcript', 'Analyse emotions', 'Build summary'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      {steps.map((s, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          animation: `fadeStep 2s ease ${i * 0.5}s infinite`,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--accent)', flexShrink: 0,
          }} />
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            {s}
          </span>
        </div>
      ))}
    </div>
  );
}

// ErrorState.jsx
export function ErrorState({ message, onRetry }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', gap: 14, padding: 32, textAlign: 'center',
    }}>
      <div style={{ fontSize: 40 }}>⚠️</div>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--tone-anger)' }}>Analysis Failed</p>
      <p style={{
        fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
        lineHeight: 1.6, wordBreak: 'break-word',
      }}>
        {message || 'Unknown error. Is the backend running on port 8000?'}
      </p>
      <button
        onClick={onRetry}
        style={{
          padding: '8px 20px',
          background: 'var(--bg3)',
          border: '1px solid var(--accent)',
          borderRadius: 6, color: 'var(--accent)',
          fontSize: 12, fontFamily: 'var(--font-display)',
          cursor: 'pointer', fontWeight: 600,
        }}
      >
        Retry
      </button>
    </div>
  );
}

export default LoadingState;
