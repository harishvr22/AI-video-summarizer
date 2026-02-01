import nltk
from nltk.tokenize import sent_tokenize

# Download required NLTK resources (safe to call multiple times)
nltk.download("punkt", quiet=True)
nltk.download("punkt_tab", quiet=True)

def chunk_text(text, max_words=200):
    """
    Split text into chunks using sentences
    without breaking sentence meaning.
    """
    sentences = sent_tokenize(text)

    chunks = []
    current_chunk = ""

    for sentence in sentences:
        if len((current_chunk + " " + sentence).split()) <= max_words:
            current_chunk += " " + sentence
        else:
            if current_chunk.strip():
                chunks.append(current_chunk.strip())
            current_chunk = sentence

    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    return chunks
