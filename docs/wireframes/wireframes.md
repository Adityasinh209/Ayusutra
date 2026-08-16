# UI Wireframes

## AyurSutra — Screen Designs

All screens share a common layout: left sidebar navigation + top header with user info.

---

## 1. Login Screen

```
┌──────────────────────────────────────┐
│          AyurSutra Logo              │
│     Panchakarma Management System    │
│                                      │
│  ┌────────────────────────────────┐  │
│  │         Sign in                │  │
│  │                                │  │
│  │  Email address *               │  │
│  │  [ you@ayursutra.dev        ]  │  │
│  │                                │  │
│  │  Password *                    │  │
│  │  [ **************           ]  │  │
│  │                                │  │
│  │  [ Sign in ]                   │  │
│  │                                │  │
│  │  ─────────────────────────     │  │
│  │  Demo credentials              │  │
│  │  Doctor: doctor@... / ...      │  │
│  │  Receptionist: ...             │  │
│  │  Admin: ...                    │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

---

## 2. Dashboard (Doctor view)

```
┌─────────┬─────────────────────────────────────────┐
│ AyurS.  │  Welcome, Dr. Meera  [Doctor]   Sign out │
│         ├─────────────────────────────────────────┤
│ Dashboard│  Good morning, Meera                    │
│ Patients │  Patient consultations accessible below │
│ Consulta.│                                         │
│ Appoint. │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│         │  │  12  │ │   3  │ │   8  │ │   2  │  │
│         │  │Patien│ │Today │ │Sched.│ │Confir│  │
│         │  └──────┘ └──────┘ └──────┘ └──────┘  │
│         │                                         │
│         │  Recent Appointments     Quick Actions  │
│         │  ┌──────────────────┐  ┌─────────────┐ │
│         │  │ 17 Aug · Confirm │  │ New Consult │ │
│         │  │ 18 Aug · Schedul │  │ View Patient│ │
│         │  │ 19 Aug · Schedul │  └─────────────┘ │
│         │  └──────────────────┘                  │
└─────────┴─────────────────────────────────────────┘
```

---

## 3. Patients List

```
┌─────────┬──────────────────────────────────────────────┐
│ Sidebar │  Patients        12 registered patients       │
│         │                              [+ Register]     │
│         │  [ Search by name or phone... ]               │
│         │                                               │
│         │  Name          Age/Gender  Phone    Registered│
│         │  ──────────────────────────────────────────── │
│         │  Rahul Sharma  41 yrs·M   98765... 01 Aug 26 │
│         │  Anjali Desai  34 yrs·F   98123... 05 Aug 26 │
│         │  Suresh Pillai 56 yrs·M   99001... 10 Aug 26 │
│         │  (click row to view patient detail)           │
└─────────┴──────────────────────────────────────────────┘
```

---

## 4. Register Patient

```
┌─────────┬──────────────────────────────────────┐
│ Sidebar │  ← Patients                           │
│         │  Register Patient                     │
│         │  ────────────────────────────────     │
│         │  Full Name *    [ Rahul Sharma   ]    │
│         │  Date of Birth* [ 1985-04-12     ]    │
│         │  Gender *       [ Male       ▼  ]     │
│         │  Phone *        [ 9876543210    ]      │
│         │  Email          [ rahul@email  ]       │
│         │  Emergency Cont*[ Sneha - 9876 ]       │
│         │  ────────────────────────────────     │
│         │  Address *                             │
│         │  [ 12, Lotus Society, Pune        ]   │
│         │  Medical History                       │
│         │  [ Chronic back pain, ...         ]   │
│         │                                        │
│         │  [Register Patient]  [Cancel]          │
└─────────┴──────────────────────────────────────┘
```

---

## 5. Patient Detail

```
┌─────────┬─────────────────────────────────────────────┐
│ Sidebar │  ← All Patients                              │
│         │  Rahul Sharma   41 yrs · Male                │
│         │  Registered 01 Aug 2026  [+ New Consultation]│
│         │                                              │
│         │  Contact Information   Medical Background    │
│         │  ┌────────────────┐  ┌────────────────────┐ │
│         │  │ Phone: 987...  │  │ Chronic back pain, │ │
│         │  │ Email: rah...  │  │ mild hypertension  │ │
│         │  │ Address: ...   │  └────────────────────┘ │
│         │  └────────────────┘                         │
│         │                                              │
│         │  Consultation & EMR Records  (2 records)     │
│         │  ┌──────────────────────────────────────┐   │
│         │  │ 12 Aug 2026 · 14 sessions · 60 min   │   │
│         │  │ Symptoms: Lower back pain...          │   │
│         │  │ Diagnosis: Vata imbalance             │   │
│         │  └──────────────────────────────────────┘   │
│         │                                              │
│         │  Appointments  [+ Schedule]                  │
│         │  ┌──────────────────────────────────────┐   │
│         │  │ Abhyanga · 17 Aug · 10:00–11:00      │   │
│         │  │ Amit Joshi · Room 2  [Confirmed]      │   │
│         │  └──────────────────────────────────────┘   │
└─────────┴─────────────────────────────────────────────┘
```

---

## 6. Doctor Consultation

```
┌─────────┬───────────────────────────────────────────────┐
│ Sidebar │  Doctor Consultation                           │
│         │  Create an EMR record for the selected patient │
│         │                                                │
│         │  Patient                                       │
│         │  [ Rahul Sharma · 9876543210       ▼ ]        │
│         │  Rahul Sharma · 41 yrs · Male                 │
│         │  History: Chronic back pain                   │
│         │                                                │
│         │  Clinical Details                              │
│         │  Presenting Symptoms *                         │
│         │  [ Lower back pain, morning stiffness... ]    │
│         │  Diagnosis *                                   │
│         │  [ Vata imbalance — Kati Shoola        ]      │
│         │  Treatment Plan *  [ Abhyanga 14 days  ]      │
│         │  Doctor Notes      [ Avoid cold food...  ]    │
│         │  Follow-up Date    [ 2026-09-01          ]    │
│         │                                                │
│         │  Therapy Prescription                          │
│         │  Therapy * [ Abhyanga (60 min)        ▼ ]     │
│         │  Duration* [ 60    ]  Sessions * [ 14  ]      │
│         │                                                │
│         │  [Save Consultation]  [Cancel]                 │
└─────────┴───────────────────────────────────────────────┘
```

---

## 7. Scheduling

```
┌─────────┬───────────────────────────────────────────────┐
│ Sidebar │  Schedule Therapy                              │
│         │  ────────────────────────────────────────     │
│         │  Therapy Request                               │
│         │  Patient *  [ Rahul Sharma · 9876...  ▼ ]     │
│         │  Therapy *  [ Abhyanga (60 min)        ▼ ]    │
│         │  Date       [ 2026-08-25               ]      │
│         │  Time Pref  [ Morning (before 12:00)   ▼ ]   │
│         │                                                │
│         │  [Find Available Slots]                        │
│         │                                                │
│         │  ────────────────────────────────────────     │
│         │  AI RECOMMENDED SLOT               [Best Match]│
│         │  19 Aug 2026 · 09:00 AM – 10:00 AM            │
│         │  Therapist: Amit Joshi                         │
│         │  Room: Room 2 · Workload: 2 appointments       │
│         │  Reason: Qualified therapist, lowest workload  │
│         │  [Confirm This Slot]   2 alternatives below    │
│         │                                                │
│         │  ALTERNATIVE SLOTS                             │
│         │  20 Aug · 11:00–12:00 · Amit Joshi · Room 1  │
│         │                                    [Select]   │
│         │  21 Aug · 09:00–10:00 · Amit Joshi · Room 2  │
│         │                                    [Select]   │
└─────────┴───────────────────────────────────────────────┘
```

---

## 8. Appointments List

```
┌─────────┬────────────────────────────────────────────────┐
│ Sidebar │  Appointments    8 total appointments           │
│         │  [All] [Scheduled] [Confirmed] [Completed]     │
│         │  [Cancelled]                                    │
│         │                                                 │
│         │  Patient       Therapy   Therapist  Date  Status│
│         │  ─────────────────────────────────────────────  │
│         │  Rahul Sharma  Abhyanga  Amit Joshi 17 Aug [Con]│
│         │  Anjali Desai  Shirodha  Priya Shar 17 Aug [Sch]│
│         │                                    [Cancel]     │
└─────────┴────────────────────────────────────────────────┘
```

---

## 9. Masters (Admin)

```
┌─────────┬──────────────────────────────────────────────┐
│ Sidebar │  Masters                                      │
│         │  Reference data for therapies, therapists...  │
│         │                                               │
│         │  Therapies (5 active)                         │
│         │  ┌────────────────────────────────────────┐  │
│         │  │ Abhyanga   60 min  Full-body oil massage│  │
│         │  │ Shirodhara 45 min  Oil flow on forehead │  │
│         │  │ Basti      90 min  Medicated enema      │  │
│         │  └────────────────────────────────────────┘  │
│         │                                               │
│         │  Therapy Rooms                                 │
│         │  ┌──────────────────────────────────────┐    │
│         │  │ Room 1   General   [active]           │    │
│         │  │ Room 2   General   [active]           │    │
│         │  │ Room 3   Shirodh.  [active]           │    │
│         │  └──────────────────────────────────────┘    │
│         │                                               │
│         │  Therapists                                    │
│         │  ┌──────────────────────────────────────┐    │
│         │  │ Amit Joshi · Abhyanga · [active]     │    │
│         │  │ Mon–Fri 09:00–13:00                  │    │
│         │  │ Leave: 18–20 Aug (Personal)           │    │
│         │  └──────────────────────────────────────┘    │
└─────────┴──────────────────────────────────────────────┘
```

---

## 10. Future Screens (Phase 2+)

These screens are designed but not implemented in Phase 1.

### Billing

```
Patient Billing
─────────────────────
Patient: Rahul Sharma
Therapy: Abhyanga × 14 sessions
Rate: ₹800/session
Total: ₹11,200
Paid: ₹5,600  Outstanding: ₹5,600

[Record Payment]  [Print Invoice]
```

### Inventory

```
Inventory
─────────────────────
Sesame Oil    2.5 L     ← 3 L used this week
Ksheerabala   750 ml    Low stock warning
Triphala      1 kg      OK
```

### Follow-up Tracker

```
Follow-ups Due
─────────────────────
Rahul Sharma    Due: 01 Sep 2026   [Schedule]
Anjali Desai    Due: 30 Aug 2026   [Schedule]
```

### AI Chatbot (Patient-Facing)

```
AyurSutra Assistant
─────────────────────
Welcome to AyurSutra. How can I help?

Patient: What is Shirodhara good for?
AI: Shirodhara is effective for stress, anxiety,
    and neurological conditions. Please consult
    your doctor for a personalised recommendation.

Note: This chatbot provides general information only.
It does not replace a medical consultation.
```
