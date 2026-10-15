# AyurSutra

**AI-Enabled Panchakarma Patient Management and Smart Therapy Scheduling System**

Capstone Project — Semester 7

---

## Overview

AyurSutra is a web-based management system for Panchakarma Ayurvedic treatment centres. It covers the full clinical workflow from patient registration through therapy appointment confirmation, with an AI scheduling recommendation layer powered by Google Gemini.

This repository contains the **Phase 1 prototype** — a fully functional frontend application with complete UI, service layer, and mock data. All Phase 2 backend and AI code is specified in the documentation.

---

## Phase 1 Features

- Login with role-based access (Doctor, Receptionist, Admin)
- Patient registration with full profile and medical history
- Patient detail view with EMR records and appointment history
- Doctor consultation with EMR creation and therapy prescription
- Smart therapy scheduling with AI-recommended slot and alternatives
- Appointment management with status tracking and cancellation
- Masters reference data: therapies, therapists, rooms

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS v4 |
| Routing | React Router v7 |
| Testing | Vitest 4, React Testing Library |
| Mock Storage | Browser localStorage |
| Backend (Phase 2) | Python, FastAPI, Pydantic, SQLAlchemy |
| Database (Phase 2) | MySQL 8 |
| Authentication (Phase 2) | JWT, bcrypt |
| AI (Phase 2) | Google Gemini API |

---

## Prerequisites

- Node.js 20+
- npm 10+

No database or backend server is needed for Phase 1.

---

## Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd Ayursutra

# 2. Environment (repo root — Vite loads via frontend/vite.config.js envDir)
cp .env.example .env
# Edit .env: set VITE_CLERK_PUBLISHABLE_KEY (required) and VITE_GROQ_API_KEY (assistant)

