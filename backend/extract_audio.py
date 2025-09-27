
from moviepy.editor import VideoFileClip
from pathlib import Path

def extract_audio(video_path: str, out_wav: str):
    Path(out_wav).parent.mkdir(parents=True, exist_ok=True)
    clip = VideoFileClip(video_path)
    clip.audio.write_audiofile(out_wav, fps=16000, nbytes=2, codec="pcm_s16le")
    clip.close()
    return out_wav
