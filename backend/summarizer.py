import os
import torch
from transformers import pipeline
from .chunking import chunk_text

_SUMMARIZER = None

def get_summarizer():
    global _SUMMARIZER
    if _SUMMARIZER is None:
        model_name = os.getenv(
            "SUMMARIZER_MODEL",
            "sshleifer/distilbart-cnn-12-6"
        )
        device = 0 if torch.cuda.is_available() else -1
        _SUMMARIZER = pipeline(
            "summarization",
            model=model_name,
            device=device
        )
    return _SUMMARIZER


def summarize_text(text: str) -> str:
    """
    Summarize long text by:
    1. Splitting into sentence-based chunks
    2. Summarizing each chunk
    3. Merging summaries
    """

    if not text or len(text.strip()) < 50:
        return text

    summarizer = get_summarizer()

    chunks = chunk_text(text, max_words=200)
    summaries = []

    for chunk in chunks:
        if len(chunk.strip()) < 40:
            continue

        result = summarizer(
            chunk,
            max_length=120,
            min_length=30,
            do_sample=False
        )
        summaries.append(result[0]["summary_text"])

    return " ".join(summaries)
