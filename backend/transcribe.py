
import whisper
import torch

_models = {}

def load_whisper(size="base"):
    if size not in _models:
        _models[size] = whisper.load_model(size)
    return _models[size]

def transcribe(wav_path: str, model_size="base"):
    model = load_whisper(model_size)
    fp16 = torch.cuda.is_available()
    result = model.transcribe(wav_path, fp16=fp16)
    return result.get("text", ""), result.get("segments", None)
