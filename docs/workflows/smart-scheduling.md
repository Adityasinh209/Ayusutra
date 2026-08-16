# Smart Scheduling Algorithm

## AyurSutra — Phase 2 Design

---

## 1. Overview

The smart scheduling engine runs on the FastAPI backend. Its job is to take a therapy request (patient + therapy) and return a list of valid, ranked candidate time slots.

The engine is purely deterministic. It does not use AI. The Gemini AI layer is a separate downstream step that receives the pre-validated candidate list and returns a recommendation with a natural-language reason.

---

## 2. Algorithm Flowchart

```
Input: patient_id, therapy_id, preferred_date?, preferred_time?
                    │
         ┌──────────▼──────────┐
         │ 1. Load therapy     │
         │    Get duration     │
         │    Get required     │
         │    specialisation   │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │ 2. Find qualified   │
         │    therapists       │
         │    (match          │
         │     specialisation) │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │ 3. For each         │
         │    therapist:       │
         │    Load availability│
         │    (working days,   │
         │     working hours)  │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │ 4. Remove therapists│
         │    on leave for     │
         │    requested date   │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │ 5. For each active  │
         │    room:            │
         │    Check room type  │
         │    vs therapy type  │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │ 6. Generate time    │
         │    windows within   │
         │    therapist hours  │
         │    (slot size =     │
         │     therapy         │
         │     duration)       │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │ 7. For each window: │
         │    Check therapist  │
         │    not already      │
         │    booked           │
         │    Check room not   │
         │    already booked   │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │ 8. Score valid      │
         │    candidates       │
         │    (see below)      │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │ 9. Sort by score    │
         │    Return top N     │
         │    candidates       │
         └─────────────────────┘
```

---

## 3. Conflict Detection Logic

Two appointments conflict if they share a therapist or room and their time windows overlap:

```
conflict if:
  existing.date == requested.date
  AND existing.start_time < requested.end_time
  AND existing.end_time > requested.start_time
```

This is evaluated against the `appointments` table in MySQL for both therapist and room simultaneously.

---

## 4. Candidate Scoring

Each valid candidate receives a numeric score based on the following criteria:

| Criterion | Weight | Logic |
|---|---|---|
| Therapist is qualified | Threshold | Already filtered — not scored separately |
| Therapist is available | Threshold | Already filtered — not scored separately |
| Room is available | Threshold | Already filtered — not scored separately |
| No booking conflict | Threshold | Already filtered — not scored separately |
| Preferred time match | +30 | Slot time matches morning/afternoon preference |
| Earliest date | +20 | Prefer slots earlier in the week |
| Lower therapist workload | +10 per appointment delta | Balance workload across therapists |
| Preferred date match | +25 | Slot is on the requested date |

Candidates are sorted descending by score. The top candidate is flagged as `recommended`.

---

## 5. Pseudocode

```python
def recommend_slots(patient_id, therapy_id, preferred_date, preferred_time):
    therapy = db.get_therapy(therapy_id)
    duration = therapy.default_duration_mins

    qualified_therapists = [
        t for t in db.get_therapists()
        if therapy_id in t.therapy_ids and t.active
    ]

    target_dates = preferred_date ? [preferred_date] : next_7_working_days()

    candidates = []

    for date in target_dates:
        day_abbrev = get_day_abbrev(date)  # "Mon", "Tue", etc.

        for therapist in qualified_therapists:
            # Skip if on leave
            if is_on_leave(therapist.id, date):
                continue

            # Get working hours for this day
            availability = get_availability(therapist.id, day_abbrev)
            if not availability:
                continue

            # Get existing bookings for this therapist on this date
            booked = get_appointments(therapist_id=therapist.id, date=date)

            # Generate time windows
            windows = generate_windows(
                availability.start_time,
                availability.end_time,
                duration
            )

            for window in windows:
                # Check therapist conflict
                if has_conflict(booked, window):
                    continue

                # Find a free room
                for room in db.get_active_rooms():
                    room_booked = get_appointments(room_id=room.id, date=date)
                    if has_conflict(room_booked, window):
                        continue

                    # Valid candidate found
                    workload = count_today_appointments(therapist.id, date)
                    score = calculate_score(
                        window, preferred_time, date, preferred_date, workload
                    )
                    candidates.append({
                        therapist, room, date, window, score, workload
                    })

    candidates.sort(key=lambda c: c.score, reverse=True)
    return candidates[:5]  # Return top 5


def generate_windows(start, end, duration_mins):
    windows = []
    current = start
    while current + duration_mins <= end:
        windows.append((current, current + duration_mins))
        current += 30  # 30-minute step granularity
    return windows


def has_conflict(existing_bookings, window):
    start, end = window
    for booking in existing_bookings:
        if booking.start_time < end and booking.end_time > start:
            return True
    return False
```

---

## 6. AI Recommendation Layer (Phase 2)

After the deterministic engine returns candidates, the Gemini AI layer is called as an optional step.

**Input to Gemini:**
```
Therapy: Abhyanga (60 min)
Patient preference: Morning

Candidate 1:
  Date: 2026-08-19
  Time: 09:00–10:00
  Therapist: Amit Joshi (workload: 2 appointments today)
  Room: Room 2

Candidate 2:
  Date: 2026-08-20
  Time: 11:00–12:00
  Therapist: Amit Joshi (workload: 2 appointments today)
  Room: Room 1

Which candidate do you recommend, and why?
Respond only in JSON: { "recommended_index": 0, "reason": "..." }
```

**Gemini constraints enforced by backend:**
1. The AI response is parsed for `recommended_index`
2. The index is validated to be within the candidate list bounds
3. If the index is out of bounds or parsing fails, the deterministic top candidate is used
4. Gemini is never asked to generate therapist names, room names, or availability data
5. Gemini is never asked for medical advice or diagnoses

**Fallback:** If the Gemini API is unavailable or returns invalid JSON, the deterministic top candidate is returned with a generic reason.
