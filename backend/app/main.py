import json
from datetime import datetime
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session
from .config import settings
from .db import Base, engine, get_db
from .models import Lead
from .schemas import LeadCreate, LeadOut, ChatRequest, ChatResponse
from .ai import analyze_lead, chat_about_lead
from .scoring import calculate_score

Base.metadata.create_all(bind=engine)
app = FastAPI(title="LeadPilot AI API", version="1.0.0")

origins = [settings.frontend_url, "http://localhost:5173"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


def serialize(lead: Lead) -> LeadOut:
    return LeadOut(
        id=lead.id,
        name=lead.name,
        location=lead.location,
        property_requirement=lead.property_requirement,
        budget=lead.budget,
        buying_timeline=lead.buying_timeline,
        customer_message=lead.customer_message,
        summary=lead.summary,
        intent=lead.intent,
        requirements=json.loads(lead.requirements_json or "[]"),
        objections=json.loads(lead.objections_json or "[]"),
        recommended_action=lead.recommended_action,
        suggested_response=lead.suggested_response,
        follow_up_plan=lead.follow_up_plan,
        score=lead.score,
        priority=lead.priority,
        score_breakdown=json.loads(lead.score_breakdown_json or "{}"),
        analyzed_at=lead.analyzed_at,
        created_at=lead.created_at,
    )

@app.get("/")
def root():
    return {"name": "LeadPilot AI API", "status": "ok"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/api/leads", response_model=LeadOut)
def create_lead(payload: LeadCreate, db: Session = Depends(get_db)):
    lead = Lead(**payload.model_dump())
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return serialize(lead)

@app.get("/api/leads", response_model=list[LeadOut])
def list_leads(db: Session = Depends(get_db)):
    leads = db.scalars(select(Lead).order_by(Lead.score.desc().nullslast(), Lead.created_at.desc())).all()
    return [serialize(l) for l in leads]

@app.get("/api/leads/{lead_id}", response_model=LeadOut)
def get_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(404, "Lead not found")
    return serialize(lead)

@app.post("/api/leads/{lead_id}/analyze", response_model=LeadOut)
def analyze(lead_id: int, db: Session = Depends(get_db)):
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(404, "Lead not found")
    try:
        analysis = analyze_lead({
            "name": lead.name,
            "location": lead.location,
            "property_requirement": lead.property_requirement,
            "budget": lead.budget,
            "buying_timeline": lead.buying_timeline,
            "customer_message": lead.customer_message,
        })
        score, priority, breakdown = calculate_score(analysis)
        lead.summary = analysis.summary
        lead.intent = analysis.intent
        lead.requirements_json = json.dumps(analysis.requirements)
        lead.objections_json = json.dumps(analysis.objections)
        lead.recommended_action = analysis.recommended_action
        lead.suggested_response = analysis.suggested_response
        lead.follow_up_plan = analysis.follow_up_plan
        lead.score = score
        lead.priority = priority
        lead.score_breakdown_json = json.dumps(breakdown)
        lead.analyzed_at = datetime.utcnow()
        db.commit()
        db.refresh(lead)
        return serialize(lead)
    except Exception as exc:
        raise HTTPException(502, f"AI analysis failed: {exc}") from exc

@app.post("/api/leads/{lead_id}/chat", response_model=ChatResponse)
def chat(
    lead_id: int,
    payload: ChatRequest,
    db: Session = Depends(get_db)
):
    lead = db.get(Lead, lead_id)

    if not lead:
        raise HTTPException(
            404,
            "Lead not found"
        )

    try:

        answer = chat_about_lead(
            {
                "name": lead.name,
                "location": lead.location,
                "property_requirement": lead.property_requirement,
                "budget": lead.budget,
                "buying_timeline": lead.buying_timeline,
                "customer_message": lead.customer_message,

                "summary": lead.summary,
                "intent": lead.intent,

                "requirements": json.loads(
                    lead.requirements_json or "[]"
                ),

                "objections": json.loads(
                    lead.objections_json or "[]"
                ),

                "recommended_action": lead.recommended_action,

                "follow_up_plan": lead.follow_up_plan,
            },
            payload.message
        )

        return ChatResponse(
            answer=answer
        )

    except Exception as exc:

        raise HTTPException(
            502,
            f"AI chat failed: {exc}"
        ) from exc