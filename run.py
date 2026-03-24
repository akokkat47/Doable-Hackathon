"""
run.py — start ToneTrack backend
Usage: python run.py
"""
import os
from dotenv import load_dotenv

load_dotenv()  # loads GEMINI_API_KEY from .env

# Validate key before starting
if not os.environ.get("GEMINI_API_KEY"):
    print("❌  ERROR: GEMINI_API_KEY not set.")
    print("   Create a .env file in the backend/ directory:")
    print("   GEMINI_API_KEY=your_key_here")
    raise SystemExit(1)

import uvicorn
uvicorn.run(
    "backend.main:app",
    host="0.0.0.0",
    port=8000,
    reload=True,
    log_level="info",
)
