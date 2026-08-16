# API Contract

## AyurSutra — Phase 2 FastAPI Endpoint Specification

All endpoints are prefixed with `/api`. All endpoints except `/api/auth/login` require `Authorization: Bearer <token>`.

---

## Authentication

### POST /api/auth/login

**Request:**
```json
{
  "email": "doctor@ayursutra.dev",
  "password": "Doctor@123"
}
```

**Response 200:**
```json
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "user": {
    "id": "user-1",
    "name": "Dr. Meera Nair",
    "email": "doctor@ayursutra.dev",
    "role": "doctor",
    "role_label": "Doctor"
  }
}
```

**Response 401:** `{ "detail": "Invalid email or password." }`

---

## Patients

### GET /api/patients

Returns all patients sorted by registration date descending.

**Response 200:** `[ Patient, ... ]`

### POST /api/patients

**Request:**
```json
{
  "full_name": "Rahul Sharma",
  "date_of_birth": "1985-04-12",
  "gender": "Male",
  "phone": "9876543210",
  "email": "rahul@email.com",
  "address": "12, Lotus Society, Pune",
  "medical_history": "Chronic back pain",
  "emergency_contact": "Sneha Sharma - 9876500001"
}
```

**Response 201:** `Patient`

**Response 409:** `{ "detail": "A patient with this phone number or email already exists." }`

### GET /api/patients/{id}

**Response 200:** `Patient`

**Response 404:** `{ "detail": "Patient not found." }`

---

## EMR Records

### GET /api/patients/{id}/emr

Returns EMR records for the patient sorted by creation date descending.

**Response 200:** `[ EmrRecord, ... ]`

### POST /api/emr

**Request:**
```json
{
  "patient_id": "patient-1",
  "symptoms": "Lower back pain, stiffness",
  "diagnosis": "Vata imbalance — Kati Shoola",
  "treatment_plan": "Abhyanga for 14 days",
  "therapy_id": "therapy-1",
  "therapy_duration_mins": 60,
  "number_of_sessions": 14,
  "doctor_notes": "Avoid cold food during treatment.",
  "follow_up_date": "2026-09-01"
}
```

**Response 201:** `EmrRecord`

---

## Therapies

### GET /api/therapies

Returns active therapies.

**Response 200:** `[ Therapy, ... ]`

---

## Therapists

### GET /api/therapists

Returns active therapists with availability and leave.

**Response 200:** `[ Therapist, ... ]`

---

## Rooms

### GET /api/rooms

Returns active therapy rooms.

**Response 200:** `[ Room, ... ]`

---

## Appointments

### GET /api/appointments

Returns all appointments sorted by creation date descending.

**Query params:** `?status=Scheduled` (optional filter)

**Response 200:** `[ Appointment, ... ]`

### GET /api/patients/{id}/appointments

Returns appointments for a specific patient.

**Response 200:** `[ Appointment, ... ]`

### POST /api/appointments

Creates a confirmed appointment.

**Request:**
```json
{
  "patient_id": "patient-1",
  "therapy_id": "therapy-1",
  "therapist_id": "therapist-1",
  "room_id": "room-2",
  "date": "2026-08-19",
  "start_time": "09:00",
  "end_time": "10:00"
}
```

**Response 201:** `Appointment`

**Response 409:** `{ "detail": "Therapist already has an appointment at this time." }`

### PATCH /api/appointments/{id}/cancel

**Response 200:** `Appointment` (with status = "Cancelled")

**Response 404:** `{ "detail": "Appointment not found." }`

---

## Scheduling

### POST /api/scheduling/recommend

Core scheduling endpoint. Runs the deterministic engine, then optionally calls Gemini.

**Request:**
```json
{
  "patient_id": "patient-1",
  "therapy_id": "therapy-1",
  "preferred_date": "2026-08-19",
  "preferred_time": "morning"
}
```

**Response 200:**
```json
{
  "recommended": {
    "therapist_id": "therapist-1",
    "therapist_name": "Amit Joshi",
    "room_id": "room-2",
    "room_name": "Room 2",
    "therapy_name": "Abhyanga",
    "date": "2026-08-19",
    "start_time": "09:00",
    "end_time": "10:00",
    "therapist_workload": 2,
    "reason": "Amit Joshi is the qualified therapist with lowest workload. Room 2 is available."
  },
  "alternatives": [ ... ]
}
```

**Response 200 (no slots):** `{ "recommended": null, "alternatives": [] }`

---

## Error Response Format

All error responses use a consistent structure:

```json
{
  "detail": "Human-readable error message."
}
```

HTTP status codes used:

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Bad request / validation error |
| 401 | Unauthenticated |
| 403 | Forbidden (insufficient role) |
| 404 | Not found |
| 409 | Conflict (duplicate, scheduling conflict) |
| 500 | Internal server error |

Stack traces are never included in error responses.
