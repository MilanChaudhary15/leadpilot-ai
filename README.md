# LeadPilot AI

**AI-powered real-estate lead prioritization and sales assistant**

LeadPilot AI is a full-stack web application that helps real-estate sales teams capture customer leads, analyze buying intent using Generative AI, prioritize leads using a transparent scoring system, and assist salespeople with context-aware follow-up conversations.

The application combines a React frontend, FastAPI backend, SQLite persistence, and Google's Gemini API. It is deployed using Vercel and Render.

---

## Live Demo

**Live Application:**
https://leadpilot-ai-amber-seven.vercel.app/

**Backend API:**
https://leadpilot-ai-backend-j3be.onrender.com/

**API Documentation:**
https://leadpilot-ai-backend-j3be.onrender.com/docs

**GitHub Repository:**
https://github.com/MilanChaudhary15/leadpilot-ai

---

## Problem Statement

Real-estate sales teams receive leads with different levels of buying intent, urgency, budget fit, and engagement. Manually reviewing every lead can make it difficult to identify which customers require immediate attention.

LeadPilot AI addresses this problem by transforming raw customer information into structured sales insights and a transparent priority score.

The system helps a salesperson quickly understand:

* Who the customer is
* What property they are looking for
* Their budget and timeline
* Their buying intent
* Potential objections or concerns
* What the salesperson should do next
* How the salesperson can respond to the customer

---

## Key Features

### 1. Lead Intake

Salespeople can create leads with:

* Customer name
* Location
* Property requirement
* Budget
* Buying timeline
* Customer message

Each lead is persisted in the backend database.

### 2. AI Lead Analysis

LeadPilot AI uses the Gemini API to analyze the customer information and generate:

* Lead summary
* Customer intent
* Key requirements
* Objections and concerns
* Recommended next action
* Suggested customer response
* Follow-up plan

The AI analysis is generated from the information provided by the salesperson and customer.

### 3. Transparent Lead Scoring

The final lead score is calculated deterministically by the application rather than allowing the LLM to decide the final priority.

The scoring model uses four signals:

| Signal          | Weight |
| --------------- | -----: |
| Buying timeline |    30% |
| Budget          |    25% |
| Customer intent |    25% |
| Engagement      |    20% |

The resulting score is classified as:

|  Score | Priority |
| -----: | -------- |
| 75–100 | HOT      |
|  50–74 | WARM     |
|   0–49 | COLD     |

This makes the prioritization logic reproducible and easier to explain.

### 4. Conversational AI Sales Assistant

Salespeople can ask questions about an analyzed lead.

Examples:

* "What should I ask this customer next?"
* "What are the customer's main concerns?"
* "How should I respond to this lead?"
* "What should I focus on during the next conversation?"

The assistant uses the stored lead information and generated analysis as context.

### 5. Next Best Action + Follow-up Tracker

LeadPilot AI includes an additional workflow feature beyond the core requirements.

For each lead, the salesperson can track follow-up activities such as:

* Contact customer
* Confirm property preferences
* Review matching inventory
* Schedule site visit

Tasks can be marked as completed and are persisted in browser local storage for the selected lead.

### 6. Priority Queue

Leads are displayed according to their calculated score, allowing salespeople to quickly identify higher-priority leads.

The dashboard also provides aggregate counts for:

* Total leads
* HOT leads
* WARM leads
* COLD leads

---

## System Architecture

```text
                    ┌──────────────────────┐
                    │      Salesperson     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   React + Vite UI    │
                    │      (Vercel)        │
                    └──────────┬───────────┘
                               │ REST API
                               ▼
                    ┌──────────────────────┐
                    │    FastAPI Backend   │
                    │      (Render)        │
                    └──────┬─────────┬─────┘
                           │         │
                ┌──────────┘         └──────────────┐
                ▼                                   ▼
       ┌─────────────────┐                 ┌─────────────────┐
       │     SQLite      │                 │   Gemini API    │
       │ Lead Persistence│                 │ AI Analysis +   │
       │                 │                 │ Conversation    │
       └─────────────────┘                 └─────────────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ Deterministic    │
                  │ Scoring Engine   │
                  │ 30/25/25/20      │
                  └──────────────────┘
```

