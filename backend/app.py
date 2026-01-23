
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from .extract_audio import extract_audio
from .transcribe import transcribe
from .summarizer import summarize_text


app = FastAPI(title="AI Video Summarizer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PROJECT_ROOT = Path(__file__).resolve().parents[1]
UPLOADS = PROJECT_ROOT / "data" / "uploads"
UPLOADS.mkdir(parents=True, exist_ok=True)

@app.get("/")
def root():
    return {"ok": True, "message": "API running"}

@app.post("/summarize/")
async def summarize_video(file: UploadFile = File(...)):
    filename = file.filename
    if not filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    save_path = UPLOADS / filename
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    wav_path = UPLOADS / (save_path.stem + ".wav")
    print(f"[1/3] Extracting audio from {filename}...")
    extract_audio(str(save_path), str(wav_path))
    print(f"[1/3] ✓ Audio extracted to {wav_path.name}")

    print(f"[2/3] Loading Whisper model and transcribing...")
    # Use default model/config from transcribe() to reduce hallucinations
    transcript, segments = transcribe(str(wav_path))
    print(f"[2/3] ✓ Transcription complete ({len(transcript)} chars)")

    print(f"[3/3] Loading BART model and generating summary...")
    summary = summarize_text(transcript)
    print(f"[3/3] ✓ Summary generated ({len(summary)} chars)")

    (UPLOADS / f"{save_path.stem}_transcript.txt").write_text(transcript, encoding="utf-8")
    (UPLOADS / f"{save_path.stem}_summary.txt").write_text(summary, encoding="utf-8")

    return {"summary": summary, "transcript": transcript[:2000]}
