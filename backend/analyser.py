"""
analyser.py
===========
Uses Google Gemini API to:
1. Analyse emotion of each transcript chunk
2. Generate overall summary with key points, dominant emotion, emotional arc
"""

import os
import json
import asyncio
import re
from typing import List, Dict, Any

import google.generativeai as genai

from .transcript import chunk_transcript

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL   = "gemini-1.5-flash"   # fast + cheap for this use case

VALID_EMOTIONS = {
    "joy", "excitement", "sadness", "anger",
    "fear", "surprise", "disgust", "neutral",
    "sarcasm", "confidence",
}

genai.configure(api_key=GEMINI_API_KEY)


# ── Prompt templates ─────────────────────────────────────────────────────────

SEGMENT_PROMPT = """You are an emotion analysis expert. Analyse the emotional tone of the following transcript segment.

Transcript segment:
\"\"\"
{text}
\"\"\"

Respond ONLY with valid JSON (no markdown, no extra text):
{{
  "emotion": "<one of: joy, excitement, sadness, anger, fear, surprise, disgust, neutral, sarcasm, confidence>",
  "intensity": <float 0.0-1.0>,
  "context": "<one sentence explaining WHY this emotion was detected in the speaker>"
}}"""


SUMMARY_PROMPT = """You are an expert content analyst. Analyse the following YouTube video transcript and provide a structured summary.

Full transcript:
\"\"\"
{transcript_text}
\"\"\"

Emotion data per segment (JSON):
{emotion_data}

Respond ONLY with valid JSON (no markdown, no extra text):
{{
  "text": "<2-3 sentence overview of the video content and emotional journey>",
  "keyPoints": [
    {{"point": "<key insight>", "emotion": "<dominant emotion for this point>"}},
    ... (3-6 key points)
  ],
  "dominantEmotion": "<overall dominant emotion across the video>",
  "emotionBreakdown": {{
    "<emotion>": <percentage 0-100>,
    ...
  }},
  "emotionTimeline": [
    {{"label": "<short label e.g. '0:00'>", "emotion": "<emotion at that point>"}},
    ... (5-8 evenly spaced timeline points)
  ]
}}"""


# ── Core functions ────────────────────────────────────────────────────────────

def _call_gemini(prompt: str) -> str:
    """Synchronous Gemini call — run via asyncio.to_thread."""
    model = genai.GenerativeModel(GEMINI_MODEL)
    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=0.2,
            max_output_tokens=512,
        )
    )
    return response.text.strip()


def _parse_json_response(raw: str) -> dict:
    """Strip markdown fences if present and parse JSON."""
    text = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()
    return json.loads(text)


async def _analyse_chunk(chunk: Dict, semaphore: asyncio.Semaphore) -> Dict:
    """Analyse a single chunk; returns chunk enriched with emotion fields."""
    async with semaphore:
        prompt = SEGMENT_PROMPT.format(text=chunk["text"])
        try:
            raw = await asyncio.to_thread(_call_gemini, prompt)
            parsed = _parse_json_response(raw)

            emotion = parsed.get("emotion", "neutral").lower()
            if emotion not in VALID_EMOTIONS:
                emotion = "neutral"

            return {
                **chunk,
                "emotion":   emotion,
                "intensity": float(parsed.get("intensity", 0.5)),
                "context":   parsed.get("context", ""),
            }
        except Exception as e:
            return {
                **chunk,
                "emotion":   "neutral",
                "intensity": 0.5,
                "context":   f"(analysis failed: {e})",
            }


def _expand_chunks_to_segments(
    original_segments: List[Dict],
    analysed_chunks: List[Dict],
) -> List[Dict]:
    """
    Map chunk-level emotion back to each original small segment.
    Each original segment inherits the emotion of the chunk it belonged to.
    """
    # Build index → (emotion, intensity, context)
    seg_map = {}
    for chunk in analysed_chunks:
        for idx in chunk.get("segment_indices", []):
            seg_map[idx] = {
                "emotion":   chunk["emotion"],
                "intensity": chunk["intensity"],
                "context":   chunk["context"],
            }

    result = []
    for i, seg in enumerate(original_segments):
        info = seg_map.get(i, {"emotion": "neutral", "intensity": 0.5, "context": ""})
        result.append({**seg, **info})
    return result


async def _generate_summary(
    raw_segments: List[Dict],
    analysed_chunks: List[Dict],
) -> Dict:
    """Generate overall summary using Gemini."""
    full_text = " ".join(s["text"] for s in raw_segments)[:6000]  # cap at ~6k chars

    emotion_data = json.dumps([
        {"start": c["start"], "emotion": c["emotion"], "intensity": c["intensity"]}
        for c in analysed_chunks
    ])

    prompt = SUMMARY_PROMPT.format(
        transcript_text=full_text,
        emotion_data=emotion_data[:2000],
    )

    try:
        raw = await asyncio.to_thread(_call_gemini, prompt)
        return _parse_json_response(raw)
    except Exception as e:
        return {
            "text": "Summary could not be generated.",
            "keyPoints": [],
            "dominantEmotion": "neutral",
            "emotionBreakdown": {},
            "emotionTimeline": [],
            "error": str(e),
        }


# ── Public API ────────────────────────────────────────────────────────────────

async def analyse_transcript(
    raw_segments: List[Dict],
    video_id: str,
) -> Dict[str, Any]:
    """
    Full pipeline:
    1. Chunk segments (~120 words each)
    2. Analyse each chunk in parallel (max 5 concurrent Gemini calls)
    3. Expand chunk emotions back to individual segments
    4. Generate overall summary
    Returns {transcript: [...], summary: {...}}
    """
    # 1. Chunk
    chunks = chunk_transcript(raw_segments, max_words=120)

    # 2. Parallel analysis with concurrency limit
    semaphore = asyncio.Semaphore(5)
    tasks = [_analyse_chunk(chunk, semaphore) for chunk in chunks]
    analysed_chunks = await asyncio.gather(*tasks)

    # 3. Expand to segment level
    full_transcript = _expand_chunks_to_segments(raw_segments, analysed_chunks)

    # 4. Summary
    summary = await _generate_summary(raw_segments, analysed_chunks)

    return {
        "video_id":  video_id,
        "transcript": full_transcript,
        "summary":   summary,
    }
