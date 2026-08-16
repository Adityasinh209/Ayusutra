# Test Plan

## AyurSutra Phase 1 — Testing Strategy

---

## 1. Overview

Phase 1 testing covers:
1. Automated unit/integration tests for the service layer (Vitest)
2. Manual test cases for the UI, navigation, and end-to-end workflow

The test suite is intentionally focused on the service layer because that layer is the contract boundary between Phase 1 mock data and the Phase 2 real API. Tests that pass in Phase 1 should continue to pass in Phase 2 when the mock adapter is replaced.

---

## 2. Automated Test Suite

**Framework:** Vitest 4 + jsdom

**Run command:**
```bash
cd frontend
npm test              # run once
npm run test:watch    # watch mode
npm run test:coverage # coverage report
```

### 2.1 Authentication Tests (`src/test/auth.test.js`)

| Test ID | Description | Expected Result |
|---|---|---|
| AUTH-T01 | Login with valid doctor credentials | Session returned, role = doctor |
| AUTH-T02 | Login with valid receptionist credentials | Session returned, role = receptionist |
| AUTH-T03 | Login with valid admin credentials | Session returned, role = admin |
| AUTH-T04 | Login with wrong password | Throws "Invalid email or password." |
| AUTH-T05 | Login with unknown email | Throws "Invalid email or password." |
| AUTH-T06 | Login with uppercase email | Case-insensitive match succeeds |
| AUTH-T07 | Login stores session in localStorage | Session retrievable after login |
| AUTH-T08 | Logout clears localStorage session | getSession() returns null |
| AUTH-T09 | getSession when not logged in | Returns null |

### 2.2 Patient Tests (`src/test/patients.test.js`)

| Test ID | Description | Expected Result |
|---|---|---|
| PAT-T01 | Create patient with valid data | Patient object with id returned |
| PAT-T02 | List patients includes new patient | listPatients finds by phone |
| PAT-T03 | Get patient by ID | Returns matching patient |
| PAT-T04 | Get unknown patient ID | Throws "Patient not found." |
| PAT-T05 | Duplicate phone rejected | Throws duplicate error |
| PAT-T06 | Duplicate email rejected | Throws duplicate error |
| PAT-T07 | Empty email allowed | Patient created without email |

### 2.3 EMR Tests (`src/test/emr.test.js`)

| Test ID | Description | Expected Result |
|---|---|---|
| EMR-T01 | Create EMR record | Record with id, patientId, doctorId returned |
| EMR-T02 | EMR record has createdAt timestamp | Valid ISO date string |
| EMR-T03 | Get EMR records for patient | Returns list with correct patientId |
| EMR-T04 | Get EMR for patient with no records | Returns empty array |
| EMR-T05 | Records sorted newest first | First record has later createdAt |

### 2.4 Scheduling Tests (`src/test/scheduling.test.js`)

| Test ID | Description | Expected Result |
|---|---|---|
| SCH-T01 | Returns slots for known pair | Array with ≥1 slot |
| SCH-T02 | Exactly one slot is recommended | recommended count = 1 |
| SCH-T03 | Slots enriched with therapist | therapist.name is truthy |
| SCH-T04 | Slots enriched with room | room.name is truthy |
| SCH-T05 | Slots enriched with therapy | therapy.name = "Abhyanga" |
| SCH-T06 | Unknown pair returns empty | Empty array returned |
| SCH-T07 | Recommended slot has reason | reason is a non-empty string |
| SCH-T08 | Confirm creates appointment | Appointment with status = Scheduled |
| SCH-T09 | Confirmed appointment appears in patient list | Found in patient appointments |
| SCH-T10 | Cancel appointment updates status | status = Cancelled |
| SCH-T11 | Cancel non-existent throws | Throws "Appointment not found." |

---

## 3. Manual Test Cases

### 3.1 Navigation and Authentication

| TC | Steps | Expected |
|---|---|---|
| M-AUTH-01 | Open app at `/` without logging in | Redirected to `/login` |
| M-AUTH-02 | Open `/patients` without logging in | Redirected to `/login` |
| M-AUTH-03 | Login as doctor | Doctor dashboard shown; Consultation link in sidebar |
| M-AUTH-04 | Login as receptionist | Receptionist dashboard; Scheduling link in sidebar |
| M-AUTH-05 | Login as admin | Admin dashboard; Masters link in sidebar |
| M-AUTH-06 | Receptionist tries to access `/masters` | Redirected to dashboard |
| M-AUTH-07 | Doctor tries to access `/scheduling` | Redirected to dashboard |
| M-AUTH-08 | Click Sign out | Redirected to login; back button does not return to app |

