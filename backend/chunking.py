
def chunk_text(text: str, max_words: int = 700, overlap: int = 120):
    words = text.split()
    chunks = []
    i = 0
    step = max(1, max_words - overlap)
    while i < len(words):
        chunk = " ".join(words[i:i+max_words])
        chunks.append(chunk)
        i += step
    return chunks
