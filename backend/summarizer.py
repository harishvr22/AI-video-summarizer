
from transformers import pipeline
import torch
from .chunking import chunk_text

_summarizer = None

def load_summarizer(model_name="facebook/bart-large-cnn"):
    global _summarizer
    if _summarizer is None:
        device = 0 if torch.cuda.is_available() else -1
        _summarizer = pipeline("summarization", model=model_name, device=device)
    return _summarizer

def summarize_text(transcript: str, model_name="facebook/bart-large-cnn"):
    summarizer = load_summarizer(model_name)
    parts = chunk_text(transcript, max_words=700, overlap=120)
    partials = []
    for p in parts:
        out = summarizer(p, max_length=180, min_length=40, do_sample=False)
        partials.append(out[0]["summary_text"])
    if len(partials) == 1:
        return partials[0]
    joined = " ".join(partials)
    final = summarizer(joined, max_length=200, min_length=60, do_sample=False)
    return final[0]["summary_text"]
