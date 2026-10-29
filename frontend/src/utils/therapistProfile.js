export const THERAPY_CATALOG = [
  { id: 'abhyanga', name: 'Abhyanga', defaultDuration: 60 },
  { id: 'shirodhara', name: 'Shirodhara', defaultDuration: 45 },
  { id: 'vamana', name: 'Vamana', defaultDuration: 90 },
  { id: 'virechana', name: 'Virechana', defaultDuration: 60 },
  { id: 'basti', name: 'Basti', defaultDuration: 45 },
  { id: 'nasya', name: 'Nasya', defaultDuration: 30 },
  { id: 'raktamokshana', name: 'Raktamokshana', defaultDuration: 45 },
  { id: 'swedana', name: 'Swedana', defaultDuration: 30 },
  { id: 'pizhichil', name: 'Pizhichil', defaultDuration: 60 },
  { id: 'kati-basti', name: 'Kati Basti', defaultDuration: 40 },
  { id: 'janu-basti', name: 'Janu Basti', defaultDuration: 40 },
  { id: 'udwarthanam', name: 'Udwarthanam', defaultDuration: 45 },
]

export const LANGUAGE_OPTIONS = [
  'English',
  'Hindi',
  'Sanskrit',
  'Gujarati',
  'Marathi',
  'Tamil',
  'Kannada',
  'Malayalam',
  'Telugu',
  'Bengali',
  'Punjabi',
]

export const SPECIALIZATION_OPTIONS = [
  'Abhyanga',
  'Shirodhara',
  'Panchakarma',
  'Basti',
  'Nasya',
  'Kayachikitsa',
  'Swedana',
  'Kati Basti',
]

export const WEEK_DAYS = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' },
]

export const STATUS_OPTIONS = [
  { value: 'Available', badge: 'green' },
  { value: 'Busy', badge: 'orange' },
  { value: 'On Leave', badge: 'red' },
]

export function defaultAvailability() {
  return WEEK_DAYS.map((day) => ({
    day: day.id,
    label: day.label,
    working: day.id !== 'sunday',
    startTime: '09:00',
    endTime: '17:00',
    breakStart: '13:00',
    breakEnd: '14:00',
  }))
}

export function createInitialTherapistProfile(user) {
  return {
    photoDataUrl: '',
    photoName: '',
    fullName: user?.name || '',
    gender: '',
    mobile: user?.phone || '',
    email: user?.email || '',
    qualification: '',
    registrationNumber: '',
    yearsOfExperience: '',
    specialization: '',
    languages: [],
    aboutMe: '',
    selectedTherapies: {},
    availability: defaultAvailability(),
    maxPatientsPerDay: 10,
    maxSessionsPerDay: 8,
    status: 'Available',
    acceptMalePatients: true,
    acceptFemalePatients: true,
    acceptChildren: false,
    acceptSeniorCitizens: true,
  }
}

export function buildTherapistProfilePayload(form) {
  const therapies = THERAPY_CATALOG
    .filter((therapy) => form.selectedTherapies[therapy.id])
    .map((therapy) => ({
      id: therapy.id,
      name: therapy.name,
      durationMinutes: Number(form.selectedTherapies[therapy.id].duration) || therapy.defaultDuration,
    }))

  return {
    therapist: {
      fullName: form.fullName.trim(),
      gender: form.gender,
      mobile: form.mobile.trim(),
      email: form.email.trim(),
      qualification: form.qualification.trim(),
      registrationNumber: form.registrationNumber.trim(),
      yearsOfExperience: Number(form.yearsOfExperience) || 0,
      specialization: form.specialization,
      languages: form.languages,
      aboutMe: form.aboutMe.trim(),
      photoName: form.photoName || null,
      hasPhoto: Boolean(form.photoDataUrl),
      maxPatientsPerDay: Number(form.maxPatientsPerDay) || 0,
      maxSessionsPerDay: Number(form.maxSessionsPerDay) || 0,
      status: form.status,
      preferences: {
        acceptMalePatients: form.acceptMalePatients,
        acceptFemalePatients: form.acceptFemalePatients,
        acceptChildren: form.acceptChildren,
        acceptSeniorCitizens: form.acceptSeniorCitizens,
      },
    },
    therapies,
    availability: form.availability.map((row) => ({
      day: row.day,
      working: row.working,
      startTime: row.working ? row.startTime : null,
      endTime: row.working ? row.endTime : null,
      breakStart: row.working ? row.breakStart : null,
      breakEnd: row.working ? row.breakEnd : null,
    })),
  }
}
