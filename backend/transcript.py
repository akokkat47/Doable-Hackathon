"""
transcript.py
=============
Fetches raw transcript from YouTube using youtube-transcript-api.
Returns a list of segments: [{start, duration, text}]
"""

from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound
from typing import List, Dict, Any


def fetch_transcript(video_id: str) -> List[Dict[str, Any]]:
    """
    Fetch transcript for a YouTube video.
    Tries English first, then falls back to auto-generated, then any available.
    Returns list of {start: float, duration: float, text: str}
    """
    try:
        # Try to get English transcript first
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)

        transcript = None

        # Priority: manual EN → auto EN → any manual → any auto
        try:
            transcript = transcript_list.find_manually_created_transcript(['en', 'en-US', 'en-GB'])
        except Exception:
            pass

        if transcript is None:
            try:
                transcript = transcript_list.find_generated_transcript(['en', 'en-US'])
            except Exception:
                pass

        if transcript is None:
            # Take whatever's available and translate to English
            for t in transcript_list:
                if t.is_translatable:
                    transcript = t.translate('en')
                    break
                transcript = t
                break

        if transcript is None:
            raise ValueError("No transcript available")

        raw = transcript.fetch()

        # Normalise format
        segments = []
        for entry in raw:
            segments.append({
                "start":    float(entry.get("start", 0)),
                "duration": float(entry.get("duration", 3)),
                "text":     entry.get("text", "").strip(),
            })

        return segments

    except TranscriptsDisabled:
        raise ValueError("Transcripts are disabled for this video.")
    except NoTranscriptFound:
        raise ValueError("No transcript found for this video.")
    except Exception as e:
        raise ValueError(f"Transcript fetch failed: {e}")


def chunk_transcript(segments: List[Dict], max_words: int = 120) -> List[Dict]:
    """
    Group small transcript segments into ~120-word chunks for efficient Gemini calls.
    Returns list of {start, duration, text, segment_indices}
    """
    chunks = []
    current_text = []
    current_start = None
    current_indices = []
    word_count = 0

    for i, seg in enumerate(segments):
        words = seg["text"].split()
        if current_start is None:
            current_start = seg["start"]

        current_text.append(seg["text"])
        current_indices.append(i)
        word_count += len(words)

        if word_count >= max_words:
            end = seg["start"] + seg["duration"]
            chunks.append({
                "start":           current_start,
                "duration":        end - current_start,
                "text":            " ".join(current_text),
                "segment_indices": current_indices,
            })
            current_text = []
            current_start = None
            current_indices = []
            word_count = 0

    # Remainder
    if current_text:
        last = segments[current_indices[-1]]
        end = last["start"] + last["duration"]
        chunks.append({
            "start":           current_start,
            "duration":        end - current_start,
            "text":            " ".join(current_text),
            "segment_indices": current_indices,
        })

    return chunks
