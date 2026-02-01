import nltk
from nltk.tokenize import sent_tokenize

# Download once (safe even if it runs again)
nltk.download("punkt", quiet=True)

def chunk_text(text, max_words=200):
    """
    Split text into chunks using sentences.
    This avoids breaking sentence meaning.
    """
    sentences = sent_tokenize(text)

    chunks = []
    current_chunk = ""

    for sentence in sentences:
        # Check word count if we add this sentence
        if len((current_chunk + " " + sentence).split()) <= max_words:
            current_chunk = current_chunk + " " + sentence
        else:
            chunks.append(current_chunk.strip())
            current_chunk = sentence

    # Add remaining text
    if current_chunk:
        chunks.append(current_chunk.strip())

    return chunks
