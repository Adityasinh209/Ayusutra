# Software Requirements Specification

## AyurSutra — AI-Enabled Panchakarma Patient Management and Smart Therapy Scheduling System

**Version:** 1.0 (Phase 1)
**Date:** August 2026
**Team:** Capstone Project, Sem 7

---

## 1. Introduction

### 1.1 Purpose

This document describes the functional and non-functional requirements for AyurSutra, a web-based patient management and therapy scheduling system designed for Panchakarma treatment centres. This version covers Phase 1, which focuses on establishing the core workflow from patient registration through appointment confirmation.

### 1.2 Scope

AyurSutra replaces manual paper-based patient records and scheduling at Ayurvedic treatment centres. It enables doctors to create and access EMR records, allows receptionists to schedule therapy appointments intelligently, and gives administrators visibility into the centre's operations. A Gemini AI integration provides scheduling recommendations (Phase 2 onwards).

### 1.3 Definitions

| Term | Definition |
|---|---|
| Panchakarma | A set of five Ayurvedic cleansing and rejuvenating therapies |
| EMR | Electronic Medical Record — the digital record of a consultation |
| Therapist | A trained practitioner who delivers therapy sessions |
| Slot | A specific time window when a therapist and room are both available |
| Dosha | The Ayurvedic concept of three fundamental energies (Vata, Pitta, Kapha) |

---

## 2. Overall Description

### 2.1 Problem Statement

Panchakarma centres currently manage patient registrations, consultation notes, therapist schedules, and room bookings using paper files or disconnected spreadsheets. This creates:

- Lost patient histories
- Double-booking of therapists and rooms
- No visibility into therapist workload
- Inability to scale patient capacity

### 2.2 Objectives

1. Digitise patient registration and medical history
2. Enable doctors to create structured EMR records against therapies
3. Enable receptionists to schedule therapy sessions with conflict detection
4. Provide AI-assisted scheduling recommendations (Phase 2)
5. Provide administrators with an operational overview

### 2.3 User Roles

| Role | Responsibilities |
|---|---|
| Doctor | View patient profiles, create EMR records, prescribe therapies |
| Receptionist | Register patients, schedule appointments, manage bookings |
| Administrator | Access all modules, manage master data, view operational reports |

### 2.4 System Context

Phase 1 is a frontend-only prototype driven by mock data stored in the browser's localStorage. The architecture is designed so that the service layer can be swapped for real API calls in Phase 2 without modifying any page or component.

Phase 2 will introduce a FastAPI backend, MySQL persistence, JWT authentication, and Gemini integration.

---

## 3. Functional Requirements

### 3.1 Authentication

| ID | Requirement |
|---|---|
| AUTH-01 | The system shall allow users to log in with email and password |
| AUTH-02 | Incorrect credentials shall return a clear error message |
| AUTH-03 | Authenticated users shall be redirected to the dashboard |
| AUTH-04 | Users who are not authenticated shall be redirected to the login page |
| AUTH-05 | Role-specific navigation shall be shown based on the logged-in user's role |
| AUTH-06 | Users shall be able to log out from any page |

### 3.2 Patient Registration

| ID | Requirement |
|---|---|
| PAT-01 | Receptionists and admins shall be able to register a new patient |
| PAT-02 | The registration form shall capture: full name, date of birth, gender, phone, email, address, medical history, emergency contact |
| PAT-03 | Full name, date of birth, gender, phone, address, and emergency contact are mandatory |
| PAT-04 | Phone number must be 10 digits |
| PAT-05 | Email, if provided, must be a valid format |
| PAT-06 | Duplicate phone or email registration shall be rejected with a clear error |
| PAT-07 | All users shall be able to view the patient list with search by name or phone |
| PAT-08 | All users shall be able to view a patient detail page showing profile, EMR history, and appointments |

### 3.3 Doctor Consultation / EMR

