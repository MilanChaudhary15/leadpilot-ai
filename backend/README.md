# LeadPilot AI Backend

FastAPI backend for lead intake, Gemini analysis, deterministic scoring, and lead-grounded chat.

## Run locally

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env  # Windows
# cp .env.example .env  # macOS/Linux
uvicorn app.main:app --reload
```

Set `GEMINI_API_KEY` in `.env`.
