from transformers import pipeline
from .chunking import chunk_text

# Load summarization model (good balance of accuracy + speed)
summarizer = pipeline(
    "summarization",
    model="facebook/bart-large-cnn"
)

def summarize_text(text):
    """
    Summarize long text by:
    1. Splitting into sentence-based chunks
    2. Summarizing each chunk
    3. Merging summaries
    """
    chunks = chunk_text(text, max_words=200)

    summaries = []

    for chunk in chunks:
        result = summarizer(
            chunk,
            max_length=150,
            min_length=60,
            do_sample=False
        )
        summaries.append(result[0]["summary_text"])

    final_summary = " ".join(summaries)
    return final_summary
