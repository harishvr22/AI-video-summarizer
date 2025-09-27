
import whisper
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

print("Downloading Whisper base...")
whisper.load_model("base")

print("Downloading BART (facebook/bart-large-cnn)...")
AutoTokenizer.from_pretrained("facebook/bart-large-cnn")
AutoModelForSeq2SeqLM.from_pretrained("facebook/bart-large-cnn")

print("All set. You can run offline now.")