---

## Technology Stack

### Frontend

* React
* Vite
* JavaScript
* CSS
* Browser Local Storage

### Backend

* Python
* FastAPI
* SQLAlchemy
* Pydantic
* SQLite

### AI

* Google Gemini API
* Structured JSON output
* Prompt-based lead analysis
* Context-aware conversational assistant

### Deployment

* Vercel — Frontend
* Render — Backend API
* SQLite — Application persistence

---

## AI Architecture

The application separates AI generation from deterministic business logic.

### AI Layer

Gemini receives the lead information and generates structured analysis containing:

```json
{
  "summary": "...",
  "intent": "...",
  "requirements": [],
  "objections": [],
  "recommended_action": "...",
  "suggested_response": "...",
  "follow_up_plan": "...",
  "timeline_signal": 90,
  "budget_signal": 85,
  "intent_signal": 95,
  "engagement_signal": 80
}
```

### Scoring Layer

The application then calculates the final score:

```text
Final Score =
    Timeline × 0.30
  + Budget × 0.25
  + Intent × 0.25
  + Engagement × 0.20
```

The final score is converted into a HOT, WARM, or COLD priority.

This separation prevents the LLM from directly deciding the final business priority.

---

## AI Safety and Hallucination Controls

The application prompt explicitly instructs the AI not to invent real-estate information that is unavailable to the system.

The AI does not have access to live property inventory.

Therefore, the assistant is instructed not to claim that:

* A property is available
* Matching properties were found
* Specific properties exist
* A particular price is available
* A property has a particular amenity
* A particular listing or discount exists

Instead, the assistant recommends actions such as reviewing available inventory or confirming availability before making claims to the customer.

This keeps generated sales responses grounded in the information actually provided to the application.

---

## API Endpoints

| Method | Endpoint                  | Purpose                           |
| ------ | ------------------------- | --------------------------------- |
| GET    | `/`                       | API status                        |
| GET    | `/health`                 | Health check                      |
| POST   | `/api/leads`              | Create a lead                     |
| GET    | `/api/leads`              | Retrieve all leads                |
| GET    | `/api/leads/{id}`         | Retrieve a specific lead          |
| POST   | `/api/leads/{id}/analyze` | Analyze a lead using Gemini       |
| POST   | `/api/leads/{id}/chat`    | Ask the AI assistant about a lead |

Interactive API documentation is available through FastAPI Swagger UI at `/docs`.

---

## Project Structure

```text
leadpilot-ai/
│
├── README.md
├── render.yaml
├── .gitignore
│
├── backend/
│   ├── .env.example
│   ├── requirements.txt
│   ├── README.md
│   ├── test_models.py
│   │
│   └── app/
│       ├── __init__.py
│       ├── main.py
│       ├── config.py
│       ├── db.py
│       ├── models.py
│       ├── schemas.py
│       ├── ai.py
│       └── scoring.py
│
└── frontend/
    ├── .env.example
    ├── package.json
    ├── package-lock.json
    ├── index.html
    │
    └── src/
        ├── main.jsx
        └── styles.css
```

---

## Local Setup

### Prerequisites

Install:

* Python 3.10+
* Node.js 18+
* npm
* A Google Gemini API key

---

### 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd leadpilot-ai
```

---

### 2. Backend Setup

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment.

#### Windows PowerShell

```powershell
.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:5173
```

Start the backend:

```bash
python -m uvicorn app.main --host 0.0.0.0 --port 8000
```

The API will be available at:

```text
http://localhost:8000
```

Swagger documentation:

```text
http://localhost:8000/docs
```

---

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
```

Create `.env.local`:

```env
VITE_API_URL=http://localhost:8000
```

Start the development server:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

## Environment Variables

### Backend

```env
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:5173
```

### Frontend

```env
VITE_API_URL=http://localhost:8000
```

For production, `VITE_API_URL` points to the deployed Render backend.

**Important:** API keys must never be committed to GitHub.

The repository uses `.gitignore` rules to prevent `.env` files from being committed.

---

## Deployment

### Frontend — Vercel

The React/Vite application is deployed on Vercel.

Production environment variable:

