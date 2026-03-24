import { useState, useEffect, useRef, useCallback } from 'react';
import TranscriptPanel from './components/TranscriptPanel';
import SummaryPanel from './components/SummaryPanel';
import EmotionChart from './components/EmotionChart';
import Header from './components/Header';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';

const BACKEND = 'http://localhost:8000';

// Emotion → CSS variable mapping
export const EMOTION_COLORS = {
  joy:        'var(--tone-joy)',
  excitement: 'var(--tone-excitement)',
  sadness:    'var(--tone-sadness)',
  anger:      'var(--tone-anger)',
  fear:       'var(--tone-fear)',
  surprise:   'var(--tone-surprise)',
  disgust:    'var(--tone-disgust)',
  neutral:    'var(--tone-neutral)',
  sarcasm:    'var(--tone-sarcasm)',
  confidence: 'var(--tone-confidence)',
};

export const EMOTION_EMOJI = {
  joy: '😄', excitement: '🔥', sadness: '💙', anger: '😤',
  fear: '😨', surprise: '😮', disgust: '🤢', neutral: '😐',
  sarcasm: '😏', confidence: '💪',
};

function getVideoIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('videoId') || params.get('v');
}

export default function App() {
  const [videoId, setVideoId] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [error, setError] = useState(null);
  const [transcript, setTranscript] = useState([]); // [{start, duration, text, emotion, intensity, context}]
  const [summary, setSummary] = useState(null);     // {text, keyPoints, dominantEmotion, emotionTimeline}
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTab, setActiveTab] = useState('transcript'); // transcript | summary | chart
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const analysisCache = useRef({});

  /* ── Get video ID ──────────────────────────────────── */
  useEffect(() => {
    const id = getVideoIdFromUrl();
    if (id) {
      setVideoId(id);
    } else {
      // Try via chrome runtime message (popup mode)
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({ type: 'GET_VIDEO_ID' }, (res) => {
          if (res?.videoId) setVideoId(res.videoId);
        });
      }
    }
  }, []);

  /* ── Listen for time updates from content.js ───────── */
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === 'YT_TIME_UPDATE') {
        setCurrentTime(e.data.currentTime);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  /* ── Auto highlight current transcript segment ──────── */
  useEffect(() => {
    if (!transcript.length) return;
    const idx = transcript.findLastIndex(seg => seg.start <= currentTime);
    setHighlightIndex(idx);
  }, [currentTime, transcript]);

  /* ── Fetch analysis when videoId is ready ───────────── */
  const analyse = useCallback(async (id) => {
    if (!id) return;
    if (analysisCache.current[id]) {
      const cached = analysisCache.current[id];
      setTranscript(cached.transcript);
      setSummary(cached.summary);
      setStatus('ready');
      return;
    }

    setStatus('loading');
    setError(null);
    setTranscript([]);
    setSummary(null);

    try {
      const res = await fetch(`${BACKEND}/analyse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: id }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Backend error');
      }

      const data = await res.json();
      analysisCache.current[id] = data;
      setTranscript(data.transcript);
      setSummary(data.summary);
      setStatus('ready');
    } catch (e) {
      setError(e.message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (videoId) analyse(videoId);
  }, [videoId, analyse]);

  /* ── Render ────────────────────────────────────────── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      <Header
        videoId={videoId}
        status={status}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        summary={summary}
      />

      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {status === 'idle' && (
          <EmptyState />
        )}

        {status === 'loading' && <LoadingState />}

        {status === 'error' && (
          <ErrorState message={error} onRetry={() => analyse(videoId)} />
        )}

        {status === 'ready' && (
          <>
            {activeTab === 'transcript' && (
              <TranscriptPanel
                transcript={transcript}
                highlightIndex={highlightIndex}
                currentTime={currentTime}
              />
            )}
            {activeTab === 'summary' && (
              <SummaryPanel summary={summary} transcript={transcript} />
            )}
            {activeTab === 'chart' && (
              <EmotionChart transcript={transcript} currentTime={currentTime} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', gap: 12, padding: 32, textAlign: 'center'
    }}>
      <div style={{ fontSize: 48 }}>🎬</div>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6, fontFamily: 'var(--font-mono)' }}>
        Open a YouTube video to begin tone analysis
      </p>
    </div>
  );
}
