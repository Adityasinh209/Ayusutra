/**
 * Patient service.
 * Phase 2 mapping:
 *   listPatients()            → GET  /api/patients
 *   getPatient(id)            → GET  /api/patients/:id
 *   createPatient(data)       → POST /api/patients
 *   submitPatientIntake(data) → POST /api/patients/intake
 */

import { getAll, getById, addItem, updateItem } from '../mocks/store.js'
import { generateId } from '../utils/id.js'

function delay(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function listPatients() {
  await delay()
  return getAll('patients').sort(
    (a, b) => new Date(b.registeredAt) - new Date(a.registeredAt),
  )
}

export async function getPatient(id) {
  await delay()
  const patient = getById('patients', id)
  if (!patient) {
    const err = new Error('Patient not found.')
    err.status = 404
    throw err
  }
  return patient
}

export async function createPatient(data, createdByUserId) {
  await delay()
  const all = getAll('patients')
  const duplicate = all.find(
    (p) => p.phone === data.phone || (data.email && p.email === data.email),
  )
  if (duplicate) {
    const err = new Error('A patient with this phone number or email already exists.')
    err.status = 409
    throw err
  }
  const patient = {
    id: generateId('patient'),
    ...data,
    registeredAt: new Date().toISOString(),
    registeredBy: createdByUserId,
  }
  return addItem('patients', patient)
}

export function findPatientForUser(user) {
  if (!user) return null
  const patients = getAll('patients')
  if (user.patientId) {
    const byId = patients.find((p) => p.id === user.patientId)
    if (byId) return byId
  }
  if (user.clerkId) {
    const byClerk = patients.find((p) => p.clerkId === user.clerkId)
    if (byClerk) return byClerk
  }
  if (user.id) {
    const byUser = patients.find((p) => p.userId === user.id)
    if (byUser) return byUser
  }
  if (user.email) {
    const email = user.email.toLowerCase()
    const byEmail = patients.find((p) => p.email?.toLowerCase() === email)
    if (byEmail) return byEmail
  }
  return null
}

export function patientNeedsIntake(user) {
  if (!user || user.role !== 'patient') return false
  const patient = findPatientForUser(user)
  if (!patient) return true
  return !patient.fullName?.trim() || !patient.phone?.trim() || !patient.address?.trim()
}

export async function submitPatientIntake(data, user) {
  await delay()
  if (!user) {
    const err = new Error('You must be signed in to save patient details.')
    err.status = 401
    throw err
  }

  const existing = findPatientForUser(user)
  const all = getAll('patients')
  const duplicate = all.find(
    (p) =>
      p.id !== existing?.id &&
      (p.phone === data.phone || (data.email && p.email && p.email.toLowerCase() === data.email.toLowerCase())),
  )
  if (duplicate) {
    const err = new Error('A patient with this phone number or email already exists.')
    err.status = 409
    throw err
  }

  const payload = {
    fullName: data.fullName.trim(),
    phone: data.phone.trim(),
    address: data.address.trim(),
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
    email: (data.email || user.email || '').trim(),
    emergencyContact: data.emergencyContact.trim(),
    chiefComplaint: (data.chiefComplaint || '').trim(),
    medicalHistory: (data.medicalHistory || '').trim(),
    allergies: (data.allergies || '').trim(),
    userId: user.id,
    clerkId: user.clerkId || null,
    registeredBy: user.id,
  }

  let patient
  if (existing) {
    patient = updateItem('patients', existing.id, payload)
  } else {
    patient = addItem('patients', {
      id: generateId('patient'),
      prakriti: '',
      vikriti: '',
      agniType: '',
      koshtaType: '',
      ...payload,
      registeredAt: new Date().toISOString(),
    })
  }

  upsertUserProfileForPatient(patient, user)
  return patient
}

/** Keeps the seeded users store aligned with intake (Phase 2: PATCH /api/users/me). */
function upsertUserProfileForPatient(patient, user) {
  const users = getAll('users')
  const email = (patient.email || user.email || '').toLowerCase()
  const idx = users.findIndex(
    (u) =>
      u.id === user.id ||
      (user.clerkId && u.clerkId === user.clerkId) ||
      (email && u.email?.toLowerCase() === email),
  )
  const profile = {
    name: patient.fullName,
    email: patient.email || user.email || '',
    role: 'patient',
    roleLabel: 'Patient',
    patientId: patient.id,
    clerkId: user.clerkId || null,
    active: true,
  }
  if (idx >= 0) {
    updateItem('users', users[idx].id, profile)
    return
  }
  addItem('users', { id: user.id, ...profile })
}
