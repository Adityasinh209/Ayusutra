/**
 * Seed data for the Phase 1 frontend prototype.
 * This mirrors the MySQL data model defined in docs/database/er-diagram.md.
 * All IDs are strings to match future UUID primary keys.
 */

export const ROLES = [
  { id: 'role-1', name: 'doctor', label: 'Doctor' },
  { id: 'role-2', name: 'receptionist', label: 'Receptionist' },
  { id: 'role-3', name: 'patient', label: 'Patient' },
  { id: 'role-4', name: 'therapist', label: 'Therapist' },
]

export const USERS = [
  {
    id: 'user-1',
    name: 'Dr. Meera Nair',
    email: 'doctor@ayursutra.dev',
    password: 'Doctor@123',
    role: 'doctor',
    roleLabel: 'Doctor',
    active: true,
  },
  {
    id: 'user-2',
    name: 'Sunita Verma',
    email: 'receptionist@ayursutra.dev',
    password: 'Reception@123',
    role: 'receptionist',
    roleLabel: 'Receptionist',
    active: true,
  },
  {
    id: 'user-3',
    name: 'Rahul Sharma',
    email: 'patient@ayursutra.dev',
    password: 'Patient@123',
    role: 'patient',
    roleLabel: 'Patient',
    patientId: 'patient-1',
    active: true,
  },
  {
    id: 'user-4',
    name: 'Amit Joshi',
    email: 'therapist@ayursutra.dev',
    password: 'Therapist@123',
    role: 'therapist',
    roleLabel: 'Therapist',
    therapistId: 'therapist-1',
    active: true,
  },
]

export const THERAPIES = [
  {
    id: 'therapy-1',
    name: 'Abhyanga',
    description:
      'Full-body warm oil massage that improves circulation, nourishes tissues, and promotes deep relaxation. One of the fundamental therapies in Panchakarma.',
    defaultDurationMins: 60,
    active: true,
  },
  {
    id: 'therapy-2',
    name: 'Shirodhara',
    description:
      'Continuous flow of warm medicated oil over the forehead. Highly effective for stress, anxiety, and neurological conditions.',
    defaultDurationMins: 45,
    active: true,
  },
  {
    id: 'therapy-3',
    name: 'Basti',
    description:
      'Medicated enema using herbal decoctions or oils. Considered the most important Panchakarma treatment for vata disorders.',
    defaultDurationMins: 90,
    active: true,
  },
  {
    id: 'therapy-4',
    name: 'Nasya',
    description:
      'Nasal administration of medicated oils. Effective for head, neck, and sinus conditions including sinusitis and migraines.',
    defaultDurationMins: 30,
    active: true,
  },
  {
    id: 'therapy-5',
    name: 'Swedana',
    description:
      'Herbal steam therapy that opens pores, loosens toxins, and prepares the body for deeper cleansing treatments.',
    defaultDurationMins: 30,
    active: true,
  },
]

export const THERAPISTS = [
  {
    id: 'therapist-1',
    name: 'Amit Joshi',
    specialization: 'Abhyanga',
    therapyIds: ['therapy-1', 'therapy-5'],
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    workStartTime: '09:00',
    workEndTime: '13:00',
    active: true,
  },
  {
    id: 'therapist-2',
    name: 'Priya Sharma',
    specialization: 'Shirodhara',
    therapyIds: ['therapy-2', 'therapy-5'],
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    workStartTime: '11:00',
    workEndTime: '16:00',
    active: true,
  },
  {
    id: 'therapist-3',
    name: 'Rajesh Kumar',
    specialization: 'Basti',
    therapyIds: ['therapy-3'],
    workingDays: ['Mon', 'Wed', 'Fri'],
    workStartTime: '08:00',
    workEndTime: '14:00',
    active: true,
  },
  {
    id: 'therapist-4',
    name: 'Kavita Mehta',
    specialization: 'Nasya',
    therapyIds: ['therapy-4', 'therapy-5'],
    workingDays: ['Tue', 'Thu', 'Sat'],
    workStartTime: '10:00',
    workEndTime: '15:00',
    active: true,
  },
]

