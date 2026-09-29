def calculate_score(a):
    breakdown = {
        "timeline": round(a.timeline_signal * 0.30),
        "budget": round(a.budget_signal * 0.25),
        "intent": round(a.intent_signal * 0.25),
        "engagement": round(a.engagement_signal * 0.20),
    }
    score = max(0, min(100, sum(breakdown.values())))
    priority = "HOT" if score >= 75 else "WARM" if score >= 50 else "COLD"
    return score, priority, breakdown
