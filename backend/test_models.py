from google import genai
from app.config import settings

client = genai.Client(api_key=settings.gemini_api_key)

models_to_test = [
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
    "gemini-3.7-flash",
    "gemini-3.8-flash",
]

print("\nTesting Gemini models...\n")

for model_name in models_to_test:
    print("=" * 60)
    print(f"MODEL: {model_name}")

    try:
        response = client.models.generate_content(
            model=model_name,
            contents="Reply with exactly: OK",
        )

        print("STATUS: SUCCESS")
        print("RESPONSE:", response.text)

    except Exception as e:
        print("STATUS: FAILED")
        print("ERROR:", e)

print("=" * 60)