# 3. Install frontend dependencies
cd frontend
npm install
```

---

## Running the Application

```bash
cd frontend
npm run dev
```

Open the URL Vite prints (usually [http://localhost:5173](http://localhost:5173)).

**Public flows (same locally and when deployed):**

- Landing → **Book Consultation** → `/sign-in?intent=book` (or **Sign up** → `/sign-up`)
- After auth → **Patient intake** (`/intake`) → **Dashboard**
- Legacy `/login` URLs redirect to `/sign-in`

### Demo Credentials (Clerk sign-in page + mock session)

| Role | Email | Password |
|---|---|---|
| Therapist | therapist@ayursutra.dev | Therapist@123 |
| Receptionist | receptionist@ayursutra.dev | Reception@123 |
| Patient | patient@ayursutra.dev | Patient@123 |
| Doctor | doctor@ayursutra.dev | Doctor@123 |

---

## Testing

```bash
cd frontend
npm test              # run all tests once
npm run test:watch    # watch mode for development
npm run test:coverage # coverage report
```

63 tests covering authentication, patients/intake, EMR, scheduling, assistant, and related services.

---

## Build

```bash
cd frontend
# Required at build time (inlined into the bundle):
#   VITE_CLERK_PUBLISHABLE_KEY=pk_... npm run build
npm run build
```

Output is written to `frontend/dist/`.

---

## Deploying on Render

This project is set up as a Render static site for the `frontend` app.

1. Connect the GitHub repo in Render.
2. Use the included `render.yaml` blueprint, or create a new Static Site manually.
3. Set the root directory to `frontend`.
4. Use `npm ci && npm run build` as the build command.
5. Set the publish directory to `dist`.
6. Add a rewrite rule from `/*` to `/index.html` so React Router routes work on refresh.

The deployed site will be a static frontend only. Since this prototype uses `localStorage` for demo data, no backend service is required for Phase 1.

## Deploying on Vercel

This repository includes a root `vercel.json` so Vercel builds the Vite app from `frontend/` without restructuring.

1. Merge your feature branch to `main` (or deploy the branch from Vercel).
2. Import the repo in Vercel with **repository root** as the project root.
3. Confirm build settings (from `vercel.json`):
   - Install: `cd frontend && npm ci`
   - Build: `cd frontend && npm run build`
   - Output: `frontend/dist`
4. In **Vercel → Project → Settings → Environment Variables**, add (Production + Preview):

   | Variable | Required | Notes |
   |---|---|---|
   | `VITE_CLERK_PUBLISHABLE_KEY` | Yes | Same Clerk **publishable** key as local `.env` |
   | `VITE_GROQ_API_KEY` | For assistant | Same as local if you use AyurSutra Assistant |
   | `VITE_APP_NAME` | Optional | Defaults in `.env.example` |

   Do **not** add `CLERK_SECRET_KEY` to Vercel unless you add a server; the static app only needs the publishable key.

5. In the **[Clerk Dashboard](https://dashboard.clerk.com)** → your application → **Paths / URLs**, allow your deployed origin (e.g. `https://your-app.vercel.app`) and set:

   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in / sign-up: allow `/dashboard`, `/intake`, and home `/`

6. Redeploy after env vars change (Vite bakes `VITE_*` into the build).

SPA rewrites in `vercel.json` send all routes to `index.html`, so `/sign-in`, `/sign-up`, `/intake`, and dashboard routes work on refresh.

**Parity with localhost:** Same React app and `localStorage` mock data per browser; each visitor gets their own seed data in that browser. Auth and intake behave the same once Clerk keys and allowed URLs are configured.

---

## Project Structure

```
.
├── frontend/
│   ├── src/
│   │   ├── components/        # Button, Card, Table, FormField, Modal, Alert,
│   │   │                      # EmptyState, Spinner, Badge, PageHeader
│   │   ├── layouts/           # AppLayout, ClerkAuthLayout
│   │   ├── pages/
│   │   │   ├── SignInPage.jsx, SignUpPage.jsx, PatientIntakePage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── patients/      # PatientsPage, NewPatientPage, PatientDetailPage
│   │   │   ├── consultation/  # ConsultationPage
│   │   │   ├── scheduling/    # SchedulingPage
│   │   │   ├── appointments/  # AppointmentsPage
│   │   │   └── masters/       # MastersPage
│   │   ├── routes/            # AppRoutes, ProtectedRoute
│   │   ├── services/          # auth, patients, emr, therapies, therapists,
│   │   │                      # rooms, appointments, scheduling
│   │   ├── mocks/             # seed.js (data), store.js (localStorage adapter)
│   │   ├── hooks/             # useAuth, useAsync
│   │   ├── utils/             # date, validation, id
│   │   └── test/              # auth, patients, emr, scheduling tests
│   ├── package.json
│   └── vite.config.js
│
├── docs/
│   ├── srs.md                           # Software Requirements Specification
│   ├── architecture/system-architecture.md
│   ├── database/er-diagram.md
│   ├── wireframes/wireframes.md
│   ├── workflows/panchakarma-workflow.md, smart-scheduling.md
│   ├── data/dataset.md
│   ├── ai/ai-design.md
│   ├── api/api-contract.md
│   ├── testing/test-plan.md
│   └── requirements/hardware-software.md
│
├── .gitignore
└── README.md
```

---

## Documentation

| Document | Description |
|---|---|
| [SRS](docs/srs.md) | Functional and non-functional requirements |
| [System Architecture](docs/architecture/system-architecture.md) | Phase 1 and Phase 2 architecture diagrams |
| [ER Diagram](docs/database/er-diagram.md) | MySQL schema with entity relationships |
| [Wireframes](docs/wireframes/wireframes.md) | ASCII wireframes for all screens |
| [Panchakarma Workflow](docs/workflows/panchakarma-workflow.md) | Clinical patient journey |
| [Smart Scheduling](docs/workflows/smart-scheduling.md) | Algorithm design and pseudocode |
| [AI Design](docs/ai/ai-design.md) | Gemini integration architecture and safety constraints |
| [API Contract](docs/api/api-contract.md) | Phase 2 FastAPI endpoint specification |
| [Dataset](docs/data/dataset.md) | Data requirements and sample dataset |
| [Test Plan](docs/testing/test-plan.md) | Automated and manual test cases |
| [Hardware & Software](docs/requirements/hardware-software.md) | Development and deployment requirements |

---

## Team Ownership

| Member | Area |
|---|---|
| Member 1 | Patient Management — patients pages, EMR pages (`src/pages/patients/`, `src/pages/consultation/`) |
| Member 2 | Appointments & Scheduling — scheduling pages, appointment service (`src/pages/scheduling/`, `src/pages/appointments/`) |
| Member 3 | Database & Resource Management — mock data, Masters pages, ER diagram (`src/mocks/`, `src/pages/masters/`, `docs/database/`) |
| Member 4 | AI Design & Chatbot — AI architecture docs, scheduling service, Gemini design (`docs/ai/`, `src/services/scheduling.js`) |
| Member 5 | Auth & Integration — auth service, routing, layouts, tests, README (`src/services/auth.js`, `src/routes/`, `src/layouts/`, `src/test/`) |

---

## Phase 1 Definition of Done

The following end-to-end workflow is fully functional in this prototype:

1. Sign in as receptionist
2. Register a new patient
3. Sign out, sign in as doctor
4. Open the patient and create a consultation + EMR record
5. Sign out, sign in as receptionist
6. Open Scheduling, select patient and therapy
7. Find available slots — recommended slot appears with reason
8. Select an alternative slot if preferred
9. Confirm the appointment
10. Navigate to the patient detail — appointment appears in the patient's record

---

## Phase 2 Roadmap

Phase 2 will connect the existing service layer to a real FastAPI + MySQL backend:

1. Set up FastAPI application with all API routes
2. Implement SQLAlchemy models matching `docs/database/er-diagram.md`
3. Implement JWT authentication
4. Implement the deterministic scheduling engine
5. Integrate Google Gemini recommendation layer
6. Update `src/services/*.js` to use Axios calls to the real API

No frontend pages or components need to change for Phase 2.

---

## Notes on Phase 1 Data Persistence

Patient registrations, EMR records, and appointments created during the Phase 1 prototype are stored in the browser's `localStorage`. This is intentional demo-only persistence:

- Data survives page reloads and browser restarts
- Data is local to the browser — not shared between team members
- Clearing site data or calling `resetStore()` from the browser console resets everything to seed data
- This is **not** production persistence; Phase 2 replaces it with MySQL

---

## License

This project is developed as an academic capstone. All patient data used in the prototype is synthetic and does not represent any real individuals.