| ID | Requirement |
|---|---|
| EMR-01 | Doctors shall be able to select a patient from a searchable dropdown |
| EMR-02 | Doctors shall see the patient's basic information before entering consultation details |
| EMR-03 | The EMR form shall capture: symptoms, diagnosis, treatment plan, therapy, duration, number of sessions, doctor notes, follow-up date |
| EMR-04 | Symptoms, diagnosis, treatment plan, therapy, duration, and number of sessions are mandatory |
| EMR-05 | Selecting a therapy shall pre-fill the default duration |
| EMR-06 | Doctors shall not modify patient registration details |
| EMR-07 | Saved EMR records shall be visible on the patient detail page in reverse chronological order |

### 3.4 Therapy Master Data

| ID | Requirement |
|---|---|
| THER-01 | The system shall maintain a list of therapies with name, description, default duration, and status |
| THER-02 | Phase 1 therapies: Abhyanga, Shirodhara, Basti, Nasya, Swedana |
| THER-03 | Therapy list shall be read-only in Phase 1 (admin edit in Phase 2) |

### 3.5 Therapist and Room Data

| ID | Requirement |
|---|---|
| RES-01 | The system shall maintain therapist records with name, specialisation, working days, hours, and status |
| RES-02 | The system shall maintain therapist leave records |
| RES-03 | The system shall maintain therapy room records with name, type, and status |
| RES-04 | Resource data shall be accessible to admins on the Masters page |

### 3.6 Appointment Scheduling

| ID | Requirement |
|---|---|
| SCH-01 | Receptionists shall be able to select a patient and therapy to find available slots |
| SCH-02 | The system shall return candidate slots based on therapist qualification, availability, and room availability |
| SCH-03 | The recommended slot shall be displayed prominently with a reason text |
| SCH-04 | Alternative slots shall be listed for selection |
| SCH-05 | Confirming an appointment shall require a confirmation dialog |
| SCH-06 | Confirmed appointments shall appear on the patient detail page and the appointments list |
| SCH-07 | Appointments shall have status: Scheduled, Confirmed, Completed, Cancelled |
| SCH-08 | Receptionists shall be able to cancel active appointments |

---

## 4. Non-Functional Requirements

### 4.1 Usability

- The UI must be operable without training on standard healthcare workflows
- Forms must show inline validation errors without page reload
- All pages must show loading and error states
- Empty states must include a descriptive message

### 4.2 Performance

- Page transitions should complete within 200 ms (frontend prototype)
- Mock data operations simulate network latency of 200–600 ms to accurately reflect Phase 2 behaviour

### 4.3 Security (Phase 2 requirements, documented here)

- Passwords shall be hashed with bcrypt (work factor ≥ 12)
- JWTs shall expire after 24 hours
- All API routes shall require a valid JWT except `/api/auth/login`
- Role checks shall be enforced server-side
- Stack traces shall never be sent to the frontend

### 4.4 Maintainability

- The service layer isolates all data access behind async functions
- Replacing the mock adapter with Axios requires changes only in `src/services/`
- Consistent naming conventions throughout codebase

### 4.5 Data Integrity (Phase 2)

- All foreign keys enforced at the database level
- Appointments cannot be created for inactive therapists or rooms
- No double-booking of therapist or room for the same time window

---

## 5. Constraints and Assumptions

- Phase 1 is a frontend-only prototype; no server or database is required to run it
- Data persists in localStorage between page reloads for demo purposes
- localStorage is explicitly not production persistence
- Gemini AI integration is designed and documented but not implemented until Phase 2
- Billing, inventory, SMS/WhatsApp notifications, and analytics are out of scope for Phase 1

---

## 6. Future Phases (Out of Scope for Phase 1)

- Billing and payment tracking
- Inventory management
- Full notification system (SMS, WhatsApp, email)
- Teleconsultation module
- Advanced analytics and reporting
- Multi-branch management
- Mobile application
- Predictive treatment recommendations using ML
