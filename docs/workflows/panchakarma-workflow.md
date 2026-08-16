# Panchakarma Workflow

## AyurSutra — Patient Journey

---

## 1. End-to-End Workflow

```
Patient arrives at the centre
           │
    ┌──────▼──────┐
    │ Receptionist │
    │ registers    │
    │ patient      │
    └──────┬───────┘
           │  Patient record created in the system
    ┌──────▼──────┐
    │   Doctor    │
    │ consultation│
    └──────┬───────┘
           │  Doctor reviews patient history
           │  Enters symptoms and diagnosis
           │  Prescribes therapy + sessions
           │  EMR record saved
    ┌──────▼──────────────┐
    │   Receptionist      │
    │ opens Scheduling    │
    │ selects patient +   │
    │ therapy             │
    └──────┬──────────────┘
           │  Backend retrieves:
           │  • Therapy duration
           │  • Qualified therapists
           │  • Therapist availability
           │  • Therapist leaves
           │  • Existing appointments
           │  • Room availability
           │
    ┌──────▼──────────────┐
    │ Scheduling engine   │
    │ generates candidate │
    │ slots               │
    └──────┬──────────────┘
           │
    ┌──────▼──────────────┐
    │ AI recommendation   │
    │ (Gemini API)        │ ← Phase 2
    │ ranks candidates    │
    └──────┬──────────────┘
           │
    ┌──────▼──────────────┐
    │  Receptionist       │
    │  reviews candidates │
    │  and confirms       │
    └──────┬──────────────┘
           │  Appointment stored in MySQL
           │  Appears on patient record
    ┌──────▼──────────────┐
    │   Therapist         │
    │ delivers session    │
    │ Status → Completed  │
    └─────────────────────┘
```

---

## 2. Panchakarma Therapy Workflow

Panchakarma typically follows a three-stage process:

### Stage 1: Purvakarma (Preparation)
- Snehana (oleation): oil massage — Abhyanga
- Svedana (fomentation): steam therapy — Swedana
- Duration: 3–7 days

### Stage 2: Pradhanakarma (Main Treatment)
Five primary therapies. One or more prescribed per patient:

| Therapy | Target | Duration |
|---|---|---|
| Vamana | Kapha disorders | 30–60 min |
| Virechana | Pitta disorders | 30–60 min |
| Basti | Vata disorders | 60–90 min |
| Nasya | Head/sinus conditions | 30 min |
| Raktamokshana | Blood purification | Variable |

*Note: AyurSutra supports Basti and Nasya in Phase 1.*

### Stage 3: Paschatkarma (Post-treatment)
- Samsarjana krama (diet progression)
- Follow-up consultation
- Maintenance therapy recommendations

---

## 3. Role Responsibilities in the Workflow

| Step | Role | Action |
|---|---|---|
| Patient intake | Receptionist | Register patient in system |
| Medical assessment | Doctor | Review history, enter consultation, prescribe therapy |
| Scheduling | Receptionist | Find slot, confirm appointment |
| Treatment delivery | Therapist | Deliver session, update status |
| Follow-up | Doctor | Review progress, adjust treatment plan |
| Administration | Admin | Monitor operations, manage master data |
