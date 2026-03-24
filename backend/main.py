"""
ToneTrack Backend
=================
FastAPI server that:
1. Accepts a YouTube video_id
2. Fetches transcript via youtube-transcript-api
3. Sends transcript chunks to Gemini for emotion analysis
4. Returns colour-coded transcript + summary to the extension

No auth, no database — stateless per request with in-memory LRU cache.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import logging

from .transcript import fetch_transcript
from .analyser import analyse_transcript
from .cache import lru_cache_get, lru_cache_set

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("tonetrack")

app = FastAPI(title="ToneTrack API", version="1.0.0")

# Allow extension (chrome-extension://*) and localhost dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)


class AnalyseRequest(BaseModel):
    video_id: str


@app.get("/health")
def health():
    return {"status": "ok", "service": "tonetrack"}


@app.post("/analyse")
async def analyse(req: AnalyseRequest):
    video_id = req.video_id.strip()
    if not video_id:
        raise HTTPException(status_code=400, detail="video_id is required")

    logger.info(f"[analyse] video_id={video_id}")

    # ── 1. Check in-memory cache ────────────────────────────────
    cached = lru_cache_get(video_id)
    if cached:
        logger.info(f"[analyse] cache hit for {video_id}")
        return cached

    # ── 2. Fetch transcript ─────────────────────────────────────
    try:
        raw_transcript = await asyncio.to_thread(fetch_transcript, video_id)
    except Exception as e:
        logger.error(f"[transcript] {e}")
        raise HTTPException(status_code=422, detail=f"Could not fetch transcript: {str(e)}")

    if not raw_transcript:
        raise HTTPException(status_code=422, detail="Transcript is empty or unavailable for this video.")

    # ── 3. Analyse emotions via Gemini ──────────────────────────
    try:
        result = await analyse_transcript(raw_transcript, video_id)
    except Exception as e:
        logger.error(f"[analyser] {e}")
        raise HTTPException(status_code=500, detail=f"Emotion analysis failed: {str(e)}")

    # ── 4. Cache and return ─────────────────────────────────────
    lru_cache_set(video_id, result)
    return result
