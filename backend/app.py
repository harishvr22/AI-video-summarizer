import shutil
import os
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .extract_audio import extract_audio
from .transcribe import transcribe
from .summarizer import summarize_text
from .database import activities_collection

app = FastAPI(title="AI Video Summarizer API")

# CORS (required for frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
PROJECT_ROOT = Path(__file__).resolve().parents[1]
UPLOADS = PROJECT_ROOT / "data" / "uploads"
UPLOADS.mkdir(parents=True, exist_ok=True)

# ---------------- ROOT ----------------
@app.get("/")
def root():
    return {"ok": True, "message": "API running"}

# ---------------- SUMMARIZE ----------------
@app.post("/summarize/")
async def summarize_video(file: UploadFile = File(...)):
    filename = file.filename
    if not filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    # Save video
    save_path = UPLOADS / filename
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract audio
    wav_path = UPLOADS / (save_path.stem + ".wav")
    extract_audio(str(save_path), str(wav_path))

    # Transcribe
    transcript, _ = transcribe(str(wav_path))

    # Summarize
    summary = summarize_text(transcript)

    # Save files
    transcript_file = f"{save_path.stem}_transcript.txt"
    summary_file = f"{save_path.stem}_summary.txt"

    (UPLOADS / transcript_file).write_text(transcript, encoding="utf-8")
    (UPLOADS / summary_file).write_text(summary, encoding="utf-8")

    # 🔥 SAVE TO MONGODB (IMPORTANT)
    activity = {
        "file": filename,
        "transcript": transcript_file,
        "summary": summary_file,
        "processed_time": datetime.utcnow()
    }
    activities_collection.insert_one(activity)

    return {
        "summary": summary,
        "transcript": transcript[:2000]
    }

# ---------------- HISTORY ----------------
@app.get("/activities/")
def get_activities():
    activities = []
    for a in activities_collection.find({}, {"_id": 0}):
        activities.append(a)
    return {"activities": activities}

# ---------------- MAIN ----------------
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.app:app", host="0.0.0.0", port=port)
