
# AI Video Summarizer Project

## Setup
```bash
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
```

## Download Models (one-time, while online)
```bash
python download_models.py
```

## Run Backend
```bash
uvicorn backend.app:app --host 127.0.0.1 --port 8000 --reload
```

## Run Frontend
```bash
cd frontend
python -m http.server 5500
```

Open http://localhost:5500 in your browser.