```env
VITE_API_URL=https://leadpilot-ai-backend-j3be.onrender.com
```

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

### Backend — Render

The FastAPI backend is deployed on Render.

Root directory:

```text
backend
```

Build command:

```bash
pip install -r requirements.txt
```

Start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Production frontend origin is configured through:

```env
FRONTEND_URL=https://leadpilot-ai-amber-seven.vercel.app
```

---

## Example Lead

### Customer

**Name:** Rahul Sharma

**Location:** Bhopal

**Property Requirement:** 3 BHK apartment

**Budget:** ₹80–90 lakh

**Buying Timeline:** Within 1 month

**Customer Message:**

> I'm looking for a 3 BHK apartment for my family in a good location. I prefer something close to schools and public transport. My budget is around 85 lakh and I would like to move within the next month. Please share suitable options.

The application analyzes these signals and produces a structured lead profile, priority score, recommended action, response suggestion, and follow-up plan.

---

## Design Decisions

### Why FastAPI?

FastAPI provides:

* Typed request and response validation
* Simple REST API development
* Automatic Swagger documentation
* Easy integration with Python-based AI logic

### Why Gemini?

Gemini provides a hosted Generative AI API suitable for structured text analysis and conversational assistance without requiring a locally hosted language model.

### Why deterministic scoring?

The LLM is useful for extracting qualitative information such as intent and concerns, but the final business score should be predictable and explainable.

Therefore, the application uses AI-generated signals and calculates the final score using explicit weights.

### Why SQLite?

SQLite keeps the project lightweight and easy to deploy for a take-home assignment.

For a production system with multiple concurrent users, a managed relational database such as PostgreSQL would be more appropriate.

---

## Limitations

This project is a prototype designed for the assignment.

Current limitations include:

1. **No live property inventory integration**
   The application does not query real estate listings or availability.

2. **SQLite persistence**
   The deployed SQLite database is suitable for demonstration but is not designed for production-scale concurrent usage.

3. **No authentication**
   The prototype does not currently implement user authentication or role-based access control.

4. **Heuristic prioritization**
   The score represents a rule-based prioritization signal. It is not a trained prediction of actual conversion probability.

5. **Follow-up storage**
   Follow-up tasks are stored in browser local storage rather than a centralized database.

---

## Future Improvements

Potential production enhancements include:

* PostgreSQL database
* Authentication and role-based access control
* CRM integration
* Live property inventory APIs
* Customer interaction history
* Automated reminders
* Email/WhatsApp integration
* Lead conversion feedback loop
* Evaluation dataset for AI responses
* Observability and AI quality monitoring
* Model/version tracking
* Multi-tenant architecture
* More advanced lead scoring based on historical conversion data

---

## AI Usage Disclosure

AI coding assistants were used during development to accelerate implementation, debugging, code refinement, and documentation.

Generative AI was also used as a core application component through the Gemini API for:

* Lead analysis
* Intent extraction
* Requirement extraction
* Objection identification
* Recommended next actions
* Suggested customer responses
* Follow-up planning
* Conversational assistance

The final lead priority score is calculated by deterministic application logic rather than being directly generated by the LLM.

---

## Assignment Coverage

| Assignment Requirement   | Implementation                                         |
| ------------------------ | ------------------------------------------------------ |
| Lead intake              | React lead creation form                               |
| Customer information     | Name, location, requirement, budget, timeline, message |
| AI analysis              | Gemini structured analysis                             |
| Lead summary             | AI-generated summary                                   |
| Customer intent          | AI-generated intent                                    |
| Requirements             | Structured requirements                                |
| Objections               | Structured objections                                  |
| Recommended action       | AI-generated next action                               |
| Suggested response       | AI-generated response                                  |
| Conversational interface | AI Sales Assistant                                     |
| Saved leads              | SQLite                                                 |
| Lead prioritization      | Deterministic weighted scoring                         |
| Priority grouping        | HOT / WARM / COLD                                      |
| Scanable dashboard       | React dashboard                                        |
| Additional feature       | Next Best Action + Follow-up Tracker                   |
| Live deployment          | Vercel + Render                                        |
| Public source code       | GitHub                                                 |

---

## License

This project was developed as a technical take-home assignment and demonstration project.
