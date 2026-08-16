# AI Design — Gemini Integration

## AyurSutra — Phase 2 AI Architecture

---

## 1. Purpose

AyurSutra uses Google Gemini as a recommendation layer on top of the deterministic scheduling engine. The AI does not perform scheduling — it selects and explains the best slot from a pre-validated list.

This approach ensures:
- The AI can never book a slot that violates real constraints
- The system works correctly even when Gemini is unavailable
- The AI's role is transparent to the receptionist

---

## 2. What Gemini Will and Will Not Do

### Gemini WILL do

- Receive a list of valid, pre-validated candidate slots
- Select the most suitable candidate based on supplied data
- Provide a concise natural-language reason for its recommendation
- Return structured JSON so the backend can parse and validate the response

### Gemini will NOT do

- Invent therapists, rooms, or time slots not present in the candidate list
- Access the database directly
- Diagnose patients or prescribe treatments
- Override scheduling conflicts detected by the engine
- Make any recommendation if no valid candidates exist

---

## 3. AI Integration Architecture

```
Deterministic Scheduler
        │
        │  Returns: candidate slots (max 5)
        │  Each slot contains:
        │    therapist, room, date, time, workload
        ▼
Gemini Recommendation Service
        │
        │  Sends structured prompt with candidates only
        │  Expects JSON response: { recommended_index, reason }
        ▼
Backend Validation
        │
        │  Checks: recommended_index is in [0, len(candidates)-1]
        │  If invalid or error: fall back to index 0 (top deterministic)
        ▼
API Response
        │
        │  { recommended: slot, alternatives: [slots], reason: "..." }
        ▼
Frontend
        │  Displays recommended slot with reason
        │  Lists alternatives for manual selection
```

---

## 4. Prompt Design

The prompt is constructed dynamically from real candidate data. It never includes patient names, diagnoses, or medical history.

```python
def build_prompt(candidates, therapy_name, preferred_time):
    prompt = f"""
You are an Ayurvedic therapy scheduling assistant.
A receptionist needs to schedule a session of {therapy_name}.
Patient preference: {preferred_time or "no preference"}.

The scheduling system has identified the following valid candidate slots.
These are the ONLY valid options — do not suggest any others.

"""
    for i, c in enumerate(candidates):
        prompt += f"""
Candidate {i + 1}:
  Date: {c.date}
  Time: {c.start_time}–{c.end_time}
  Therapist: {c.therapist.name} (workload today: {c.workload} appointments)
  Room: {c.room.name}
"""

    prompt += """
Select the most suitable candidate considering:
1. Patient's preferred time
2. Earliest available date
3. Therapist with lower workload

Respond with valid JSON only, no extra text:
{ "recommended_index": <0-based index>, "reason": "<one sentence explanation>" }
"""
    return prompt
```

---

## 5. Gemini API Configuration

```python
# backend/app/services/ai_recommend.py
import google.generativeai as genai
import json

def get_ai_recommendation(candidates, therapy_name, preferred_time):
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")

        prompt = build_prompt(candidates, therapy_name, preferred_time)
        response = model.generate_content(prompt)
        raw = response.text.strip()

        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]

        result = json.loads(raw)
        idx = int(result["recommended_index"])
        reason = str(result["reason"])

        if idx < 0 or idx >= len(candidates):
            raise ValueError("Index out of range")

        return { "index": idx, "reason": reason }

    except Exception as e:
        # Fallback: return top deterministic candidate
        return {
            "index": 0,
            "reason": "Earliest available slot with a qualified therapist and free room."
        }
```

---

## 6. Safety Constraints

| Constraint | Implementation |
|---|---|
| AI cannot invent slots | Prompt explicitly states "ONLY valid options" |
| AI response validated | Backend checks index bounds before trusting response |
| Fallback on failure | `try/except` returns index 0 on any error |
| No medical advice | Prompt never asks for diagnosis or treatment recommendation |
| No PII in prompt | Patient name and health records are never sent to Gemini |
| API key security | Key stored in `.env`, never committed to Git |

---

## 7. Future AI Features (Phase 3+)

| Feature | Description |
|---|---|
| Chatbot assistant | Natural-language Q&A for patients and staff |
| Treatment recommendation | Based on dosha type, symptoms, and history — with strict medical disclaimers |
| Predictive scheduling | Predict therapy outcomes and suggest optimal session frequency |
| Inventory forecasting | Predict oil/herb consumption based on scheduled therapies |

All future AI features will follow the same pattern: AI supplements human decision-making, never replaces it. Medical recommendations will carry explicit disclaimers and require doctor confirmation.

---

## 8. SDK and Model Selection

- **SDK:** `google-generativeai` (official Python SDK)
- **Model:** `gemini-1.5-flash` (fast, cost-effective for structured output tasks)
- **Upgrade path:** `gemini-1.5-pro` if reasoning quality needs improvement
- **Structured output:** Use `response_mime_type="application/json"` in Phase 2 for more reliable JSON parsing
