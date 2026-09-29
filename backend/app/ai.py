from google import genai
from google.genai import types

from .config import settings
from .schemas import Analysis


PRIMARY_MODEL = "gemini-3.6-flash"
FALLBACK_MODEL = "gemini-3.5-flash-lite"


client = genai.Client(
    api_key=settings.gemini_api_key
)


SYSTEM_PROMPT = """
You are an AI sales assistant for a real-estate lead management application.

Your job is to analyze a customer lead and help a salesperson prioritize
and respond to that lead.

IMPORTANT RULES:

1. Use ONLY the information provided in the lead.
2. Never invent or assume property availability, listings, prices,
   discounts, amenities, addresses, inventory, or customer facts.
3. The application does NOT provide a live property inventory to you.
4. Never claim that a property is available.

5. Never say:
    "We have several properties"
    "We have matching properties"
    "I found properties"
    "There are properties available"

6. Instead say:
    "Review available inventory"
    "Check whether matching properties are available"
    "Confirm matching inventory before responding to the customer"

7. Never invent prices, addresses, amenities, listings,
    discounts, availability, or customer information.
8. When recommending an action involving properties, say to review or
   check available inventory rather than claiming that matching
   properties exist.
9. In the suggested response, never tell the customer that properties
   are available unless availability is explicitly provided in the lead.
10. Keep the analysis concise and useful for a salesperson.
11. Identify the customer's actual intent.
12. Extract the customer's important requirements.
13. Identify objections, concerns, uncertainty, or missing information.
14. Recommend a practical next action for the salesperson.
15. Draft a professional response that the salesperson could send
    to the customer.
16. Provide a short follow-up plan.
17. Provide four numerical signals:
    - timeline_signal
    - budget_signal
    - intent_signal
    - engagement_signal
18. The four signals must be integers from 0 to 100.
19. The suggested response must be truthful and must not make
    commitments about property availability.

Do NOT calculate or provide the final lead score.

The application calculates the final score separately using
deterministic business rules.
"""


def get_value(lead, key, default=""):
    """
    Safely retrieve a value from either a dictionary or an object.
    """

    if isinstance(lead, dict):
        return lead.get(key, default)

    return getattr(lead, key, default)


def _generate_analysis(prompt: str, model: str) -> Analysis:

    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
            response_schema=Analysis.model_json_schema(),
        ),
    )

    if not response.text:
        raise RuntimeError(
            "Gemini returned an empty response."
        )

    return Analysis.model_validate_json(
        response.text
    )


def analyze_lead(lead) -> Analysis:

    name = get_value(lead, "name")
    location = get_value(lead, "location")
    property_requirement = get_value(
        lead,
        "property_requirement"
    )
    budget = get_value(lead, "budget")
    buying_timeline = get_value(
        lead,
        "buying_timeline"
    )
    customer_message = get_value(
        lead,
        "customer_message"
    )

    prompt = f"""
Analyze the following real-estate lead.

Customer name:
{name}

Location:
{location}

Property requirement:
{property_requirement}

Budget:
{budget}

Buying timeline:
{buying_timeline}

Customer message:
{customer_message}

Return a JSON object matching the required schema.
"""

    try:

        return _generate_analysis(
            prompt,
            PRIMARY_MODEL
        )

    except Exception as primary_error:

        print(
            f"Primary Gemini model failed: "
            f"{primary_error}. "
            f"Trying fallback model..."
        )

        try:

            return _generate_analysis(
                prompt,
                FALLBACK_MODEL
            )

        except Exception as fallback_error:

            print(
                f"Fallback Gemini model also failed: "
                f"{fallback_error}"
            )

            raise RuntimeError(
                "Gemini AI analysis failed with both "
                "primary and fallback models."
            ) from fallback_error


def chat_about_lead(lead, question: str) -> str:

    name = get_value(lead, "name")
    location = get_value(lead, "location")
    property_requirement = get_value(
        lead,
        "property_requirement"
    )
    budget = get_value(lead, "budget")
    buying_timeline = get_value(
        lead,
        "buying_timeline"
    )
    customer_message = get_value(
        lead,
        "customer_message"
    )

    summary = get_value(lead, "summary")
    intent = get_value(lead, "intent")
    requirements = get_value(lead, "requirements", [])
    objections = get_value(lead, "objections", [])
    recommended_action = get_value(
        lead,
        "recommended_action"
    )
    follow_up_plan = get_value(
        lead,
        "follow_up_plan"
    )

    prompt = f"""
You are an AI sales assistant helping a real-estate
salesperson manage a customer lead.

Use ONLY the information provided below.

LEAD INFORMATION

Customer name:
{name}

Location:
{location}

Property requirement:
{property_requirement}

Budget:
{budget}

Buying timeline:
{buying_timeline}

Customer message:
{customer_message}


AI ANALYSIS

Summary:
{summary}

Intent:
{intent}

Requirements:
{requirements}

Objections:
{objections}

Recommended action:
{recommended_action}

Follow-up plan:
{follow_up_plan}


SALESPERSON QUESTION

{question}


INSTRUCTIONS

Answer the salesperson's question clearly and concisely.

Do not invent:
- property listings
- property availability
- prices
- discounts
- amenities
- addresses
- customer information
- conversations that did not happen

If information is unavailable, explicitly say that it
is not available from the current lead information.

Focus on helping the salesperson decide what to do next
with this specific lead.
"""

    try:

        response = client.models.generate_content(
            model=PRIMARY_MODEL,
            contents=prompt
        )

        return response.text

    except Exception as primary_error:

        print(
            f"Primary Gemini chat model failed: "
            f"{primary_error}. "
            f"Trying fallback model..."
        )

        try:

            response = client.models.generate_content(
                model=FALLBACK_MODEL,
                contents=prompt
            )

            return response.text

        except Exception as fallback_error:

            raise RuntimeError(
                "Gemini AI chat failed with both "
                "primary and fallback models."
            ) from fallback_error