# System Architecture

## AyurSutra — Phase 1 & Phase 2 Design

---

## 1. Phase 1 Architecture (Implemented)

Phase 1 is a frontend-only prototype. The full UI workflow is functional using a mock data layer backed by the browser's localStorage.

```
Browser
├── React 19 + Vite
├── Tailwind CSS v4
├── React Router v7
│
├── src/pages/         ← UI pages
├── src/components/    ← Shared UI components
├── src/layouts/       ← AppLayout, AuthLayout
├── src/services/      ← Async service functions (API contract)
│   └── auth.js, patients.js, emr.js, therapies.js,
│       therapists.js, rooms.js, appointments.js, scheduling.js
├── src/mocks/
│   ├── seed.js        ← Static seed data matching the DB schema
│   └── store.js       ← localStorage adapter (CRUD operations)
├── src/hooks/         ← useAuth, useAsync
└── src/utils/         ← date, validation, id helpers
```

The service layer intentionally mirrors the FastAPI REST contract. When Phase 2 is ready, `src/services/*.js` is updated to use Axios calls to the real backend — no pages or components change.

---

## 2. Phase 2 Target Architecture

```
                    Browser (React App)
                           │
                     HTTPS / REST
                           │
              ┌────────────▼─────────────┐
              │        FastAPI            │
              │  (Uvicorn / Gunicorn)     │
              │                           │
              │  /api/auth/*              │
              │  /api/patients/*          │
              │  /api/emr/*               │
              │  /api/therapies/*         │
              │  /api/therapists/*        │
              │  /api/rooms/*             │
              │  /api/appointments/*      │
              │  /api/scheduling/         │
              └──────┬────────────┬───────┘
                     │            │
           ┌─────────▼──┐    ┌───▼──────────────┐
           │   MySQL 8   │    │  Google Gemini API │
           │ SQLAlchemy  │    │  (gemini-1.5-flash)│
           └────────────┘    └───────────────────┘
```

### Component Responsibilities

**FastAPI**
- Validates all request/response payloads with Pydantic
- Enforces JWT authentication on all routes except `/api/auth/login`
- Checks role-based access for role-restricted endpoints
- Calls the scheduling engine and optionally the Gemini layer

**MySQL + SQLAlchemy**
- Source of truth for all application data
- Enforces foreign key constraints
- Scheduling queries check conflicts at the database layer

**Gemini API (Scheduling Recommendation)**
- Receives pre-validated candidate slots from the deterministic scheduler
- Returns a ranked recommendation with a natural-language reason
- Is never trusted to invent new therapists, rooms, or time windows
- Backend validates the AI response against the actual candidate list

---

## 3. Backend Project Structure (Phase 2)

```
backend/
├── app/
│   ├── api/
│   │   └── routes/
│   │       ├── auth.py
│   │       ├── patients.py
│   │       ├── emr.py
│   │       ├── therapies.py
│   │       ├── therapists.py
│   │       ├── rooms.py
│   │       ├── appointments.py
│   │       └── scheduling.py
│   ├── core/
│   │   ├── config.py         ← Settings from .env
│   │   ├── security.py       ← JWT creation / verification
│   │   └── dependencies.py   ← get_db, get_current_user
│   ├── models/               ← SQLAlchemy ORM models
│   ├── schemas/              ← Pydantic request/response schemas
│   ├── services/             ← Business logic
│   │   ├── scheduling.py     ← Deterministic conflict engine
│   │   └── ai_recommend.py   ← Gemini wrapper
│   ├── db/
│   │   ├── session.py        ← SQLAlchemy engine + session
│   │   └── init_db.py        ← Table creation + seed data
│   └── main.py               ← FastAPI app entry point
├── tests/
├── requirements.txt
└── .env.example
```

---

## 4. Authentication Flow (Phase 2)

```
Client → POST /api/auth/login { email, password }
       ← 200 { access_token, token_type, user }

Client → GET /api/patients
         Authorization: Bearer <access_token>
       ← 200 [ ... ]

Client → GET /api/emr  (doctor only)
         Authorization: Bearer <access_token>
       ← 200  (if role mismatch → 403)
```

JWT payload: `{ sub: user_id, role: "doctor", exp: ... }`

---

## 5. Scheduling Flow

```
Receptionist selects patient + therapy
              │
POST /api/scheduling/recommend
{ patient_id, therapy_id, preferred_date?, preferred_time? }
              │
        Scheduling Service
              │
    ┌─────────▼──────────┐
    │ 1. Get therapy      │
    │ 2. Get qualified    │
    │    therapists       │
    │ 3. Check leaves     │
    │ 4. Get availability │
    │ 5. Get booked slots │
    │ 6. Detect conflicts │
    │ 7. Generate valid   │
    │    candidates       │
    │ 8. Rank candidates  │
    └─────────┬──────────┘
              │  candidate list
    ┌─────────▼──────────┐
    │  Gemini AI Layer   │  ← receives only validated candidates
    │  (optional)        │
    │  Returns ranked    │
    │  recommendation    │
    └─────────┬──────────┘
              │
    Backend validates AI response
    against candidate list
              │
    ← 200 { recommended, alternatives }
```

---

## 6. Technology Choices

| Area | Technology | Rationale |
|---|---|---|
| Frontend framework | React 19 | Team familiarity, component reuse |
| Build tool | Vite 8 | Fast HMR, native ESM |
| Styling | Tailwind CSS v4 | Utility-first, no custom CSS needed |
| Routing | React Router v7 | Industry standard |
| Backend | FastAPI (Python) | Auto-generates OpenAPI docs, fast, Pydantic integration |
| ORM | SQLAlchemy 2.x | Mature, async support, migration tools |
| Database | MySQL 8 | Widely used in healthcare systems, strong relational integrity |
| Auth | JWT + bcrypt | Stateless, scales horizontally |
| AI | Google Gemini API | Team has access, multimodal capability for Phase 3+ |