### 3.2 Patient Registration

| TC | Steps | Expected |
|---|---|---|
| M-PAT-01 | Submit empty form | Inline errors on all required fields |
| M-PAT-02 | Enter 9-digit phone | "Enter a valid 10-digit phone number." error |
| M-PAT-03 | Enter malformed email | "Enter a valid email address." error |
| M-PAT-04 | Register valid patient | Redirected to patient detail page |
| M-PAT-05 | Try to register same phone again | "A patient with this phone number or email already exists." |
| M-PAT-06 | Search patient list by name | List filters as you type |
| M-PAT-07 | Search by phone | Matching patient shown |
| M-PAT-08 | Click patient row | Patient detail page opens |

### 3.3 Consultation / EMR

| TC | Steps | Expected |
|---|---|---|
| M-EMR-01 | Open Consultation page | Patient dropdown populated |
| M-EMR-02 | Select patient | Patient info card appears below dropdown |
| M-EMR-03 | Submit without required fields | Inline errors |
| M-EMR-04 | Select therapy | Duration auto-fills |
| M-EMR-05 | Submit valid form | Success alert shown, form resets |
| M-EMR-06 | Open patient detail | New EMR record appears in EMR section |
| M-EMR-07 | Arrive via "New Consultation" button on patient detail | Patient pre-selected in dropdown |

### 3.4 Scheduling

| TC | Steps | Expected |
|---|---|---|
| M-SCH-01 | Open Scheduling page | Patient and therapy dropdowns populated |
| M-SCH-02 | Click Find without selecting patient | "Patient is required." error |
| M-SCH-03 | Select Rahul Sharma + Abhyanga, click Find | Recommended slot card appears |
| M-SCH-04 | Recommended card shows therapist, room, reason | All three visible |
| M-SCH-05 | Alternative slots listed below | At least 1 alternative shown |
| M-SCH-06 | Click Select on alternative | Selected slot highlighted |
| M-SCH-07 | Click Confirm This Slot | Confirmation modal opens |
| M-SCH-08 | Modal shows correct patient, therapy, date, time | All details match selected slot |
| M-SCH-09 | Click Confirm Appointment in modal | Success alert shown |
| M-SCH-10 | Navigate to Patients → Rahul Sharma | New appointment appears in Appointments section |
| M-SCH-11 | Arrive via + Schedule on patient detail | Patient pre-selected |

### 3.5 Appointments

| TC | Steps | Expected |
|---|---|---|
| M-APPT-01 | Open Appointments page | All appointments listed |
| M-APPT-02 | Filter by Scheduled | Only Scheduled appointments shown |
| M-APPT-03 | Click patient name link | Navigates to patient detail |
| M-APPT-04 | Click Cancel on active appointment | Confirmation modal opens |
| M-APPT-05 | Confirm cancellation | Status badge changes to Cancelled |
| M-APPT-06 | Cancelled appointment has no Cancel button | Button not shown |

### 3.6 Masters

| TC | Steps | Expected |
|---|---|---|
| M-MAST-01 | Open Masters as admin | Three sections visible: Therapies, Rooms, Therapists |
| M-MAST-02 | Therapies section | 5 therapies listed with duration and description |
| M-MAST-03 | Rooms section | 3 rooms listed |
| M-MAST-04 | Therapist section | 4 therapists with availability and leave details |
| M-MAST-05 | Amit Joshi leave shown | 18–20 Aug leave visible |
| M-MAST-06 | Login as doctor and navigate to /masters | Redirected to dashboard |

---

## 4. UX and Accessibility Checks

| Check | Expectation |
|---|---|
| Loading states | Spinner shown while data loads |
| Error states | Alert banner with dismissible button |
| Empty states | Descriptive message with context |
| Form validation | Errors appear inline, not via alert() |
| Confirmation dialogs | Destructive actions guarded by modal |
| Responsive layout | Sidebar collapses on mobile; hamburger menu works |
| Keyboard navigation | Tab order logical; Enter submits forms |
