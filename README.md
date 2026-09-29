# LeadPilot AI

LeadPilot AI is a small AI-powered real-estate sales assistant that helps a salesperson turn inbound lead messages into prioritized, actionable sales work.

## What I built

- Lead intake for name, location, property requirement, budget, buying timeline, and customer message.
- Gemini-powered lead analysis: summary, intent, requirements, concerns, next action, suggested response, and follow-up plan.
- Deterministic lead scoring and HOT/WARM/COLD priority labels.
- Multiple saved leads in SQLite with a priority queue.
- Lead-grounded conversational assistant for follow-up questions.
- **Own feature: Next Best Action / Follow-up Plan**, connecting AI analysis to a concrete salesperson workflow.

## Architecture

```text
Salesperson -> React UI -> FastAPI -> SQLite
                              |
                              +-> Gemini API -> Structured Analysis
                              |
                              +-> Deterministic Scoring -> Priority
                              |
                              +-> Lead-grounded Chat -> Gemini
```

The LLM interprets qualitative customer information. The backend calculates the final score using fixed weights so prioritization is predictable and easy to debug.

## AI model and API

The backend uses Google's Gemini API through the official `google-genai` Python SDK. Lead analysis uses structured output with a Pydantic schema. Chat uses the same model with the selected lead injected as context.

Set:

```env
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
```

## Scoring

The model returns four 0-100 signals:

- Timeline: 30%
- Budget: 25%
- Intent: 25%
- Engagement: 20%

The backend computes the weighted score. Priority is:

- 75-100: HOT
- 50-74: WARM
- 0-49: COLD

This separation keeps qualitative interpretation in the LLM and business logic in deterministic application code.

## Local setup

### Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env
# Set GEMINI_API_KEY in .env
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

## API endpoints

- `POST /api/leads` — create a lead
- `GET /api/leads` — list leads ordered by score
- `GET /api/leads/{id}` — get one lead
- `POST /api/leads/{id}/analyze` — call Gemini and calculate score
- `POST /api/leads/{id}/chat` — ask a lead-grounded question
- `GET /health` — health check

## Deployment

Recommended split deployment:

- Frontend: Vercel static site
- Backend: Render Web Service
- Database: SQLite for this assignment
- AI: Gemini API

Set `VITE_API_URL` in Vercel to the deployed backend URL. Set `GEMINI_API_KEY` and `FRONTEND_URL` in Render.

## Known limitations

- SQLite is appropriate for a small assignment/demo but not for concurrent production workloads.
- Render free services may sleep after inactivity, so the first request can be slower.
- Lead scoring is a prioritization heuristic, not a prediction of conversion probability.
- The AI only has the information supplied in the lead record; it does not query live property inventory.
- No authentication is included because the assignment focuses on the lead workflow.

## AI usage disclosure

Replace this section with the tools you actually used. Example:

- ChatGPT: architecture planning, prompt design, debugging, and README/demo preparation.
- Coding assistant: code scaffolding, autocomplete, and refactoring suggestions.
- Gemini: runtime lead analysis and lead-grounded conversational assistance.

All submitted code should be reviewed and understood by the author.