export const THERAPIST_AVAILABILITY = [
  { id: 'avail-1', therapistId: 'therapist-1', dayOfWeek: 'Mon', startTime: '09:00', endTime: '13:00' },
  { id: 'avail-2', therapistId: 'therapist-1', dayOfWeek: 'Tue', startTime: '09:00', endTime: '13:00' },
  { id: 'avail-3', therapistId: 'therapist-1', dayOfWeek: 'Wed', startTime: '09:00', endTime: '13:00' },
  { id: 'avail-4', therapistId: 'therapist-1', dayOfWeek: 'Thu', startTime: '09:00', endTime: '13:00' },
  { id: 'avail-5', therapistId: 'therapist-1', dayOfWeek: 'Fri', startTime: '09:00', endTime: '13:00' },
  { id: 'avail-6', therapistId: 'therapist-2', dayOfWeek: 'Mon', startTime: '11:00', endTime: '16:00' },
  { id: 'avail-7', therapistId: 'therapist-2', dayOfWeek: 'Tue', startTime: '11:00', endTime: '16:00' },
  { id: 'avail-8', therapistId: 'therapist-2', dayOfWeek: 'Wed', startTime: '11:00', endTime: '16:00' },
  { id: 'avail-9', therapistId: 'therapist-2', dayOfWeek: 'Thu', startTime: '11:00', endTime: '16:00' },
  { id: 'avail-10', therapistId: 'therapist-2', dayOfWeek: 'Fri', startTime: '11:00', endTime: '16:00' },
  { id: 'avail-11', therapistId: 'therapist-2', dayOfWeek: 'Sat', startTime: '11:00', endTime: '16:00' },
  { id: 'avail-12', therapistId: 'therapist-3', dayOfWeek: 'Mon', startTime: '08:00', endTime: '14:00' },
  { id: 'avail-13', therapistId: 'therapist-3', dayOfWeek: 'Wed', startTime: '08:00', endTime: '14:00' },
  { id: 'avail-14', therapistId: 'therapist-3', dayOfWeek: 'Fri', startTime: '08:00', endTime: '14:00' },
  { id: 'avail-15', therapistId: 'therapist-4', dayOfWeek: 'Tue', startTime: '10:00', endTime: '15:00' },
  { id: 'avail-16', therapistId: 'therapist-4', dayOfWeek: 'Thu', startTime: '10:00', endTime: '15:00' },
  { id: 'avail-17', therapistId: 'therapist-4', dayOfWeek: 'Sat', startTime: '10:00', endTime: '15:00' },
]

export const THERAPIST_LEAVES = [
  {
    id: 'leave-1',
    therapistId: 'therapist-1',
    startDate: '2026-08-18',
    endDate: '2026-08-20',
    reason: 'Personal leave',
  },
]

export const THERAPY_ROOMS = [
  { id: 'room-1', name: 'Room 1', roomType: 'General', active: true },
  { id: 'room-2', name: 'Room 2', roomType: 'General', active: true },
  { id: 'room-3', name: 'Room 3', roomType: 'Shirodhara', active: true },
]

export const PATIENTS = [
  {
    id: 'patient-1',
    fullName: 'Rahul Sharma',
    dateOfBirth: '1985-04-12',
    gender: 'Male',
    phone: '9876543210',
    email: 'rahul.sharma@email.com',
    address: '12, Lotus Society, Pune - 411001',
    medicalHistory: 'Chronic back pain, mild hypertension',
    emergencyContact: 'Sneha Sharma - 9876500001',
    registeredAt: '2026-08-01T09:30:00.000Z',
    registeredBy: 'user-2',
  },
  {
    id: 'patient-2',
    fullName: 'Anjali Desai',
    dateOfBirth: '1992-07-25',
    gender: 'Female',
    phone: '9812345678',
    email: 'anjali.desai@email.com',
    address: '45, Green Park, Mumbai - 400021',
    medicalHistory: 'Stress and anxiety, insomnia',
    emergencyContact: 'Ravi Desai - 9812300001',
    registeredAt: '2026-08-05T11:00:00.000Z',
    registeredBy: 'user-2',
  },
  {
    id: 'patient-3',
    fullName: 'Suresh Pillai',
    dateOfBirth: '1970-01-30',
    gender: 'Male',
    phone: '9900112233',
    email: 'suresh.pillai@email.com',
    address: '7, MG Road, Kochi - 682001',
    medicalHistory: 'Type 2 diabetes, knee pain',
    emergencyContact: 'Latha Pillai - 9900100001',
    registeredAt: '2026-08-10T14:00:00.000Z',
    registeredBy: 'user-2',
  },
]

