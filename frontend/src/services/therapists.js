/**
 * Therapist service.
 * Phase 2 mapping: GET /api/therapists
 */

import { getAll, getById, updateItem, addItem, removeItem } from '../mocks/store.js'
import { api, remoteReady } from './http.js'

function delay(ms = 200) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function listTherapists() {
  if (remoteReady()) return api('/api/therapists')
  await delay()
  return getAll('therapists').filter((t) => t.active)
}

export async function getTherapist(id) {
  await delay()
  return getById('therapists', id)
}

export async function getAvailability(therapistId) {
  await delay()
  return getAll('therapist_availability').filter((a) => a.therapistId === therapistId)
}

export async function saveTherapistProfile(payload, user) {
  if (remoteReady()) return api('/api/therapists/me', { method: 'PUT', body: payload })
  await delay()
  const id = user?.therapistId
  if (!id) {
    const err = new Error('This account is not linked to a therapist profile.')
    err.status = 404
    throw err
  }
  const info = payload.therapist || {}
  const workingDays = (payload.availability || []).filter((row) => row.working).map((row) => row.day)
  updateItem('therapists', id, {
    name: info.fullName,
    gender: info.gender,
    phone: info.mobile,
    email: info.email,
    qualification: info.qualification,
    experienceYears: info.yearsOfExperience,
    specializations: info.specialization ? [info.specialization] : [],
    therapyIds: (payload.therapies || []).map((item) => item.id),
    status: info.status || 'Available',
    maxPatientsPerDay: info.maxPatientsPerDay,
    maxSessionsPerDay: info.maxSessionsPerDay,
    workingDays,
    active: true,
  })
  getAll('therapist_availability')
    .filter((row) => row.therapistId === id)
    .forEach((row) => removeItem('therapist_availability', row.id))
  ;(payload.availability || []).filter((row) => row.working).forEach((row) => {
    addItem('therapist_availability', {
      id: `${id}-${row.day}`,
      therapistId: id,
      day: row.day,
      dayOfWeek: row.day,
      working: true,
      startTime: row.startTime,
      endTime: row.endTime,
      breakStart: row.breakStart,
      breakEnd: row.breakEnd,
    })
  })
  return getById('therapists', id)
}

export async function getLeaves(therapistId) {
  await delay()
  return getAll('therapist_leaves').filter((l) => l.therapistId === therapistId)
}
