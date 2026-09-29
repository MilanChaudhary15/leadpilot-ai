from datetime import datetime
from pydantic import BaseModel, Field

class LeadCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    location: str
    property_requirement: str
    budget: str
    buying_timeline: str
    customer_message: str

class Analysis(BaseModel):
    summary: str
    intent: str
    requirements: list[str]
    objections: list[str]
    recommended_action: str
    suggested_response: str
    follow_up_plan: str
    timeline_signal: int = Field(ge=0, le=100)
    budget_signal: int = Field(ge=0, le=100)
    intent_signal: int = Field(ge=0, le=100)
    engagement_signal: int = Field(ge=0, le=100)

class LeadOut(LeadCreate):
    id: int
    summary: str | None = None
    intent: str | None = None
    requirements: list[str] = []
    objections: list[str] = []
    recommended_action: str | None = None
    suggested_response: str | None = None
    follow_up_plan: str | None = None
    score: int | None = None
    priority: str | None = None
    score_breakdown: dict[str, int] = {}
    analyzed_at: datetime | None = None
    created_at: datetime

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)

class ChatResponse(BaseModel):
    answer: str
