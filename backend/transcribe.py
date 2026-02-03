import os
import whisper
import torch

_models = {}

def clean_text(text: str) -> str:
    fillers = [
        " uh ", " um ", " ah ", " er ",
        " you know ", " like ", " okay ", " ok "
    ]

    text = text.lower()

    for f in fillers:
        text = text.replace(f, " ")

    text = " ".join(text.split())
    return text


def load_whisper(size=None, device=None):
    """Load and cache Whisper models.

    Defaults to a smaller model to reduce memory. Configure with WHISPER_SIZE env var.
    """
    size = size or os.getenv("WHISPER_SIZE", "small")
    device = device or ("cuda" if torch.cuda.is_available() else "cpu")
    key = f"{size}:{device}"
    if key not in _models:
        # pass device to whisper.load_model to avoid unnecessary GPU/CPU allocation surprises
        _models[key] = whisper.load_model(size, device=device)
    return _models[key]


def transcribe(wav_path: str, model_size=None):
    # If model_size is None, load_whisper will use WHISPER_SIZE env var (default: "small")
    model = load_whisper(model_size)
    fp16 = torch.cuda.is_available()

    result = model.transcribe(
        wav_path,
        fp16=fp16,
        language="en",
        task="transcribe",
        temperature=0.0,
        beam_size=5,
        best_of=5,
        condition_on_previous_text=True,
        no_speech_threshold=0.6,
        logprob_threshold=-1.0,
        compression_ratio_threshold=2.4,
    )

    segments = result.get("segments")
    if not segments:
        raw = result.get("text", "")
        return clean_text(raw), segments

    filtered = []
    for s in segments:
        avg_logprob = s.get("avg_logprob", 0)
        no_speech_prob = s.get("no_speech_prob", 0)
        compression_ratio = s.get("compression_ratio", 0)

        if no_speech_prob is not None and no_speech_prob > 0.7:
            continue
        if avg_logprob is not None and avg_logprob < -1.3:
            continue
        if compression_ratio is not None and compression_ratio > 2.6:
            continue

        filtered.append(s)

    raw_text = " ".join(s.get("text", "").strip() for s in filtered).strip()
    raw_text = raw_text if raw_text else result.get("text", "")

    cleaned_text = clean_text(raw_text)

    return cleaned_text, filtered
