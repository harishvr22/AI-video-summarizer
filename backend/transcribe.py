
import whisper
import torch

_models = {}

def load_whisper(size="small"):
    if size not in _models:
        _models[size] = whisper.load_model(size)
    return _models[size]

def transcribe(wav_path: str, model_size="small"):
    model = load_whisper(model_size)
    fp16 = torch.cuda.is_available()
    # Use stricter decoding to reduce hallucinations and disable cross-segment conditioning
    result = model.transcribe(
        wav_path,
        fp16=fp16,
        language=None,  # auto-detect to avoid forcing incorrect language
        task="transcribe",
        temperature=0.0,
        best_of=5,
        beam_size=5,
        condition_on_previous_text=False,
        no_speech_threshold=0.6,
        logprob_threshold=-1.0,
        compression_ratio_threshold=2.4,
    )

    segments = result.get("segments")
    if not segments:
        return result.get("text", ""), segments

    # Filter segments that are likely hallucinations or low-confidence
    filtered = []
    for s in segments:
        avg_logprob = s.get("avg_logprob", 0)
        no_speech_prob = s.get("no_speech_prob", 0)
        compression_ratio = s.get("compression_ratio", 0)
        if no_speech_prob is not None and no_speech_prob > 0.6:
            continue
        if avg_logprob is not None and avg_logprob < -1.0:
            continue
        if compression_ratio is not None and compression_ratio > 2.4:
            continue
        filtered.append(s)

    text = " ".join((s.get("text", "").strip() for s in filtered)).strip()
    return (text if text else result.get("text", "")), filtered