export const EMR_RECORDS = [
  {
    id: 'emr-1',
    patientId: 'patient-1',
    doctorId: 'user-1',
    symptoms: 'Persistent lower back pain, stiffness in the morning, fatigue',
    diagnosis: 'Vata imbalance — Kati Shoola (lumbar spondylosis)',
    treatmentPlan: 'Panchakarma detox followed by Abhyanga for 14 days',
    therapyId: 'therapy-1',
    therapyDurationMins: 60,
    numberOfSessions: 14,
    doctorNotes: 'Avoid cold food and excessive travel during treatment period.',
    followUpDate: '2026-09-01',
    createdAt: '2026-08-12T10:30:00.000Z',
  },
  {
    id: 'emr-2',
    patientId: 'patient-2',
    doctorId: 'user-1',
    symptoms: 'Frequent headaches, disturbed sleep, anxiety attacks',
    diagnosis: 'Vata-Pitta imbalance — Shiroroga',
    treatmentPlan: 'Shirodhara therapy for 7 sessions',
    therapyId: 'therapy-2',
    therapyDurationMins: 45,
    numberOfSessions: 7,
    doctorNotes: 'Patient should maintain a regular sleep schedule.',
    followUpDate: '2026-08-30',
    createdAt: '2026-08-13T09:15:00.000Z',
  },
]

export const APPOINTMENTS = [
  {
    id: 'appt-1',
    patientId: 'patient-1',
    therapyId: 'therapy-1',
    therapistId: 'therapist-1',
    roomId: 'room-1',
    date: '2026-08-17',
    startTime: '10:00',
    endTime: '11:00',
    status: 'Confirmed',
    sessionNotes: '',
    createdBy: 'user-2',
    createdAt: '2026-08-12T11:00:00.000Z',
  },
  {
    id: 'appt-2',
    patientId: 'patient-2',
    therapyId: 'therapy-2',
    therapistId: 'therapist-2',
    roomId: 'room-3',
    date: '2026-08-17',
    startTime: '11:00',
    endTime: '11:45',
    status: 'Scheduled',
    sessionNotes: '',
    createdBy: 'user-2',
    createdAt: '2026-08-13T10:00:00.000Z',
  },
  {
    id: 'appt-3',
    patientId: 'patient-1',
    therapyId: 'therapy-1',
    therapistId: 'therapist-1',
    roomId: 'room-2',
    date: '2026-08-19',
    startTime: '09:00',
    endTime: '10:00',
    status: 'Scheduled',
    sessionNotes: '',
    createdBy: 'user-2',
    createdAt: '2026-08-14T09:00:00.000Z',
  },
]

/**
 * Pre-generated candidate slots shown by the scheduling engine.
 * In Phase 2 these are computed dynamically by the FastAPI scheduling service.
 * Key: "<patientId>-<therapyId>" — used by the scheduling service mock.
 */
export const CANDIDATE_SLOTS = {
  'patient-1-therapy-1': [
    {
      id: 'slot-1',
      therapistId: 'therapist-1',
      roomId: 'room-2',
      date: '2026-08-19',
      startTime: '09:00',
      endTime: '10:00',
      therapistWorkload: 2,
      recommended: true,
      reason: 'Amit Joshi is the qualified therapist for Abhyanga with lowest current workload. Room 2 is free for the duration and the slot falls in the patient\'s preferred morning window.',
    },
    {
      id: 'slot-2',
      therapistId: 'therapist-1',
      roomId: 'room-1',
      date: '2026-08-20',
      startTime: '11:00',
      endTime: '12:00',
      therapistWorkload: 2,
      recommended: false,
      reason: 'Alternative slot — Room 1 with the same therapist on a later day.',
    },
    {
      id: 'slot-3',
      therapistId: 'therapist-1',
      roomId: 'room-2',
      date: '2026-08-21',
      startTime: '09:00',
      endTime: '10:00',
      therapistWorkload: 3,
      recommended: false,
      reason: 'Therapist available; slightly higher workload than the recommended slot.',
    },
  ],
  'patient-2-therapy-2': [
    {
      id: 'slot-4',
      therapistId: 'therapist-2',
      roomId: 'room-3',
      date: '2026-08-19',
      startTime: '11:00',
      endTime: '11:45',
      therapistWorkload: 4,
      recommended: true,
      reason: 'Priya Sharma is the qualified therapist for Shirodhara. Room 3 is the designated Shirodhara room and is available. Morning slot preferred.',
    },
    {
      id: 'slot-5',
      therapistId: 'therapist-2',
      roomId: 'room-3',
      date: '2026-08-20',
      startTime: '13:00',
      endTime: '13:45',
      therapistWorkload: 4,
      recommended: false,
      reason: 'Afternoon alternative on the next available day.',
    },
  ],
  'patient-3-therapy-3': [
    {
      id: 'slot-6',
      therapistId: 'therapist-3',
      roomId: 'room-1',
      date: '2026-08-19',
      startTime: '08:00',
      endTime: '09:30',
      therapistWorkload: 1,
      recommended: true,
      reason: 'Rajesh Kumar specialises in Basti therapy and has minimal workload. Room 1 is free.',
    },
  ],
}
