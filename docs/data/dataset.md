# Dataset Identification

## AyurSutra — Data Requirements for Phase 1 & Phase 2

---

## 1. Overview

This document identifies the data required to operate the AyurSutra system and describes the sample/mock dataset used in the Phase 1 prototype.

---

## 2. Master Data (Seeded at System Startup)

### 2.1 Therapies

Five core Panchakarma therapies are seeded:

| ID | Name | Default Duration | Description |
|---|---|---|---|
| therapy-1 | Abhyanga | 60 min | Full-body warm oil massage |
| therapy-2 | Shirodhara | 45 min | Warm oil flow over forehead |
| therapy-3 | Basti | 90 min | Medicated enema for vata disorders |
| therapy-4 | Nasya | 30 min | Nasal administration of medicated oils |
| therapy-5 | Swedana | 30 min | Herbal steam therapy |

### 2.2 Therapists

| ID | Name | Specialisation | Working Days | Hours |
|---|---|---|---|---|
| therapist-1 | Amit Joshi | Abhyanga | Mon–Fri | 09:00–13:00 |
| therapist-2 | Priya Sharma | Shirodhara | Mon–Sat | 11:00–16:00 |
| therapist-3 | Rajesh Kumar | Basti | Mon, Wed, Fri | 08:00–14:00 |
| therapist-4 | Kavita Mehta | Nasya | Tue, Thu, Sat | 10:00–15:00 |

### 2.3 Therapy Rooms

| ID | Name | Type |
|---|---|---|
| room-1 | Room 1 | General |
| room-2 | Room 2 | General |
| room-3 | Room 3 | Shirodhara |

### 2.4 Staff Users

| Name | Email | Role |
|---|---|---|
| Dr. Meera Nair | doctor@ayursutra.dev | Doctor |
| Sunita Verma | receptionist@ayursutra.dev | Receptionist |
| Admin User | admin@ayursutra.dev | Admin |

---

## 3. Transactional Data (Created During Prototype Demo)

### 3.1 Sample Patients

| ID | Name | DOB | Condition |
|---|---|---|---|
| patient-1 | Rahul Sharma | 1985-04-12 | Chronic back pain, mild hypertension |
| patient-2 | Anjali Desai | 1992-07-25 | Stress, anxiety, insomnia |
| patient-3 | Suresh Pillai | 1970-01-30 | Type 2 diabetes, knee pain |

### 3.2 Sample EMR Records

| ID | Patient | Doctor | Therapy | Sessions |
|---|---|---|---|---|
| emr-1 | Rahul Sharma | Dr. Meera Nair | Abhyanga | 14 sessions, 60 min |
| emr-2 | Anjali Desai | Dr. Meera Nair | Shirodhara | 7 sessions, 45 min |

### 3.3 Sample Appointments

| ID | Patient | Therapy | Therapist | Date | Time | Status |
|---|---|---|---|---|---|---|
| appt-1 | Rahul Sharma | Abhyanga | Amit Joshi | 2026-08-17 | 10:00–11:00 | Confirmed |
| appt-2 | Anjali Desai | Shirodhara | Priya Sharma | 2026-08-17 | 11:00–11:45 | Scheduled |

---

## 4. Scheduling Candidate Slot Data

The Phase 1 scheduling engine uses pre-computed candidate slots keyed by `patientId-therapyId`. These slots are realistic samples of what the Phase 2 deterministic engine will compute in real time.

### Candidate Slots for Rahul Sharma + Abhyanga

| Slot | Date | Time | Therapist | Room | Workload | Recommended |
|---|---|---|---|---|---|---|
| slot-1 | 2026-08-19 | 09:00–10:00 | Amit Joshi | Room 2 | 2 appts | Yes |
| slot-2 | 2026-08-20 | 11:00–12:00 | Amit Joshi | Room 1 | 2 appts | No |
| slot-3 | 2026-08-21 | 09:00–10:00 | Amit Joshi | Room 2 | 3 appts | No |

---

## 5. Data for Phase 2 Scheduling Algorithm

The following data attributes are accessed by the Phase 2 scheduling engine:

| Data Point | Source Table | Purpose |
|---|---|---|
| Therapy duration | therapies.default_duration_mins | Calculate end time of slot |
| Therapist specialisation | therapists.specialization | Match qualified therapist |
| Working days | therapist_availability.day_of_week | Filter by day |
| Working hours | therapist_availability.start_time / end_time | Filter by time window |
| Leave dates | therapist_leaves.start_date / end_date | Exclude unavailable therapists |
| Existing appointments | appointments WHERE date = target_date | Detect conflicts |
| Room bookings | appointments.room_id + date + time | Detect room conflicts |

---

## 6. Data Quality Notes

- All date/time values use ISO 8601 format
- Times are stored as HH:MM (24-hour)
- IDs use a `{entity}-{n}` format in Phase 1; Phase 2 uses UUIDs
- Patient phone numbers are 10-digit Indian mobile numbers
- No real patient health data is used; all records are synthetic
